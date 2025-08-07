const { SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrête la musique et vide la file')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🛑 Viens dans un vocal pour arrêter la musique, sexy.', flags: MessageFlags.Ephemeral });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Rien à arrêter.', flags: MessageFlags.Ephemeral });

    let deferred = false;
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      deferred = true;
    } catch {
      try { await interaction.reply({ content: '❌ Impossible d\'accuser réception de la commande (latence/permissions).', flags: MessageFlags.Ephemeral }); } catch {}
      return;
    }

    try {
      await queue.stop();
      if (deferred) await interaction.editReply({ content: '🧹 File nettoyée. Bisous 💋' });
    } catch (err) {
      const msg = `❌ Oups: ${String(err.message || err)}`;
      if (deferred) await interaction.editReply({ content: msg }).catch(() => {});
      else await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
};