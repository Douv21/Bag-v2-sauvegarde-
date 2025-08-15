const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Ouvre un menu de configuration pour une section donnée')
		.addStringOption(option =>
			option
				.setName('section')
				.setDescription('Section à configurer')
				.setRequired(true)
				.addChoices(
					{ name: 'Modération', value: 'moderation' },
					{ name: 'Économie', value: 'economie' },
					{ name: 'Logs', value: 'logs' },
					{ name: 'Confessions', value: 'confession' },
					{ name: 'Comptage', value: 'counting' },
					{ name: 'AutoThread', value: 'autothread' }
				)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
		if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return await interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', flags: 64 });
		}

		const section = interaction.options.getString('section');

		try {
			if (section === 'moderation') {
				if (!interaction.client.moderationManager) {
					const ModerationManager = require('../managers/ModerationManager');
					const DataManager = require('../managers/DataManager');
					interaction.client.moderationManager = new ModerationManager(new DataManager(), interaction.client);
				}

				const MainRouterHandler = require('../handlers/MainRouterHandler');
				const dataManager = require('../utils/simpleDataManager');
				const router = new MainRouterHandler(dataManager);

				await interaction.reply({ content: '⚙️ Ouverture du menu de modération...', flags: 64 });
				await router.handleModerationUI(interaction, 'moderation_main');
				return;
			}

			const dataManager = require('../utils/simpleDataManager');

			if (section === 'economie') {
				const EconomyConfigHandler = require('../handlers/EconomyConfigHandler');
				const handler = new EconomyConfigHandler(dataManager);
				await handler.showMainConfigMenu(interaction);
				return;
			}

			if (section === 'logs') {
				const LogsConfigHandler = require('../handlers/LogsConfigHandler');
				const LogManager = require('../managers/LogManager');
				const logManager = new LogManager(dataManager, interaction.client);
				const handler = new LogsConfigHandler(dataManager, logManager);
				await handler.showMain(interaction);
				return;
			}

			if (section === 'confession') {
				const ConfessionConfigHandler = require('../handlers/ConfessionConfigHandler');
				const handler = new ConfessionConfigHandler(dataManager);
				await handler.showMainConfigMenu(interaction);
				return;
			}

			if (section === 'counting') {
				const CountingConfigHandler = require('../handlers/CountingConfigHandler');
				const handler = new CountingConfigHandler(dataManager);
				await handler.showMainConfigMenu(interaction);
				return;
			}

			if (section === 'autothread') {
				const AutoThreadConfigHandler = require('../handlers/AutoThreadConfigHandler');
				const handler = new AutoThreadConfigHandler(dataManager);
				await handler.showMainConfigMenu(interaction);
				return;
			}

			await interaction.reply({ content: '❌ Section inconnue.', flags: 64 });
		} catch (error) {
			console.error('Erreur /config:', error);
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply({ content: '❌ Erreur lors de l\'ouverture de la configuration.' });
			} else {
				await interaction.reply({ content: '❌ Erreur lors de l\'ouverture de la configuration.', flags: 64 });
			}
		}
	}
};