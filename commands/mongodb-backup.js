const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const mongoBackupManager = require('../utils/mongoBackupManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mongodb-backup')
        .setDescription('🗄️ Gestion complète des sauvegardes MongoDB (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action à effectuer')
                .setRequired(true)
                .addChoices(
                    { name: '📤 Sauvegarder vers MongoDB', value: 'backup' },
                    { name: '📥 Restaurer depuis MongoDB', value: 'restore' },
                    { name: '📊 Vérifier l\'intégrité', value: 'verify' },
                    { name: '📋 Lister les sauvegardes', value: 'list' },
                    { name: '🔍 Scanner les fichiers', value: 'scan' }
                ))
        .addStringOption(option =>
            option.setName('fichier')
                .setDescription('Fichier spécifique (optionnel, pour restauration ciblée)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            const action = interaction.options.getString('action');
            const specificFile = interaction.options.getString('fichier');
            
            let embed = {
                title: '🗄️ Gestion Sauvegardes MongoDB',
                color: 0x3498db,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Admin: ${interaction.user.displayName}`,
                    icon_url: interaction.user.displayAvatarURL()
                }
            };

            switch (action) {
                case 'backup':
                    embed.description = '📤 **Sauvegarde en cours...**';
                    await interaction.editReply({ embeds: [embed] });
                    
                    const backupResult = await mongoBackupManager.backupToMongo();
                    
                    if (backupResult.success) {
                        embed.color = 0x27ae60;
                        embed.description = '✅ **Sauvegarde MongoDB terminée avec succès**';
                        embed.fields = [
                            {
                                name: '📊 Résultats',
                                value: `✅ **${backupResult.backupCount}** fichiers sauvegardés\n⏭️ **${backupResult.skippedCount}** fichiers ignorés\n📁 **${backupResult.total}** fichiers totaux`,
                                inline: true
                            },
                            {
                                name: '🕐 Timestamp',
                                value: `<t:${Math.floor(Date.now()/1000)}:F>`,
                                inline: true
                            }
                        ];
                    } else {
                        embed.color = 0xe74c3c;
                        embed.description = '❌ **Échec de la sauvegarde MongoDB**';
                        embed.fields = [{
                            name: '❌ Erreur',
                            value: backupResult.error || 'Erreur inconnue',
                            inline: false
                        }];
                    }
                    break;

                case 'restore':
                    embed.description = '📥 **Restauration en cours...**';
                    if (specificFile) {
                        embed.description += `\n🎯 Fichier ciblé: \`${specificFile}\``;
                    }
                    await interaction.editReply({ embeds: [embed] });
                    
                    const restoreResult = await mongoBackupManager.restoreFromMongo(specificFile);
                    
                    if (restoreResult.success) {
                        embed.color = 0x27ae60;
                        embed.description = '✅ **Restauration MongoDB terminée avec succès**';
                        embed.fields = [
                            {
                                name: '📊 Résultats',
                                value: `✅ **${restoreResult.restoreCount}** fichiers restaurés\n⏭️ **${restoreResult.skippedCount}** fichiers ignorés\n📁 **${restoreResult.total}** fichiers traités`,
                                inline: true
                            },
                            {
                                name: '🗄️ Collections',
                                value: `**${restoreResult.collections?.length || 0}** collections disponibles`,
                                inline: true
                            }
                        ];
                    } else {
                        embed.color = 0xe74c3c;
                        embed.description = '❌ **Échec de la restauration MongoDB**';
                        embed.fields = [{
                            name: '❌ Erreur',
                            value: restoreResult.error || restoreResult.reason || 'Erreur inconnue',
                            inline: false
                        }];
                    }
                    break;

                case 'verify':
                    embed.description = '🔍 **Vérification en cours...**';
                    await interaction.editReply({ embeds: [embed] });
                    
                    const verifyResult = await mongoBackupManager.verifyBackupIntegrity();
                    
                    if (verifyResult) {
                        embed.color = 0x27ae60;
                        embed.description = '✅ **Vérification terminée**';
                        embed.fields = [{
                            name: '📊 État',
                            value: 'Consultez les logs du serveur pour les détails complets de l\'intégrité',
                            inline: false
                        }];
                    } else {
                        embed.color = 0xe74c3c;
                        embed.description = '❌ **Échec de la vérification**';
                    }
                    break;

                case 'scan':
                    embed.description = '🔍 **Scan des fichiers en cours...**';
                    await interaction.editReply({ embeds: [embed] });
                    
                    const allFiles = await mongoBackupManager.scanAllDataFiles();
                    const fileCount = Object.keys(allFiles).length;
                    const collections = [...new Set(Object.values(allFiles))];
                    
                    embed.color = 0x3498db;
                    embed.description = '📁 **Scan des fichiers terminé**';
                    embed.fields = [
                        {
                            name: '📊 Statistiques',
                            value: `📄 **${fileCount}** fichiers JSON trouvés\n📁 **${collections.length}** collections cibles\n🗂️ Dossier: \`/data\``,
                            inline: true
                        },
                        {
                            name: '🗄️ Collections cibles',
                            value: collections.slice(0, 10).map(c => `\`${c}\``).join(', ') + (collections.length > 10 ? '...' : ''),
                            inline: false
                        }
                    ];
                    break;

                case 'list':
                    embed.description = '📋 **Consultation des sauvegardes...**';
                    await interaction.editReply({ embeds: [embed] });
                    
                    try {
                        if (!await mongoBackupManager.connect()) {
                            throw new Error('Connexion MongoDB impossible');
                        }
                        
                        const collections = await mongoBackupManager.db.listCollections().toArray();
                        let totalBackups = 0;
                        
                        for (const collection of collections) {
                            const count = await mongoBackupManager.db.collection(collection.name).countDocuments();
                            totalBackups += count;
                        }
                        
                        embed.color = 0x27ae60;
                        embed.description = '📋 **Liste des sauvegardes MongoDB**';
                        embed.fields = [
                            {
                                name: '📊 Statistiques',
                                value: `🗄️ **${collections.length}** collections MongoDB\n📄 **${totalBackups}** documents de sauvegarde\n🔗 Base: \`bagbot\``,
                                inline: true
                            },
                            {
                                name: '📁 Collections disponibles',
                                value: collections.slice(0, 15).map(c => `\`${c.name}\``).join(', ') + (collections.length > 15 ? '...' : ''),
                                inline: false
                            }
                        ];
                    } catch (error) {
                        embed.color = 0xe74c3c;
                        embed.description = '❌ **Erreur consultation MongoDB**';
                        embed.fields = [{
                            name: '❌ Erreur',
                            value: error.message,
                            inline: false
                        }];
                    }
                    break;
            }

            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Erreur commande mongodb-backup:', error);
            
            const errorEmbed = {
                title: '❌ Erreur MongoDB Backup',
                description: 'Une erreur est survenue lors de l\'opération de sauvegarde.',
                color: 0xe74c3c,
                fields: [{
                    name: 'Détail de l\'erreur',
                    value: error.message || 'Erreur inconnue',
                    inline: false
                }],
                timestamp: new Date().toISOString()
            };
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};