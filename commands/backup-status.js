const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const deploymentManager = require('../utils/deploymentManager');
const mongoBackup = require('../utils/mongoBackupManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup-status')
        .setDescription('📊 État du système de sauvegarde MongoDB (Admin uniquement)')
        .setDefaultMemberPermissions('0'),

    async execute(interaction) {
        try {
            // Vérification permissions admin
            if (!interaction.member.permissions.has('Administrator')) {
                return interaction.reply({
                    content: '❌ Cette commande est réservée aux administrateurs.',
                    flags: 64
                });
            }

            await interaction.deferReply({ flags: 64 });

            // Récupérer status système
            const systemStatus = await deploymentManager.getSystemStatus();
            
            // Tenter connexion MongoDB seulement si password valide
            let connected = false;
            let integrity = false;
            
            if (process.env.MONGODB_PASSWORD && process.env.MONGODB_USERNAME && process.env.MONGODB_CLUSTER_URL) {
                connected = await mongoBackup.connect();
                if (connected) {
                    integrity = await mongoBackup.verifyBackupIntegrity();
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Système de Sauvegarde MongoDB')
                .setColor(connected ? 0x00ff00 : 0xff9500)
                .addFields(
                    {
                        name: '🔗 Connexion MongoDB',
                        value: connected ? '✅ Connecté' : '❌ Déconnecté',
                        inline: true
                    },
                    {
                        name: '🚀 Déploiement',
                        value: `\`${systemStatus.deploymentId}\``,
                        inline: true
                    },
                    {
                        name: '🔄 Type Boot',
                        value: systemStatus.isFirstBoot ? '🆕 Premier déploiement' : '🔄 Redémarrage',
                        inline: true
                    },
                    {
                        name: '📊 Vérification Intégrité',
                        value: integrity ? '✅ Sauvegardes OK' : '⚠️ Problèmes détectés',
                        inline: true
                    },
                    {
                        name: '⏰ Dernière Vérification',
                        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                        inline: true
                    },
                    {
                        name: '🏗️ Environnement',
                        value: process.env.RENDER_SERVICE_ID ? '☁️ Render.com' : '💻 Local',
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({
                    text: 'Système de sauvegarde automatique',
                    iconURL: interaction.guild.iconURL()
                });

            // Ajouter info MongoDB si connecté
            if (connected) {
                embed.addFields({
                    name: '📦 Collections Disponibles',
                    value: '`users`, `economy`, `confessions`, `counting`, `autothread`, `shop`, `karma`, `configs`, `backup_member_locations`',
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erreur backup-status:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erreur Système')
                .setDescription(`Impossible de récupérer le statut: ${error.message}`)
                .setColor(0xff0000)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};