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

// Ajout: utilitaire de timeout pour éviter les blocages
function withTimeout(promise, ms, label = 'operation') {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn(`[music] Timeout ${ms}ms sur ${label}`);
      reject(new Error(`TIMEOUT_${label}`));
    }, ms);
    promise
      .then((v) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } })
      .catch((e) => { if (!settled) { settled = true; clearTimeout(timer); reject(e); } });
  });
}

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
    // Vérification de sécurité pour voiceAdapterCreator
    if (!voiceChannel.guild.voiceAdapterCreator || typeof voiceChannel.guild.voiceAdapterCreator !== 'function') {
      throw new Error('INVALID_VOICE_ADAPTER');
    }

    try {
      state.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
      });
      await entersState(state.connection, VoiceConnectionStatus.Ready, 15000);
    } catch (error) {
      // Nettoyage en cas d'erreur de connexion
      guildIdToState.delete(guildId);
      if (error.message && error.message.includes('sendPayload')) {
        throw new Error('BOT_NOT_CONNECTED');
      }
      throw error;
    }

    // Auto-unsuppress on Stage channels so audio is audible
    try {
      if (voiceChannel.type === ChannelType.GuildStageVoice) {
        const me = voiceChannel.guild.members.me;
        // Try to become a speaker
        try { await me?.voice?.setSuppressed?.(false); } catch {}
        // Also try to request to speak on platforms where required
        try { await me?.voice?.setRequestToSpeak?.(true); } catch {}
      }
    } catch {}

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

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function isYouTubeUrl(u) {
  return /(?:youtube\.com|youtu\.be)\//i.test(u || '');
}

function resolveYtdlpPath() {
  if (process.env.YTDLP_BIN && process.env.YTDLP_BIN.trim().length > 0) return process.env.YTDLP_BIN.trim();

  // Prefer system binaries first
  const candidates = [];
  const exe = process.platform === 'win32' ? ['yt-dlp.exe', 'youtube-dl.exe'] : ['yt-dlp', 'youtube-dl'];

  // PATH resolution via spawnSync
  for (const name of exe) {
    try {
      const which = process.platform === 'win32' ? 'where' : 'which';
      const r = spawnSync(which, [name], { encoding: 'utf8' });
      if (r.status === 0 && r.stdout) {
        const p = r.stdout.split(/\r?\n/).find(Boolean);
        if (p && fs.existsSync(p)) return p.trim();
      }
    } catch {}
  }

  // Local bin in project
  const localBins = [
    path.join(__dirname, '..', 'bin', exe[0]),
    path.join(__dirname, '..', 'node_modules', '.bin', exe[0])
  ];
  for (const p of localBins) {
    if (fs.existsSync(p)) return p;
  }

  // As last resort, Distube’s vendored binary (can be disabled)
  if (process.env.YTDLP_DISABLE_DISTUBE !== '1' && process.env.YTDLP_DISABLE_DISTUBE !== 'true') {
    return path.join(__dirname, '..', 'node_modules', '@distube', 'yt-dlp', 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  }

  // Nothing found
  throw new Error('yt-dlp binary not found. Set YTDLP_BIN or install yt-dlp.');
}

// Helper radios: charge une fois la liste et cherche par id/nom
let cachedRadios;
function loadRadiosOnce() {
  if (cachedRadios) return cachedRadios;
  try {
    const p = path.join(__dirname, '..', 'data', 'radios.json');
    const raw = fs.readFileSync(p, 'utf8');
    const list = JSON.parse(raw);
    cachedRadios = Array.isArray(list) ? list : [];
  } catch {
    cachedRadios = [];
  }
  return cachedRadios;
}
function findRadioByQuery(query) {
  if (!query) return null;
  const q = String(query).trim().toLowerCase();
  if (!q) return null;
  const radios = loadRadiosOnce();
  return radios.find(r => r?.id?.toLowerCase() === q || r?.name?.toLowerCase() === q) || null;
}

// Fallback: recherche via yt-dlp (ytsearch1:query)
async function ytdlpSearchFirst(query) {
  const bin = resolveYtdlpPath();
  const args = [
    '--force-ipv4',
    '--socket-timeout', String(process.env.YTDLP_SOCKET_TIMEOUT || 6),
    '--geo-bypass',
    '-j', `ytsearch1:${query}`
  ];
  if (process.env.YTDLP_NO_CHECK_CERT === '1' || process.env.YTDLP_NO_CHECK_CERT === 'true') {
    args.unshift('--no-check-certificates');
  }
  const cookie = getYouTubeCookieString();
  if (cookie) {
    args.unshift('--add-header', `Cookie: ${cookie}`);
  }
  return await new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const killTimer = setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch {}
      reject(new Error('yt-dlp search timeout'));
    }, 18000);
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (e) => {
      clearTimeout(killTimer);
      reject(e);
    });
    proc.on('close', (code) => {
      clearTimeout(killTimer);
      if (code === 0 && stdout.trim().length > 0) {
        try {
          // yt-dlp peut renvoyer plusieurs lignes JSON; on prend la dernière non vide
          const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
          const last = lines[lines.length - 1];
          const data = JSON.parse(last);
          const url = data.webpage_url || data.url;
          const title = data.title || query;
          if (url) return resolve({ url, title });
        } catch (e) {
          return reject(e);
        }
      }
      reject(new Error(stderr.trim() || `yt-dlp search failed (code ${code})`));
    });
  });
}

