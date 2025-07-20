
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
            const text = interaction.options.getString('texte');
            const image = interaction.options.getAttachment('image');

            // Vérifier qu'au moins un contenu est fourni
            if (!text && !image) {
                return await interaction.reply({
                    content: '❌ Vous devez fournir au moins un texte ou une image.',
                    flags: 64
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
                return await interaction.reply({
                    content: '❌ Aucun canal de confession configuré sur ce serveur.\n\nUtilisez `/config-confession` pour configurer les canaux.',
                    flags: 64
                });
            }

            // Prendre le premier canal configuré
            const channelId = confessionConfig.channels[0];
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                return await interaction.reply({
                    content: '❌ Canal de confession introuvable.',
                    flags: 64
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
                // Obtenir le compteur de threads pour ce serveur
                const threadCounters = await dataManager.getData('threadCounters') || {};
                if (!threadCounters[interaction.guild.id]) {
                    threadCounters[interaction.guild.id] = 1;
                } else {
                    threadCounters[interaction.guild.id]++;
                }
                await dataManager.saveData('threadCounters', threadCounters);

                let threadName = confessionConfig.threadName || 'Confession #{number}';
                threadName = threadName.replace('#{number}', threadCounters[interaction.guild.id]);
                threadName = threadName.replace('{date}', new Date().toLocaleDateString('fr-FR'));
                
                await confessionMessage.startThread({
                    name: threadName.substring(0, 100), // Limite Discord
                    autoArchiveDuration: confessionConfig.archiveTime || 1440,
                    reason: 'Auto-thread confession'
                });
            }

            // Logger la confession
            await this.logConfession(interaction, text, image?.url, dataManager);

            // Confirmer à l'utilisateur (une seule fois)
            if (!interaction.replied) {
                await interaction.reply({
                    content: '✅ Votre confession a été envoyée anonymement.',
                    flags: 64
                });
            }

        } catch (error) {
            console.error('❌ Erreur confession:', error);
            if (!interaction.replied) {
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