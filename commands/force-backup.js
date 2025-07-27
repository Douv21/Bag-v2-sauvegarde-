const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const deploymentManager = require('../utils/deploymentManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('force-backup')
        .setDescription('💾 Forcer une sauvegarde manuelle vers MongoDB (Admin uniquement)')
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

            const startTime = Date.now();
            
            // Forcer sauvegarde
            const success = await deploymentManager.emergencyBackup();
            
            const duration = Date.now() - startTime;

            const embed = new EmbedBuilder()
                .setTitle('💾 Sauvegarde Manuelle')
                .setColor(success ? 0x00ff00 : 0xff0000)
                .addFields(
                    {
                        name: '📋 Résultat',
                        value: success ? '✅ Sauvegarde réussie' : '❌ Échec de la sauvegarde',
                        inline: true
                    },
                    {
                        name: '⏱️ Durée',
                        value: `${duration}ms`,
                        inline: true
                    },
                    {
                        name: '🕐 Timestamp',
                        value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({
                    text: success ? 'Données sauvegardées avec succès' : 'Erreur lors de la sauvegarde',
                    iconURL: interaction.guild.iconURL()
                });

            if (success) {
                embed.setDescription('🎯 Toutes les données utilisateur et configurations ont été sauvegardées vers MongoDB.');
                embed.addFields({
                    name: '📁 Fichiers Sauvegardés',
                    value: '• `economy.json` - Données économiques\n• `level_users.json` - Données niveaux membres\n• `level_config.json` - Configuration niveaux\n• `confessions.json` - Confessions\n• `counting.json` - Système comptage\n• `autothread.json` - Auto-thread\n• `shop.json` - Boutique\n• `karma_config.json` - Configuration karma\n• `message_rewards.json` - Récompenses messages',
                    inline: false
                });
            } else {
                embed.setDescription('⚠️ La sauvegarde a échoué. Vérifiez la connexion MongoDB.');
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erreur force-backup:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erreur Sauvegarde')
                .setDescription(`Erreur lors de la sauvegarde manuelle: ${error.message}`)
                .setColor(0xff0000)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};