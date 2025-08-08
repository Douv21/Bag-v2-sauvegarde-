const { SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Met en pause le morceau en cours')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🧘 Viens au vocal pour mettre en pause, darling.', flags: MessageFlags.Ephemeral });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Pas de lecture en cours.', flags: MessageFlags.Ephemeral });

    let deferred = false;
    try {
      await interaction.deferReply({ ephemeral: true });
      deferred = true;
    } catch {
      try { await interaction.reply({ content: '❌ Impossible d\'accuser réception de la commande (latence/permissions).', flags: MessageFlags.Ephemeral }); } catch {}
      return;
    }

    try {
      queue.pause();
      if (deferred) await interaction.editReply({ content: '⏸️ C’est en pause, baby.' });
    } catch (err) {
      const msg = `❌ Oups: ${String(err.message || err)}`;
      if (deferred) await interaction.editReply({ content: msg }).catch(() => {});
      else await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
};