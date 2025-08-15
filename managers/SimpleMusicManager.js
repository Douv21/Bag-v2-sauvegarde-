const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } = require('@discordjs/voice');
const { ChannelType, EmbedBuilder } = require('discord.js');
const prism = require('prism-media');
const { getYouTubeCookieString } = require('../utils/youtubeCookies');

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
    state.player.on('error', (err) => { try { console.warn('[voice] player error:', err?.message || err); } catch {} });
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
          }, 120000);
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

// Ajout PIPED: fournisseur alternatif sans yt-dlp
function getYoutubeIdFromUrl(u) {
  try {
    if (!u) return null;
    const url = new URL(u);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    const match = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
    if (match) return match[1];
  } catch {}
  return null;
}

// Nouveau: si on reçoit une URL de résultats YouTube, en extraire le terme de recherche
function getYoutubeSearchQueryFromUrl(u) {
  try {
    if (!u) return null;
    const url = new URL(u);
    const isYoutubeHost = /(^|\.)youtube\.com$|(^|\.)music\.youtube\.com$|(^|\.)m\.youtube\.com$/i.test(url.hostname);
    if (!isYoutubeHost) return null;
    if (url.pathname.includes('/results')) {
      const q = url.searchParams.get('search_query');
      return q && q.trim() ? q.trim() : null;
    }
  } catch {}
  return null;
}

function getPipedInstances() {
  const custom = (process.env.PIPED_BASE_URL || '').trim();
  const list = [];
  if (custom) list.push(custom);
  list.push(
    'https://piped.video',
    'https://pipedapi.kavin.rocks',
    'https://piped.privacy.com.de',
    'https://piped.projectsegfau.lt'
  );
  // Dé-dupliquer
  return Array.from(new Set(list));
}

async function pipedFetchJson(base, pathname) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), Number(process.env.PIPED_TIMEOUT || 15000));
  try {
    const url = `${base.replace(/\/$/, '')}${pathname}`;
    const res = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'user-agent': process.env.YTDLP_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
      },
      signal: abort.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    const msg = String(err?.message || err || '');
    if (err?.name === 'AbortError' || msg.toLowerCase().includes('aborted')) {
      throw new Error('TIMEOUT_PIPED_FETCH');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function pipedSearchFirst(query) {
  const bases = getPipedInstances();
  const tasks = bases.map(b => (async () => {
    const data = await pipedFetchJson(b, `/api/v1/search?q=${encodeURIComponent(query)}&region=${encodeURIComponent(process.env.PIPED_REGION || 'FR')}`);
    if (Array.isArray(data) && data.length > 0) {
      const firstVideo = data.find(i => (i?.type || 'video') === 'video') || data[0];
      // Robust ID extraction without unsafe split
      let id = firstVideo?.id || null;
      if (!id) {
        const rawUrl = typeof firstVideo?.url === 'string' ? firstVideo.url : '';
        try {
          // Support absolute or path-only URLs
          const maybeUrl = new URL(rawUrl, 'https://www.youtube.com');
          id = maybeUrl.searchParams.get('v');
          if (!id && /\/shorts\//.test(maybeUrl.pathname)) {
            const m = maybeUrl.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
            if (m) id = m[1];
          }
        } catch {}
        if (!id && rawUrl) {
          const m = rawUrl.match(/[?&]v=([^&]+)/);
          if (m) id = m[1];
        }
      }
      if (id) {
        return { id, url: `https://www.youtube.com/watch?v=${id}`, title: firstVideo?.title || query };
      }
    }
    throw new Error('EMPTY_RESULT');
  })());
  try {
    return await Promise.any(tasks);
  } catch {
    throw new Error('piped search failed');
  }
}

async function pipedGetInfo(videoId) {
  const bases = getPipedInstances();
  const tasks = bases.map(b => pipedFetchJson(b, `/api/v1/streams/${encodeURIComponent(videoId)}`));
  try {
    const info = await Promise.any(tasks);
    return info && (info.audioStreams || info.title) ? info : (() => { throw new Error('NO_INFO'); })();
  } catch {
    throw new Error('piped info failed');
  }
}

// === Fallback via play-dl (YouTube natif) ===
let playDlModule = null;
function getPlayDl() {
  if (playDlModule) return playDlModule;
  try {
    // Chargement paresseux car play-dl peut prendre du temps à initialiser
    // et n'est utilisé qu'en fallback.
    playDlModule = require('play-dl');
    try {
      const cookie = getYouTubeCookieString();
      if (cookie && typeof playDlModule.setToken === 'function') {
        playDlModule.setToken({ youtube: { cookie } });
      }
    } catch {}
    return playDlModule;
  } catch (e) {
    console.warn('[music] play-dl indisponible:', e?.message || e);
    return null;
  }
}

async function createResourceWithPlayDl(input, startSeconds = 0) {
  const play = getPlayDl();
  if (!play) throw new Error('PLAYDL_NOT_AVAILABLE');

  try {
    let url = input;
    if (!/^https?:\/\//i.test(input)) {
      const results = await play.search(input, { source: { youtube: 'video' }, limit: 1 });
      if (!Array.isArray(results) || results.length === 0) throw new Error('PLAYDL_NO_RESULT');
      url = results[0].url;
    }

    const opts = { discordPlayerCompatibility: true };
    if (startSeconds > 0) opts.seek = startSeconds;

    const stream = await play.stream(url, opts);
    const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });

    // Récupérer un titre lisible si possible
    let title = input;
    try {
      const info = await play.video_basic_info(url).catch(() => null);
      title = info?.video_details?.title || title;
    } catch {}

    return { resource, url, title };
  } catch (e) {
    throw e;
  }
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

