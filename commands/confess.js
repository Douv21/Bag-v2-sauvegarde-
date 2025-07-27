
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
            // Récupérer la configuration AVANT de répondre pour vérifier le canal
            const config = await dataManager.getData('config');
            const confessionConfig = config.confessions?.[interaction.guild.id] || {
                channels: [],
                logChannel: null,
                autoThread: false,
                threadName: 'Confession #{number}'
            };

            // Vérifier si la commande est utilisée dans un canal de confession configuré
            if (!confessionConfig.channels || confessionConfig.channels.length === 0) {
                return await interaction.reply({
                    content: '❌ Aucun canal de confession configuré sur ce serveur.\n\n**Administrateurs:** Utilisez `/config-confession` pour configurer les canaux.',
                    flags: 64
                });
            }

            // Vérifier si le canal actuel est dans la liste des canaux de confession configurés
            if (!confessionConfig.channels.includes(interaction.channel.id)) {
                const configuredChannels = confessionConfig.channels
                    .map(channelId => {
                        const channel = interaction.guild.channels.cache.get(channelId);
                        return channel ? `<#${channelId}>` : `Canal supprimé (${channelId})`;
                    })
                    .join(', ');
                
                return await interaction.reply({
                    content: `❌ Cette commande ne peut être utilisée que dans les canaux de confession configurés.\n\n**Canaux autorisés:** ${configuredChannels}`,
                    flags: 64
                });
            }

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

            // Utiliser le canal actuel où la commande a été exécutée (déjà vérifié qu'il est autorisé)
            const channel = interaction.channel;

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

            // Envoyer les logs admin IMMÉDIATEMENT après la confession
            await this.sendAdminLog(interaction, text, image, confessionNumber, dataManager);

            // Créer un thread si configuré
            if (confessionConfig.autoThread) {
                try {
                    let threadName = confessionConfig.threadName || 'Confession #{number}';
                    threadName = threadName.replace('#{number}', confessionNumber);
                    threadName = threadName.replace('{number}', confessionNumber);
                    threadName = threadName.replace('{date}', new Date().toLocaleDateString('fr-FR'));
                    
                    await confessionMessage.startThread({
                        name: threadName.substring(0, 100), // Limite Discord
                        autoArchiveDuration: confessionConfig.archiveTime || 1440,
                        reason: 'Auto-thread confession'
                    });
                } catch (threadError) {
                    console.error('❌ Erreur création thread:', threadError);
                    // Ne pas bloquer l'execution si le thread échoue
                }
            }

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
                logPings = confessionConfig.logPingRoles.map(roleId => `<@&${roleId}>`).join(' ');
            }

            // Envoyer avec gestion d'erreur pour les images
            try {
                await logChannel.send({
                    content: logPings || undefined,
                    embeds: [logEmbed]
                });
                console.log(`✅ Log admin envoyé pour confession #${confessionNumber}`);
            } catch (logError) {
                console.error('❌ Erreur envoi log admin:', logError);
                // Fallback sans image si erreur
                if (image) {
                    try {
                        logEmbed.setImage(null);
                        await logChannel.send({
                            content: logPings || undefined,
                            embeds: [logEmbed]
                        });
                        console.log(`✅ Log admin envoyé (sans image) pour confession #${confessionNumber}`);
                    } catch (fallbackError) {
                        console.error('❌ Erreur log admin fallback:', fallbackError);
                    }
                }
            }

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