const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-confession')
        .setDescription('🛠️ Configuration avancée du système de confessions'),

    async execute(interaction, dataManager) {
        // Vérifier les permissions
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({
                content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                flags: 64
            });
        }

        try {
            const ConfessionConfigHandler = require('../handlers/ConfessionConfigHandler');
            const handler = new ConfessionConfigHandler(dataManager);
            
            await handler.showMainConfigMenu(interaction);
            
        } catch (error) {
            console.error('Erreur config-confession:', error);
            
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage de la configuration des confessions.',
                flags: 64
            });
        }
    }
};