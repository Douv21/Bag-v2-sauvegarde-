const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config-logs')
		.setDescription('Configuration du système de logs (Admin uniquement)')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
		if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return await interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', flags: 64 });
		}

		try {
			const LogsConfigHandler = require('../handlers/LogsConfigHandler');
			const LogManager = require('../managers/LogManager');
			const dataManager = require('../utils/simpleDataManager');

			const logManager = new LogManager(dataManager, interaction.client);
			const handler = new LogsConfigHandler(dataManager, logManager);

			await handler.showMain(interaction);
		} catch (error) {
			console.error('Erreur /config-logs:', error);
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply({ content: '❌ Erreur lors de l\'ouverture de la configuration des logs.' });
			} else {
				await interaction.reply({ content: '❌ Erreur lors de l\'ouverture de la configuration des logs.', flags: 64 });
			}
		}
	}
};