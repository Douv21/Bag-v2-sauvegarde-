const { SlashCommandBuilder, ChannelType, PermissionsBitField, MessageFlags } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Lance une station de radio (URL du flux)')
    .addStringOption(o => o.setName('url').setDescription('URL du flux radio (mp3/aac/m3u)').setRequired(true))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '📻 Pour la radio, rejoins un salon vocal.', ephemeral: true });
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect)) {
      return interaction.reply({ content: '❌ Je ne peux pas me connecter à ce salon vocal. Vérifie mes permissions (Connect).', ephemeral: true });
    }
    if (!permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je ne peux pas parler dans ce salon vocal. Vérifie mes permissions (Speak).', ephemeral: true });
    }

    const url = interaction.options.getString('url', true);

    let deferred = false;
    try {
      await interaction.deferReply({ ephemeral: true });
      deferred = true;
    } catch {
      try { await interaction.reply({ content: '❌ Impossible d\'accuser réception de la commande (permissions ou latence).', ephemeral: true }); } catch {}
      return;
    }

    const distube = getMusic(interaction.client);

    try {
      const timeoutMs = 15000;
      const playPromise = distube.play(voiceChannel, url, { member, textChannel: interaction.channel, interaction });

      await Promise.race([
        playPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_MUSIC_PLAY')), timeoutMs))
      ]);

      if (deferred) {
        await interaction.editReply({ content: `📻 Radio lancée: ${url} • Bonne écoute 😈` });
      }
    } catch (err) {
      // Fallback moteur alternatif direct
      try {
        const { playAlt } = require('../managers/AltPlayer');
        await playAlt(voiceChannel, url, interaction.channel, interaction.user);
        if (deferred) {
          await interaction.editReply({ content: `📻 Radio lancée (ALT): ${url}` }).catch(() => {});
        } else {
          await interaction.reply({ content: `📻 Radio lancée (ALT): ${url}`, ephemeral: true }).catch(() => {});
        }
        return;
      } catch (altErr) {
        const primaryMsg = err && err.message === 'TIMEOUT_MUSIC_PLAY'
          ? '⏳ La connexion vocale ou la récupération du flux est trop lente. Réessaie dans un instant et vérifie mes permissions/latence.'
          : `❌ Impossible de lire le flux (DisTube): ${String(err.message || err)}`;
        const altMsg = ` • Fallback ALT: ${String(altErr?.message || altErr)}`;
        const msg = `${primaryMsg}${altMsg}`;
        if (deferred) {
          await interaction.editReply({ content: msg }).catch(() => {});
        } else {
          await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
        }
      }
    }
  }
};