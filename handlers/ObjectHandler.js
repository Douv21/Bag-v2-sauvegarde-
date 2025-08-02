const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder } = require('discord.js');

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
            const objectId = interaction.values[0];
            const obj = userData.inventory.find(item => item.id.toString() === objectId);

            if (!obj) {
                return await interaction.update({ content: '❌ Objet introuvable ou expiré.', components: [] });
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
                return await interaction.update({ content: '❌ Objet introuvable ou expiré.', components: [] });
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
                    const modal = new ModalBuilder()
                        .setCustomId(`custom_message_modal_${objectId}`)
                        .setTitle('Interaction personnalisée')
                        .addComponents(new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('custom_message').setLabel('Votre message').setStyle(TextInputStyle.Paragraph).setRequired(true)
                        ));
                    return await interaction.showModal(modal);
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
            economyData[userKey].inventory = userData.inventory.filter(item => item.id.toString() !== objectId);

            // Add to target's inventory
            const targetKey = `${targetId}_${guildId}`;
            if (!economyData[targetKey]) {
                economyData[targetKey] = { balance: 0, goodKarma: 0, badKarma: 0, inventory: [] };
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
            economyData[userKey].inventory = userData.inventory.filter(item => item.id.toString() !== objectId);
            await dataManager.saveData('economy.json', economyData);

            return await interaction.update({ content: `🗑️ **${obj.name}** a été supprimé.`, components: [], embeds: [] });
        }

        // --- Step 3c: Handling the custom message modal ---
        if (interaction.isModalSubmit() && customId.startsWith('custom_message_modal_')) {
            const objectId = customId.replace('custom_message_modal_', '');
            const message = interaction.fields.getTextInputValue('custom_message');

            const members = (await interaction.guild.members.fetch()).filter(m => !m.user.bot);
            if (members.size === 0) return await interaction.reply({ content: '❌ Aucun membre à cibler.', ephemeral: true });

            // Temporary storage for the message content
            interaction.client.tempStore = interaction.client.tempStore || {};
            interaction.client.tempStore[`${userId}_${objectId}`] = message;

            const userSelect = new StringSelectMenuBuilder()
                .setCustomId(`custom_user_select_${objectId}`)
                .setPlaceholder('Choisissez un utilisateur à cibler')
                .addOptions(members.map(m => ({ 
                    label: m.user.username, 
                    value: m.id,
                    description: m.user.tag
                })).slice(0, 25));

            return await interaction.reply({
                content: 'À qui voulez-vous envoyer cette interaction ?',
                components: [new ActionRowBuilder().addComponents(userSelect)],
                ephemeral: true
            });
        }

        // --- Step 4: Finalizing the custom message action ---
        if (customId.startsWith('custom_user_select_')) {
            const objectId = customId.replace('custom_user_select_', '');
            const targetId = interaction.values[0];
            const selectedObject = userData.inventory.find(item => item.id.toString() === objectId);

            if (!selectedObject) return await interaction.update({ content: '❌ Objet introuvable ou expiré.', components:[], embeds: []});

            const message = interaction.client.tempStore[`${userId}_${objectId}`];
            if (!message) return await interaction.update({ content: '❌ Erreur: message personnalisé non trouvé.', components:[], embeds: []});

            const targetMember = await interaction.guild.members.fetch(targetId);
            const objetCommand = require('../commands/objet'); // require command file to call executeCustomInteraction

            // We need to deferUpdate here as executeCustomInteraction does its own reply
            await interaction.deferUpdate();
            await objetCommand.executeCustomInteraction(interaction, dataManager, selectedObject, message, targetMember);

            delete interaction.client.tempStore[`${userId}_${objectId}`];
        }

    } catch (err) {
        console.error('Erreur dans handleObjectInteraction:', err);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Une erreur critique est survenue.', ephemeral: true });
        }
    }
}

function getItemTypeLabel(type) {
    switch (type) {
        case 'custom': return 'Objet personnalisé';
        case 'temp_role': return 'Rôle temporaire';
        case 'perm_role': return 'Rôle permanent';
        default: return 'Inconnu';
    }
}

module.exports = {
    handleObjectInteraction
};