const { EmbedBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { DeezerPlugin } = require('@distube/deezer');
const ffmpeg = require('ffmpeg-static');

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

function resolveYouTubePlugin() {
  // Préférence: yt-dlp. Fallback: plugin YouTube officiel si binaire indisponible.
  try {
    const fs = require('fs');
    const path = require('path');
    const binPath = process.env.YTDLP_DIR
      ? path.join(process.env.YTDLP_DIR, process.env.YTDLP_FILENAME || 'yt-dlp')
      : path.join(__dirname, '..', 'node_modules', '@distube', 'yt-dlp', 'bin', process.env.YTDLP_FILENAME || 'yt-dlp');
    const exists = fs.existsSync(binPath) && fs.statSync(binPath).size > 100000;
    if (exists) {
      return new YtDlpPlugin({ update: process.env.YTDLP_UPDATE === 'true' });
    }
  } catch {}

  try {
    const { YouTubePlugin } = require('@distube/youtube');
    return new YouTubePlugin({ cookies: undefined });
  } catch (e) {
    try {
      return new YtDlpPlugin({ update: false });
    } catch {}
  }
  return null;
}

function getMusic(client) {
  if (distubeInstance) return distubeInstance;

  // Petit rapport console pour diagnostiquer l'audio/voix
  try {
    const voice = require('@discordjs/voice');
    if (voice && typeof voice.generateDependencyReport === 'function') {
      // N'affiche qu'une seule fois
      console.log('\n[voice] Dependency report (once):');
      console.log(voice.generateDependencyReport());
    }
  } catch {}

  const plugins = [
    new SpotifyPlugin(),
    new SoundCloudPlugin(),
    new DeezerPlugin()
  ];
  const ytPlugin = resolveYouTubePlugin();
  if (ytPlugin) plugins.push(ytPlugin);

  distubeInstance = new DisTube(client, {
    emitNewSongOnly: true,
    nsfw: true,
    emitAddSongWhenCreatingQueue: false,
    leaveOnFinish: false,
    leaveOnEmpty: true,
    leaveOnStop: true,
    savePreviousSongs: true,
    searchSongs: 0,
    ffmpeg: { path: ffmpeg || undefined },
    ytdlOptions: { highWaterMark: 1 << 25, quality: 'highestaudio' },
    plugins
  });

  distubeInstance
    .on('playSong', (queue, song) => {
      try {
        if (typeof queue.volume === 'number' && queue.volume < 1) {
          queue.setVolume(80);
        }
      } catch {}
      const embed = createNowPlayingEmbed(song, queue);
      queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
      try {
        console.log(`[music] playSong → ${song.name} (${song.formattedDuration}) | channelId=${queue.voice?.connection?.joinConfig?.channelId}`);
      } catch {}
    })
    .on('addSong', (queue, song) => {
      const embed = createAddedEmbed(song);
      queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    })
    .on('finishSong', (queue, song) => {
      try { console.log(`[music] finishSong → ${song?.name}`); } catch {}
    })
    .on('empty', queue => {
      try { console.log('[music] empty → voice channel became empty'); } catch {}
    })
    .on('noRelated', queue => {
      try { console.log('[music] noRelated → no related tracks found'); } catch {}
    })
    .on('searchNoResult', (message, query) => {
      try { console.log(`[music] searchNoResult → ${query}`); } catch {}
    })
    .on('error', (channel, error) => {
      try {
        const text = String(error?.message || error)
          .replace(/https?:\/\/\S+/g, (m) => `<${m}>`)
          .slice(0, 1000);
        const embed = new EmbedBuilder()
          .setColor('#FF0044')
          .setTitle('❌ Erreur audio')
          .setDescription(`\u2063\n${text}`)
          .setFooter({ text: THEME.footer });
        if (channel && typeof channel.send === 'function') channel.send({ embeds: [embed] }).catch(() => {});
        console.warn('[music] error:', error?.stack || error);
      } catch {}
    })
    .on('finish', queue => {
      const embed = new EmbedBuilder()
        .setColor(THEME.colorSecondary)
        .setDescription('💦 File terminée. On se repose un peu ?')
        .setFooter({ text: THEME.footer });
      queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
      try { console.log('[music] finish → queue ended'); } catch {}
    })
    .on('disconnect', queue => {
      const embed = new EmbedBuilder()
        .setColor(THEME.colorSecondary)
        .setDescription('👋 Déconnecté du salon vocal.')
        .setFooter({ text: THEME.footer });
      queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
      try { console.log('[music] disconnect'); } catch {}
    })
    .on('debug', msg => {
      // Log uniquement côté serveur pour diagnostic
      try { console.debug('[music][debug]', msg); } catch {}
    });

  return distubeInstance;
}

module.exports = { getMusic, THEME };