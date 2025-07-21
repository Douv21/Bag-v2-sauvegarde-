const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configeconomie')
        .setDescription('Configuration du système économique (Admin uniquement)')
        .setDefaultMemberPermissions('0'),

    async execute(interaction, dataManager) {
        // Vérifier les permissions
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({
                content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                flags: 64
            });
        }

        try {
            const EconomyConfigHandler = require('../handlers/EconomyConfigHandler');
            const handler = new EconomyConfigHandler(dataManager);
            
            await handler.showMainConfigMenu(interaction);
            
        } catch (error) {
            console.error('Erreur configeconomie:', error);
            
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage de la configuration économique.',
                flags: 64
            });
        }
    }
};