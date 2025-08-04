const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('objet')
        .setDescription('Gérer vos objets de boutique - Offrir, supprimer ou interaction personnalisée'),
    
    async execute(interaction, dataManager) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        
        // Charger les données utilisateur
        const economyData = await dataManager.loadData('economy.json', {});
        const userKey = `${userId}_${guildId}`;
        const userData = economyData[userKey] || { balance: 0, goodKarma: 0, badKarma: 0, inventory: [] };
        
        // Filtrer les objets pour ne montrer que les objets personnalisés ET valides
        const customObjects = userData.inventory ? userData.inventory.filter(item => {
            // Validation robuste: l'objet doit avoir un ID et un nom
            const isValid = item && item.id && item.name;
            const isCustom = item.type === 'custom_object' || item.type === 'custom' || !item.type;
            
            if (!isValid) {
                console.log(`🧹 Objet invalide détecté et ignoré: ${JSON.stringify(item)}`);
            }
            
            return isValid && isCustom;
        }) : [];
        
        // Vérifier si l'utilisateur a des objets personnalisés
        if (customObjects.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🎒 Aucun Objet Personnalisé')
                .setDescription('Vous n\'avez aucun objet personnalisé dans votre inventaire.\n\nAchetez des objets personnalisés dans la `/boutique` pour les utiliser ici !\n\n💡 Cette commande ne gère que les objets personnalisés, pas les rôles.');
                
            return await interaction.reply({ embeds: [embed], flags: 64 });
        }
        
        // Créer le menu de sélection d'objets
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🎒 Gestion des Objets')
            .setDescription('Sélectionnez un objet pour choisir une action')
            .addFields([
                {
                    name: '📦 Vos Objets Personnalisés',
                    value: customObjects.map((item, index) => {
                        const emoji = getItemEmoji(item.type);
                        return `${emoji} **${item.name}** ${item.description ? `- ${item.description}` : ''}`;
                    }).join('\n') || 'Aucun objet',
                    inline: false
                },
                {
                    name: '⚡ Actions Disponibles',
                    value: '🎁 **Offrir** - Donner l\'objet à un membre\n🗑️ **Supprimer** - Retirer l\'objet de votre inventaire\n💬 **Interaction** - Utiliser l\'objet avec message personnalisé\n📦 **Objets Reçus** - Voir les objets que vous avez reçus',
                    inline: false
                }
            ]);
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('object_selection')
            .setPlaceholder('Choisissez un objet...')
            .addOptions(
                customObjects.map((item, index) => ({
                    label: item.name,
                    value: `${item.id || index}_${index}`, // Ensure unique value by combining ID and index
                    description: item.description || 'Objet personnalisé',
                    emoji: getItemEmoji(item.type)
                }))
            );
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    },
    
    async executeCustomInteraction(interaction, dataManager, selectedObject, customText, targetMember) {
        try {
            // Créer le message texte simple : nom du membre + texte personnalisé + objet + ping du membre
            const messageContent = `**${interaction.user.displayName}** ${customText} **${selectedObject.name}** <@${targetMember.id}>`;
            
            // Envoyer dans le canal actuel - Message non éphémère pour que le ping soit visible
            await interaction.followUp({
                content: messageContent
                // Suppression du flag ephemeral pour que le ping soit visible à tous
            });
            
            console.log(`💬 ${interaction.user.tag} a utilisé "${selectedObject.name}" sur ${targetMember.tag}: ${customText}`);
            
        } catch (error) {
            console.error('❌ Erreur interaction personnalisée:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erreur lors de l\'envoi de l\'interaction personnalisée.',
                    flags: 64
                });
            } else {
                await interaction.followUp({
                    content: '❌ Erreur lors de l\'envoi de l\'interaction personnalisée.',
                    flags: 64
                });
            }
        }
    }
};

function getItemEmoji(type) {
    switch(type) {
        case 'custom_object':
        case 'custom': return '🎨';
        case 'temporary_role':
        case 'temp_role': return '⌛';
        case 'permanent_role': return '⭐';
        default: return '📦';
    }
}