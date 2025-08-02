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

        if (customId.startsWith('offer_user_select_')) {
            const parts = customId.split('_');
            const index = parseInt(parts[3]);
            const targetId = parts[4];
            const obj = customObjects[index];
            if (!obj) return;

            userData.inventory = userData.inventory.filter((item, idx) => !(item.type === 'custom' && idx === index));
            await dataManager.saveData('economy.json', economyData);

            const targetKey = `${targetId}_${guildId}`;
            if (!economyData[targetKey]) economyData[targetKey] = { inventory: [] };
            economyData[targetKey].inventory.push(obj);
            await dataManager.saveData('economy.json', economyData);

            return await interaction.update({
                content: `🎁 Vous avez offert **${obj.name}** à <@${targetId}>.`,
                components: [],
                embeds: []
            });
        }

        if (customId.startsWith('confirm_delete_')) {
            const index = parseInt(customId.replace('confirm_delete_', ''));
            const obj = customObjects[index];
            if (!obj) return;

            userData.inventory = userData.inventory.filter((item, idx) => !(item.type === 'custom' && idx === index));
            await dataManager.saveData('economy.json', economyData);

            return await interaction.update({
                content: `🗑️ **${obj.name}** a été supprimé.`,
                components: [],
                embeds: []
            });
        }

        if (customId === 'cancel_delete') {
            return await interaction.update({
                content: '❌ Suppression annulée.',
                components: [],
                embeds: []
            });
        }

        if (interaction.isModalSubmit() && customId.startsWith('custom_message_modal_')) {
            const index = parseInt(customId.replace('custom_message_modal_', ''));
            const obj = customObjects[index];
            const message = interaction.fields.getTextInputValue('custom_message');

            return await interaction.reply({
                content: `💬 Vous utilisez **${obj.name}** :\n> ${message}`,
                ephemeral: true
            });
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