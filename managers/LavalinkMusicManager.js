let Shoukaku, Connectors;
try {
	Shoukaku = require('shoukaku').Shoukaku;
	Connectors = require('shoukaku').Connectors;
} catch (_) {
	Shoukaku = null;
	Connectors = null;
}

let EmbedBuilder, ChannelType;
try {
	({ EmbedBuilder, ChannelType } = require('discord.js'));
} catch (_) {
	EmbedBuilder = class {
		setColor() { return this; }
		setTitle() { return this; }
		setDescription() { return this; }
		setFooter() { return this; }
	};
	ChannelType = { GuildVoice: 2, GuildStageVoice: 13 };
}

const THEME = {
	colorPrimary: '#FF2E88',
	colorSecondary: '#FF69B4',
	footer: 'Boys & Girls • NSFW Vibes 💋'
};

let shoukaku = null;
let nodes = [];
let clientRef = null;

function getGuildColor(guild) {
	try {
		const me = guild?.members?.me;
		const meColor = me?.displayColor || 0;
		if (meColor && meColor !== 0) return meColor;
		const topColored = guild?.roles?.cache
			?.filter(r => (r?.color || 0) !== 0)
			?.sort((a, b) => b.position - a.position)
			?.first();
		if (topColored) return topColored.color;
	} catch (_) {}
	return THEME.colorPrimary;
}

function shouldUsePublicFallback() {
	return process.env.LAVALINK_DISABLE_PUBLIC !== 'true' && process.env.LAVALINK_DISABLE_PUBLIC !== '1';
}

function getPublicFallbackNodes() {
	return [
		{ name: 'ajie-v4', url: 'lava-v4.ajieblogs.eu.org:443', auth: 'https://dsc.gg/ajidevserver', secure: true },
		{ name: 'creavite-us1', url: 'us1.lavalink.creavite.co:20080', auth: 'auto.creavite.co', secure: false },
		{ name: 'v4-lavalink-rocks', url: 'v4.lavalink.rocks:443', auth: 'horizxon.tech', secure: true },
		{ name: 'darren-v4', url: 'lavalink.darrennathanael.com:443', auth: 'www.darrennathanael.com', secure: true },
		{ name: 'lava-link', url: 'lava.link:80', auth: 'youshallnotpass', secure: false },
	];
}

function isConfigured() {
	return !!(process.env.LAVALINK_NODES || process.env.LAVALINK_HOST) || shouldUsePublicFallback();
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

function getConfiguredNodesPreview() {
	const envNodes = parseNodesFromEnv();
	if (envNodes.length) return { nodes: envNodes, source: 'env' };
	if (shouldUsePublicFallback()) return { nodes: getPublicFallbackNodes(), source: 'public' };
	return { nodes: [], source: 'none' };
}

function init(discordClient) {
	if (!isConfigured()) return false;
	if (!Shoukaku || !Connectors) return false;
	clientRef = discordClient;
	nodes = parseNodesFromEnv();
	if (!nodes.length && shouldUsePublicFallback()) nodes = getPublicFallbackNodes();
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
	try {
		return !!shoukaku && !!clientRef && !!shoukaku.getIdealNode();
	} catch (_) {
		return false;
	}
}

// New: wait for at least one node to be ready within a timeout
async function waitForReady(timeoutMs = 8000) {
	if (isReady()) return true;
	return await new Promise((resolve) => {
		let finished = false;
		const done = (value) => { if (!finished) { finished = true; cleanup(); resolve(value); } };
		const onReady = () => done(true);
		const onAny = () => {};
		const cleanup = () => {
			try { shoukaku?.off('ready', onReady); } catch {}
			try { shoukaku?.off('error', onAny); } catch {}
			try { shoukaku?.off('close', onAny); } catch {}
			try { shoukaku?.off('disconnect', onAny); } catch {}
		};
		try {
			shoukaku?.on('ready', onReady);
			shoukaku?.on('error', onAny);
			shoukaku?.on('close', onAny);
			shoukaku?.on('disconnect', onAny);
		} catch {}
		const to = setTimeout(() => done(isReady()), Math.max(1000, timeoutMs));
	});
}

let reconnecting = false;
async function tryEnsureConnection(timeoutMs = 8000) {
	if (isReady()) return true;
	if (!clientRef) return false;
	if (reconnecting) return await waitForReady(timeoutMs);
	reconnecting = true;
	try {
		try { shoukaku?.removeAllListeners(); } catch {}
		shoukaku = null;
		const ok = init(clientRef);
		if (!ok) return false;
		return await waitForReady(timeoutMs);
	} finally {
		reconnecting = false;
	}
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

function createNowPlayingEmbed(track, guild) {
	return new EmbedBuilder()
		.setColor(getGuildColor(guild))
		.setTitle('▶️ Lecture')
		.setDescription(`**${track.title || track.query}**\nDemandé par <@${track.requestedBy?.id || track.requestedBy}>`)
		.setFooter({ text: THEME.footer });
}

async function ensurePlayer(voiceChannel) {
	if (!isReady()) {
		await tryEnsureConnection(10000);
	}
	if (!isReady()) throw new Error('LAVALINK_NOT_READY');
	if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) throw new Error('NOT_IN_VOICE');

	const guildId = voiceChannel.guild.id;
	const state = getState(guildId);
	if (state.player) return state;

	const player = await shoukaku.joinVoiceChannel({ guildId, channelId: voiceChannel.id, shardId: voiceChannel.guild.shardId });
	state.player = player;
	state.voiceChannelId = voiceChannel.id;
	state.player.on('end', async () => {
		state.current = null;
		if (state.queue.length > 0) await playNext(guildId);
	});
	return state;
}

async function resolveTrack(query) {
	if (!isReady()) {
		await tryEnsureConnection(10000);
	}
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
	try {
		if (state.textChannel) await state.textChannel.send({ embeds: [createNowPlayingEmbed(next, state.textChannel.guild)] });
	} catch {}
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
	__getConfiguredNodesPreview: getConfiguredNodesPreview,
	getGuildColor,
};