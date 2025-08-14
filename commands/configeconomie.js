const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('configeconomie')
		.setDescription('Configuration du système économique (alias)')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

	async execute(interaction) {
		if (!interaction.member.permissions.has('Administrator')) {
			return await interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', flags: 64 });
		}

		try {
			const EconomyConfigHandler = require('../utils/EconomyConfigHandler');
			const dataManager = require('../utils/simpleDataManager');
			const handler = new EconomyConfigHandler(dataManager);

			await interaction.reply({ content: '⚙️ Ouverture du menu de configuration économique...', flags: 64 });
			await handler.showMainMenu({ update: (p) => interaction.editReply(p) });
		} catch (error) {
			console.error('Erreur /configeconomie:', error);
			await interaction.editReply({ content: '❌ Erreur lors de l\'ouverture de la configuration économique.' });
		}
	}
};