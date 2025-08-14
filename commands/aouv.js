const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const path = require('path');

const { BASE_ACTIONS, BASE_TRUTHS } = require('../utils/aouvPrompts');

function pickRandom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

async function getGuildConfig(dataManager, guildId) {
	const config = await dataManager.loadData('aouv_config.json', {});
	return config[guildId] || { allowedChannels: [], disabledBaseActions: [], disabledBaseTruths: [], customActions: [], customTruths: [], baseActionOverrides: {}, baseTruthOverrides: {} };
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

function buildPromptEmbed(kind, text, user) {
	const color = kind === 'action' ? 0xFF6B6B : 0x3399FF;
	const title = kind === 'action' ? 'Action 🎯' : 'Vérité 💬';
	return new EmbedBuilder()
		.setTitle(title)
		.setDescription(text)
		.setColor(color)
		.setFooter({ text: `Demandé par ${user.displayName || user.username}` });
}

async function resolvePools(dataManager, guildId) {
	const cfg = await getGuildConfig(dataManager, guildId);
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
		truths: [...baseT, ...customT]
	};
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
		const channelId = interaction.channel.id;
		const cfg = await getGuildConfig(dataManager, guildId);
		const allowed = Array.isArray(cfg.allowedChannels) ? cfg.allowedChannels : [];
		if (allowed.length > 0 && !allowed.includes(channelId)) {
			const mentions = allowed.map(id => `<#${id}>`).join(', ');
			return interaction.reply({ content: `Ce salon n'est pas configuré pour AouV. Utilise: ${mentions}`, flags: 64 });
		}

		const embed = new EmbedBuilder()
			.setTitle('Action ou Vérité ?')
			.setDescription("Clique sur un bouton pour tirer un prompt public.")
			.setColor(0x888888);

		await interaction.reply({ embeds: [embed], components: [buildButtons()] });
	},

	// Gestion des boutons via MainRouter
	async handleButton(interaction, dataManager) {
		const guildId = interaction.guild.id;
		const { actions, truths } = await resolvePools(dataManager, guildId);
		if (interaction.customId === 'aouv_btn_action') {
			const text = (actions.length ? pickRandom(actions) : '(Aucune action configurée)');
			return interaction.reply({ embeds: [buildPromptEmbed('action', text, interaction.user)], components: [buildButtons()] });
		}
		if (interaction.customId === 'aouv_btn_verite') {
			const text = (truths.length ? pickRandom(truths) : '(Aucune vérité configurée)');
			return interaction.reply({ embeds: [buildPromptEmbed('verite', text, interaction.user)], components: [buildButtons()] });
		}
	}
};