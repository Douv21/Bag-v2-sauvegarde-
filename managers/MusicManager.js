const { EmbedBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { DeezerPlugin } = require('@distube/deezer');

const THEME = {
  colorPrimary: '#FF2E88',
  colorSecondary: '#FF69B4',
  footer: 'Boys & Girls • NSFW Vibes 💋'
};

let distubeInstance = null;

function createNowPlayingEmbed(song, queue) {
  const embed = new EmbedBuilder()
    .setColor(THEME.colorPrimary)
    .setTitle('💋 Now playing, boys & girls')
    .setDescription(`🔥 **${song.name}**\n⏱️ ${song.formattedDuration} • 😈 Demandé par <@${song.user?.id || song.user}>`)
    .setThumbnail(song.thumbnail || null)
    .setFooter({ text: THEME.footer });
  return embed;
}

function createAddedEmbed(song) {
  const embed = new EmbedBuilder()
    .setColor(THEME.colorSecondary)
    .setTitle('😏 Ajouté à la file')
    .setDescription(`🎶 **${song.name}** • ⏱️ ${song.formattedDuration}`)
    .setThumbnail(song.thumbnail || null)
    .setFooter({ text: THEME.footer });
  return embed;
}

function getMusic(client) {
  if (distubeInstance) return distubeInstance;

  distubeInstance = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnStop: true,
    leaveOnFinish: true,
    leaveOnEmpty: true,
    nsfw: true,
    emitAddSongWhenCreatingQueue: false,
    plugins: [
      new SpotifyPlugin(),
      new SoundCloudPlugin(),
      new DeezerPlugin(),
      new YtDlpPlugin({ update: false })
    ]
  });

  distubeInstance
    .on('playSong', (queue, song) => {
      const embed = createNowPlayingEmbed(song, queue);
      queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    })
    .on('addSong', (queue, song) => {
      const embed = createAddedEmbed(song);
      queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    })
    .on('error', (channel, error) => {
      try {
        const embed = new EmbedBuilder()
          .setColor('#FF0044')
          .setTitle('❌ Oups, coquin(e)… Erreur audio')
          .setDescription(`\`\`\`${String(error?.message || error).slice(0, 1800)}\`\`\``)
          .setFooter({ text: THEME.footer });
        if (channel && typeof channel.send === 'function') channel.send({ embeds: [embed] }).catch(() => {});
      } catch {}
    })
    .on('finish', queue => {
      const embed = new EmbedBuilder()
        .setColor(THEME.colorSecondary)
        .setDescription('💦 File terminée. On se repose un peu ?')
        .setFooter({ text: THEME.footer });
      queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    })
    .on('disconnect', queue => {
      const embed = new EmbedBuilder()
        .setColor(THEME.colorSecondary)
        .setDescription('👋 Déconnecté du salon vocal.')
        .setFooter({ text: THEME.footer });
      queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    });

  return distubeInstance;
}

module.exports = { getMusic, THEME };