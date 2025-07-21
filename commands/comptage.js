const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comptage')
        .setDescription('🔢 Configurer le système de comptage (Admin uniquement)'),

    async execute(interaction, dataManager) {
        // Vérifier les permissions admin
        if (!interaction.member.permissions.has('ADMINISTRATOR') && !interaction.member.permissions.has('MANAGE_GUILD')) {
            await interaction.reply({
                content: '❌ Cette commande est réservée aux administrateurs.',
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
            
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage de la configuration comptage.',
                flags: 64
            });
        }
    }
};