const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const path = require('path');

const { BASE_ACTIONS, BASE_TRUTHS, BASE_NSFW_ACTIONS, BASE_NSFW_TRUTHS } = require('../utils/aouvPrompts');

function pickRandom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

async function getGuildConfig(dataManager, guildId) {
	const config = await dataManager.loadData('aouv_config.json', {});
	return config[guildId] || {
		allowedChannels: [],
		disabledBaseActions: [],
		disabledBaseTruths: [],
		customActions: [],
		customTruths: [],
		baseActionOverrides: {},
		baseTruthOverrides: {},
		// NSFW
		nsfwAllowedChannels: [],
		nsfwDisabledBaseActions: [],
		nsfwDisabledBaseTruths: [],
		nsfwCustomActions: [],
		nsfwCustomTruths: [],
		nsfwBaseActionOverrides: {},
		nsfwBaseTruthOverrides: {}
	};
}

async function saveGuildConfig(dataManager, guildId, partial) {
	const all = await dataManager.loadData('aouv_config.json', {});
	all[guildId] = { ...(all[guildId] || {}), ...partial };
	await dataManager.saveData('aouv_config.json', all);
}

function buildButtons() {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId('aouv_btn_action').setLabel('Action').setEmoji('🎯').setStyle(ButtonStyle.Danger),
		new ButtonBuilder().setCustomId('aouv_btn_verite').setLabel('Vérité').setEmoji('💬').setStyle(ButtonStyle.Primary)
	);
}

function buildPromptEmbed(kind, text, user, nsfw = false) {
	const color = kind === 'action' ? (nsfw ? 0xE91E63 : 0xFF6B6B) : (nsfw ? 0x9C27B0 : 0x3399FF);
	const title = (nsfw ? 'NSFW — ' : '') + (kind === 'action' ? 'Action 🎯' : 'Vérité 💬');
	return new EmbedBuilder()
		.setTitle(title)
		.setDescription(text)
		.setColor(color)
		.setFooter({ text: `Demandé par ${user.displayName || user.username}` });
}

async function resolvePools(dataManager, guildId, mode) {
	const cfg = await getGuildConfig(dataManager, guildId);
	if (mode === 'nsfw') {
		const disabledA = new Set(cfg.nsfwDisabledBaseActions || []);
		const disabledT = new Set(cfg.nsfwDisabledBaseTruths || []);
		const overridesA = cfg.nsfwBaseActionOverrides || {};
		const overridesT = cfg.nsfwBaseTruthOverrides || {};
		const baseA = BASE_NSFW_ACTIONS
			.map((txt, i) => (overridesA[i] ? String(overridesA[i]) : txt))
			.filter((_, i) => !disabledA.has(i));
		const baseT = BASE_NSFW_TRUTHS
			.map((txt, i) => (overridesT[i] ? String(overridesT[i]) : txt))
			.filter((_, i) => !disabledT.has(i));
		const customA = (cfg.nsfwCustomActions || []).map(x => String(x || '')).filter(Boolean);
		const customT = (cfg.nsfwCustomTruths || []).map(x => String(x || '')).filter(Boolean);
		return {
			actions: [...baseA, ...customA],
			truths: [...baseT, ...customT],
			nsfw: true
		};
	}

	// SFW par défaut
	const disabledA = new Set(cfg.disabledBaseActions || []);
	const disabledT = new Set(cfg.disabledBaseTruths || []);
	const overridesA = cfg.baseActionOverrides || {};
	const overridesT = cfg.baseTruthOverrides || {};
	const baseA = BASE_ACTIONS
		.map((txt, i) => (overridesA[i] ? String(overridesA[i]) : txt))
		.filter((_, i) => !disabledA.has(i));
	const baseT = BASE_TRUTHS
		.map((txt, i) => (overridesT[i] ? String(overridesT[i]) : txt))
		.filter((_, i) => !disabledT.has(i));
	const customA = (cfg.customActions || []).map(x => String(x || '')).filter(Boolean);
	const customT = (cfg.customTruths || []).map(x => String(x || '')).filter(Boolean);
	return {
		actions: [...baseA, ...customA],
		truths: [...baseT, ...customT],
		nsfw: false
	};
}

