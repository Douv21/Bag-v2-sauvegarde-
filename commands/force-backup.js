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
                try {
                    const levelManager = require('../utils/levelManager');
                    const cfg = levelManager.loadConfig();
                    const perks = cfg.boosterPerks || { enabled: false };
                    embed.addFields(
                        { name: '💎 Avantages Booster', value: perks.enabled ? '✅ Activés' : '❌ Désactivés', inline: true },
                        { name: 'XP Msg (x)', value: String(perks.xpMultiplier ?? '—'), inline: true },
                        { name: 'XP Vocal (x)', value: String(perks.voiceXpMultiplier ?? perks.xpMultiplier ?? '—'), inline: true },
                        { name: 'Cooldown Msg (%)', value: perks.textCooldownFactor ? `${Math.round(100 * perks.textCooldownFactor)}%` : '—', inline: true }
                    );
                } catch {}
                embed.addFields({
                    name: '📁 Fichiers Sauvegardés',
                    value: '• `level_config.json` - Config niveaux (incl. Booster)\n• `level_users.json` - Données niveaux\n• `economy.json` - Économie\n• `confessions.json` - Confessions\n• `counting.json` - Comptage\n• `autothread.json` - Auto-thread\n• `shop.json` - Boutique\n• `karma_config.json` - Karma\n• `message_rewards.json` - Récompenses messages\n• `member_locations.json` - Localisation',
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