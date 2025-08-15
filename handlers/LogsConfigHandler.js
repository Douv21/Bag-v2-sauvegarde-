const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, StringSelectMenuBuilder } = require('discord.js');

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
        { name: '📺 Salons', value: `${c.channels?.enabled ? '✅' : '❌'} ${formatChannel(c.channels?.channelId)}` },
        { name: '🧵 Threads', value: `${c.threads?.enabled ? '✅' : '❌'} ${formatChannel(c.threads?.channelId)}` },
        { name: '😜 Émojis', value: `${c.emojis?.enabled ? '✅' : '❌'} ${formatChannel(c.emojis?.channelId)}` },
        { name: '🏷️ Stickers', value: `${c.stickers?.enabled ? '✅' : '❌'} ${formatChannel(c.stickers?.channelId)}` },
        { name: '✉️ Invitations', value: `${c.invites?.enabled ? '✅' : '❌'} ${formatChannel(c.invites?.channelId)}` },
        { name: '🪝 Webhooks', value: `${c.webhooks?.enabled ? '✅' : '❌'} ${formatChannel(c.webhooks?.channelId)}` },
        { name: '🏰 Serveur', value: `${c.server?.enabled ? '✅' : '❌'} ${formatChannel(c.server?.channelId)}` },
        { name: '💎 Boosts', value: `${c.boosts?.enabled ? '✅' : '❌'} ${formatChannel(c.boosts?.channelId)}` },
        { name: '📅 Événements', value: `${c.events?.enabled ? '✅' : '❌'} ${formatChannel(c.events?.channelId)}` },
        { name: '🎨 Thème', value: `NSFW: ${cfg.theme?.nsfwTone ? '🔞' : '🚫'} • Avatars: ${cfg.theme?.includeAvatars ? '✅' : '❌'} • Liens: ${cfg.theme?.includeJumpLinks ? '✅' : '❌'}\nFooter: ${cfg.theme?.footer || '—'}` }
      );

    // Nouvelle UI: menu de sélection de catégorie + options de thème
    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId('logs_category_select')
      .setPlaceholder('Choisissez une catégorie à configurer')
      .addOptions(
        { label: 'Messages', value: 'messages' },
        { label: 'Modération', value: 'moderation' },
        { label: 'Arrivées/Départs', value: 'members' },
        { label: 'Pseudos', value: 'nicknames' },
        { label: 'Économie', value: 'economy' },
        { label: 'Vocaux', value: 'voice' },
        { label: 'Rôles', value: 'roles' },
        { label: 'Salons', value: 'channels' },
        { label: 'Threads', value: 'threads' },
        { label: 'Émojis', value: 'emojis' },
        { label: 'Stickers', value: 'stickers' },
        { label: 'Invitations', value: 'invites' },
        { label: 'Webhooks', value: 'webhooks' },
        { label: 'Serveur', value: 'server' },
        { label: 'Boosts', value: 'boosts' },
        { label: 'Événements', value: 'events' }
      );

    const rows = [
      new ActionRowBuilder().addComponents(categorySelect),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_theme_toggle_nsfw').setLabel('NSFW On/Off').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_theme_toggle_avatars').setLabel('Avatars On/Off').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_theme_toggle_links').setLabel('Liens On/Off').setStyle(ButtonStyle.Secondary)
      ),
      new ActionRowBuilder().addComponents(
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

    // Sélection de catégorie -> proposer actions basiques pour cette catégorie
    if (customId === 'logs_category_select') {
      const category = interaction.values?.[0];
      if (!category) return interaction.reply({ content: 'Aucune catégorie sélectionnée.', ephemeral: true });

      const cfg = await this.logManager.getGuildConfig(guildId);
      const enabled = cfg.categories[category]?.enabled ?? false;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`logs_toggle_${category}`)
          .setLabel(enabled ? 'Désactiver' : 'Activer')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`logs_set_channel_${category}`)
          .setLabel('Définir le salon')
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({ content: `Options pour ${category}`, components: [row], ephemeral: true });
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