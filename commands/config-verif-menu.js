const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-verif-menu')
    .setDescription('Menu de configuration du système de vérification et sécurité')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 5,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const mod = interaction.client.moderationManager;
    if (!mod) {
      return interaction.reply({ content: '❌ Système de modération non disponible.', flags: 64 });
    }

    const guildId = interaction.guild.id;

    try {
      await this.handleMainMenu(interaction, mod, guildId);
    } catch (error) {
      console.error('Erreur config-verif-menu:', error);
      return interaction.reply({ content: '❌ Erreur lors de la configuration.', flags: 64 });
    }
  },

  async handleMainMenu(interaction, mod, guildId) {
    const config = await mod.getSecurityConfig(guildId);
    
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Configuration Système de Vérification')
      .setDescription('Sélectionnez une option de configuration ci-dessous')
      .setColor(config.enabled ? 0x51cf66 : 0x6c757d)
      .setTimestamp();

    // État actuel
    embed.addFields({
      name: '📊 État actuel',
      value: `**Système :** ${config.enabled ? '✅ Activé' : '❌ Désactivé'}\n` +
             `**Vérification auto :** ${config.autoVerification?.enabled ? '✅ Activée' : '❌ Désactivée'}\n` +
             `**Quarantaine :** ${config.accessControl?.quarantineRoleId ? '✅ Configurée' : '❌ Non configurée'}\n` +
             `**Notifications :** ${config.autoAlerts?.alertChannelId ? '✅ Configurées' : '❌ Non configurées'}`,
      inline: false
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('config_verif_menu')
      .setPlaceholder('Choisissez une section à configurer')
      .addOptions([
        {
          label: '🔍 Vérification automatique',
          description: 'Configurer la vérification à l\'arrivée des membres',
          value: 'auto_verification',
          emoji: '🔍'
        },
        {
          label: '🔒 Système de quarantaine',
          description: 'Configurer les rôles et canaux de quarantaine',
          value: 'quarantine_system',
          emoji: '🔒'
        },
        {
          label: '⚡ Actions automatiques',
          description: 'Définir les actions pour chaque type de suspect',
          value: 'auto_actions',
          emoji: '⚡'
        },
        {
          label: '📢 Notifications admin',
          description: 'Configurer les alertes et délais de décision',
          value: 'notifications',
          emoji: '📢'
        },
        {
          label: '📝 Exemptions',
          description: 'Gérer la liste des utilisateurs/rôles exemptés',
          value: 'exemptions',
          emoji: '📝'
        },
        {
          label: '📊 Voir configuration',
          description: 'Afficher la configuration complète actuelle',
          value: 'view_config',
          emoji: '📊'
        }
      ]);

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_verif_enable')
          .setLabel(config.enabled ? 'Désactiver système' : 'Activer système')
          .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
          .setEmoji(config.enabled ? '❌' : '✅'),
        new ButtonBuilder()
          .setCustomId('config_verif_reset')
          .setLabel('Réinitialiser')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId('config_verif_help')
          .setLabel('Guide d\'aide')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❓')
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return interaction.reply({ 
      embeds: [embed], 
      components: [row, buttons], 
      flags: 64 
    });
  },

  getActionDisplay(action) {
    const displays = {
      'ALERT': '📢 Alerte seulement',
      'WARN': '⚠️ Avertissement',
      'KICK': '👢 Expulsion automatique',
      'BAN': '🔨 Bannissement automatique',
      'QUARANTINE': '🔒 Mise en quarantaine',
      'ADMIN_APPROVAL': '👨‍💼 Demander approbation admin'
    };
    return displays[action] || action;
  }
};