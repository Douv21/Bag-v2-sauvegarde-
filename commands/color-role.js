const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildChoicesForSlashCommand, findStyleByKey } = require('../utils/rolePalette');

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
				.setDescription('Choisis un style')
				.setRequired(true)
				.addChoices(...buildChoicesForSlashCommand())
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
		const styleKey = interaction.options.getString('style', true);
		const shouldRename = interaction.options.getBoolean('rename') ?? false;

		const style = findStyleByKey(styleKey);
		if (!style) {
			return interaction.reply({ content: 'Style inconnu.', flags: 64 });
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			const roleEditData = { color: style.color };
			if (shouldRename) roleEditData.name = style.name;
			await targetRole.edit(roleEditData, 'Application de couleur via /color-role');
			return interaction.editReply({ content: `Mis à jour: ${targetRole.toString()} → ${style.name} (${style.color})` });
		} catch (error) {
			return interaction.editReply({ content: `Impossible de modifier ${targetRole.name}. Vérifie mes permissions et la position du rôle.\nErreur: ${error.message}` });
		}
	}
};

