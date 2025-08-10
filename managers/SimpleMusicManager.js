const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } = require('@discordjs/voice');
const { ChannelType, EmbedBuilder } = require('discord.js');
const play = require('play-dl');
const { applyPlayDlCookies, getYouTubeCookieString } = require('../utils/youtubeCookies');
applyPlayDlCookies(play);
const prism = require('prism-media');

const THEME = {
  colorPrimary: '#FF2E88',
  colorSecondary: '#FF69B4',
  footer: 'Boys & Girls • NSFW Vibes 💋'
};

/**
 * État global: par serveur
 * guildId -> {
 *   connection,
 *   player,
 *   queue: Array<Track>,
 *   current: Track | null,
 *   volume: number (0-100),
 *   textChannel
 * }
 */
const guildIdToState = new Map();

function createNowPlayingEmbed(track) {
  return new EmbedBuilder()
    .setColor(THEME.colorPrimary)
    .setTitle('▶️ Lecture')
    .setDescription(`**${track.title || track.query}**\nDemandé par <@${track.requestedBy?.id || track.requestedBy}>`)
    .setFooter({ text: THEME.footer });
}

async function ensureConnection(voiceChannel) {
  if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
    throw new Error('NOT_IN_VOICE');
  }

  const guildId = voiceChannel.guild.id;
  let state = guildIdToState.get(guildId);

  if (!state) {
    state = {
      connection: null,
      player: null,
      queue: [],
      current: null,
      volume: 100,
      textChannel: null,
      isPlaying: false
    };
    guildIdToState.set(guildId, state);
  }

  // Connexion vocale
  if (!state.connection) {
    state.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    await entersState(state.connection, VoiceConnectionStatus.Ready, 15000);

    // Reconnexion automatique si Discord coupe la connexion
    try {
      state.connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(state.connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(state.connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          try { state.player?.stop(true); } catch {}
          try { state.connection?.destroy(); } catch {}
          guildIdToState.delete(guildId);
        }
      });
    } catch {}
  }

  // Lecteur
  if (!state.player) {
    state.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
    state.connection.subscribe(state.player);

    // Gestion des événements du lecteur
    state.player.on('error', () => {});
    state.player.on(AudioPlayerStatus.Idle, async () => {
      // Fin du morceau: passer au suivant
      try {
        const currentState = guildIdToState.get(guildId);
        if (!currentState) return;
        currentState.current = null;
        if (currentState.queue.length > 0) {
          await playNext(guildId);
        } else {
          // Rien à jouer: détruire la connexion après un court délai
          setTimeout(() => {
            const s = guildIdToState.get(guildId);
            if (!s) return;
            if (!s.current && s.queue.length === 0) {
              try { s.player.stop(true); } catch {}
              try { s.connection.destroy(); } catch {}
              guildIdToState.delete(guildId);
            }
          }, 3000);
        }
      } catch {}
    });
  }

  return state;
}

// Préparer ffmpeg-static si disponible pour une meilleure compatibilité Render
try {
  const ffmpegStatic = require('ffmpeg-static');
  if (ffmpegStatic) {
    process.env.FFMPEG_PATH = ffmpegStatic;
  }
} catch {}

const { spawn } = require('child_process');
const path = require('path');

function isYouTubeUrl(u) {
  return /(?:youtube\.com|youtu\.be)\//i.test(u || '');
}

