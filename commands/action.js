const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BASE_ACTIONS } = require('../utils/aouvPrompts');

function pickRandom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

async function getGuildConfig(dataManager, guildId) {
	const all = await dataManager.loadData('aouv_config.json', {});
	return all[guildId] || { disabledBaseActions: [], customActions: [] };
}

function buildPromptEmbed(text, user) {
	return new EmbedBuilder()
		.setTitle('Action 🎯')
		.setDescription(text)
		.setColor(0xFF6B6B)
		.setFooter({ text: `Demandé par ${user.displayName || user.username}` });
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('action')
		.setDescription("Tire une 'Action' aléatoire."),

	async execute(interaction, dataManager) {
		if (!interaction.guild) return interaction.reply({ content: 'Serveur uniquement.', flags: 64 });
		const guildId = interaction.guild.id;
		const cfg = await getGuildConfig(dataManager, guildId);
		const disabled = new Set(cfg.disabledBaseActions || []);
		const base = BASE_ACTIONS.filter((_, i) => !disabled.has(i));
		const custom = (cfg.customActions || []).map(x => String(x || '')).filter(Boolean);
		const pool = [...base, ...custom];
		const text = pool.length ? pickRandom(pool) : '(Aucune action configurée)';
		await interaction.reply({ embeds: [buildPromptEmbed(text, interaction.user)] });
	}
};