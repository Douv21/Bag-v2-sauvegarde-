const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder } = require('discord.js');

class LogsConfigHandler {
  constructor(dataManager, logManager) {
    this.dataManager = dataManager;
    this.logManager = logManager;
  }

  async showMain(interaction) {
    const guildId = interaction.guild.id;
    const cfg = await this.logManager.getGuildConfig(guildId);
    const c = cfg.categories;

    const embed = new EmbedBuilder()
      .setColor('#00bcd4')
      .setTitle('🧾 Configuration des Logs')
      .setDescription('Configurez les salons et l’activation des catégories. Les logs de confessions restent dans le menu `config-confession`.')
      .addFields(
        { name: '📝 Messages', value: `${c.messages.enabled ? '✅' : '❌'} <#${c.messages.channelId || 'non-configuré'}> • Éditions: ${c.messages.logEdits ? '✅' : '❌'} • Suppressions: ${c.messages.logDeletes ? '✅' : '❌'}` },
        { name: '🛡️ Modération', value: `${c.moderation.enabled ? '✅' : '❌'} <#${c.moderation.channelId || 'non-configuré'}>` },
        { name: '👥 Arrivées/Départs', value: `${c.members.enabled ? '✅' : '❌'} <#${c.members.channelId || 'non-configuré'}>` },
        { name: '🏷️ Pseudos', value: `${c.nicknames.enabled ? '✅' : '❌'} <#${c.nicknames.channelId || 'non-configuré'}>` },
        { name: '💰 Économie', value: `${c.economy.enabled ? '✅' : '❌'} <#${c.economy.channelId || 'non-configuré'}>` }
      );

    const rows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_toggle_messages').setLabel('Activer/Arrêter Messages').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_messages').setLabel('Salon Messages').setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_toggle_moderation').setLabel('Activer/Arrêter Modération').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_moderation').setLabel('Salon Modération').setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_toggle_members').setLabel('Activer/Arrêter Arrivées/Départs').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_members').setLabel('Salon Arrivées/Départs').setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_toggle_nicknames').setLabel('Activer/Arrêter Pseudos').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_nicknames').setLabel('Salon Pseudos').setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_toggle_economy').setLabel('Activer/Arrêter Économie').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_set_channel_economy').setLabel('Salon Économie').setStyle(ButtonStyle.Primary)
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
        .setMaxValues(1);

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
      // Refresh main
      const replied = interaction.message?.interaction?.user?.id === interaction.user.id;
      if (!replied) {
        // try to edit original ephemeral reply if exists
      }
      return; // main will be refreshed when user presses button again
    }

    return false;
  }
}

module.exports = LogsConfigHandler;