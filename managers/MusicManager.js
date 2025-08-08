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

// Track start time and one-shot retry per guild to mitigate premature finishes
const songStartAtByGuildId = new Map();
const earlyFinishRetriedGuildIds = new Set();
// Memo last voice channel and last early-replay per guild to robustly recover
const lastVoiceChannelByGuildId = new Map();
const lastEarlyReplayAtByGuildId = new Map();

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

  // FFmpeg diagnostic (version / path)
  try {
    const { execFileSync } = require('child_process');
    if (ffmpeg) {
      const out = execFileSync(ffmpeg, ['-version'], { encoding: 'utf8' }).split('\n')[0];
      console.log(`[voice] FFmpeg detected: ${out} @ ${ffmpeg}`);
    } else {
      console.warn('[voice] FFmpeg path is not set');
    }
  } catch (e) {
    console.warn('[voice] FFmpeg check failed:', e?.message || e);
  }

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
    savePreviousSongs: true,
    ffmpeg: { path: ffmpeg || undefined },
    plugins
  });

  distubeInstance
    .on('initQueue', (queue) => {
      try {
        const guildId = queue?.id || queue?.textChannel?.guildId;
        if (guildId) {
          const vc = queue?.voice?.channel || null;
          if (vc) lastVoiceChannelByGuildId.set(guildId, vc);
          if (!songStartAtByGuildId.has(guildId)) songStartAtByGuildId.set(guildId, Date.now());
          earlyFinishRetriedGuildIds.delete(guildId);
        }
      } catch {}
    })
    .on('playSong', (queue, song) => {
      try {
        if (typeof queue.volume === 'number' && queue.volume < 1) {
          queue.setVolume(80);
        }
      } catch {}

      // Memorize start time for early-finish detection
      try {
        const guildId = queue?.id || queue?.textChannel?.guildId;
        if (guildId) {
          songStartAtByGuildId.set(guildId, Date.now());
          earlyFinishRetriedGuildIds.delete(guildId);
          const vc = queue?.voice?.channel || song?.member?.voice?.channel || null;
          if (vc) lastVoiceChannelByGuildId.set(guildId, vc);
        }
      } catch {}

      // Attach lightweight voice connection diagnostics once
      try {
        const conn = queue?.voice?.connection;
        if (conn && !conn.__diagAttached) {
          conn.__diagAttached = true;
          const onStateChange = (oldS, newS) => {
            try { console.debug('[music][voice] state', oldS.status, '→', newS.status); } catch {}
          };
          conn.on('stateChange', onStateChange);
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
    .on('finishSong', async (queue, song) => {
      try { console.log(`[music] finishSong → ${song?.name}`); } catch {}

      // Early finish mitigation: if ended < 5s after start, try once to replay
      try {
        const guildId = queue?.id || queue?.textChannel?.guildId;
        const startedAt = guildId ? songStartAtByGuildId.get(guildId) : undefined;
        const elapsedMs = startedAt ? Date.now() - startedAt : undefined;
        if (
          guildId &&
          typeof elapsedMs === 'number' && elapsedMs < 5000 &&
          !earlyFinishRetriedGuildIds.has(guildId)
        ) {
          // Find a robust voice channel reference
          const fallbackVc = (guild => {
            try {
              const saved = lastVoiceChannelByGuildId.get(guildId);
              if (saved) return saved;
            } catch {}
            try {
              return queue?.voice?.channel || song?.member?.voice?.channel || null;
            } catch {}
            return null;
          })();

          if (fallbackVc) {
            earlyFinishRetriedGuildIds.add(guildId);
            lastEarlyReplayAtByGuildId.set(guildId, Date.now());
            console.warn(`[music] earlyFinishRetry (${elapsedMs}ms) → trying to replay once`);
            try {
              await distubeInstance.play(fallbackVc, song?.url || song?.name, {
                textChannel: queue.textChannel
              });
              return; // stop further handling; a new playSong will follow
            } catch (retryErr) {
              console.warn('[music] earlyFinishRetry failed:', retryErr?.message || retryErr);
            }
          }
        }
      } catch {}
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
      // If we just attempted an early replay, suppress the misleading "queue ended" message
      try {
        const guildId = queue?.id || queue?.textChannel?.guildId;
        const replayAt = guildId ? lastEarlyReplayAtByGuildId.get(guildId) : undefined;
        if (replayAt && Date.now() - replayAt < 4000) {
          console.log('[music] finish (suppressed after early replay)');
          return;
        }
      } catch {}

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