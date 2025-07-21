const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comptage')
        .setDescription('🔢 Configurer le système de comptage (Admin uniquement)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('activer')
                .setDescription('Activer le système de comptage dans un canal')
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('Canal où activer le comptage')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('desactiver')
                .setDescription('Désactiver le système de comptage'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Remettre le compteur à zéro'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Voir les informations du système de comptage'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('Configurer les options du comptage')
                .addIntegerOption(option =>
                    option.setName('nombre')
                        .setDescription('Nombre à partir duquel recommencer (défaut: 1)')
                        .setMinValue(0)
                        .setMaxValue(1000)
                        .setRequired(false))),

    async execute(interaction, dataManager) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guild.id;
            
            // Vérifier les permissions admin
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({
                    content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                    flags: 64
                });
            }

            // Charger la configuration de comptage
            let countingConfig = await dataManager.getData('counting') || {};
            if (!countingConfig[guildId]) {
                countingConfig[guildId] = {
                    enabled: false,
                    channelId: null,
                    currentNumber: 1,
                    lastUserId: null,
                    startNumber: 1,
                    totalCounts: 0,
                    record: 0,
                    lastResetReason: null,
                    lastResetDate: null
                };
            }

            const config = countingConfig[guildId];
            const embed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setFooter({ text: `Serveur: ${interaction.guild.name}` });

            switch (subcommand) {
                case 'activer':
                    const channel = interaction.options.getChannel('canal');
                    
                    config.enabled = true;
                    config.channelId = channel.id;
                    config.currentNumber = config.startNumber;
                    config.lastUserId = null;
                    
                    countingConfig[guildId] = config;
                    await dataManager.setData('counting', countingConfig);
                    
                    embed.setTitle('✅ Système de Comptage Activé')
                        .setDescription(`Le système de comptage est maintenant actif dans ${channel}`)
                        .addFields([
                            { name: '📊 Numéro actuel', value: config.currentNumber.toString(), inline: true },
                            { name: '🎯 Numéro de départ', value: config.startNumber.toString(), inline: true },
                            { name: '📝 Règles', value: '• Compter dans l\'ordre\n• Pas deux fois de suite\n• Calculs mathématiques acceptés\n• Reset si erreur ou doublon', inline: false }
                        ]);
                    
                    await interaction.reply({ embeds: [embed] });
                    
                    // Message d'instructions dans le canal
                    try {
                        await channel.send({
                            embeds: [new EmbedBuilder()
                                .setColor('#00FF00')
                                .setTitle('🔢 Système de Comptage Activé!')
                                .setDescription(`Commencez à compter à partir de **${config.currentNumber}**`)
                                .addFields([
                                    { name: '✅ Autorisé', value: '• Nombres simples: `1`, `2`, `3`\n• Calculs: `2+1`, `4-1`, `2*2`, `8/2`\n• Expressions: `(3*2)-1`', inline: true },
                                    { name: '❌ Interdit', value: '• Compter deux fois de suite\n• Sauter des numéros\n• Texte avec les nombres\n• Nombres incorrects', inline: true },
                                    { name: '🔄 Reset auto si', value: '• Mauvais nombre\n• Même personne deux fois\n• Calcul incorrect\n• Format invalide', inline: false }
                                ])]
                        });
                    } catch (error) {
                        console.error('Erreur envoi message comptage:', error);
                    }
                    break;

                case 'desactiver':
                    if (!config.enabled) {
                        return await interaction.reply({
                            content: '❌ Le système de comptage n\'est pas activé sur ce serveur.',
                            flags: 64
                        });
                    }
                    
                    config.enabled = false;
                    config.channelId = null;
                    countingConfig[guildId] = config;
                    await dataManager.setData('counting', countingConfig);
                    
                    embed.setTitle('🔴 Système de Comptage Désactivé')
                        .setDescription('Le système de comptage a été désactivé sur ce serveur.')
                        .addFields([
                            { name: '📊 Dernier numéro atteint', value: (config.currentNumber - 1).toString(), inline: true },
                            { name: '🏆 Record du serveur', value: config.record.toString(), inline: true }
                        ]);
                    
                    await interaction.reply({ embeds: [embed] });
                    break;

                case 'reset':
                    if (!config.enabled) {
                        return await interaction.reply({
                            content: '❌ Le système de comptage n\'est pas activé sur ce serveur.',
                            flags: 64
                        });
                    }
                    
                    const previousNumber = config.currentNumber - 1;
                    if (previousNumber > config.record) {
                        config.record = previousNumber;
                    }
                    
                    config.currentNumber = config.startNumber;
                    config.lastUserId = null;
                    config.lastResetReason = 'Reset manuel par un administrateur';
                    config.lastResetDate = new Date().toISOString();
                    
                    countingConfig[guildId] = config;
                    await dataManager.setData('counting', countingConfig);
                    
                    embed.setTitle('🔄 Comptage Remis à Zéro')
                        .setDescription(`Le comptage a été remis à zéro par un administrateur.`)
                        .addFields([
                            { name: '🎯 Nouveau numéro', value: config.currentNumber.toString(), inline: true },
                            { name: '📊 Ancien numéro', value: previousNumber.toString(), inline: true },
                            { name: '🏆 Record', value: config.record.toString(), inline: true }
                        ]);
                    
                    await interaction.reply({ embeds: [embed] });
                    
                    // Notification dans le canal de comptage
                    if (config.channelId) {
                        try {
                            const countingChannel = await interaction.guild.channels.fetch(config.channelId);
                            await countingChannel.send({
                                embeds: [new EmbedBuilder()
                                    .setColor('#FFA500')
                                    .setTitle('🔄 Reset Manuel')
                                    .setDescription(`Le comptage a été remis à zéro par ${interaction.user.displayName}.\n\nProchain numéro: **${config.currentNumber}**`)]
                            });
                        } catch (error) {
                            console.error('Erreur notification reset:', error);
                        }
                    }
                    break;

                case 'config':
                    const startNumber = interaction.options.getInteger('nombre') || 1;
                    
                    config.startNumber = startNumber;
                    if (!config.enabled) {
                        config.currentNumber = startNumber;
                    }
                    
                    countingConfig[guildId] = config;
                    await dataManager.setData('counting', countingConfig);
                    
                    embed.setTitle('⚙️ Configuration Mise à Jour')
                        .setDescription('Les paramètres de comptage ont été modifiés.')
                        .addFields([
                            { name: '🎯 Numéro de départ', value: startNumber.toString(), inline: true },
                            { name: '📊 Numéro actuel', value: config.currentNumber.toString(), inline: true },
                            { name: '💡 Info', value: 'Le numéro de départ s\'appliquera au prochain reset ou activation.', inline: false }
                        ]);
                    
                    await interaction.reply({ embeds: [embed] });
                    break;

                case 'info':
                    if (!config.enabled) {
                        embed.setTitle('📊 Information Comptage')
                            .setDescription('❌ Le système de comptage n\'est pas activé sur ce serveur.')
                            .addFields([
                                { name: '🏆 Record du serveur', value: config.record.toString(), inline: true },
                                { name: '🎯 Numéro de départ configuré', value: config.startNumber.toString(), inline: true }
                            ]);
                    } else {
                        const channel = await interaction.guild.channels.fetch(config.channelId);
                        embed.setTitle('📊 Information Comptage')
                            .setDescription(`✅ Système actif dans ${channel}`)
                            .addFields([
                                { name: '🔢 Numéro actuel', value: config.currentNumber.toString(), inline: true },
                                { name: '🏆 Record du serveur', value: config.record.toString(), inline: true },
                                { name: '📈 Total comptages', value: config.totalCounts.toString(), inline: true },
                                { name: '🎯 Numéro de départ', value: config.startNumber.toString(), inline: true },
                                { name: '👤 Dernier compteur', value: config.lastUserId ? `<@${config.lastUserId}>` : 'Aucun', inline: true },
                                { name: '📅 Dernier reset', value: config.lastResetDate ? new Date(config.lastResetDate).toLocaleDateString('fr-FR') : 'Jamais', inline: true }
                            ]);
                        
                        if (config.lastResetReason) {
                            embed.addFields([{ name: '🔄 Raison du dernier reset', value: config.lastResetReason, inline: false }]);
                        }
                    }
                    
                    await interaction.reply({ embeds: [embed] });
                    break;
            }

        } catch (error) {
            console.error('❌ Erreur comptage:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la configuration du comptage.',
                flags: 64
            });
        }
    }
};