const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

async function handleObjectInteraction(interaction, dataManager) {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
        const economyData = await dataManager.loadData('economy.json', {});
        const userKey = `${userId}_${guildId}`;
        const userData = economyData[userKey] || { inventory: [] };
        const customObjects = userData.inventory.filter(item => item.type === 'custom');

        if (customId === 'object_selection') {
            if (customObjects.length === 0) {
                return await interaction.update({ content: '❌ Aucun objet dans votre inventaire.', components: [] });
            }
            const index = parseInt(interaction.values[0].replace('object_', ''));
            const obj = customObjects[index];
            if (!obj) return;

            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle(`🎯 ${obj.name}`)
                .setDescription(obj.description || 'Objet de boutique')
                .addFields([
                    { name: '📦 Type', value: getItemTypeLabel(obj.type), inline: true },
                    { name: '💰 Prix', value: `${obj.price || 'N/A'}€`, inline: true },
                    { name: '⚡ Action', value: '🎁 Offrir\n🗑️ Supprimer\n💬 Interaction', inline: false }
                ]);

            const select = new StringSelectMenuBuilder()
                .setCustomId('object_action_menu')
                .setPlaceholder('Choisissez une action')
                .addOptions([
                    { label: 'Offrir', value: `object_offer_${index}`, emoji: '🎁' },
                    { label: 'Supprimer', value: `object_delete_${index}`, emoji: '🗑️' },
                    { label: 'Utiliser avec message', value: `object_custom_${index}`, emoji: '💬' }
                ]);

            return await interaction.update({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(select)]
            });
        }

        if (customId === 'object_action_menu') {
            const value = interaction.values[0];
            const index = parseInt(value.split('_').pop());
            const obj = customObjects[index];
            if (!obj) return;

            if (value.startsWith('object_offer_')) {
                const members = (await interaction.guild.members.fetch()).filter(m => !m.user.bot && m.id !== userId);
                const options = members.map(m => ({
                    label: m.user.username,
                    value: `offer_user_select_${index}_${m.id}`
                })).slice(0, 25);

                if (options.length === 0) {
                    return await interaction.update({ content: '❌ Aucun membre disponible.', components: [] });
                }

                const select = new StringSelectMenuBuilder()
                    .setCustomId('offer_user_select')
                    .setPlaceholder('À qui offrir cet objet ?')
                    .addOptions(options);

                return await interaction.update({
                    content: `🎁 À qui veux-tu offrir **${obj.name}** ?`,
                    components: [new ActionRowBuilder().addComponents(select)],
                    embeds: []
                });
            }

            if (value.startsWith('object_delete_')) {
                const confirm = new StringSelectMenuBuilder()
                    .setCustomId('confirm_delete')
                    .setPlaceholder('Confirmer la suppression')
                    .addOptions([
                        { label: '✅ Supprimer', value: `confirm_delete_${index}` },
                        { label: '❌ Annuler', value: 'cancel_delete' }
                    ]);

                return await interaction.update({
                    content: `🗑️ Supprimer **${obj.name}** ?`,
                    components: [new ActionRowBuilder().addComponents(confirm)],
                    embeds: []
                });
            }

            if (value.startsWith('object_custom_')) {
                const modal = new ModalBuilder()
                    .setCustomId(`custom_message_modal_${index}`)
                    .setTitle('Interaction personnalisée')
                    .addComponents(new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('custom_message')
                            .setLabel('Votre message')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ));
                return await interaction.showModal(modal);
            }
        }

        if (customId === 'offer_user_select') {
            const value = interaction.values[0];
            const parts = value.split('_');
            const index = parseInt(parts[2]);
            const targetId = parts[3];
            const obj = customObjects[index];
            if (!obj) return;

            // Retirer l'objet de l'inventaire de l'utilisateur
            const userInventory = userData.inventory;
            let itemRemoved = false;
            const newInventory = userInventory.reduce((acc, item) => {
                if (item.type === 'custom' && !itemRemoved) {
                    const itemIndexInCustom = customObjects.indexOf(obj);
                    if (customObjects.indexOf(item) === itemIndexInCustom) {
                        itemRemoved = true;
                        return acc;
                    }
                }
                acc.push(item);
                return acc;
            }, []);

            economyData[userKey].inventory = newInventory;

            // Ajouter l'objet à l'inventaire de la cible
            const targetKey = `${targetId}_${guildId}`;
            if (!economyData[targetKey]) {
                economyData[targetKey] = { balance: 0, goodKarma: 0, badKarma: 0, inventory: [] };
            }
            economyData[targetKey].inventory.push(obj);

            await dataManager.saveData('economy.json', economyData);

            return await interaction.update({
                content: `🎁 Vous avez offert **${obj.name}** à <@${targetId}>.`,
                components: [],
                embeds: []
            });
        }

        if (customId === 'confirm_delete') {
            const value = interaction.values[0];
            if (value === 'cancel_delete') {
                return await interaction.update({
                    content: '❌ Suppression annulée.',
                    components: [],
                    embeds: []
                });
            }

            const index = parseInt(value.replace('confirm_delete_', ''));
            const obj = customObjects[index];
            if (!obj) return;

            const userInventory = userData.inventory;
            let itemRemoved = false;
            const newInventory = userInventory.reduce((acc, item) => {
                if (item.type === 'custom' && !itemRemoved) {
                    const itemIndexInCustom = customObjects.indexOf(obj);
                     if (customObjects.indexOf(item) === itemIndexInCustom) {
                        itemRemoved = true;
                        return acc;
                    }
                }
                acc.push(item);
                return acc;
            }, []);

            economyData[userKey].inventory = newInventory;
            await dataManager.saveData('economy.json', economyData);

            return await interaction.update({
                content: `🗑️ **${obj.name}** a été supprimé.`,
                components: [],
                embeds: []
            });
        }

        if (interaction.isModalSubmit() && customId.startsWith('custom_message_modal_')) {
            const index = parseInt(customId.replace('custom_message_modal_', ''));
            const obj = customObjects[index];
            const message = interaction.fields.getTextInputValue('custom_message');

            // Ici, il faudrait choisir un membre cible. Ajoutons un sélecteur d'utilisateur.
            const members = (await interaction.guild.members.fetch()).filter(m => !m.user.bot);
             if (members.size === 0) {
                return await interaction.reply({ content: '❌ Aucun membre à cibler.', ephemeral: true });
            }

            const userSelect = new StringSelectMenuBuilder()
                .setCustomId(`custom_user_select_${index}`)
                .setPlaceholder('Choisissez un utilisateur à cibler')
                .addOptions(members.map(m => ({
                    label: m.user.username,
                    value: m.id
                })));

            // Sauvegarder le message temporairement
            // NOTE: Une meilleure approche serait une base de données temporaire ou un cache
            interaction.client.tempStore = interaction.client.tempStore || {};
            interaction.client.tempStore[`${userId}_${index}`] = message;

            return await interaction.reply({
                content: 'À qui voulez-vous envoyer cette interaction ?',
                components: [new ActionRowBuilder().addComponents(userSelect)],
                ephemeral: true
            });
        }

        if (customId.startsWith('custom_user_select_')) {
            const index = parseInt(customId.replace('custom_user_select_', ''));
            const targetId = interaction.values[0];
            const selectedObject = customObjects[index];

            const message = interaction.client.tempStore[`${userId}_${index}`];
            if (!message) {
                return await interaction.update({ content: '❌ Erreur: message personnalisé non trouvé.', components:[], embeds: []});
            }

            const targetMember = await interaction.guild.members.fetch(targetId);
            const objetCommand = require('../commands/objet');
            await objetCommand.executeCustomInteraction(interaction, dataManager, selectedObject, message, targetMember);

            // Nettoyer le store temporaire
            delete interaction.client.tempStore[`${userId}_${index}`];
        }

    } catch (err) {
        console.error('Erreur objet :', err);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Erreur lors de l\'interaction.', ephemeral: true });
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