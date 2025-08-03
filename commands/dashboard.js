const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('📊 Tableau de bord administratif du serveur'),
    
    async execute(interaction) {
        // Vérifier permissions admin
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({
                content: '❌ Cette commande est réservée aux administrateurs.',
                flags: 64
            });
        }

        // URL du dashboard - utilise l'URL de déploiement Render.com
        const DASHBOARD_URL = process.env.RENDER_EXTERNAL_URL || 'https://bag-bot-v2.onrender.com';
        const serverDashboard = `${DASHBOARD_URL}/dashboard/${interaction.guildId}`;

        const embed = new EmbedBuilder()
            .setTitle('📊 Tableau de Bord BAG v2')
            .setDescription('Interface d\'administration élégante et moderne pour votre serveur Discord')
            .addFields(
                {
                    name: '🌐 Accès Dashboard',
                    value: `[🚀 Ouvrir le Dashboard](${serverDashboard})`,
                    inline: false
                },
                {
                    name: '⚙️ Configuration Complète',
                    value: '💰 **Économie** - Actions, karma, boutique\n🤐 **Confessions** - Canaux, logs, auto-threads\n🔢 **Comptage** - Mode math, records\n🔗 **Auto-Threads** - Configuration avancée',
                    inline: true
                },
                {
                    name: '📱 Interface Moderne',
                    value: '🎨 **Design Élégant** - Style BAG premium\n📊 **Statistiques** - Temps réel\n💾 **Sauvegarde** - Instantanée\n📱 **Mobile** - Entièrement responsive',
                    inline: true
                }
            )
            .setColor('#e53e3e')
            .setFooter({ 
                text: `Dashboard pour ${interaction.guild.name} • BAG v2`, 
                iconURL: interaction.guild.iconURL() 
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }
};