async function createResourceWithPiped(input, startSeconds = 0) {
  try {
    let id = isYouTubeUrl(input) ? getYoutubeIdFromUrl(input) : null;
    let title = input;
    if (!id) {
      const normalizedQuery = getYoutubeSearchQueryFromUrl(input) || input;
      const s = await pipedSearchFirst(normalizedQuery);
      id = s.id;
      title = s.title || title;
    }
    const info = await pipedGetInfo(id);
    title = info?.title || title;
    const audios = Array.isArray(info?.audioStreams) ? info.audioStreams : [];
    if (audios.length === 0) throw new Error('PIPED_NO_AUDIO');
    // Choisir le flux audio au plus haut débit
    const best = audios.slice().sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    const url = best?.url || audios[0]?.url;
    if (!url) throw new Error('PIPED_NO_URL');

    const ffmpegArgs = [
      '-hide_banner', '-loglevel', 'error',
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5'
    ];
    if (startSeconds > 0) {
      ffmpegArgs.push('-ss', String(startSeconds));
    }
    ffmpegArgs.push(
      '-i', url,
      '-analyzeduration', '0',
      '-f', 's16le', '-ar', '48000', '-ac', '2'
    );

    const ffmpeg = new prism.FFmpeg({ args: ffmpegArgs });
    const resource = createAudioResource(ffmpeg, { inputType: StreamType.Raw, inlineVolume: true });
    return { resource, url: `https://www.youtube.com/watch?v=${id}`, title };
  } catch (e) {
    throw e;
  }
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

    // Recherche via PIPED
    let resolved = null;
    try {
      resolved = await pipedSearchFirst(query);
    } catch (e) {
      console.warn(`[music] piped search failed: ${e.message}`);
      // Dernier recours: créer une entrée avec juste la query
      resolved = { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, title: query };
    }
    url = resolved.url;
    title = resolved.title;
  } else {
    try {
      const info = await pipedGetInfo(getYoutubeIdFromUrl(url)).catch(() => null);
      title = info?.title || title;
    } catch {}
  }

  // Tenter PIPED puis fallback play-dl
  try {
    const resourcePiped = await createResourceWithPiped(url, seekSeconds);
    return { resource: resourcePiped.resource, url, title: resourcePiped.title || title };
  } catch (err) {
    console.warn('[music] échec PIPED → fallback play-dl:', err?.message || err);
    const resourcePlayDl = await createResourceWithPlayDl(isUrl ? url : title, seekSeconds);
    return { resource: resourcePlayDl.resource, url: resourcePlayDl.url || url, title: resourcePlayDl.title || title };
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
      resolved = await pipedSearchFirst(query);
    } catch (e) {
      console.warn(`[music] piped search failed: ${e.message}`);
      // Dernier recours avec juste la query
      resolved = { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, title: query };
    }
    track.url = resolved.url;
    track.title = resolved.title;
  } else {
    try {
      const info = await pipedGetInfo(getYoutubeIdFromUrl(track.url)).catch(() => null);
      track.title = info?.title || null;
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