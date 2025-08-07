const { SlashCommandBuilder, ChannelType, PermissionsBitField, MessageFlags } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Relance la lecture')
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '💬 Rejoins un vocal pour relancer la musique, honey.', flags: MessageFlags.Ephemeral });
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect) || !permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je n’ai pas la permission de me connecter/parler dans ce salon.', flags: MessageFlags.Ephemeral });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '😴 Pas de lecture en cours.', flags: MessageFlags.Ephemeral });

    let deferred = false;
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      deferred = true;
    } catch {
      try { await interaction.reply({ content: '❌ Impossible d\'accuser réception de la commande (latence/permissions).', flags: MessageFlags.Ephemeral }); } catch {}
      return;
    }

    try {
      queue.resume();
      if (deferred) await interaction.editReply({ content: '▶️ Et c’est reparti !' });
    } catch (err) {
      const msg = `❌ Oups: ${String(err.message || err)}`;
      if (deferred) {
        await interaction.editReply({ content: msg }).catch(() => {});
      } else {
        await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
  }
};