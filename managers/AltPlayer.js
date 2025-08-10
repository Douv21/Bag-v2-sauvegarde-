const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus, getVoiceConnection, VoiceConnectionStatus, entersState, demuxProbe } = require('@discordjs/voice');
const { ChannelType, EmbedBuilder } = require('discord.js');
const play = require('play-dl');
const { applyPlayDlCookies, buildYtdlRequestOptions } = require('../utils/youtubeCookies');

// Configure play-dl with cookies if provided via env
try { applyPlayDlCookies(play); } catch (_) {}

const guildIdToAltState = new Map();

function buildAltEmbed(title, description, color = '#FF2E88') {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setFooter({ text: 'Boys & Girls • NSFW Vibes 💋' });
}

async function connectToChannel(voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 15000);
  } catch (err) {
    try { connection.destroy(); } catch {}
    throw new Error('TIMEOUT_VOICE_CONNECTION');
  }
  return connection;
}

// --- Helpers YouTube
const YT_URL_REGEX = /^(https?:\/\/)?((www|m)\.)?(music\.)?(youtube\.com|youtu\.be)\//i;
let ytdlCore = null;
try { ytdlCore = require('@distube/ytdl-core'); } catch {}

async function createResourceFromYouTube(url) {
  if (!ytdlCore) throw new Error('YTDL_CORE_UNAVAILABLE');
  const ytdlStream = ytdlCore(url, {
    filter: 'audioonly',
    quality: 'highestaudio',
    highWaterMark: 1 << 25,
    dlChunkSize: 0,
    requestOptions: buildYtdlRequestOptions(),
  });
  const probe = await demuxProbe(ytdlStream);
  return createAudioResource(probe.stream, { inputType: probe.type, inlineVolume: true });
}

async function createResourceFromQuery(query) {
  // URL direct ou recherche cross‑source
  const isUrl = /^https?:\/\//i.test(query);
  if (isUrl) {
    // YouTube: toujours via ytdl-core, pas de fallback play-dl pour éviter
    // les erreurs "Failed to Parse YouTube Video".
    if (YT_URL_REGEX.test(query)) {
      return await createResourceFromYouTube(query); // laisse remonter l'erreur si échec
    }
    const stream = await play.stream(query, { discordPlayerCompatibility: true });
    return createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
  }

  // Recherche: on privilégie SoundCloud puis YouTube Music puis YouTube
  const results = await play.search(query, { limit: 1, source: { soundcloud: 'tracks', youtube: 'video' } });
  if (!results || results.length === 0) throw new Error('NO_RESULT');
  const target = results[0];

  // Si résultat YouTube, forcer ytdl-core
  if (target?.url && YT_URL_REGEX.test(target.url)) {
    return await createResourceFromYouTube(target.url); // laisse remonter l'erreur si échec
  }

  const stream = await play.stream(target.url, { discordPlayerCompatibility: true });
  return createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
}

async function playAlt(voiceChannel, query, textChannel, requestedBy) {
  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    throw new Error('NOT_IN_VOICE');
  }

  const guildId = voiceChannel.guild.id;
  // Nettoyage état précédent si existant
  await stopAlt(guildId).catch(() => {});

  // Si une queue DisTube existe, l'arrêter proprement pour éviter les conflits de connexion
  try {
    const { getMusic } = require('./MusicManager');
    const distube = getMusic(voiceChannel.client);
    const q = distube.getQueue(guildId);
    if (q) {
      await distube.stop(guildId).catch(() => {});
      try { q.voice?.connection?.destroy?.(); } catch {}
    }
  } catch {}

  // Détruire toute connexion vocale résiduelle avant de rejoindre
  try {
    const { getVoiceConnection } = require('@discordjs/voice');
    const existing = getVoiceConnection(guildId);
    if (existing) existing.destroy();
  } catch {}

  const connection = await connectToChannel(voiceChannel);
  const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });

  const state = { connection, player };
  guildIdToAltState.set(guildId, state);

  player.on('error', (err) => {
    try { textChannel?.send({ embeds: [buildAltEmbed('❌ Erreur lecteur', String(err?.message || err), '#FF0044')] }).catch(() => {}); } catch {}
  });

  player.on(AudioPlayerStatus.Idle, () => {
    // Détruire automatiquement à la fin du morceau
    stopAlt(guildId).catch(() => {});
    try { textChannel?.send({ embeds: [buildAltEmbed('🏁 Lecture terminée', 'Le moteur alternatif s\'est arrêté.')] }).catch(() => {}); } catch {}
  });

  // Création ressource avec fallback YouTube
  let resource;
  try {
    resource = await createResourceFromQuery(query);
  } catch (err) {
    // Si play-dl a échoué à parser YT, retenter explicitement via ytdl-core
    if (YT_URL_REGEX.test(query) && (!resource)) {
      resource = await createResourceFromYouTube(query);
    } else {
      throw err;
    }
  }

  connection.subscribe(player);
  player.play(resource);

  try {
    const info = typeof play.video_basic_info === 'function' && /^https?:\/\//.test(query)
      ? await play.video_basic_info(query).catch(() => null)
      : null;
    const title = info?.video_details?.title || query;
    textChannel?.send({ embeds: [buildAltEmbed('▶️ Lecture (ALT)', `**${title}**\nDemandé par <@${requestedBy?.id || requestedBy}>`)] }).catch(() => {});
  } catch {}

  return state;
}

async function stopAlt(guildId) {
  const st = guildIdToAltState.get(guildId);
  if (!st) return;
  try { st.player.stop(true); } catch {}
  try { st.connection.destroy(); } catch {}
  guildIdToAltState.delete(guildId);
}

module.exports = { playAlt, stopAlt };