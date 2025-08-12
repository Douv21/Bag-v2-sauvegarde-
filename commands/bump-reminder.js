const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bump-reminder')
    .setDescription('Configurer les rappels de bump (Disboard et similaires)')
    .addSubcommand(sc => sc.setName('enable').setDescription('Activer les rappels'))
    .addSubcommand(sc => sc.setName('disable').setDescription('Désactiver les rappels'))
    .addSubcommand(sc => sc.setName('set-channel')
      .setDescription('Définir le canal des rappels')
      .addChannelOption(o => o.setName('channel').setDescription('Canal cible').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(sc => sc.setName('set-interval')
      .setDescription('Définir l\'intervalle en heures')
      .addIntegerOption(o => o.setName('heures').setDescription('Nombre d\'heures').setMinValue(1).setMaxValue(72).setRequired(true)))
    .addSubcommand(sc => sc.setName('set-message')
      .setDescription('Définir le message de rappel')
      .addStringOption(o => o.setName('message').setDescription('Message à envoyer').setRequired(true)))
    .addSubcommand(sc => sc.setName('set-role')
      .setDescription('Définir le rôle à mentionner')
      .addRoleOption(o => o.setName('role').setDescription('Rôle à ping').setRequired(false)))
    .addSubcommand(sc => sc.setName('status').setDescription('Afficher la configuration actuelle')),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({ content: '❌ Permission requise: Gérer le serveur', ephemeral: true });
    }

    const rm = client.reminderManager;
    if (!rm) return interaction.reply({ content: '❌ ReminderManager indisponible', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const cfg = await rm.getConfig(guildId);

    if (sub === 'enable') {
      await rm.updateConfig(guildId, { enabled: true });
      return interaction.editReply('✅ Rappels activés');
    }

    if (sub === 'disable') {
      await rm.updateConfig(guildId, { enabled: false });
      return interaction.editReply('✅ Rappels désactivés');
    }

    if (sub === 'set-channel') {
      const channel = interaction.options.getChannel('channel', true);
      await rm.updateConfig(guildId, { channelId: channel.id });
      return interaction.editReply(`✅ Canal défini: ${channel}`);
    }

    if (sub === 'set-interval') {
      const hours = interaction.options.getInteger('heures', true);
      await rm.updateConfig(guildId, { intervalMs: hours * 60 * 60 * 1000 });
      return interaction.editReply(`✅ Intervalle défini: ${hours}h`);
    }

    if (sub === 'set-message') {
      const message = interaction.options.getString('message', true);
      await rm.updateConfig(guildId, { message });
      return interaction.editReply('✅ Message mis à jour');
    }

    if (sub === 'set-role') {
      const role = interaction.options.getRole('role');
      await rm.updateConfig(guildId, { roleId: role ? role.id : null });
      return interaction.editReply(role ? `✅ Rôle défini: ${role}` : '✅ Rôle effacé');
    }

    if (sub === 'status') {
      const e = new EmbedBuilder()
        .setTitle('🔔 Configuration des Rappels de Bump')
        .setColor(cfg.enabled ? 0x00ff00 : 0xff6b6b)
        .addFields(
          { name: 'Statut', value: cfg.enabled ? '✅ Activés' : '❌ Désactivés', inline: true },
          { name: 'Canal', value: cfg.channelId ? `<#${cfg.channelId}>` : 'Non défini', inline: true },
          { name: 'Intervalle', value: `${Math.round((cfg.intervalMs||0)/(60*60*1000))}h`, inline: true },
        );
      if (cfg.roleId) e.addFields({ name: 'Rôle', value: `<@&${cfg.roleId}>`, inline: true });
      if (cfg.message) e.addFields({ name: 'Message', value: cfg.message, inline: false });
      return interaction.editReply({ embeds: [e] });
    }
  }
};