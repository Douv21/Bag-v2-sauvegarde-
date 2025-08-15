let Shoukaku, Connectors;
try {
	Shoukaku = require('shoukaku').Shoukaku;
	Connectors = require('shoukaku').Connectors;
} catch (_) {
	Shoukaku = null;
	Connectors = null;
}

const { EmbedBuilder, ChannelType } = require('discord.js');

const THEME = {
	colorPrimary: '#FF2E88',
	colorSecondary: '#FF69B4',
	footer: 'Boys & Girls • NSFW Vibes 💋'
};

let shoukaku = null;
let nodes = [];
let clientRef = null;

function isConfigured() {
	return !!(process.env.LAVALINK_NODES || process.env.LAVALINK_HOST);
}

function parseNodesFromEnv() {
	try {
		if (process.env.LAVALINK_NODES) {
			const parsed = JSON.parse(process.env.LAVALINK_NODES);
			if (Array.isArray(parsed)) return parsed;
		}
		if (process.env.LAVALINK_HOST) {
			return [{
				name: process.env.LAVALINK_NAME || 'default',
				url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT || '2333'}`,
				auth: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
				secure: process.env.LAVALINK_SECURE === 'true'
			}];
		}
	} catch (_) {}
	return [];
}

function init(discordClient) {
	if (!isConfigured()) return false;
	if (!Shoukaku || !Connectors) return false;
	clientRef = discordClient;
	nodes = parseNodesFromEnv();
	if (!nodes.length) return false;
	try {
		shoukaku = new Shoukaku(new Connectors.DiscordJS(discordClient), nodes, {
			resume: true,
			resumeTimeout: 60,
			moveOnDisconnect: true,
			userAgent: 'BAG-Bot/2.0 (Rythm-like)'
		});

		shoukaku.on('ready', (name) => console.log(`[lavalink] Node ${name} ready`));
		shoukaku.on('error', (name, err) => console.warn(`[lavalink] Node ${name} error:`, err?.message || err));
		shoukaku.on('close', (name, code, reason) => console.warn(`[lavalink] Node ${name} closed: ${code} ${reason || ''}`));
		shoukaku.on('disconnect', (name, reason) => console.warn(`[lavalink] Node ${name} disconnected: ${reason || ''}`));
		return true;
	} catch (_) {
		shoukaku = null;
		return false;
	}
}

function isReady() {
	return !!shoukaku && !!clientRef;
}

const guildIdToState = new Map();

function getState(guildId) {
	let state = guildIdToState.get(guildId);
	if (!state) {
		state = { player: null, queue: [], current: null, volume: 100, textChannel: null };
		guildIdToState.set(guildId, state);
	}
	return state;
}

function createNowPlayingEmbed(track) {
	return new EmbedBuilder().setColor(THEME.colorPrimary).setTitle('▶️ Lecture').setDescription(`**${track.title || track.query}**\nDemandé par <@${track.requestedBy?.id || track.requestedBy}>`).setFooter({ text: THEME.footer });
}

async function ensurePlayer(voiceChannel) {
	if (!isReady()) throw new Error('LAVALINK_NOT_READY');
	if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) throw new Error('NOT_IN_VOICE');

	const guildId = voiceChannel.guild.id;
	const state = getState(guildId);
	if (state.player) return state;

	const player = await shoukaku.joinVoiceChannel({ guildId, channelId: voiceChannel.id, shardId: voiceChannel.guild.shardId });
	state.player = player;
	state.player.on('end', async () => {
		state.current = null;
		if (state.queue.length > 0) await playNext(guildId);
	});
	return state;
}

async function resolveTrack(query) {
	const node = shoukaku.getIdealNode();
	if (!node) throw new Error('LAVALINK_NOT_READY');
	const isUrl = /^https?:\/\//i.test(query);
	const q = isUrl ? query : `ytsearch:${query}`;
	const res = await node.rest.resolve(q);
	const type = String(res?.loadType || res?.type || '').toLowerCase();
	if (!res || type === 'empty' || type === 'no_matches') throw new Error('NO_RESULT');
	if (type === 'playlist' && Array.isArray(res.tracks)) return res.tracks;
	if (type === 'track' && res.data) return [res.data];
	if (Array.isArray(res?.tracks) && res.tracks.length) return res.tracks;
	if (Array.isArray(res?.data) && res.data.length) return res.data;
	throw new Error('NO_RESULT');
}

async function playNext(guildId) {
	const state = getState(guildId);
	const next = state.queue.shift();
	if (!next) { state.current = null; return; }
	state.current = next;
	const encoded = typeof next.track === 'string' ? next.track : (next.track?.encoded || next.track?.track);
	if (encoded) {
		await state.player.playTrack({ track: { encoded } }, false);
	} else {
		await state.player.playTrack({ track: { identifier: next.url || next.title } }, false);
	}
	try { if (state.textChannel) await state.textChannel.send({ embeds: [createNowPlayingEmbed(next)] }); } catch {}
}

async function playCommand(voiceChannel, query, textChannel, requestedBy) {
	const state = await ensurePlayer(voiceChannel);
	state.textChannel = textChannel || state.textChannel;
	const tracks = await resolveTrack(query);
	if (!tracks.length) throw new Error('NO_RESULT');
	const mapped = tracks.map(t => ({ track: t.encoded || t.track || t, url: query, title: t.info?.title || query, requestedBy }));
	const wasIdle = !state.current;
	state.queue.push(...mapped);
	if (wasIdle) await playNext(voiceChannel.guild.id);
	return mapped[0];
}

async function pause(guildId) {
	const state = getState(guildId);
	await state.player.setPaused(true);
}

async function resume(guildId) {
	const state = getState(guildId);
	await state.player.setPaused(false);
}

async function stop(guildId) {
	const state = getState(guildId);
	state.queue = [];
	try { await state.player.stopTrack(); } catch {}
	try { await state.player.destroy(); } catch {}
	try { await shoukaku.leaveVoiceChannel(guildId); } catch {}
	guildIdToState.delete(guildId);
}

async function skip(guildId) {
	const state = getState(guildId);
	await state.player.stopTrack();
}

async function setVolume(guildId, percent) {
	const state = getState(guildId);
	state.volume = Math.max(0, Math.min(100, Number(percent) || 0));
	try { await state.player.setGlobalVolume(state.volume); } catch {}
	return state.volume;
}

async function seek(guildId, seconds) {
	const state = getState(guildId);
	await state.player.seekTo(Math.max(0, seconds || 0) * 1000);
}

function getQueueInfo(guildId) {
	const state = guildIdToState.get(guildId);
	return { current: state?.current || null, queue: state?.queue ? [...state.queue] : [], volume: state?.volume ?? 100 };
}

module.exports = {
	init,
	isReady,
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