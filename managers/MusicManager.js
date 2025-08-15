const Lavalink = require('./LavalinkMusicManager');

let lavalink = null;
let lavalinkInitialized = false;

function configureLavalink(discordClient) {
  try {
    if (typeof Lavalink?.init === 'function') {
      lavalinkInitialized = !!Lavalink.init(discordClient);
      lavalink = Lavalink;
    }
  } catch (_) {
    lavalinkInitialized = false;
    lavalink = null;
  }
}

function ensureReady() {
  if (!lavalink || !lavalinkInitialized || (typeof lavalink.isReady === 'function' && !lavalink.isReady())) {
    throw new Error('LAVALINK_NOT_READY');
  }
}

async function playCommand(voiceChannel, query, textChannel, requestedBy) {
  ensureReady();
  return lavalink.playCommand(voiceChannel, query, textChannel, requestedBy);
}

async function pause(guildId) {
  ensureReady();
  return lavalink.pause(guildId);
}

async function resume(guildId) {
  ensureReady();
  return lavalink.resume(guildId);
}

async function stop(guildId) {
  ensureReady();
  return lavalink.stop(guildId);
}

async function skip(guildId) {
  ensureReady();
  return lavalink.skip(guildId);
}

async function setVolume(guildId, percent) {
  ensureReady();
  return lavalink.setVolume(guildId, percent);
}

async function seek(guildId, seconds) {
  ensureReady();
  return lavalink.seek(guildId, seconds);
}

function getQueueInfo(guildId) {
  if (!lavalink || !lavalinkInitialized) return { current: null, queue: [], volume: 100 };
  return lavalink.getQueueInfo(guildId);
}

function createNowPlayingEmbed(track) {
  return Lavalink.createNowPlayingEmbed(track);
}

const THEME = Lavalink.THEME;

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
};