const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BASE_TRUTHS } = require('../utils/aouvPrompts');

function pickRandom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

async function getGuildConfig(dataManager, guildId) {
	const all = await dataManager.loadData('aouv_config.json', {});
	return all[guildId] || { disabledBaseTruths: [], customTruths: [], allowedChannels: [] };
}

function buildPromptEmbed(text, user) {
	return new EmbedBuilder()
		.setTitle('Vérité 💬')
		.setDescription(text)
		.setColor(0x3399FF)
		.setFooter({ text: `Demandé par ${user.displayName || user.username}` });
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('verite')
		.setDescription("Tire une 'Vérité' aléatoire."),

	async execute(interaction, dataManager) {
		if (!interaction.guild) return interaction.reply({ content: 'Serveur uniquement.', flags: 64 });
		const guildId = interaction.guild.id;
		const channelId = interaction.channel.id;

		// Restreindre aux salons configurés pour AouV (SFW)
		const cfg = await getGuildConfig(dataManager, guildId);
		const allowed = Array.isArray(cfg.allowedChannels) ? cfg.allowedChannels : [];
		if (allowed.length > 0 && !allowed.includes(channelId)) {
			const mentions = allowed.map(id => `<#${id}>`).join(', ');
			return interaction.reply({ content: `❌ Ce salon n'est pas configuré pour /verite. Utilisez: ${mentions}`, flags: 64 });
		}

		const disabled = new Set(cfg.disabledBaseTruths || []);
		const base = BASE_TRUTHS.filter((_, i) => !disabled.has(i));
		const custom = (cfg.customTruths || []).map(x => String(x || '')).filter(Boolean);
		const pool = [...base, ...custom];
		const text = pool.length ? pickRandom(pool) : '(Aucune vérité configurée)';
		await interaction.reply({ embeds: [buildPromptEmbed(text, interaction.user)] });
	}
};