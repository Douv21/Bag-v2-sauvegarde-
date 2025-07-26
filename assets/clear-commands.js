const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-commands')
        .setDescription('🗑️ Supprimer toutes les commandes Discord pour éliminer les doublons (Admin uniquement)')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de suppression')
                .setRequired(true)
                .addChoices(
                    { name: '🏠 Serveur uniquement', value: 'guild' },
                    { name: '🌍 Global uniquement', value: 'global' },
                    { name: '🧹 Tout supprimer (serveur + global)', value: 'all' }
                )
        )
        .addBooleanOption(option =>
            option.setName('confirmation')
                .setDescription('Confirmez-vous la suppression ? (OBLIGATOIRE)')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        try {
            // Vérifier les permissions admin
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({
                    content: '❌ Cette commande est réservée aux administrateurs.',
                    flags: 64
                });
            }

            const type = interaction.options.getString('type');
            const confirmation = interaction.options.getBoolean('confirmation');

            // Vérifier la confirmation
            if (!confirmation) {
                return await interaction.reply({
                    content: '❌ Vous devez confirmer la suppression en cochant la case de confirmation.',
                    flags: 64
                });
            }

            await interaction.deferReply({ flags: 64 });

            console.log(`🗑️ Suppression des commandes demandée par ${interaction.user.tag} (Type: ${type})`);

            let deletedGuild = 0;
            let deletedGlobal = 0;
            let errors = [];

            try {
                // Suppression des commandes du serveur
                if (type === 'guild' || type === 'all') {
                    console.log('🗑️ Suppression des commandes du serveur...');
                    const guildCommands = await interaction.guild.commands.fetch();
                    
                    for (const command of guildCommands.values()) {
                        try {
                            await command.delete();
                            deletedGuild++;
                            console.log(`   ✅ Supprimé (serveur): ${command.name}`);
                        } catch (error) {
                            console.error(`   ❌ Erreur suppression ${command.name}:`, error.message);
                            errors.push(`Serveur - ${command.name}: ${error.message}`);
                        }
                    }
                }

                // Suppression des commandes globales
                if (type === 'global' || type === 'all') {
                    console.log('🗑️ Suppression des commandes globales...');
                    const globalCommands = await interaction.client.application.commands.fetch();
                    
                    for (const command of globalCommands.values()) {
                        try {
                            await command.delete();
                            deletedGlobal++;
                            console.log(`   ✅ Supprimé (global): ${command.name}`);
                        } catch (error) {
                            console.error(`   ❌ Erreur suppression ${command.name}:`, error.message);
                            errors.push(`Global - ${command.name}: ${error.message}`);
                        }
                    }
                }

            } catch (error) {
                console.error('❌ Erreur lors de la suppression des commandes:', error);
                return await interaction.editReply({
                    content: `❌ Erreur lors de la suppression des commandes: ${error.message}`
                });
            }

            // Créer l'embed de résultat
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Suppression des Commandes Discord')
                .setColor(deletedGuild + deletedGlobal > 0 ? 0x00ff00 : 0xff9900)
                .setTimestamp()
                .setFooter({
                    text: `Demandé par ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            let description = '';
            
            if (type === 'guild' || type === 'all') {
                description += `**🏠 Serveur:** ${deletedGuild} commande(s) supprimée(s)\n`;
            }
            
            if (type === 'global' || type === 'all') {
                description += `**🌍 Global:** ${deletedGlobal} commande(s) supprimée(s)\n`;
            }

            if (errors.length > 0) {
                description += `\n⚠️ **Erreurs:** ${errors.length}\n`;
                
                // Limiter les erreurs affichées pour éviter de dépasser la limite
                const maxErrors = 5;
                const displayErrors = errors.slice(0, maxErrors);
                description += displayErrors.map(error => `• ${error}`).join('\n');
                
                if (errors.length > maxErrors) {
                    description += `\n... et ${errors.length - maxErrors} autre(s) erreur(s)`;
                }
            }

            if (deletedGuild + deletedGlobal === 0) {
                description += '\n💡 Aucune commande trouvée à supprimer.';
            } else {
                description += '\n\n✅ **Suppression terminée !**\n';
                description += '💡 Vous pouvez maintenant redémarrer le bot pour réenregistrer les commandes sans doublons.';
            }

            embed.setDescription(description);

            await interaction.editReply({ embeds: [embed] });

            console.log(`✅ Suppression terminée - Serveur: ${deletedGuild}, Global: ${deletedGlobal}, Erreurs: ${errors.length}`);

        } catch (error) {
            console.error('Erreur commande clear-commands:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Erreur lors de la suppression des commandes.'
                });
            } else {
                await interaction.reply({
                    content: '❌ Erreur lors de la suppression des commandes.',
                    flags: 64
                });
            }
        }
    }
};