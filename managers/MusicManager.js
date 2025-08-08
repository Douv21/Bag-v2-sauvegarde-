const { EmbedBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
let YouTubePlugin = null;
try { ({ YouTubePlugin } = require('@distube/youtube')); } catch (_) {}
const ffmpeg = require('ffmpeg-static');

const THEME = {
  colorPrimary: '#FF2E88',
  colorSecondary: '#FF69B4',
  footer: 'Boys & Girls • NSFW Vibes 💋'
};

let distubeInstance = null;

function createNowPlayingEmbed(song) {
  return new EmbedBuilder()
    .setColor(THEME.colorPrimary)
    .setTitle('▶️ Lecture')
    .setDescription(`**${song.name}**\n⏱️ ${song.formattedDuration} • demandé par <@${song.user?.id || song.user}>`)
    .setThumbnail(song.thumbnail || null)
    .setFooter({ text: THEME.footer });
}

function createAddedEmbed(song) {
  return new EmbedBuilder()
    .setColor(THEME.colorSecondary)
    .setTitle('➕ Ajouté à la file')
    .setDescription(`**${song.name}** • ⏱️ ${song.formattedDuration}`)
    .setThumbnail(song.thumbnail || null)
    .setFooter({ text: THEME.footer });
}

function resolveYouTubePlugin() {
  // Préfère yt-dlp si le binaire est présent, sinon fallback YouTubePlugin
  try {
    const fs = require('fs');
    const path = require('path');
    const binPath = process.env.YTDLP_DIR
      ? path.join(process.env.YTDLP_DIR, process.env.YTDLP_FILENAME || 'yt-dlp')
      : path.join(__dirname, '..', 'node_modules', '@distube', 'yt-dlp', 'bin', process.env.YTDLP_FILENAME || 'yt-dlp');
    const exists = fs.existsSync(binPath) && fs.statSync(binPath).size > 100000;
    if (exists) return new YtDlpPlugin({ update: false });
  } catch {}
  try {
    if (YouTubePlugin) return new YouTubePlugin();
  } catch {}
  try { return new YtDlpPlugin({ update: false }); } catch {}
  return null;
}

function getMusic(client) {
  if (distubeInstance) return distubeInstance;

  const plugins = [];
  const ytPlugin = resolveYouTubePlugin();
  if (ytPlugin) plugins.push(ytPlugin);

  distubeInstance = new DisTube(client, {
    emitNewSongOnly: true,
    nsfw: true,
    leaveOnEmpty: true,
    leaveOnStop: true,
    leaveOnFinish: false, // on garde la co si la file finit, pour relancer vite
    savePreviousSongs: false,
    ffmpeg: { path: ffmpeg || undefined },
    plugins
  });

  const { buildControls } = require('../handlers/MusicControls');
  distubeInstance
    .on('playSong', (queue, song) => {
      try { queue.textChannel?.send({ embeds: [createNowPlayingEmbed(song)], components: buildControls(queue) }).catch(() => {}); } catch {}
    })
    .on('addSong', (queue, song) => {
      try { queue.textChannel?.send({ embeds: [createAddedEmbed(song)] }).catch(() => {}); } catch {}
    })
    .on('error', (channel, error) => {
      try {
        const text = String(error?.message || error).replace(/https?:\/\/\S+/g, (m) => `<${m}>`).slice(0, 1000);
        const embed = new EmbedBuilder()
          .setColor('#FF0044')
          .setTitle('❌ Erreur musique')
          .setDescription(`\u2063\n${text}`)
          .setFooter({ text: THEME.footer });
        if (channel && typeof channel.send === 'function') channel.send({ embeds: [embed] }).catch(() => {});
      } catch {}
    })
    // Plus de message "File terminée" pour éviter la confusion
    .on('finish', () => {})
    .on('disconnect', (queue) => {
      try {
        const embed = new EmbedBuilder()
          .setColor(THEME.colorSecondary)
          .setDescription('👋 Déconnecté du salon vocal.')
          .setFooter({ text: THEME.footer });
        queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
      } catch {}
    });

  return distubeInstance;
}

module.exports = { getMusic, THEME, createNowPlayingEmbed };