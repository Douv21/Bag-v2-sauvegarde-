/**
 * COMMANDE BUMP
 * Système de bump multi-plateforme similaire à Disboard
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bump')
        .setDescription('Bump le serveur sur plusieurs plateformes en une seule commande')
        .addStringOption(option =>
            option.setName('plateforme')
                .setDescription('Plateforme spécifique à bump (optionnel)')
                .setRequired(false)
                .addChoices(
                    { name: '🔥 Top.gg', value: 'topgg' },
                    { name: '⭐ Discord Bot List', value: 'discordbotlist' },
                    { name: '🚢 Discord Boats', value: 'discordboats' },
                    { name: '🤖 Discord Bots', value: 'discordbots' },
                    { name: '📢 Disboard', value: 'disboard' }
                )
        ),

    async execute(interaction, client) {
        try {
            const bumpManager = client.bumpManager;
            if (!bumpManager) {
                return await interaction.reply({
                    content: '❌ Le système de bump n\'est pas disponible.',
                    ephemeral: true
                });
            }

            const guildId = interaction.guild.id;
            const userId = interaction.user.id;
            const specificPlatform = interaction.options.getString('plateforme');

            // Vérifier les permissions
            if (!interaction.member.permissions.has('ManageGuild')) {
                return await interaction.reply({
                    content: '❌ Vous devez avoir la permission "Gérer le serveur" pour utiliser cette commande.',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            // Vérifier la configuration
            const config = await bumpManager.getBumpConfig(guildId);
            const hasNSFWChannels = interaction.guild.channels.cache.some(channel => channel.nsfw);
            const allEnabledPlatforms = bumpManager.getAllEnabledPlatforms(config, hasNSFWChannels);
            
            if (allEnabledPlatforms.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('⚙️ Configuration requise')
                    .setDescription('Aucune plateforme n\'est configurée pour ce serveur.')
                    .setColor('#ffcc00')
                    .addFields(
                        { 
                            name: 'Comment configurer ?', 
                            value: 'Utilisez la commande `/bump-config` pour activer les plateformes de votre choix.' 
                        }
                    );

                const configButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('bump_config')
                            .setLabel('Configurer maintenant')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('⚙️')
                    );

                return await interaction.editReply({
                    embeds: [embed],
                    components: [configButton]
                });
            }

            // Si une plateforme spécifique est demandée
            if (specificPlatform) {
                if (!allEnabledPlatforms.includes(specificPlatform)) {
                    return await interaction.editReply({
                        content: `❌ La plateforme ${bumpManager.platforms[specificPlatform].name} n'est pas activée sur ce serveur.`,
                    });
                }

                const cooldownInfo = await bumpManager.checkCooldowns(guildId, userId);
                
                if (!cooldownInfo.canBump.includes(specificPlatform)) {
                    const onCooldownPlatform = cooldownInfo.onCooldown.find(cd => cd.platform === specificPlatform);
                    if (onCooldownPlatform) {
                        const embed = new EmbedBuilder()
                            .setTitle('⏰ Cooldown actif')
                            .setDescription(`La plateforme ${bumpManager.platforms[specificPlatform].name} est en cooldown.`)
                            .addFields({
                                name: 'Temps restant',
                                value: bumpManager.formatTimeLeft(onCooldownPlatform.timeLeft),
                                inline: true
                            })
                            .setColor('#ff6b6b');

                        return await interaction.editReply({ embeds: [embed] });
                    }
                }

                // Effectuer le bump sur la plateforme spécifique
                const results = await bumpManager.performBump(guildId, userId, [specificPlatform]);
                const result = results[0];

                if (result.success) {
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Bump réussi !')
                        .setDescription(`Le serveur a été bumpé avec succès sur ${bumpManager.platforms[specificPlatform].name}`)
                        .setColor('#00ff00')
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Erreur de bump')
                        .setDescription(`Erreur lors du bump sur ${bumpManager.platforms[specificPlatform].name}`)
                        .setColor('#ff0000');

                    await interaction.editReply({ embeds: [embed] });
                }
                return;
            }

            // Affichage du statut général et interface de sélection
            const cooldownInfo = await bumpManager.checkCooldowns(guildId, userId);
            const embed = bumpManager.createBumpStatusEmbed(guildId, cooldownInfo);

            const components = [];

            // Menu de sélection si des plateformes sont disponibles
            if (cooldownInfo.canBump.length > 0) {
                const selectMenu = bumpManager.createPlatformSelectMenu(cooldownInfo.canBump);
                components.push(selectMenu);
            }

            // Boutons d'action
            const actionButtons = bumpManager.createActionButtons(cooldownInfo.canBump.length > 0);
            components.push(actionButtons);

            await interaction.editReply({
                embeds: [embed],
                components: components
            });

        } catch (error) {
            console.error('❌ Error in bump command:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de l\'exécution de la commande bump.',
                });
            } else {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de l\'exécution de la commande bump.',
                    ephemeral: true
                });
            }
        }
    }
};