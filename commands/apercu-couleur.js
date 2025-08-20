const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { buildChoicesForSlashCommand, findStyleByKey } = require('../utils/rolePalette');

const LIMITED_CHOICES = buildChoicesForSlashCommand().slice(0, 25);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('apercu-couleur')
		.setDescription("Afficher un aperçu d'un style/couleur")
		.addStringOption(option =>
			option
				.setName('style')
				.setDescription('Choisis un style (liste limitée)')
				.setRequired(false)
				.addChoices(...LIMITED_CHOICES)
		)
		.addStringOption(option =>
			option
				.setName('style-key')
				.setDescription('Clé du style (ex: irise-3, exotique-5)')
				.setRequired(false)
		),

	async execute(interaction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', flags: 64 });
		}

		const styleKeyFromChoice = interaction.options.getString('style');
		const styleKeyFromText = interaction.options.getString('style-key');
		const styleKey = styleKeyFromText || styleKeyFromChoice;
		if (!styleKey) {
			return interaction.reply({ content: 'Précise un style via la liste (style) ou sa clé (style-key), ex: irise-3.', flags: 64 });
		}

		const style = findStyleByKey(styleKey);
		if (!style) {
			return interaction.reply({ content: `Style inconnu: ${styleKey}.`, flags: 64 });
		}

		const embed = new EmbedBuilder()
			.setTitle(`Aperçu: ${style.name}`)
			.setDescription('Clé: ' + style.key + '\nHex: ' + style.color)
			.setColor(style.color)
			.setFooter({ text: "Cet aperçu utilise la couleur de la bordure de l'embed." });

		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
};