const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { buildChoicesForSlashCommand, findStyleByKey } = require('../utils/rolePalette');

const LIMITED_CHOICES = buildChoicesForSlashCommand().slice(0, 25);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('color-role')
		.setDescription('Appliquer une couleur/style à un rôle existant')
		.addRoleOption(option =>
			option
				.setName('role')
				.setDescription('Rôle à modifier')
				.setRequired(true)
		)
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
				.setDescription('Clé du style (ex: irise-3, exotique-5, degrade-v-2)')
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option
				.setName('rename')
				.setDescription('Renommer le rôle avec le nom du style (par défaut: non)')
				.setRequired(false)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles.toString()),

	async execute(interaction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', flags: 64 });
		}

		if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return interaction.reply({ content: '❌ Permission requise: Gérer les rôles.', flags: 64 });
		}

		const targetRole = interaction.options.getRole('role', true);
		const styleKeyFromChoice = interaction.options.getString('style');
		const styleKeyFromText = interaction.options.getString('style-key');
		const shouldRename = interaction.options.getBoolean('rename') ?? false;

		const styleKey = styleKeyFromText || styleKeyFromChoice;
		if (!styleKey) {
			return interaction.reply({ content: 'Précise un style via la liste (style) ou sa clé (style-key), ex: irise-3.', flags: 64 });
		}

		const style = findStyleByKey(styleKey);
		if (!style) {
			return interaction.reply({ content: `Style inconnu: ${styleKey}. Exemples: irise-3, exotique-5, degrade-v-2.`, flags: 64 });
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			const roleEditData = { color: style.color };
			if (shouldRename) roleEditData.name = style.name;
			await targetRole.edit(roleEditData, 'Application de couleur via /color-role');

			const embed = new EmbedBuilder()
				.setTitle(`Style appliqué: ${style.name}`)
				.setDescription(`Clé: ${style.key}\nHex: ${style.color}`)
				.setColor(style.color);

			return interaction.editReply({ content: `Mis à jour: ${targetRole.toString()} → ${style.name} (${style.color})`, embeds: [embed] });
		} catch (error) {
			return interaction.editReply({ content: `Impossible de modifier ${targetRole.name}. Vérifie mes permissions et la position du rôle.\nErreur: ${error.message}` });
		}
	}
};

