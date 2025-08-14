const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config-economie')
		.setDescription('Configuration du système économique (Admin uniquement)')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

	async execute(interaction) {
		if (!interaction.member.permissions.has('Administrator')) {
			return await interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', flags: 64 });
		}

		try {
			const EconomyConfigHandler = require('../utils/EconomyConfigHandler');
			const dataManager = require('../utils/simpleDataManager');
			const handler = new EconomyConfigHandler(dataManager);

			// Répondre d'abord pour éviter l'expiration
			await interaction.reply({ content: '⚙️ Ouverture du menu de configuration économique...', flags: 64 });
			// Utiliser editReply via un wrapper minimal compatible avec les handlers
			await handler.showMainMenu({ update: (p) => interaction.editReply(p) });
		} catch (error) {
			console.error('Erreur /config-economie:', error);
			await interaction.editReply({ content: '❌ Erreur lors de l\'ouverture de la configuration économique.' });
		}
	}
};