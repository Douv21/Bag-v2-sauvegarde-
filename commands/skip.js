const { SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Passer au prochain morceau')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '👂 Rejoins un salon vocal pour skipper, coquin(e)!', ephemeral: true });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Rien à skipper…', ephemeral: true });

    let deferred = false;
    try {
      await interaction.deferReply({ ephemeral: true });
      deferred = true;
    } catch {
      try { await interaction.reply({ content: '❌ Impossible d\'accuser réception de la commande (latence/permissions).', ephemeral: true }); } catch {}
      return;
    }

    try {
      await queue.skip();
      if (deferred) await interaction.editReply({ content: '⏭️ Hop ! Suivant.' });
    } catch (err) {
      const msg = `❌ Oups: ${String(err.message || err)}`;
      if (deferred) await interaction.editReply({ content: msg }).catch(() => {});
      else await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
};