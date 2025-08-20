const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autothread')
        .setDescription('Configuration du système auto-thread global (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, dataManager) {
        try {
            // Accès direct au handler AutoThread
            const AutoThreadConfigHandler = require('../handlers/AutoThreadConfigHandler');
            const handler = new AutoThreadConfigHandler(dataManager);
            await handler.handleMainConfig(interaction);
        } catch (error) {
            console.error('❌ Erreur autothread:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de la configuration auto-thread.',
                    flags: 64
                });
            }
        }
    }
};