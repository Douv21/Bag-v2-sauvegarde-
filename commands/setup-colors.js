const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ROLE_STYLES } = require('../utils/rolePalette');
const { createAndPositionColorRole } = require('../utils/rolePositioning');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup-colors')
		.setDescription('Créer les rôles « couleur/style » de la palette')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

	async execute(interaction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', flags: 64 });
		}

		if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return interaction.reply({ content: '❌ Permission requise: Administrateur.', flags: 64 });
		}

		await interaction.deferReply({ ephemeral: true });

		const results = [];
		const me = interaction.guild.members.me;
		if (!me) {
			return interaction.editReply({ content: '❌ Impossible de récupérer les informations du bot.' });
		}

		for (const style of ROLE_STYLES) {
			try {
				const existing = interaction.guild.roles.cache.find(r => r.name === style.name);
				if (existing) {
					results.push(`Déjà présent: ${style.name}`);
					continue;
				}

				const role = await createAndPositionColorRole(
					interaction.guild, 
					me, 
					style, 
					'Palette auto (setup-colors)'
				);

				if (role) {
					results.push(`Créé: ${role.name}`);
				} else {
					results.push(`Erreur: ${style.name} (impossible de créer)`);
				}
			} catch (error) {
				results.push(`Erreur: ${style.name} (${error.message})`);
			}
		}

		return interaction.editReply({ content: `Terminé.\n${results.join('\n')}` });
	}
};