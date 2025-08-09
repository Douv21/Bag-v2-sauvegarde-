const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus, getVoiceConnection, VoiceConnectionStatus, entersState, demuxProbe } = require('@discordjs/voice');
const { ChannelType, EmbedBuilder } = require('discord.js');
const play = require('play-dl');

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

async function createResourceFromQuery(query) {
  // URL direct ou recherche cross‑source
  const isUrl = /^https?:\/\//i.test(query);
  if (isUrl) {
    const stream = await play.stream(query, { discordPlayerCompatibility: true });
    return createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
  }

  // Recherche: on privilégie SoundCloud puis YouTube Music puis YouTube
  const results = await play.search(query, { limit: 1, source: { soundcloud: 'tracks', youtube: 'video' } });
  if (!results || results.length === 0) throw new Error('NO_RESULT');
  const target = results[0];
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

  const resource = await createResourceFromQuery(query);
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