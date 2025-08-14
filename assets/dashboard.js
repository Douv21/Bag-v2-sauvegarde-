const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('📊 Statut du tableau de bord (en reconstruction)'),
    
    async execute(interaction) {
        // Vérifier permissions admin
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({
                content: '❌ Cette commande est réservée aux administrateurs.',
                flags: 64
            });
        }

        // URL du dashboard - utilise l'URL actuelle du serveur
        const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5000';
        const serverDashboard = `${DASHBOARD_URL}/dashboard`;

        const embed = new EmbedBuilder()
            .setTitle('📊 Dashboard en reconstruction')
            .setDescription('Le tableau de bord est en cours de refonte. Une version minimale sera réintroduite pas à pas.')
            .addFields({ name: 'Accès', value: `[Page placeholder](${serverDashboard})` })
            .setColor('#e53e3e')
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }
};