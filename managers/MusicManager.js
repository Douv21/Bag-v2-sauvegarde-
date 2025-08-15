const Simple = require('./SimpleMusicManager');

let lavalink = null;
let lavalinkInitialized = false;

function configureLavalink(discordClient) {
  try {
    // Chargement paresseux du gestionnaire Lavalink
    // Ce fichier n'impose aucune dépendance si Lavalink n'est pas utilisé
    const manager = require('./LavalinkMusicManager');
    if (typeof manager?.init === 'function') {
      lavalinkInitialized = !!manager.init(discordClient);
      lavalink = manager;
    }
  } catch (_) {
    lavalinkInitialized = false;
    lavalink = null;
  }
}

function useLavalink() {
  try {
    if (!lavalink || !lavalinkInitialized) return false;
    if (typeof lavalink.isReady === 'function') return !!lavalink.isReady();
    return false;
  } catch (_) {
    return false;
  }
}

async function playCommand(voiceChannel, query, textChannel, requestedBy) {
  if (useLavalink()) return lavalink.playCommand(voiceChannel, query, textChannel, requestedBy);
  return Simple.playCommand(voiceChannel, query, textChannel, requestedBy);
}

async function pause(guildId) {
  if (useLavalink()) return lavalink.pause(guildId);
  return Simple.pause(guildId);
}

async function resume(guildId) {
  if (useLavalink()) return lavalink.resume(guildId);
  return Simple.resume(guildId);
}

async function stop(guildId) {
  if (useLavalink()) return lavalink.stop(guildId);
  return Simple.stop(guildId);
}

async function skip(guildId) {
  if (useLavalink()) return lavalink.skip(guildId);
  return Simple.skip(guildId);
}

async function setVolume(guildId, percent) {
  if (useLavalink()) return lavalink.setVolume(guildId, percent);
  return Simple.setVolume(guildId, percent);
}

async function seek(guildId, seconds) {
  if (useLavalink()) return lavalink.seek(guildId, seconds);
  return Simple.seek(guildId, seconds);
}

function getQueueInfo(guildId) {
  if (useLavalink()) return lavalink.getQueueInfo(guildId);
  return Simple.getQueueInfo(guildId);
}

// Fonctions conservées depuis SimpleMusicManager; Lavalink peut les surcharger si besoin
function createNowPlayingEmbed(track) { return Simple.createNowPlayingEmbed(track); }
const THEME = Simple.THEME;

async function playRadio(voiceChannel, radio, textChannel, requestedBy) {
  // Support radio basé sur ffmpeg: garder l'implémentation simple qui fonctionne partout
  return Simple.playRadio(voiceChannel, radio, textChannel, requestedBy);
}

module.exports = {
  configureLavalink,
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