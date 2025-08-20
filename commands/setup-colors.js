const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ROLE_STYLES, getPaletteByKey, buildPaletteChoices } = require('../utils/rolePalette');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup-colors')
		.setDescription('Créer les rôles « couleur/style » de la palette')
		.addStringOption(option =>
			option
				.setName('palette')
				.setDescription('Palette à utiliser (par défaut: palette active)')
				.setRequired(false)
				.addChoices(...buildPaletteChoices().slice(0,25))
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles.toString()),

	async execute(interaction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', flags: 64 });
		}

		if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return interaction.reply({ content: '❌ Permission requise: Gérer les rôles.', flags: 64 });
		}

		await interaction.deferReply({ ephemeral: true });

		const paletteKey = interaction.options.getString('palette');
		const palette = paletteKey ? (getPaletteByKey(paletteKey) || { styles: ROLE_STYLES }) : { styles: ROLE_STYLES };

		const results = [];
		for (const style of palette.styles) {
			try {
				const existing = interaction.guild.roles.cache.find(r => r.name === style.name);
				if (existing) {
					results.push(`Déjà présent: ${style.name}`);
					continue;
				}
				const role = await interaction.guild.roles.create({
					name: style.name,
					color: style.color,
					hoist: false,
					mentionable: false,
					reason: 'Palette auto (setup-colors)'
				});
				results.push(`Créé: ${role.name}`);
			} catch (error) {
				results.push(`Erreur: ${style.name} (${error.message})`);
			}
		}

		return interaction.editReply({ content: `Terminé.\n${results.join('\n')}` });
	}
};