function resolveYtdlpPath() {
  if (process.env.YTDLP_BIN && process.env.YTDLP_BIN.trim().length > 0) return process.env.YTDLP_BIN.trim();
  return path.join(__dirname, '..', 'node_modules', '@distube', 'yt-dlp', 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
}

async function createResourceWithYtdlp(url, startSeconds = 0) {
  const bin = resolveYtdlpPath();
  const args = [
    '-f', 'bestaudio/best',
    '--no-playlist',
    '-o', '-',
    '-q',
    '--no-warnings',
    url
  ];

  const cookie = getYouTubeCookieString();
  if (cookie) {
    args.unshift('--add-header', `Cookie: ${cookie}`);
  }

  const ytdlp = spawn(bin, args, { stdio: ['ignore', 'pipe', 'ignore'] });

  const ffmpegArgs = [
    '-hide_banner', '-loglevel', 'error',
  ];
  if (startSeconds > 0) {
    ffmpegArgs.push('-ss', String(startSeconds));
  }
  ffmpegArgs.push(
    '-i', 'pipe:0',
    '-analyzeduration', '0',
    '-f', 's16le', '-ar', '48000', '-ac', '2'
  );

  const ffmpeg = new prism.FFmpeg({ args: ffmpegArgs });

  ytdlp.stdout.pipe(ffmpeg);
  const resource = createAudioResource(ffmpeg, { inputType: StreamType.Arbitrary, inlineVolume: true });
  return resource;
}

async function createResourceFromQuery(query, seekSeconds = 0) {
  // URL directe ou recherche
  const isUrl = /^https?:\/\//i.test(query);
  let url = query;
  let title = query;

  if (!isUrl) {
    const results = await play.search(query, { limit: 1, source: { youtube: 'video', soundcloud: 'tracks' } });
    if (!results || results.length === 0) throw new Error('NO_RESULT');
    const first = results[0];
    url = first.url;
    title = first.title || query;
  } else {
    try {
      const info = await play.video_basic_info(query).catch(() => null);
      title = info?.video_details?.title || title;
    } catch {}
  }

  try {
    const stream = await play.stream(url, { seek: seekSeconds > 0 ? seekSeconds : 0, discordPlayerCompatibility: true });
    const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
    return { resource, url, title };
  } catch (err) {
    // Fallback yt-dlp si YouTube échoue (age/region/cipher)
    if (isYouTubeUrl(url)) {
      const resource = await createResourceWithYtdlp(url, seekSeconds);
      return { resource, url, title };
    }
    throw err;
  }
}

async function playNext(guildId) {
  const state = guildIdToState.get(guildId);
  if (!state) return;

  const next = state.queue.shift();
  if (!next) {
    state.current = null;
    return;
  }

  const { resource } = await createResourceFromQuery(next.url || next.query, 0);
  if (resource?.volume) resource.volume.setVolume((state.volume || 100) / 100);

  state.current = next;
  state.player.play(resource);

  try {
    if (state.textChannel) {
      await state.textChannel.send({ embeds: [createNowPlayingEmbed(next)] });
    }
  } catch {}
}

async function playCommand(voiceChannel, query, textChannel, requestedBy) {
  const state = await ensureConnection(voiceChannel);
  state.textChannel = textChannel || state.textChannel;

  const track = { query, url: /^https?:\/\//i.test(query) ? query : null, title: null, requestedBy };

  // Si pas d'URL, on résout maintenant le titre/URL pour feedback rapide
  if (!track.url) {
    const results = await play.search(query, { limit: 1, source: { youtube: 'video', soundcloud: 'tracks' } });
    if (!results || results.length === 0) throw new Error('NO_RESULT');
    const first = results[0];
    track.url = first.url;
    track.title = first.title || query;
  } else {
    try {
      const info = await play.video_basic_info(track.url).catch(() => null);
      track.title = info?.video_details?.title || null;
    } catch {}
  }

  const wasIdle = !state.current;
  state.queue.push(track);

  if (wasIdle) {
    await playNext(voiceChannel.guild.id);
  } else {
    try {
      await textChannel?.send({
        embeds: [new EmbedBuilder().setColor(THEME.colorSecondary).setTitle('➕ Ajouté à la file').setDescription(`**${track.title || track.query}**`).setFooter({ text: THEME.footer })]
      });
    } catch {}
  }

  return track;
}

async function pause(guildId) {
  const state = guildIdToState.get(guildId);
  if (!state?.player) throw new Error('NO_PLAYER');
  state.player.pause();
}

async function resume(guildId) {
  const state = guildIdToState.get(guildId);
  if (!state?.player) throw new Error('NO_PLAYER');
  state.player.unpause();
}

async function stop(guildId) {
  const state = guildIdToState.get(guildId);
  if (!state) return;
  state.queue = [];
  try { state.player?.stop(true); } catch {}
  try { state.connection?.destroy(); } catch {}
  guildIdToState.delete(guildId);
}

async function skip(guildId) {
  const state = guildIdToState.get(guildId);
  if (!state?.player) throw new Error('NO_PLAYER');
  // Arrête le morceau courant; l'événement Idle déclenchera la suite
  state.player.stop(true);
}

async function setVolume(guildId, percent) {
  const state = guildIdToState.get(guildId);
  if (!state) throw new Error('NO_STATE');
  state.volume = Math.max(0, Math.min(100, Number(percent) || 0));
  try {
    // Applique au flux courant si possible
    const sub = state.player?._state?.resource;
    if (sub?.volume) sub.volume.setVolume(state.volume / 100);
  } catch {}
  return state.volume;
}

async function seek(guildId, seconds) {
  const state = guildIdToState.get(guildId);
  if (!state?.current) throw new Error('NO_CURRENT');
  const current = state.current;
  const { resource } = await createResourceFromQuery(current.url || current.query, Math.max(0, seconds || 0));
  if (resource?.volume) resource.volume.setVolume((state.volume || 100) / 100);
  state.player.play(resource);
}

async function createRadioResource(url) {
  const ffmpeg = new prism.FFmpeg({
    args: [
      '-hide_banner',
      '-loglevel', 'error',
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      '-i', url,
      '-analyzeduration', '0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2'
    ]
  });
  const resource = createAudioResource(ffmpeg, { inputType: StreamType.Arbitrary, inlineVolume: true });
  return resource;
}

async function playRadio(voiceChannel, radio, textChannel, requestedBy) {
  const state = await ensureConnection(voiceChannel);
  state.textChannel = textChannel || state.textChannel;

  // Reset queue et état pour radio
  state.queue = [];
  state.current = { query: radio.name, url: radio.url, title: radio.name, requestedBy, isRadio: true };

  const resource = await createRadioResource(radio.url);
  if (resource?.volume) resource.volume.setVolume((state.volume || 100) / 100);

  state.player.play(resource);

  try {
    if (state.textChannel) {
      await state.textChannel.send({ embeds: [createNowPlayingEmbed(state.current)] });
    }
  } catch {}

  return state.current;
}

function getQueueInfo(guildId) {
  const state = guildIdToState.get(guildId);
  return {
    current: state?.current || null,
    queue: state?.queue ? [...state.queue] : [],
    volume: state?.volume ?? 100
  };
}

module.exports = {
  playCommand,
  pause,
  resume,
  stop,
  skip,
  setVolume,
  seek,
  getQueueInfo,
  createNowPlayingEmbed,
  THEME,
  playRadio,
};