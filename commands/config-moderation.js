const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config-moderation')
		.setDescription('Configuration du système de modération (Admin uniquement)')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

	async execute(interaction) {
		if (!interaction.member.permissions.has('Administrator')) {
			return await interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', flags: 64 });
		}

		try {
			// S'assurer que le ModerationManager est attaché
			if (!interaction.client.moderationManager) {
				const ModerationManager = require('../managers/ModerationManager');
				const DataManager = require('../managers/DataManager');
				interaction.client.moderationManager = new ModerationManager(new DataManager(), interaction.client);
			}

			// Ouvrir le menu principal de modération
			await interaction.reply({ content: '⚙️ Ouverture du menu de modération...', flags: 64 });
			await interaction.client.emit('interactionCreate', { ...interaction, customId: 'moderation_main', isButton: () => true, isStringSelectMenu: () => false, isModalSubmit: () => false });
		} catch (error) {
			console.error('Erreur /config-moderation:', error);
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply({ content: '❌ Erreur lors de l\'ouverture de la configuration de modération.' });
			} else {
				await interaction.reply({ content: '❌ Erreur lors de l\'ouverture de la configuration de modération.', flags: 64 });
			}
		}
	}
};