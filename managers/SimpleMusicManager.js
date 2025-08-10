const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const { ChannelType, EmbedBuilder } = require('discord.js');
const play = require('play-dl');

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
  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
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

  const stream = await play.stream(url, { seek: seekSeconds > 0 ? seekSeconds : 0, discordPlayerCompatibility: true });
  const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
  return { resource, url, title };
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
};