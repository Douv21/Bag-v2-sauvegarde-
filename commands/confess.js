
const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confess')
        .setDescription('Envoyer une confession anonyme')
        .addStringOption(option =>
            option.setName('texte')
                .setDescription('Votre confession (optionnel si image fournie)')
                .setMaxLength(4000)
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Image à joindre (optionnel)')
                .setRequired(false)),

    async execute(interaction, dataManager) {
        try {
            // Répondre immédiatement pour éviter les timeouts
            await interaction.deferReply({ flags: 64 });
            
            const text = interaction.options.getString('texte');
            const image = interaction.options.getAttachment('image');

            // Vérifier qu'au moins un contenu est fourni
            if (!text && !image) {
                return await interaction.editReply({
                    content: '❌ Vous devez fournir au moins un texte ou une image.'
                });
            }

            // Récupérer la configuration
            const config = await dataManager.getData('config');
            const confessionConfig = config.confessions?.[interaction.guild.id] || {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}'
            };

            // Générer le numéro de confession unique
            if (!confessionConfig.confessionCounter) {
                confessionConfig.confessionCounter = 0;
            }
            confessionConfig.confessionCounter++;
            const confessionNumber = confessionConfig.confessionCounter;

            // Sauvegarder le compteur mis à jour
            if (!config.confessions) config.confessions = {};
            config.confessions[interaction.guild.id] = confessionConfig;
            await dataManager.saveData('config', config);
            
            if (!confessionConfig.channels || confessionConfig.channels.length === 0) {
                return await interaction.editReply({
                    content: '❌ Aucun canal de confession configuré sur ce serveur.\n\nUtilisez `/config-confession` pour configurer les canaux.'
                });
            }

            // Prendre le premier canal configuré
            const channelId = confessionConfig.channels[0];
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                return await interaction.editReply({
                    content: '❌ Canal de confession introuvable.'
                });
            }

            // Créer l'embed de confession avec numéro
            const confessionEmbed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle(`💭 Confession Anonyme #${confessionNumber}`)
                .setTimestamp();

            if (text) {
                confessionEmbed.setDescription(text);
            }

            if (image) {
                confessionEmbed.setImage(image.url);
            }

            // Préparer les pings pour confessions
            let confessionPings = '';
            if (confessionConfig.confessionPingRoles && confessionConfig.confessionPingRoles.length > 0) {
                confessionPings = confessionConfig.confessionPingRoles.map(roleId => `<@&${roleId}>`).join(' ') + '\n';
            }

            // Envoyer la confession avec pings
            const confessionMessage = await channel.send({ 
                content: confessionPings,
                embeds: [confessionEmbed] 
            });

            // Créer un thread si configuré
            if (confessionConfig.autoThread) {
                // Utiliser la configuration existante pour stocker le compteur
                const config = await dataManager.getData('config');
                if (!config.confessions[interaction.guild.id].threadCounter) {
                    config.confessions[interaction.guild.id].threadCounter = 1;
                } else {
                    config.confessions[interaction.guild.id].threadCounter++;
                }
                await dataManager.saveData('config', config);

                let threadName = confessionConfig.threadName || 'Confession #{number}';
                threadName = threadName.replace('#{number}', confessionNumber);
                threadName = threadName.replace('{number}', confessionNumber);
                threadName = threadName.replace('{date}', new Date().toLocaleDateString('fr-FR'));
                
                await confessionMessage.startThread({
                    name: threadName.substring(0, 100), // Limite Discord
                    autoArchiveDuration: confessionConfig.archiveTime || 1440,
                    reason: 'Auto-thread confession'
                });
            }

            // Envoyer les logs admin si configuré
            await this.sendAdminLog(interaction, text, image, confessionNumber, dataManager);

            // Logger la confession
            await this.logConfession(interaction, text, image?.url, dataManager);

            // Confirmer à l'utilisateur (une seule fois)
            return await interaction.editReply({
                content: '✅ Votre confession a été envoyée anonymement.'
            });

        } catch (error) {
            console.error('❌ Erreur confession:', error);
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue.'
                });
            } else {
                await interaction.reply({
                    content: '❌ Une erreur est survenue.',
                    flags: 64
                });
            }
        }
    },

    async sendAdminLog(interaction, text, image, confessionNumber, dataManager) {
        try {
            const config = await dataManager.getData('config');
            const confessionConfig = config.confessions?.[interaction.guild.id];
            
            if (!confessionConfig?.logChannel) return;

            const logChannel = interaction.guild.channels.cache.get(confessionConfig.logChannel);
            if (!logChannel) return;

            const logLevel = confessionConfig.logLevel || 'basic';
            const includeImages = confessionConfig.logImages !== false;
            
            // Créer l'embed de log selon le niveau avec numéro
            const logEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle(`📋 Nouvelle Confession #${confessionNumber}`)
                .setTimestamp();

            // Niveau basique : numéro, contenu et utilisateur
            if (logLevel === 'basic') {
                logEmbed.addFields([
                    { name: '#️⃣ Numéro', value: `${confessionNumber}`, inline: true },
                    { name: '👤 Utilisateur', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: '💬 Contenu', value: text || '*Image uniquement*', inline: false }
                ]);
            }
            
            // Niveau détaillé : + canal et horodatage
            else if (logLevel === 'detailed') {
                logEmbed.addFields([
                    { name: '#️⃣ Numéro', value: `${confessionNumber}`, inline: true },
                    { name: '👤 Utilisateur', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: '📍 Canal', value: `<#${interaction.channelId}>`, inline: true },
                    { name: '⏰ Envoyé le', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
                    { name: '💬 Contenu', value: text || '*Image uniquement*', inline: false }
                ]);
            }
            
            // Niveau complet : + métadonnées et traces
            else if (logLevel === 'full') {
                logEmbed.addFields([
                    { name: '#️⃣ Numéro', value: `${confessionNumber}`, inline: true },
                    { name: '👤 Utilisateur', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: '📍 Canal', value: `<#${interaction.channelId}>`, inline: true },
                    { name: '⏰ Envoyé le', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
                    { name: '💬 Contenu', value: text || '*Image uniquement*', inline: false },
                    { name: '🔍 Métadonnées', value: `**Serveur:** ${interaction.guild.name} (${interaction.guild.id})\n**Permissions:** ${interaction.member.permissions.bitfield}\n**Rôles:** ${interaction.member.roles.cache.size}`, inline: false }
                ]);
            }

            if (image && includeImages) {
                logEmbed.setImage(image.url);
                logEmbed.addFields([
                    { name: '🖼️ Image', value: `**Nom:** ${image.name}\n**Taille:** ${(image.size / 1024).toFixed(1)} KB`, inline: true }
                ]);
            }

            // Préparer les pings pour logs admin
            let logPings = '';
            if (confessionConfig.logPingRoles && confessionConfig.logPingRoles.length > 0) {
                logPings = confessionConfig.logPingRoles.map(roleId => `<@&${roleId}>`).join(' ') + '\n';
            }

            await logChannel.send({
                content: logPings,
                embeds: [logEmbed]
            });

        } catch (error) {
            console.error('❌ Erreur envoi log admin:', error);
        }
    },

    async logConfession(interaction, text, imageUrl, dataManager) {
        try {
            const confessions = await dataManager.getData('confessions');
            
            const logEntry = {
                id: Date.now(),
                userId: interaction.user.id,
                username: interaction.user.tag,
                guildId: interaction.guild.id,
                guildName: interaction.guild.name,
                content: text || 'Image uniquement',
                imageUrl: imageUrl || null,
                timestamp: Date.now()
            };

            confessions.push(logEntry);

            // Garder seulement les 1000 dernières confessions
            if (confessions.length > 1000) {
                confessions.splice(0, confessions.length - 1000);
            }

            await dataManager.saveData('confessions', confessions);

        } catch (error) {
            console.error('❌ Erreur log confession:', error);
        }
    }
};