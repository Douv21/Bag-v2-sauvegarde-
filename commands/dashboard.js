const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('📊 Tableau de bord administratif du serveur'),
        
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
            const DashboardHandler = require('../handlers/DashboardHandler');
            const handler = new DashboardHandler(dataManager);
            
            await handler.showMainDashboard(interaction);
            
        } catch (error) {
            console.error('Erreur dashboard:', error);
            
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage du dashboard.',
                flags: 64
            });
        }
    }
};