function resolveMode(cfg, channel) {
	const channelId = channel.id;
	const nsfwSet = new Set(cfg.nsfwAllowedChannels || []);
	const sfwList = Array.isArray(cfg.allowedChannels) ? cfg.allowedChannels : [];
	const isNsfwConfigured = nsfwSet.has(channelId);
	if (isNsfwConfigured) {
		return channel.nsfw ? 'nsfw' : 'invalid_nsfw_channel';
	}
	// Si pas NSFW configuré pour ce salon, vérifier SFW
	if (sfwList.length === 0) return 'sfw';
	return sfwList.includes(channelId) ? 'sfw' : 'denied';
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('aouv')
		.setDescription("Démarre le jeu Action ou Vérité dans ce salon."),

	async execute(interaction, dataManager) {
		if (!interaction.guild) {
			return interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', flags: 64 });
		}

		const guildId = interaction.guild.id;
		const channel = interaction.channel;
		const channelId = channel.id;
		const cfg = await getGuildConfig(dataManager, guildId);

		const mode = resolveMode(cfg, channel);
		if (mode === 'invalid_nsfw_channel') {
			return interaction.reply({ content: '❌ Ce salon n\'est pas marqué NSFW dans Discord. Veuillez utiliser un salon NSFW configuré pour AouV NSFW.', flags: 64 });
		}
		if (mode === 'denied') {
			const sfwMentions = (cfg.allowedChannels || []).map(id => `<#${id}>`).join(', ') || '(tous)';
			const nsfwMentions = (cfg.nsfwAllowedChannels || []).map(id => `<#${id}>`).join(', ') || '(aucun)';
			return interaction.reply({ content: `❌ Ce salon n'est pas configuré pour AouV.\nSFW: ${sfwMentions}\nNSFW: ${nsfwMentions}`, flags: 64 });
		}

		const isNsfw = mode === 'nsfw';
		const embed = new EmbedBuilder()
			.setTitle(isNsfw ? '🔞 Action ou Vérité — NSFW' : 'Action ou Vérité ?')
			.setDescription(isNsfw ? "Clique sur un bouton pour tirer un prompt NSFW (soft, 18+)." : "Clique sur un bouton pour tirer un prompt public.")
			.setColor(isNsfw ? 0xE91E63 : 0x888888);

		await interaction.reply({ embeds: [embed], components: [buildButtons()] });
	},

	// Gestion des boutons via MainRouter
	async handleButton(interaction, dataManager) {
		const guildId = interaction.guild.id;
		const cfg = await getGuildConfig(dataManager, guildId);
		const mode = resolveMode(cfg, interaction.channel);
		if (mode === 'invalid_nsfw_channel') {
			return interaction.reply({ content: '❌ Ce salon n\'est pas marqué NSFW dans Discord. Utilise un salon NSFW configuré.', flags: 64 });
		}
		if (mode === 'denied') {
			return interaction.reply({ content: '❌ Ce salon n\'est pas configuré pour AouV.', flags: 64 });
		}

		const { actions, truths, nsfw } = await resolvePools(dataManager, guildId, mode);
		if (interaction.customId === 'aouv_btn_action') {
			const text = (actions.length ? pickRandom(actions) : nsfw ? '(Aucune action NSFW configurée)' : '(Aucune action configurée)');
			return interaction.reply({ embeds: [buildPromptEmbed('action', text, interaction.user, nsfw)], components: [buildButtons()] });
		}
		if (interaction.customId === 'aouv_btn_verite') {
			const text = (truths.length ? pickRandom(truths) : nsfw ? '(Aucune vérité NSFW configurée)' : '(Aucune vérité configurée)');
			return interaction.reply({ embeds: [buildPromptEmbed('verite', text, interaction.user, nsfw)], components: [buildButtons()] });
		}
	}
};