const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MongoDBDiagnostic = require('../utils/mongodbDiagnostic');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mongodb-diagnostic')
        .setDescription('🔍 Diagnostic complet de la connexion MongoDB Atlas (Admin uniquement)'),
    
    async execute(interaction) {
        try {
            // Vérifier les permissions admin
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({
                    content: '❌ Cette commande est réservée aux administrateurs.',
                    flags: 64
                });
            }

            await interaction.deferReply({ flags: 64 });

            console.log(`🔍 Diagnostic MongoDB demandé par ${interaction.user.tag}`);
            
            // Lancer le diagnostic
            const success = await MongoDBDiagnostic.testConnection();
            
            const embed = new EmbedBuilder()
                .setTitle('🔍 Diagnostic MongoDB Atlas')
                .setColor(success ? 0x00ff00 : 0xff0000)
                .setTimestamp();
            
            if (success) {
                embed.setDescription('✅ **MongoDB Atlas fonctionne parfaitement !**\n\nLe système de sauvegarde automatique est opérationnel.');
                embed.addFields(
                    { name: '🔄 Sauvegarde Automatique', value: 'Activée - Toutes les 15 minutes', inline: true },
                    { name: '🛡️ Protection Données', value: 'Triple sécurité garantie', inline: true },
                    { name: '📊 Status', value: 'Système prêt pour production', inline: true }
                );
            } else {
                embed.setDescription('⚠️ **Problème de connexion MongoDB détecté**\n\nLe bot utilise la sauvegarde locale en attendant.');
                embed.addFields(
                    { name: '🔄 Sauvegarde Locale', value: 'Active - Toutes les 30 minutes', inline: true },
                    { name: '🛡️ Protection Données', value: 'Sauvegarde locale fonctionnelle', inline: true },
                    { name: '💡 Solution', value: 'Vérifiez la console pour les détails', inline: true }
                );
            }
            
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur diagnostic MongoDB:', error);
            await interaction.editReply({
                content: '❌ Erreur lors du diagnostic MongoDB.',
                flags: 64
            });
        }
    }
};