async function createResourceWithYtdlp(url, startSeconds = 0) {
  const bin = resolveYtdlpPath();
  const args = [
    '--force-ipv4',
    '--socket-timeout', String(process.env.YTDLP_SOCKET_TIMEOUT || 6),
    '--geo-bypass',
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

  let ytdlp;
  try {
    ytdlp = spawn(bin, args, { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (spawnErr) {
    // If spawn fails (e.g., ENOENT), try fallback names directly
    const fallbackExe = process.platform === 'win32' ? ['yt-dlp.exe', 'youtube-dl.exe'] : ['yt-dlp', 'youtube-dl'];
    for (const name of fallbackExe) {
      try {
        ytdlp = spawn(name, args, { stdio: ['ignore', 'pipe', 'ignore'] });
        break;
      } catch {}
    }
    if (!ytdlp) throw spawnErr;
  }

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
  const resource = createAudioResource(ffmpeg, { inputType: StreamType.Raw, inlineVolume: true });
  return resource;
}

async function createResourceFromQuery(query, seekSeconds = 0) {
  // URL directe ou recherche
  const isUrl = /^https?:\/\//i.test(query);
  let url = query;
  let title = query;

  if (!isUrl) {
    // Si la requête correspond à une radio connue, jouer la radio directement
    const maybeRadio = findRadioByQuery(query);
    if (maybeRadio) {
      const resource = await createRadioResource(maybeRadio.url);
      return { resource, url: maybeRadio.url, title: maybeRadio.name };
    }

    // Essayer d'abord play-dl, puis retomber sur yt-dlp en cas d'échec/timeout
    let resolved = null;
    try {
      const results = await withTimeout(
        play.search(query, { limit: 1, source: { youtube: 'video', soundcloud: 'tracks' } }),
        8000,
        'play.search'
      );
      if (results && results.length > 0) {
        const first = results[0];
        resolved = { url: first.url, title: first.title || query };
      }
    } catch (e) {
      console.warn('[music] play.search échec/timeout -> fallback yt-dlp');
    }

    if (!resolved) {
      // Fallback robuste
      resolved = await ytdlpSearchFirst(query);
    }

    url = resolved.url;
    title = resolved.title;
  } else {
    try {
      const info = await withTimeout(
        play.video_basic_info(query).catch(() => null),
        6000,
        'video_basic_info'
      );
      title = info?.video_details?.title || title;
    } catch {}
  }

  try {
    const stream = await withTimeout(
      play.stream(url, { seek: seekSeconds > 0 ? seekSeconds : 0, discordPlayerCompatibility: true }),
      12000,
      'play.stream'
    );
    const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
    return { resource, url, title };
  } catch (err) {
    // Fallback yt-dlp si YouTube échoue (age/region/cipher/timeout)
    if (isYouTubeUrl(url)) {
      console.warn('[music] play.stream échec/timeout -> fallback yt-dlp');
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

  // Si Stage: assurer que le bot est orateur, sinon avertir
  try {
    if (voiceChannel.type === ChannelType.GuildStageVoice) {
      const me = voiceChannel.guild.members.me;
      try { await me?.voice?.setSuppressed?.(false); } catch {}
      try { await me?.voice?.setRequestToSpeak?.(true); } catch {}
      if (me?.voice?.suppress) {
        try {
          await state.textChannel?.send('⚠️ Sur un salon Stage, ajoutez le bot comme orateur pour qu’il soit audible. Ouvrez les paramètres du salon et “Inviter à parler” le bot.');
        } catch {}
      }
    }
  } catch {}

  // Support direct des radios via /play "nom" ou id
  const maybeRadio = findRadioByQuery(query);
  if (maybeRadio) {
    const played = await playRadio(voiceChannel, maybeRadio, textChannel, requestedBy);
    return played;
  }

  const track = { query, url: /^https?:\/\//i.test(query) ? query : null, title: null, requestedBy };

  // Si pas d'URL, on résout maintenant le titre/URL pour feedback rapide
  if (!track.url) {
    let resolved = null;
    try {
      const results = await withTimeout(
        play.search(query, { limit: 1, source: { youtube: 'video', soundcloud: 'tracks' } }),
        8000,
        'play.search'
      );
      if (results && results.length > 0) {
        const first = results[0];
        resolved = { url: first.url, title: first.title || query };
      }
    } catch {}

    if (!resolved) {
      resolved = await ytdlpSearchFirst(query);
    }

    track.url = resolved.url;
    track.title = resolved.title;
  } else {
    try {
      const info = await withTimeout(
        play.video_basic_info(track.url).catch(() => null),
        6000,
        'video_basic_info'
      );
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
  const resource = createAudioResource(ffmpeg, { inputType: StreamType.Raw, inlineVolume: true });
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