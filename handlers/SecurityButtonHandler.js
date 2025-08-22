const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const QuarantineChannelManager = require('./QuarantineChannelManager');

class SecurityButtonHandler {
  constructor(moderationManager) {
    this.moderationManager = moderationManager;
  }

  /**
   * Gérer les interactions des boutons de sécurité
   * @param {ButtonInteraction} interaction - L'interaction du bouton
   */
  async handleSecurityButton(interaction) {
    try {
      // Vérifier les permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ 
          content: '❌ Vous n\'avez pas les permissions pour effectuer cette action.', 
          flags: 64 
        });
      }

      const [action, userId] = interaction.customId.replace('security_', '').split('_');
      const targetUser = await interaction.client.users.fetch(userId).catch(() => null);
      
      if (!targetUser) {
        return interaction.reply({ 
          content: '❌ Utilisateur introuvable.', 
          flags: 64 
        });
      }

      const member = await interaction.guild.members.fetch(userId).catch(() => null);

      switch (action) {
        case 'approve':
          await this.handleApprove(interaction, member, targetUser);
          break;
        case 'deny':
          await this.handleDeny(interaction, member, targetUser);
          break;
        case 'quarantine':
          await this.handleQuarantine(interaction, member, targetUser);
          break;
        case 'details':
          await this.handleDetails(interaction, member, targetUser);
          break;
        case 'kick':
          await this.handleKick(interaction, member, targetUser);
          break;
        case 'ban':
          await this.handleBan(interaction, member, targetUser);
          break;
        default:
          return interaction.reply({ content: '❌ Action inconnue.', flags: 64 });
      }

    } catch (error) {
      console.error('Erreur bouton sécurité:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors du traitement de l\'action.', 
        flags: 64 
      });
    }
  }

  async handleApprove(interaction, member, targetUser) {
    try {
      if (!member) {
        return interaction.reply({ 
          content: `❌ ${targetUser.tag} n'est plus sur le serveur.`, 
          flags: 64 
        });
      }

      const reason = `Approuvé par ${interaction.user.tag}`;

      // Utiliser le système centralisé si disponible pour nettoyer permissions et canaux
      if (typeof interaction.client.grantAccess === 'function') {
        await interaction.client.grantAccess(member, reason);
      } else {
        const qManager = new QuarantineChannelManager(this.moderationManager);
        await qManager.releaseFromQuarantine(member, reason);
      }

      // Notifier le membre
      try {
        await member.send(
          `✅ **Accès approuvé - ${interaction.guild.name}**\n\n` +
          `Votre accès au serveur a été approuvé par un administrateur.\n` +
          `**Approuvé par :** ${interaction.user.tag}\n\n` +
          `Vous pouvez maintenant accéder à tous les canaux autorisés. Bienvenue !`
        );
      } catch {}

      // Mettre à jour le message d'alerte
      const embed = new EmbedBuilder()
        .setTitle('✅ MEMBRE APPROUVÉ')
        .setDescription(`**${targetUser.tag}** a été approuvé par ${interaction.user}`)
        .setColor(0x51cf66)
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });

      console.log(`✅ Membre approuvé: ${targetUser.tag} par ${interaction.user.tag}`);

    } catch (error) {
      console.error('Erreur approbation membre:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors de l\'approbation.', 
        flags: 64 
      });
    }
  }

  async handleDeny(interaction, member, targetUser) {
    try {
      const reason = `Refusé par ${interaction.user.tag}`;
      
      if (member) {
        // Notifier le membre avant de le kicker
        try {
          await member.send(
            `❌ **Accès refusé - ${interaction.guild.name}**\n\n` +
            `Votre demande d'accès au serveur a été refusée par un administrateur.\n` +
            `**Refusé par :** ${interaction.user.tag}\n\n` +
            `Si vous pensez qu'il s'agit d'une erreur, vous pouvez contacter les administrateurs.`
          );
        } catch {}

        // Kicker le membre
        await member.kick(reason);
      }

      // Mettre à jour le message d'alerte
      const embed = new EmbedBuilder()
        .setTitle('❌ MEMBRE REFUSÉ')
        .setDescription(`**${targetUser.tag}** a été refusé et expulsé par ${interaction.user}`)
        .setColor(0xff6b6b)
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });

      console.log(`❌ Membre refusé: ${targetUser.tag} par ${interaction.user.tag}`);

    } catch (error) {
      console.error('Erreur refus membre:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors du refus.', 
        flags: 64 
      });
    }
  }

  async handleQuarantine(interaction, member, targetUser) {
    try {
      if (!member) {
        return interaction.reply({ 
          content: `❌ ${targetUser.tag} n'est plus sur le serveur.`, 
          flags: 64 
        });
      }

      const details = { reason: `Mis en quarantaine par ${interaction.user.tag}`, score: 0 };

      // Utiliser la méthode centrale si disponible (isolation stricte + canaux privés)
      if (typeof interaction.client.quarantineMember === 'function') {
        await interaction.client.quarantineMember(member, 'SECURITY_BUTTON', details);
      } else {
        // Fallback: créer les canaux + configurer les permissions via le gestionnaire
        const qManager = new QuarantineChannelManager(this.moderationManager);
        await qManager.createQuarantineChannels(member, details.reason);
      }

      // Notifier le membre
      try {
        await member.send(
          `🔒 **Mis en quarantaine - ${interaction.guild.name}**\n\n` +
          `Vous avez été placé en quarantaine par un administrateur.\n` +
          `**Mis en quarantaine par :** ${interaction.user.tag}\n\n` +
          `Votre accès est limité en attendant une vérification supplémentaire.`
        );
      } catch {}

      // Mettre à jour le message
      const embed = new EmbedBuilder()
        .setTitle('🔒 MEMBRE EN QUARANTAINE')
        .setDescription(`**${targetUser.tag}** a été mis en quarantaine par ${interaction.user}`)
        .setColor(0xffd43b)
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });

      console.log(`🔒 Membre en quarantaine: ${targetUser.tag} par ${interaction.user.tag}`);

    } catch (error) {
      console.error('Erreur quarantaine membre:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors de la mise en quarantaine.', 
        flags: 64 
      });
    }
  }

  async handleDetails(interaction, member, targetUser) {
    try {
      // Effectuer une analyse complète
      const [securityAnalysis, multiAccountCheck, genderInfo] = await Promise.all([
        this.moderationManager.analyzeUserSecurity(interaction.guild, targetUser),
        this.moderationManager.detectMultiAccounts(interaction.guild, targetUser),
        this.moderationManager.analyzeGenderInfo(targetUser)
      ]);

      const embed = new EmbedBuilder()
        .setTitle(`🔍 Analyse détaillée - ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setColor(0x3498db)
        .setTimestamp();

      // Informations de base
      const accountAge = Math.floor((Date.now() - targetUser.createdTimestamp) / (1000 * 60 * 60 * 24));
      embed.addFields({
        name: '👤 Informations',
        value: `**Score de risque :** ${securityAnalysis.riskScore}/100\n` +
               `**Âge du compte :** ${accountAge} jour(s)\n` +
               `**Genre détecté :** ${this.getGenderDisplay(genderInfo.detected)}\n` +
               `**Multi-comptes :** ${multiAccountCheck.totalSuspects} suspect(s)`,
        inline: false
      });

      // Drapeaux de risque
      if (securityAnalysis.flags.length > 0) {
        embed.addFields({
          name: '🚩 Drapeaux de risque',
          value: securityAnalysis.flags.slice(0, 8).join('\n'),
          inline: false
        });
      }

      // Multi-comptes détaillés
      if (multiAccountCheck.totalSuspects > 0) {
        let multiText = '';
        for (const suspect of multiAccountCheck.suspiciousAccounts.slice(0, 3)) {
          multiText += `• **${suspect.user.tag}** (${suspect.similarity}%)\n`;
          multiText += `  ${suspect.reasons.slice(0, 2).join(', ')}\n\n`;
        }
        
        embed.addFields({
          name: '🔍 Comptes suspects',
          value: multiText.slice(0, 1024),
          inline: false
        });
      }

      return interaction.reply({ embeds: [embed], flags: 64 });

    } catch (error) {
      console.error('Erreur détails sécurité:', error);
      return interaction.reply({ 
        content: '❌ Erreur lors de la récupération des détails.', 
        flags: 64 
      });
    }
  }

  async handleKick(interaction, member, targetUser) {
    try {
      // Vérifier permissions du modérateur
      if (!interaction.member?.permissions?.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({ content: '❌ Permission requise: KickMembers.', flags: 64 });
      }

      // Vérifier que le bot a les permissions requises
      const me = interaction.guild.members.me;
      if (!me?.permissions?.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({ content: '❌ Je n\'ai pas la permission de kick.', flags: 64 });
      }

      if (!member) {
        return interaction.reply({ content: `❌ ${targetUser.tag} n'est plus sur le serveur.`, flags: 64 });
      }

      // Notifier l'utilisateur
      try {
        await targetUser.send(
          `👢 **Expulsé - ${interaction.guild.name}**\n\n` +
          `Vous avez été expulsé par un administrateur.\n` +
          `**Modérateur :** ${interaction.user.tag}`
        );
      } catch {}

      await member.kick(`Kick via vérif par ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setTitle('👢 MEMBRE EXPULSÉ')
        .setDescription(`**${targetUser.tag}** a été expulsé par ${interaction.user}`)
        .setColor(0xff6b6b)
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });

      console.log(`👢 Membre kick: ${targetUser.tag} par ${interaction.user.tag}`);
    } catch (error) {
      console.error('Erreur kick via bouton:', error);
      return interaction.reply({ content: '❌ Erreur lors du kick.', flags: 64 });
    }
  }

  async handleBan(interaction, member, targetUser) {
    try {
      // Vérifier permissions du modérateur
      if (!interaction.member?.permissions?.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({ content: '❌ Permission requise: BanMembers.', flags: 64 });
      }

      // Vérifier que le bot a les permissions requises
      const me = interaction.guild.members.me;
      if (!me?.permissions?.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({ content: '❌ Je n\'ai pas la permission de ban.', flags: 64 });
      }

      // Notifier l'utilisateur
      try {
        await targetUser.send(
          `🔨 **Banni - ${interaction.guild.name}**\n\n` +
          `Vous avez été banni par un administrateur.\n` +
          `**Modérateur :** ${interaction.user.tag}`
        );
      } catch {}

      // Si le membre n'est plus présent, on peut quand même ban via ID
      if (member) {
        await member.ban({ reason: `Ban via vérif par ${interaction.user.tag}`, deleteMessageDays: 1 });
      } else {
        await interaction.guild.members.ban(targetUser.id, { reason: `Ban via vérif par ${interaction.user.tag}`, deleteMessageSeconds: 86400 }).catch(() => null);
      }

      const embed = new EmbedBuilder()
        .setTitle('🔨 MEMBRE BANNI')
        .setDescription(`**${targetUser.tag}** a été banni par ${interaction.user}`)
        .setColor(0x000000)
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });

      console.log(`🔨 Membre banni: ${targetUser.tag} par ${interaction.user.tag}`);
    } catch (error) {
      console.error('Erreur ban via bouton:', error);
      try {
        await interaction.reply({ content: '❌ Erreur lors du ban.', flags: 64 });
      } catch {}
    }
  }

  getGenderDisplay(gender) {
    const displays = {
      MALE: '👨 Masculin',
      FEMALE: '👩 Féminin',
      NON_BINARY: '🧑 Non-binaire',
      UNKNOWN: '❓ Inconnu'
    };
    return displays[gender] || '❓ Inconnu';
  }
}

module.exports = SecurityButtonHandler;