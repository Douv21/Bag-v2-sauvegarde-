const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('📊 Ouvre le tableau de bord du serveur (version minimale)'),
    
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
        const guildId = interaction.guildId || interaction.guild?.id || '';
        const serverDashboard = `${DASHBOARD_URL}/dashboard${guildId ? `?guildId=${guildId}` : ''}`;

        const embed = new EmbedBuilder()
            .setTitle('📊 Tableau de bord — BAG v2')
            .setDescription('Accès au tableau de bord minimal (statistiques temps réel).')
            .addFields({ name: 'Lien', value: `[Ouvrir le tableau de bord](${serverDashboard})` })
            .setColor('#e53e3e')
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }
};