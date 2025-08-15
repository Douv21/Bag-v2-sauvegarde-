const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');

class LogsConfigHandler {
  constructor(dataManager, logManager) {
    this.dataManager = dataManager;
    this.logManager = logManager;
  }

  async showMain(interaction) {
    const guildId = interaction.guild.id;
    const cfg = await this.logManager.getGuildConfig(guildId);
    const c = cfg.categories;

    const formatChannel = (id) => id ? `<#${id}>` : 'non-configuré';

    const embed = new EmbedBuilder()
      .setColor('#00bcd4')
      .setTitle('🧾 Configuration des Logs')
      .setDescription('Configurez les salons et l’activation des catégories. Les logs de confessions restent dans le menu `config-confession`.')
      .addFields(
        { name: '📝 Messages', value: `${c.messages.enabled ? '✅' : '❌'} ${formatChannel(c.messages.channelId)} • Éditions: ${c.messages.logEdits ? '✅' : '❌'} • Suppressions: ${c.messages.logDeletes ? '✅' : '❌'}` },
        { name: '🛡️ Modération', value: `${c.moderation.enabled ? '✅' : '❌'} ${formatChannel(c.moderation.channelId)}` },
        { name: '👥 Arrivées/Départs', value: `${c.members.enabled ? '✅' : '❌'} ${formatChannel(c.members.channelId)}` },
        { name: '🏷️ Pseudos', value: `${c.nicknames.enabled ? '✅' : '❌'} ${formatChannel(c.nicknames.channelId)}` },
        { name: '💰 Économie', value: `${c.economy.enabled ? '✅' : '❌'} ${formatChannel(c.economy.channelId)}` },
        { name: '🔊 Vocaux', value: `${c.voice?.enabled ? '✅' : '❌'} ${formatChannel(c.voice?.channelId)}` },
        { name: '🧩 Rôles', value: `${c.roles?.enabled ? '✅' : '❌'} ${formatChannel(c.roles?.channelId)}` },
        { name: '🎨 Thème', value: `NSFW: ${cfg.theme?.nsfwTone ? '🔞' : '🚫'} • Avatars: ${cfg.theme?.includeAvatars ? '✅' : '❌'} • Liens: ${cfg.theme?.includeJumpLinks ? '✅' : '❌'}\nFooter: ${cfg.theme?.footer || '—'}` }
      );

    // Regrouper les boutons en 4 rangées
    const rows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_toggle_messages').setLabel('Activer/Arrêter Messages').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_messages').setLabel('Salon Messages').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('logs_toggle_moderation').setLabel('Activer/Arrêter Modération').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_moderation').setLabel('Salon Modération').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('logs_toggle_members').setLabel('Activer/Arrêter Arrivées/Départs').setStyle(ButtonStyle.Secondary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_set_channel_members').setLabel('Salon Arrivées/Départs').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('logs_toggle_nicknames').setLabel('Activer/Arrêter Pseudos').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_nicknames').setLabel('Salon Pseudos').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('logs_toggle_economy').setLabel('Activer/Arrêter Économie').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_economy').setLabel('Salon Économie').setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_toggle_voice').setLabel('Activer/Arrêter Vocaux').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_voice').setLabel('Salon Vocaux').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('logs_toggle_roles').setLabel('Activer/Arrêter Rôles').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_roles').setLabel('Salon Rôles').setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_theme_toggle_nsfw').setLabel('NSFW On/Off').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_theme_toggle_avatars').setLabel('Avatars On/Off').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_theme_toggle_links').setLabel('Liens On/Off').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_theme_footer_set').setLabel('Définir Footer par défaut').setStyle(ButtonStyle.Primary)
      )
    ];

    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
  }

  async handle(interaction, customId) {
    const guildId = interaction.guild.id;

    if (customId === 'logs_main') {
      return this.showMain(interaction);
    }

    // Toggle
    if (customId.startsWith('logs_toggle_')) {
      const category = customId.split('logs_toggle_')[1];
      const cfg = await this.logManager.getGuildConfig(guildId);
      const old = cfg.categories[category]?.enabled ?? true;
      await this.logManager.setCategoryConfig(guildId, category, { enabled: !old });
      return this.showMain(interaction);
    }

    // Open channel picker
    if (customId.startsWith('logs_set_channel_')) {
      const category = customId.split('logs_set_channel_')[1];
      const picker = new ChannelSelectMenuBuilder()
        .setCustomId(`logs_channel_select_${category}`)
        .setPlaceholder('Choisissez un salon pour les logs')
        .setMinValues(1)
        .setMaxValues(1)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

      const row = new ActionRowBuilder().addComponents(picker);
      return interaction.reply({ content: `Sélectionnez le salon pour ${category}`, components: [row], ephemeral: true });
    }

    // Channel picked
    if (customId.startsWith('logs_channel_select_')) {
      const category = customId.split('logs_channel_select_')[1];
      const channelId = interaction.values?.[0];
      if (!channelId) return interaction.reply({ content: 'Aucun salon sélectionné.', ephemeral: true });
      await this.logManager.setCategoryConfig(guildId, category, { channelId });
      await interaction.update({ content: `Salon configuré pour ${category}: <#${channelId}>`, components: [] });
      return;
    }

    // Theme toggles
    if (customId === 'logs_theme_toggle_nsfw') {
      const cfg = await this.logManager.getGuildConfig(guildId);
      const nsfwTone = !cfg.theme?.nsfwTone;
      await this.logManager.setThemeConfig(guildId, { nsfwTone });
      return this.showMain(interaction);
    }

    if (customId === 'logs_theme_toggle_avatars') {
      const cfg = await this.logManager.getGuildConfig(guildId);
      const includeAvatars = !cfg.theme?.includeAvatars;
      await this.logManager.setThemeConfig(guildId, { includeAvatars });
      return this.showMain(interaction);
    }

    if (customId === 'logs_theme_toggle_links') {
      const cfg = await this.logManager.getGuildConfig(guildId);
      const includeJumpLinks = !cfg.theme?.includeJumpLinks;
      await this.logManager.setThemeConfig(guildId, { includeJumpLinks });
      return this.showMain(interaction);
    }

    if (customId === 'logs_theme_footer_set') {
      // Définit le footer par défaut NSFW Boys & Girls
      await this.logManager.setThemeConfig(guildId, { footer: 'Boys & Girls 🔥 Logs' });
      return this.showMain(interaction);
    }

    return false;
  }
}

module.exports = LogsConfigHandler;