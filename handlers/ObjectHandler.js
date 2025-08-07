const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, MessageFlags } = require('discord.js');

async function handleObjectInteraction(interaction, dataManager) {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
        const economyData = await dataManager.loadData('economy.json', {});
        const userKey = `${userId}_${guildId}`;
        const userData = economyData[userKey] || { inventory: [] };

        // --- Step 1: User selects an object ---
        if (customId === 'object_selection') {
            const objectValue = interaction.values[0];
            // Extract the original ID from the combined value (objectId_index)
            const originalObjectId = objectValue.split('_')[0];
            const obj = userData.inventory.find(item => (item.id || '').toString() === originalObjectId);

            if (!obj) {
                console.log(`⚠️ Objet introuvable: ${originalObjectId} - Nettoyage automatique de l'inventaire`);
                // Nettoyer l'inventaire automatiquement
                await cleanupUserInventory(userId, guildId, dataManager);
                return await interaction.update({ 
                    content: '❌ Cet objet n\'existe plus. Votre inventaire a été mis à jour.\n\nUtilisez `/objet` à nouveau pour voir vos objets actuels.', 
                    components: [] 
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle(`🎯 ${obj.name}`)
                .setDescription(obj.description || 'Objet de boutique')
                .addFields([
                    { name: '📦 Type', value: getItemTypeLabel(obj.type), inline: true },
                    { name: '💰 Prix d\'achat', value: `${obj.price || 'N/A'}€`, inline: true }
                ]);

            const select = new StringSelectMenuBuilder()
                .setCustomId(`object_action_menu_${obj.id}`) // Embed object ID in customId
                .setPlaceholder('Choisissez une action')
                .addOptions([
                    { label: 'Offrir', value: 'offer', emoji: '🎁' },
                    { label: 'Supprimer', value: 'delete', emoji: '🗑️' },
                    { label: 'Utiliser avec message', value: 'use', emoji: '💬' }
                ]);

            return await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
        }

        // --- Step 2: User chooses an action (Offer, Delete, Use) ---
        if (customId.startsWith('object_action_menu_')) {
            const objectId = customId.replace('object_action_menu_', '');
            const action = interaction.values[0];
            const obj = userData.inventory.find(item => item.id.toString() === objectId);

            if (!obj) {
                console.log(`⚠️ Objet action introuvable: ${objectId} - Nettoyage automatique`);
                await cleanupUserInventory(userId, guildId, dataManager);
                return await interaction.update({ 
                    content: '❌ Cet objet n\'existe plus. Votre inventaire a été mis à jour.\n\nUtilisez `/objet` à nouveau pour voir vos objets actuels.', 
                    components: [] 
                });
            }

            switch (action) {
                case 'offer': {
                    const select = new UserSelectMenuBuilder()
                        .setCustomId(`offer_user_select_${objectId}`)
                        .setPlaceholder('À qui offrir cet objet ?');

                    return await interaction.update({ content: `🎁 À qui veux-tu offrir **${obj.name}** ?`, components: [new ActionRowBuilder().addComponents(select)], embeds: [] });
                }
                case 'delete': {
                    const confirm = new StringSelectMenuBuilder()
                        .setCustomId(`confirm_delete_${objectId}`)
                        .setPlaceholder('Confirmer la suppression')
                        .addOptions([
                            { label: '✅ Oui, supprimer', value: 'confirm' },
                            { label: '❌ Non, annuler', value: 'cancel' }
                        ]);
                    return await interaction.update({ content: `🗑️ Êtes-vous sûr de vouloir supprimer **${obj.name}** ?`, components: [new ActionRowBuilder().addComponents(confirm)], embeds: [] });
                }
                case 'use': {
                    // Demander d'abord le choix du membre
                    const userSelect = new UserSelectMenuBuilder()
                        .setCustomId(`use_user_select_${objectId}`)
                        .setPlaceholder('Choisissez le membre à cibler');

                    return await interaction.update({ 
                        content: `🎯 Avec qui voulez-vous utiliser **${obj.name}** ?`, 
                        components: [new ActionRowBuilder().addComponents(userSelect)], 
                        embeds: [] 
                    });
                }
            }
        }

        // --- Step 3a: Handling the offer action ---
        if (customId.startsWith('offer_user_select_')) {
            const objectId = customId.replace('offer_user_select_', '');
            const targetId = interaction.values[0];
            const obj = userData.inventory.find(item => item.id.toString() === objectId);

            if (!obj) return await interaction.update({ content: '❌ Objet introuvable ou expiré.', components: [], embeds: [] });

            // Remove from user's inventory by ID
            if (!economyData[userKey]) {
                economyData[userKey] = { balance: 0, goodKarma: 0, badKarma: 0, inventory: [] };
            }
            if (!economyData[userKey].inventory) {
                economyData[userKey].inventory = [];
            }
            economyData[userKey].inventory = userData.inventory.filter(item => item.id.toString() !== objectId);

            // Add to target's inventory
            const targetKey = `${targetId}_${guildId}`;
            if (!economyData[targetKey]) {
                economyData[targetKey] = { balance: 0, goodKarma: 0, badKarma: 0, inventory: [] };
            }
            // Ensure inventory exists even if the user data was created before this property
            if (!economyData[targetKey].inventory) {
                economyData[targetKey].inventory = [];
            }
            economyData[targetKey].inventory.push(obj);

            await dataManager.saveData('economy.json', economyData);
            return await interaction.update({ content: `🎁 Vous avez offert **${obj.name}** à <@${targetId}>.`, components: [], embeds: [] });
        }

        // --- Step 3b: Handling the delete confirmation ---
        if (customId.startsWith('confirm_delete_')) {
            if (interaction.values[0] === 'cancel') {
                return await interaction.update({ content: '❌ Suppression annulée.', components: [], embeds: [] });
            }

            const objectId = customId.replace('confirm_delete_', '');
            const obj = userData.inventory.find(item => item.id.toString() === objectId);
            if (!obj) return await interaction.update({ content: '❌ Objet introuvable ou expiré.', components: [], embeds: [] });

            // Remove from user's inventory by ID
            if (!economyData[userKey]) {
                economyData[userKey] = { balance: 0, goodKarma: 0, badKarma: 0, inventory: [] };
            }
            if (!economyData[userKey].inventory) {
                economyData[userKey].inventory = [];
            }
            economyData[userKey].inventory = userData.inventory.filter(item => item.id.toString() !== objectId);
            await dataManager.saveData('economy.json', economyData);

            return await interaction.update({ content: `🗑️ **${obj.name}** a été supprimé.`, components: [], embeds: [] });
        }

        // --- Step 3c: Handling user selection for custom interaction ---
        if (customId.startsWith('use_user_select_')) {
            const objectId = customId.replace('use_user_select_', '');
            const targetId = interaction.values[0];
            const obj = userData.inventory.find(item => item.id.toString() === objectId);

            if (!obj) {
                return await interaction.update({ content: '❌ Objet introuvable ou expiré.', components: [], embeds: [] });
            }

            // Stocker temporairement le membre cible
            interaction.client.tempStore = interaction.client.tempStore || {};
            interaction.client.tempStore[`${userId}_${objectId}_target`] = targetId;

            // Maintenant afficher le modal pour le message
            const modal = new ModalBuilder()
                .setCustomId(`custom_message_modal_${objectId}`)
                .setTitle('Interaction personnalisée')
                .addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('custom_message')
                        .setLabel('Votre message personnalisé')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setPlaceholder(`Décrivez comment vous utilisez ${obj.name}...`)
                ));

            return await interaction.showModal(modal);
        }

        // --- Step 4: Handling the custom message modal ---
        if (interaction.isModalSubmit() && customId.startsWith('custom_message_modal_')) {
            const objectId = customId.replace('custom_message_modal_', '');
            const message = interaction.fields.getTextInputValue('custom_message');
            const selectedObject = userData.inventory.find(item => item.id.toString() === objectId);

            if (!selectedObject) {
                return await interaction.reply({ 
                    content: '❌ Objet introuvable ou expiré.', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            // Récupérer le membre cible depuis le stockage temporaire
            const targetId = interaction.client.tempStore[`${userId}_${objectId}_target`];
            if (!targetId) {
                return await interaction.reply({ 
                    content: '❌ Erreur: membre cible non trouvé.', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            try {
                const targetMember = await interaction.guild.members.fetch(targetId);

                // Créer le message texte simple : nom du membre + texte personnalisé + objet + ping du membre
                const messageContent = `**${interaction.user.displayName}** ${message} **${selectedObject.name}** <@${targetId}>`;
                
                // Répondre directement avec le message personnalisé (non éphémère pour que le ping soit visible)
                await interaction.reply({
                    content: messageContent
                });

                // Nettoyer le stockage temporaire
                delete interaction.client.tempStore[`${userId}_${objectId}_target`];

                console.log(`💬 ${interaction.user.tag} a utilisé "${selectedObject.name}" sur ${targetMember.tag}: ${message}`);

            } catch (error) {
                console.error('❌ Erreur lors de l\'interaction personnalisée:', error);
                await interaction.reply({ 
                    content: '❌ Erreur lors de l\'envoi de l\'interaction personnalisée.',
                    flags: MessageFlags.Ephemeral 
                });
            }
        }



    } catch (err) {
        console.error('Erreur dans handleObjectInteraction:', err);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Une erreur critique est survenue.', flags: MessageFlags.Ephemeral });
        }
    }
}

function getItemTypeLabel(type) {
    switch (type) {
        case 'custom_object': return 'Objet personnalisé';
        case 'temporary_role': return 'Rôle temporaire';
        case 'permanent_role': return 'Rôle permanent';
        default: return 'Inconnu';
    }
}

// Méthode pour nettoyer automatiquement l'inventaire des objets corrompus
async function cleanupUserInventory(userId, guildId, dataManager) {
        try {
            const economyData = await dataManager.loadData('economy.json', {});
            const userKey = `${userId}_${guildId}`;
            
            if (economyData[userKey] && economyData[userKey].inventory) {
                const originalLength = economyData[userKey].inventory.length;
                
                // Filtrer les objets valides (avec ID et nom)
                economyData[userKey].inventory = economyData[userKey].inventory.filter(item => {
                    if (!item.id || !item.name) {
                        console.log(`🧹 Suppression objet corrompu: ${JSON.stringify(item)}`);
                        return false;
                    }
                    return true;
                });
                
                const cleanedCount = originalLength - economyData[userKey].inventory.length;
                
                if (cleanedCount > 0) {
                    await dataManager.saveData('economy.json', economyData);
                    console.log(`✅ ${cleanedCount} objet(s) corrompu(s) supprimé(s) de l'inventaire de ${userKey}`);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage automatique de l\'inventaire:', error);
        }
    }

module.exports = {
    handleObjectInteraction
};