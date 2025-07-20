
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
            await interaction.deferReply({ ephemeral: true });
            
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

            // Créer l'embed de confession
            const confessionEmbed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('💭 Confession Anonyme')
                .setTimestamp();

            if (text) {
                confessionEmbed.setDescription(text);
            }

            if (image) {
                confessionEmbed.setImage(image.url);
            }

            // Envoyer la confession
            const confessionMessage = await channel.send({ embeds: [confessionEmbed] });

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
                threadName = threadName.replace('#{number}', config.confessions[interaction.guild.id].threadCounter);
                threadName = threadName.replace('{date}', new Date().toLocaleDateString('fr-FR'));
                
                await confessionMessage.startThread({
                    name: threadName.substring(0, 100), // Limite Discord
                    autoArchiveDuration: confessionConfig.archiveTime || 1440,
                    reason: 'Auto-thread confession'
                });
            }

            // Logger la confession
            await this.logConfession(interaction, text, image?.url, dataManager);

            // Confirmer à l'utilisateur
            await interaction.editReply({
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