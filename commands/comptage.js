const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comptage')
        .setDescription('💋 Configurer le jeu coquin des boys & girls (Admin only)'),

    async execute(interaction, dataManager) {
        // Vérifier les permissions admin
        if (!interaction.member.permissions.has('ADMINISTRATOR') && !interaction.member.permissions.has('MANAGE_GUILD')) {
            await interaction.reply({
                content: '❌ Seuls les admins peuvent configurer le jeu coquin! 😈',
                flags: 64
            });
            return;
        }
        try {
            const CountingConfigHandler = require('../handlers/CountingConfigHandler');
            const handler = new CountingConfigHandler(dataManager);
            
            await handler.showMainConfigMenu(interaction);
            
        } catch (error) {
            console.error('Erreur comptage:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Oops! Erreur lors de la configuration du jeu coquin.',
                    flags: 64
                });
            }
        }
    }
};