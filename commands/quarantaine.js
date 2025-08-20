const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quarantaine')
    .setDescription('Gérer les quarantaines de sécurité')
    .addSubcommand(subcommand =>
      subcommand
        .setName('appliquer')
        .setDescription('Mettre un membre en quarantaine manuellement')
        .addUserOption(o => o.setName('membre').setDescription('Membre à mettre en quarantaine').setRequired(true))
        .addStringOption(o => o.setName('raison').setDescription('Raison de la quarantaine').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('liberer')
        .setDescription('Libérer un membre de la quarantaine')
        .addUserOption(o => o.setName('membre').setDescription('Membre à libérer').setRequired(true))
        .addStringOption(o => o.setName('raison').setDescription('Raison de la libération').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('liste')
        .setDescription('Voir tous les membres en quarantaine'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Voir les détails d\'une quarantaine')
        .addUserOption(o => o.setName('membre').setDescription('Membre à examiner').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('nettoyer')
        .setDescription('Nettoyer les canaux de quarantaine orphelins'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers.toString()),

  cooldown: 5,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Réservé aux modérateurs.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'appliquer':
          await this.handleApply(interaction);
          break;
        case 'liberer':
          await this.handleRelease(interaction);
          break;
        case 'liste':
          await this.handleList(interaction);
          break;
        case 'info':
          await this.handleInfo(interaction);
          break;
        case 'nettoyer':
          await this.handleCleanup(interaction);
          break;
      }
    } catch (error) {
      console.error('Erreur commande quarantaine:', error);
      return interaction.reply({ content: '❌ Erreur lors de l\'exécution de la commande.', ephemeral: true });
    }
  },

  async handleApply(interaction) {
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison');

    if (!member) {
      return interaction.reply({ content: '❌ Membre introuvable sur ce serveur.', ephemeral: true });
    }

    if (member.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Vous ne pouvez pas vous mettre en quarantaine.', ephemeral: true });
    }

    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Impossible de mettre un administrateur en quarantaine.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Utiliser le système de quarantaine du bot principal
      const bot = interaction.client;
      await bot.quarantineMember(member, 'MANUAL', {
        reason: `Quarantaine manuelle: ${reason}`,
        score: 0,
        manual: true,
        moderator: interaction.user.id
      });

      return interaction.editReply({
        content: `✅ **Quarantaine appliquée**\n\n` +
                 `**Membre :** ${member.user.tag}\n` +
                 `**Raison :** ${reason}\n\n` +
                 `Des canaux de quarantaine ont été créés automatiquement.`
      });
    } catch (error) {
      console.error('Erreur application quarantaine:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors de l'application de la quarantaine**\n\n` +
                 `${error.message}`
      });
    }
  },

  async handleRelease(interaction) {
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison');

    if (!member) {
      return interaction.reply({ content: '❌ Membre introuvable sur ce serveur.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Utiliser le système de libération du bot principal
      const bot = interaction.client;
      await bot.grantAccess(member, `Libération manuelle: ${reason}`);

      return interaction.editReply({
        content: `✅ **Quarantaine levée**\n\n` +
                 `**Membre :** ${member.user.tag}\n` +
                 `**Raison :** ${reason}\n\n` +
                 `L'accès a été restauré et les canaux ont été nettoyés.`
      });
    } catch (error) {
      console.error('Erreur libération quarantaine:', error);
      return interaction.editReply({
        content: `❌ **Erreur lors de la libération**\n\n` +
                 `${error.message}`
      });
    }
  },

  async handleList(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const dataManager = interaction.client.dataManager;
      const quarantineData = await dataManager.getData('quarantine_records');
      const guildData = quarantineData[interaction.guild.id] || {};

      const activeQuarantines = Object.entries(guildData)
        .filter(([userId, data]) => data.status === 'active')
        .slice(0, 10); // Limiter à 10 pour éviter les messages trop longs

      if (activeQuarantines.length === 0) {
        return interaction.editReply({
          content: '✅ **Aucune quarantaine active**\n\nTous les membres ont accès normal au serveur.'
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🔒 Quarantaines actives (${activeQuarantines.length})`)
        .setColor(0xff922b)
        .setTimestamp();

      let description = '';
      for (const [userId, data] of activeQuarantines) {
        try {
          const user = await interaction.client.users.fetch(userId);
          const quarantineAge = Math.floor((Date.now() - data.timestamp) / (1000 * 60 * 60));
          description += `👤 **${user.tag}**\n`;
          description += `   📝 ${data.reason}\n`;
          description += `   📊 Score: ${data.score}/100\n`;
          description += `   ⏰ Depuis: ${quarantineAge}h\n`;
          if (data.textChannelId) {
            description += `   💬 <#${data.textChannelId}>\n`;
          }
          description += '\n';
        } catch {
          description += `👤 **Utilisateur inconnu (${userId})**\n`;
          description += `   📝 ${data.reason}\n\n`;
        }
      }

      embed.setDescription(description);

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur liste quarantaines:', error);
      return interaction.editReply({
        content: '❌ Erreur lors de la récupération de la liste des quarantaines.'
      });
    }
  },

  async handleInfo(interaction) {
    const member = interaction.options.getMember('membre');

    if (!member) {
      return interaction.reply({ content: '❌ Membre introuvable sur ce serveur.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const dataManager = interaction.client.dataManager;
      const quarantineData = await dataManager.getData('quarantine_records');
      const memberData = quarantineData[interaction.guild.id]?.[member.id];

      if (!memberData) {
        return interaction.editReply({
          content: `ℹ️ **${member.user.tag}** n'a pas d'historique de quarantaine sur ce serveur.`
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🔍 Détails de quarantaine - ${member.user.tag}`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(memberData.status === 'active' ? 0xff922b : 0x51cf66)
        .setTimestamp();

      embed.addFields({
        name: '📊 Informations générales',
        value: `**Statut :** ${memberData.status === 'active' ? '🔒 En quarantaine' : '✅ Libéré'}\n` +
               `**Raison :** ${memberData.reason}\n` +
               `**Score :** ${memberData.score}/100\n` +
               `**Date :** ${new Date(memberData.timestamp).toLocaleString('fr-FR')}`,
        inline: false
      });

      if (memberData.status === 'active' && memberData.textChannelId) {
        embed.addFields({
          name: '📁 Canaux de quarantaine',
          value: `💬 Texte : <#${memberData.textChannelId}>\n` +
                 `🔊 Vocal : <#${memberData.voiceChannelId}>`,
          inline: false
        });
      }

      if (memberData.status === 'resolved') {
        embed.addFields({
          name: '✅ Résolution',
          value: `**Date :** ${new Date(memberData.resolvedAt).toLocaleString('fr-FR')}\n` +
                 `**Raison :** ${memberData.resolvedReason}`,
          inline: false
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur info quarantaine:', error);
      return interaction.editReply({
        content: '❌ Erreur lors de la récupération des informations.'
      });
    }
  },

  async handleCleanup(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      let cleaned = 0;
      const guild = interaction.guild;

      // Trouver tous les canaux de quarantaine orphelins
      const quarantineChannels = guild.channels.cache.filter(channel => 
        channel.name.includes('quarantaine') && 
        (channel.type === 0 || channel.type === 2) // Text ou Voice
      );

      for (const channel of quarantineChannels.values()) {
        try {
          // Vérifier si le canal a été utilisé récemment
          if (channel.type === 0) { // TextChannel
            const messages = await channel.messages.fetch({ limit: 1 });
            const lastMessage = messages.first();
            
            // Si pas de messages depuis plus de 24h, considérer comme orphelin
            if (!lastMessage || (Date.now() - lastMessage.createdTimestamp) > 24 * 60 * 60 * 1000) {
              await channel.delete('Nettoyage automatique des canaux de quarantaine orphelins');
              cleaned++;
            }
          } else { // VoiceChannel
            // Si pas de membres connectés, supprimer
            if (channel.members.size === 0) {
              await channel.delete('Nettoyage automatique des canaux de quarantaine orphelins');
              cleaned++;
            }
          }
        } catch (error) {
          console.warn(`Impossible de nettoyer le canal ${channel.name}:`, error.message);
        }
      }

      // Nettoyer les catégories vides
      const quarantineCategories = guild.channels.cache.filter(channel =>
        channel.type === 4 && channel.name.toLowerCase().includes('quarantaine')
      );

      for (const category of quarantineCategories.values()) {
        if (category.children.cache.size === 0) {
          try {
            await category.delete('Catégorie de quarantaine vide');
            cleaned++;
          } catch (error) {
            console.warn(`Impossible de supprimer la catégorie ${category.name}:`, error.message);
          }
        }
      }

      return interaction.editReply({
        content: `🧹 **Nettoyage terminé**\n\n` +
                 `**Canaux supprimés :** ${cleaned}\n\n` +
                 `${cleaned === 0 ? 'Aucun canal orphelin trouvé.' : 'Les canaux inutilisés ont été supprimés.'}`
      });

    } catch (error) {
      console.error('Erreur nettoyage quarantaines:', error);
      return interaction.editReply({
        content: '❌ Erreur lors du nettoyage des canaux de quarantaine.'
      });
    }
  }
};