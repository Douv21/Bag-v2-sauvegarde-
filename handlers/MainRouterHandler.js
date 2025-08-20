const { MessageFlags, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

class MainRouterHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;

        // Lazy instances to avoid heavy constructors until needed
        this._handlers = null;
    }

    get handlers() {
        if (this._handlers) return this._handlers;
        const EconomyConfigHandler = require('./EconomyConfigHandler');
        const CountingConfigHandler = require('./CountingConfigHandler');
        const AutoThreadConfigHandler = require('./AutoThreadConfigHandler');
        const AouvConfigHandler = require('./AouvConfigHandler');
        const LevelConfigHandler = require('./LevelConfigHandler');

        this._handlers = {
            economy: new EconomyConfigHandler(this.dataManager),
            counting: new CountingConfigHandler(this.dataManager),
            autothread: new AutoThreadConfigHandler(this.dataManager),
            aouv: new AouvConfigHandler(this.dataManager),
            level: new LevelConfigHandler()
        };
        return this._handlers;
    }

    async handleInteraction(interaction) {
        try {
            if (!interaction) return false;

            const customId = interaction.customId || '';

            if (interaction.isModalSubmit()) {
                const { modalHandler } = require('../utils/modalHandler');
                const ok = await modalHandler.handleModalSubmission(interaction);
                if (ok === false) return true; // already replied with not implemented

                if (customId.startsWith('action_config_modal_')) {
                    await this.handlers.economy.handleActionConfigModal(interaction);
                    return true;
                }
                if (customId === 'objet_perso_modal') {
                    await this.handlers.economy.handleObjetPersoModal?.(interaction);
                    return true;
                }
                if (customId.startsWith('role_config_modal_')) {
                    await this.handlers.economy.handleRoleConfigModal(interaction);
                    return true;
                }
                if (customId === 'remise_karma_modal') {
                    await this.handlers.economy.handleRemiseModal(interaction);
                    return true;
                }
                if (customId === 'modify_remises_modal') {
                    await this.handlers.economy.handleModifyRemiseModal(interaction);
                    return true;
                }
                if (customId === 'delete_remises_modal') {
                    await this.handlers.economy.handleDeleteRemiseModal(interaction);
                    return true;
                }
                if (customId.startsWith('edit_discount_modal_')) {
                    await this.handlers.economy.handleEditDiscountModal(interaction);
                    return true;
                }

                // AOUV modals
                if (customId === 'aouv_prompt_add_modal') { await this.handlers.aouv.handleAouvPromptAddModal(interaction); return true; }
                if (customId === 'aouv_prompt_edit_modal') { await this.handlers.aouv.handleAouvPromptEditModal(interaction); return true; }
                if (customId === 'aouv_prompt_remove_modal') { await this.handlers.aouv.handleAouvPromptRemoveModal(interaction); return true; }
                if (customId === 'aouv_prompt_disable_base_modal') { await this.handlers.aouv.handleAouvPromptBaseModal(interaction, true); return true; }
                if (customId === 'aouv_prompt_enable_base_modal') { await this.handlers.aouv.handleAouvPromptBaseModal(interaction, false); return true; }
                if (customId === 'aouv_prompt_list_base_modal') { await this.handlers.aouv.handleAouvPromptListBaseModal(interaction); return true; }
                if (customId === 'aouv_prompt_override_base_modal') { await this.handlers.aouv.handleAouvPromptOverrideModal(interaction); return true; }
                if (customId === 'aouv_prompt_reset_override_base_modal') { await this.handlers.aouv.handleAouvPromptResetOverrideModal(interaction); return true; }

                if (customId === 'aouv_nsfw_prompt_add_modal') { await this.handlers.aouv.handleAouvNsfwPromptAddModal(interaction); return true; }
                if (customId === 'aouv_nsfw_prompt_edit_modal') { await this.handlers.aouv.handleAouvNsfwPromptEditModal(interaction); return true; }
                if (customId === 'aouv_nsfw_prompt_remove_modal') { await this.handlers.aouv.handleAouvNsfwPromptRemoveModal(interaction); return true; }
                if (customId === 'aouv_nsfw_prompt_disable_base_modal') { await this.handlers.aouv.handleAouvNsfwPromptBaseModal(interaction, true); return true; }
                if (customId === 'aouv_nsfw_prompt_enable_base_modal') { await this.handlers.aouv.handleAouvNsfwPromptBaseModal(interaction, false); return true; }
                if (customId === 'aouv_nsfw_prompt_list_base_modal') { await this.handlers.aouv.handleAouvNsfwPromptListBaseModal(interaction); return true; }
                if (customId === 'aouv_nsfw_prompt_override_base_modal') { await this.handlers.aouv.handleAouvNsfwPromptOverrideModal(interaction); return true; }
                if (customId === 'aouv_nsfw_prompt_reset_override_base_modal') { await this.handlers.aouv.handleAouvNsfwPromptResetOverrideModal(interaction); return true; }

                return false;
            }

            if (interaction.isStringSelectMenu()) {
                if (customId === 'economy_actions_select') { await this.handlers.economy.handleActionSelect(interaction); return true; }
                if (customId.startsWith('economy_action_config_')) { await this.handlers.economy.handleActionConfigSelect(interaction); return true; }
                if (customId === 'economy_boutique_select') { await this.handlers.economy.handleBoutiqueSelect(interaction); return true; }
                if (customId === 'economy_main_config_submenu') { await this.handlers.economy.showMainMenu(interaction); return true; }
                if (customId === 'remises_karma_select') { await this.handlers.economy.handleRemisesSelect(interaction); return true; }
                if (customId === 'economy_daily_select') { await this.handlers.economy.handleDailySelect(interaction); return true; }
                if (customId === 'economy_messages_select') { await this.handlers.economy.handleMessagesSelect(interaction); return true; }
                if (customId === 'economy_karma_select') { await this.handlers.economy.handleKarmaSelect(interaction); return true; }
                if (customId === 'manage_objects_select') { await this.handlers.economy.handleManageObjetsSelect?.(interaction); return true; }
                if (customId === 'delete_articles_select') { await this.handlers.economy.handleDeleteArticlesSelect?.(interaction); return true; }

                // AOUV selects
                if (customId === 'aouv_main_select') { await this.handlers.aouv.showMainMenu(interaction); return true; }
                if (customId === 'aouv_prompt_edit_kind_select') { await this.handlers.aouv.handleAouvPromptEditKindSelect(interaction); return true; }
                if (customId === 'aouv_prompt_remove_kind_select') { await this.handlers.aouv.handleAouvPromptRemoveKindSelect(interaction); return true; }
                if (customId === 'aouv_prompt_list_custom_kind_select') { await this.handlers.aouv.handleAouvPromptListCustomKindSelect(interaction); return true; }
                if (customId === 'aouv_prompt_list_base_kind_select') { await this.handlers.aouv.handleAouvPromptListBaseKindSelect(interaction); return true; }
                if (customId === 'aouv_prompt_override_kind_select') { await this.handlers.aouv.handleAouvPromptOverrideKindSelect(interaction); return true; }
                if (customId === 'aouv_disable_all_select') { await this.handlers.aouv.handleAouvDisableAllSelect(interaction); return true; }
                if (customId === 'aouv_prompt_remove_select_action') { await this.handlers.aouv.handleAouvPromptRemoveSelect(interaction, 'action'); return true; }
                if (customId === 'aouv_prompt_remove_select_truth') { await this.handlers.aouv.handleAouvPromptRemoveSelect(interaction, 'verite'); return true; }
                if (customId === 'aouv_prompt_override_select_action') { await this.handlers.aouv.handleAouvPromptOverrideSelect(interaction, 'action'); return true; }
                if (customId === 'aouv_prompt_override_select_truth') { await this.handlers.aouv.handleAouvPromptOverrideSelect(interaction, 'verite'); return true; }
                if (customId === 'aouv_nsfw_prompt_remove_select_action') { await this.handlers.aouv.handleAouvNsfwPromptRemoveSelect(interaction, 'action'); return true; }
                if (customId === 'aouv_nsfw_prompt_remove_select_truth') { await this.handlers.aouv.handleAouvNsfwPromptRemoveSelect(interaction, 'verite'); return true; }

                // Counting
                if (customId === 'counting_main_config') { await this.handlers.counting.showMainConfigMenu(interaction); return true; }
                return false;
            }

            if (interaction.isRoleSelectMenu()) {
                if (customId === 'role_temp_select' || customId === 'role_perm_select') {
                    await this.handlers.economy.handleRoleSelect(interaction);
                    return true;
                }
                return false;
            }

            if (interaction.isChannelSelectMenu()) {
                if (customId === 'counting_add_channel') {
                    await this.handlers.counting.handleAddChannel(interaction);
                    return true;
                }
                if (customId === 'aouv_channel_add') { await this.handlers.aouv.handleAouvChannelAdd(interaction); return true; }
                if (customId === 'aouv_channel_remove') { await this.handlers.aouv.handleAouvChannelRemove(interaction); return true; }
                if (customId === 'aouv_nsfw_channel_add') { await this.handlers.aouv.handleAouvNsfwChannelAdd(interaction); return true; }
                if (customId === 'aouv_nsfw_channel_remove') { await this.handlers.aouv.handleAouvNsfwChannelRemove(interaction); return true; }
                return false;
            }

            if (interaction.isButton && interaction.isButton()) {
                const id = customId;
                if (id.startsWith('aouv_prompt_edit_list_') || id.startsWith('aouv_prompt_remove_list_') || id.startsWith('aouv_prompt_list_custom_') || id.startsWith('aouv_prompt_list_base_') || id.startsWith('aouv_prompt_override_list_')) {
                    const parts = String(id || '').split('_');
                    const kind = parts.includes('truth') ? 'verite' : 'action';
                    // Delegate based on prefix
                    if (id.startsWith('aouv_prompt_edit_list_')) return !!(await this.handlers.aouv.handleAouvPromptEditKindSelect(interaction));
                    if (id.startsWith('aouv_prompt_remove_list_')) return !!(await this.handlers.aouv.handleAouvPromptRemoveKindSelect(interaction));
                    if (id.startsWith('aouv_prompt_list_custom_')) return !!(await this.handlers.aouv.handleAouvPromptListCustomKindSelect(interaction));
                    if (id.startsWith('aouv_prompt_list_base_')) return !!(await this.handlers.aouv.handleAouvPromptListBaseKindSelect(interaction));
                    if (id.startsWith('aouv_prompt_override_list_')) return !!(await this.handlers.aouv.handleAouvPromptOverrideKindSelect(interaction));
                    return true;
                }
                if (id.startsWith('aouv_nsfw_prompt_edit_list_') || id.startsWith('aouv_nsfw_prompt_remove_list_') || id.startsWith('aouv_nsfw_prompt_list_custom_')) {
                    // Just delegate to Aouv for NSFW flows (they parse their own ids)
                    return !!(await this.handlers.aouv.handleAouvNsfwPromptEditKindSelect(interaction));
                }
            }

            return false;
        } catch (error) {
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Erreur lors du routage.', flags: MessageFlags.Ephemeral });
                }
            } catch {}
            return false;
        }
    }

    async handleColorRoleSelect(interaction, id) {
        try {
            const parts = String(id || '').split('|');
            // color_role_select|r|ROLE_ID|renameFlag OR |m|MEMBER_ID|renameFlag
            if (parts.length < 4) return false;
            const targetType = parts[1];
            const targetId = parts[2];
            const renameFlag = parts[3] === '1';

            const { findStyleByKey } = require('../utils/rolePalette');
            const selected = (interaction.values || [])[0];
            const style = findStyleByKey(selected);
            if (!style) return false;

            await interaction.deferReply({ ephemeral: true });

            if (targetType === 'r') {
                const role = await interaction.guild.roles.fetch(targetId).catch(() => null);
                if (!role) return false;
                const edit = { color: style.color };
                if (renameFlag) edit.name = style.name;
                await role.edit(edit, 'color-role select');
                await interaction.editReply({ content: `Mis à jour: ${role.toString()} → ${style.name} (${style.color})` });
                return true;
            } else if (targetType === 'm') {
                const member = await interaction.guild.members.fetch(targetId).catch(() => null);
                if (!member) return false;
                let styleRole = interaction.guild.roles.cache.find(r => r.name === style.name);
                if (!styleRole) {
                    styleRole = await interaction.guild.roles.create({ name: style.name, color: style.color, reason: 'color-role select' });
                }
                const me = interaction.guild.members.me;
                if (!me || me.roles.highest.comparePositionTo(styleRole) <= 0) {
                    await interaction.editReply({ content: `Je ne peux pas assigner ${styleRole.toString()} (place mon rôle au-dessus).` });
                    return true;
                }
                await member.roles.add(styleRole, 'color-role select');
                await interaction.editReply({ content: `Couleur attribuée à ${member.toString()} → ${style.name} (${style.color})` });
                return true;
            }
            return false;
        } catch (e) {
            try { if (!interaction.replied) await interaction.reply({ content: 'Erreur color-role.', flags: MessageFlags.Ephemeral }); } catch {}
            return false;
        }
    }

    async handleModerationUI(interaction, view = 'moderation_main') {
        try {
            const { PermissionFlagsBits } = require('discord.js');
            if (!interaction.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({ content: '❌ Admin requis.', flags: MessageFlags.Ephemeral });
            }

            const ModerationManager = require('../managers/ModerationManager');
            const manager = new ModerationManager(this.dataManager, interaction.client);
            const guildId = interaction.guild.id;
            const cfg = await manager.getGuildConfig(guildId);

            if (view === 'moderation_main') {
                const embed = new EmbedBuilder()
                    .setTitle('⚙️ Configuration de Modération')
                    .setColor('#5865F2')
                    .setDescription('Choisissez une section à configurer')
                    .addFields([
                        { name: '📜 Salon des logs', value: cfg.logsChannelId ? `<#${cfg.logsChannelId}>` : 'Non défini', inline: true },
                        { name: '🪪 Rôle obligatoire', value: (cfg.roleEnforcement?.enabled ? `Activé — ${cfg.roleEnforcement.requiredRoleName || cfg.roleEnforcement.requiredRoleId || 'Non défini'}` : 'Désactivé'), inline: true },
                        { name: '🛌 Inactivité', value: (cfg.inactivity?.enabled ? `Activé — ${Math.round((cfg.inactivity.thresholdMs || 0) / (24*60*60*1000))}j` : 'Désactivé'), inline: true }
                    ]);

                const menu = new StringSelectMenuBuilder()
                    .setCustomId('moderation_main_menu')
                    .setPlaceholder('Choisir une section…')
                    .addOptions([
                        { label: '📜 Logs', value: 'logs' },
                        { label: '🪪 Rôle obligatoire', value: 'role_enforcement' },
                        { label: '🛌 Inactivité', value: 'inactivity' }
                    ]);

                const row = new ActionRowBuilder().addComponents(menu);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ embeds: [embed], components: [row] });
                } else {
                    await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
                }
                return true;
            }

            return false;
        } catch (error) {
            try { if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: 'Erreur UI modération.', flags: MessageFlags.Ephemeral }); } catch {}
            return false;
        }
    }
}

module.exports = MainRouterHandler;

