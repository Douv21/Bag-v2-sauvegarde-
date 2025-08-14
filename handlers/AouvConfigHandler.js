const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle } = require('discord.js');
const { modalHandler } = require('../utils/modalHandler');

class AouvConfigHandler {
	constructor(dataManager) {
		this.dataManager = dataManager;
	}

	// =============
	// AOUV CONFIG
	// =============
	async showMainMenu(interaction) {
		// Dans le système indépendant, le "retour" renvoie simplement au menu AouV
		return this.showAouvMenu(interaction);
	}

	async showAouvMenu(interaction) {
		const embed = new EmbedBuilder()
			.setColor('#5865F2')
			.setTitle('🎲 Configuration Action ou Vérité')
			.setDescription('Gérez les salons autorisés et les prompts (base, désactivés, personnalisés).');

		const select = new StringSelectMenuBuilder()
			.setCustomId('aouv_main_select')
			.setPlaceholder('Choisissez une option...')
			.addOptions([
				{ label: '📺 Salons autorisés', value: 'channels', description: 'Limiter /aouv à certains salons' },
				{ label: '📝 Ajouter prompt personnalisé', value: 'prompt_add', description: 'Ajouter un prompt action/vérité' },
				{ label: '✏️ Modifier prompt personnalisé', value: 'prompt_edit', description: 'Modifier un prompt personnalisé' },
				{ label: '🗑️ Supprimer prompt personnalisé', value: 'prompt_remove', description: 'Supprimer un prompt personnalisé' },
				{ label: '📜 Lister prompts personnalisés', value: 'prompt_list_custom', description: 'Voir vos prompts' },
				{ label: '📚 Lister prompts intégrés', value: 'prompt_list_base', description: 'Voir la liste de base (avec numéros)' },
				{ label: '✏️ Modifier prompt intégré', value: 'prompt_override_base', description: 'Remplacer un prompt intégré par votre texte' },
				{ label: '♻️ Réinitialiser override intégré', value: 'prompt_reset_override', description: 'Supprimer le remplacement d\'un prompt intégré' },
				{ label: '⛔ Désactiver prompt de base', value: 'prompt_disable_base', description: 'Désactiver un prompt intégré' },
				{ label: '✅ Réactiver prompt de base', value: 'prompt_enable_base', description: 'Réactiver un prompt intégré' },
				// NSFW
				{ label: '🔞 Salons autorisés (NSFW)', value: 'nsfw_channels', description: 'Limiter /aouv (NSFW) à certains salons' },
				{ label: '🔞 Ajouter prompt NSFW', value: 'nsfw_prompt_add', description: 'Ajouter un prompt 18+' },
				{ label: '🔞 Modifier prompt NSFW', value: 'nsfw_prompt_edit', description: 'Modifier un prompt 18+' },
				{ label: '🔞 Supprimer prompt NSFW', value: 'nsfw_prompt_remove', description: 'Supprimer un prompt 18+' },
				{ label: '🔞 Lister prompts NSFW persos', value: 'nsfw_prompt_list_custom', description: 'Voir vos prompts 18+' },
				{ label: '🔞 Lister prompts NSFW intégrés', value: 'nsfw_prompt_list_base', description: 'Voir la liste NSFW de base' },
				{ label: '🔞 Modifier prompt NSFW intégré', value: 'nsfw_prompt_override_base', description: 'Remplacer un prompt NSFW intégré' },
				{ label: '🔞 Réinitialiser override NSFW', value: 'nsfw_prompt_reset_override', description: 'Supprimer un remplacement NSFW' },
				{ label: '🔞 Désactiver prompt NSFW de base', value: 'nsfw_prompt_disable_base', description: 'Désactiver un prompt base NSFW' },
				{ label: '🔞 Réactiver prompt NSFW de base', value: 'nsfw_prompt_enable_base', description: 'Réactiver un prompt base NSFW' }
			]);

		const row = new ActionRowBuilder().addComponents(select);
		await interaction.update({ embeds: [embed], components: [row] });
	}

	async handleAouvSelect(interaction) {
		const choice = interaction.values[0];
		if (choice === 'back_main') return this.showMainMenu(interaction);

		if (choice === 'channels') return this.showAouvChannelsMenu(interaction);
		if (choice === 'prompt_add') return this.showAouvPromptAddModal(interaction);
		if (choice === 'prompt_edit') return this.showAouvPromptEditKindPicker(interaction);
		if (choice === 'prompt_remove') return this.showAouvPromptRemoveKindPicker(interaction);
		if (choice === 'prompt_list_custom') return this.showAouvPromptListCustom(interaction);
		if (choice === 'prompt_list_base') return this.showAouvPromptListBaseMenu(interaction);
		if (choice === 'prompt_override_base') return this.showAouvPromptOverrideBaseKindPicker(interaction);
		if (choice === 'prompt_reset_override') return this.showAouvPromptResetOverrideModal(interaction);
		if (choice === 'prompt_disable_base') return this.showAouvPromptToggleBase(interaction, true);
		if (choice === 'prompt_enable_base') return this.showAouvPromptToggleBase(interaction, false);

		// NSFW
		if (choice === 'nsfw_channels') return this.showAouvNsfwChannelsMenu(interaction);
		if (choice === 'nsfw_prompt_add') return this.showAouvNsfwPromptAddModal(interaction);
		if (choice === 'nsfw_prompt_edit') return this.showAouvNsfwPromptEditPicker(interaction);
		if (choice === 'nsfw_prompt_remove') return this.showAouvNsfwPromptRemoveModal(interaction);
		if (choice === 'nsfw_prompt_list_custom') return this.showAouvNsfwPromptListCustom(interaction);
		if (choice === 'nsfw_prompt_list_base') return this.showAouvNsfwPromptListBaseModal(interaction);
		if (choice === 'nsfw_prompt_override_base') return this.showAouvNsfwPromptOverrideBaseModal(interaction);
		if (choice === 'nsfw_prompt_reset_override') return this.showAouvNsfwPromptResetOverrideModal(interaction);
		if (choice === 'nsfw_prompt_disable_base') return this.showAouvNsfwPromptToggleBase(interaction, true);
		if (choice === 'nsfw_prompt_enable_base') return this.showAouvNsfwPromptToggleBase(interaction, false);
	}

	// ---- Channels ----
	async showAouvChannelsMenu(interaction) {
		const cfgAll = await this.dataManager.loadData('aouv_config.json', {});
		const guildId = interaction.guild.id;
		const cfg = cfgAll[guildId] || { allowedChannels: [] };

		const embed = new EmbedBuilder()
			.setColor('#2ecc71')
			.setTitle('📺 Salons autorisés pour AouV')
			.setDescription((cfg.allowedChannels || []).length ? (cfg.allowedChannels.map(id => `<#${id}>`).join(', ')) : 'Aucun (tous les salons autorisés)');

		const channelAdd = new ChannelSelectMenuBuilder()
			.setCustomId('aouv_channel_add')
			.setPlaceholder('Ajouter un salon autorisé')
			.addChannelTypes(ChannelType.GuildText)
			.setMinValues(1)
			.setMaxValues(1);

		// Remplacer le retrait par un select listant SEULEMENT les salons configurés
		const allowed = Array.isArray(cfg.allowedChannels) ? cfg.allowedChannels : [];
		let removeRow = null;
		if (allowed.length > 0) {
			const channelRemoveSelect = new StringSelectMenuBuilder()
				.setCustomId('aouv_channel_remove')
				.setPlaceholder('Retirer un salon autorisé')
				.setMinValues(1)
				.setMaxValues(1);
			for (const chId of allowed) {
				const ch = interaction.guild.channels.cache.get(chId);
				const label = ch ? `#${ch.name}` : `#${chId}`;
				channelRemoveSelect.addOptions({ label, value: chId, description: ch ? `ID: ${chId}` : undefined });
			}
			removeRow = new ActionRowBuilder().addComponents(channelRemoveSelect);
		}

		const rows = [new ActionRowBuilder().addComponents(channelAdd)];
		if (removeRow) rows.push(removeRow);
		await interaction.update({ embeds: [embed], components: rows });
	}

	async handleAouvChannelAdd(interaction) {
		const guildId = interaction.guild.id;
		const chId = interaction.values[0];
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { allowedChannels: [], disabledBaseActions: [], disabledBaseTruths: [], customActions: [], customTruths: [] };
		const set = new Set(cfg.allowedChannels || []); set.add(chId);
		cfg.allowedChannels = Array.from(set);
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.update({ content: `✅ Salon autorisé: <#${chId}>`, embeds: [], components: [] });
	}

	async handleAouvChannelRemove(interaction) {
		const guildId = interaction.guild.id;
		const chId = interaction.values[0];
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { allowedChannels: [] };
		cfg.allowedChannels = (cfg.allowedChannels || []).filter(id => id !== chId);
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.update({ content: `✅ Salon retiré: <#${chId}>`, embeds: [], components: [] });
	}

	// ---- NSFW Channels ----
	async showAouvNsfwChannelsMenu(interaction) {
		const cfgAll = await this.dataManager.loadData('aouv_config.json', {});
		const guildId = interaction.guild.id;
		const cfg = cfgAll[guildId] || { nsfwAllowedChannels: [] };

		const embed = new EmbedBuilder()
			.setColor('#e91e63')
			.setTitle('🔞 Salons NSFW autorisés pour AouV')
			.setDescription((cfg.nsfwAllowedChannels || []).length ? (cfg.nsfwAllowedChannels.map(id => `<#${id}>`).join(', ')) : 'Aucun');

		const channelAdd = new ChannelSelectMenuBuilder()
			.setCustomId('aouv_nsfw_channel_add')
			.setPlaceholder('Ajouter un salon NSFW autorisé')
			.addChannelTypes(ChannelType.GuildText)
			.setMinValues(1)
			.setMaxValues(1);

		const allowed = Array.isArray(cfg.nsfwAllowedChannels) ? cfg.nsfwAllowedChannels : [];
		let removeRow = null;
		if (allowed.length > 0) {
			const channelRemoveSelect = new StringSelectMenuBuilder()
				.setCustomId('aouv_nsfw_channel_remove')
				.setPlaceholder('Retirer un salon NSFW autorisé')
				.setMinValues(1)
				.setMaxValues(1);
			for (const chId of allowed) {
				const ch = interaction.guild.channels.cache.get(chId);
				const label = ch ? `#${ch.name}` : `#${chId}`;
				channelRemoveSelect.addOptions({ label, value: chId, description: ch ? `ID: ${chId}` : undefined });
			}
			removeRow = new ActionRowBuilder().addComponents(channelRemoveSelect);
		}

		const rows = [new ActionRowBuilder().addComponents(channelAdd)];
		if (removeRow) rows.push(removeRow);
		await interaction.update({ embeds: [embed], components: rows });
	}

	async handleAouvNsfwChannelAdd(interaction) {
		const guildId = interaction.guild.id;
		const chId = interaction.values[0];
		const channel = interaction.guild.channels.cache.get(chId);
		if (!channel?.nsfw) {
			return interaction.update({ content: '❌ Le salon sélectionné n\'est pas marqué NSFW dans Discord.', embeds: [], components: [] });
		}
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { nsfwAllowedChannels: [] };
		const set = new Set(cfg.nsfwAllowedChannels || []); set.add(chId);
		cfg.nsfwAllowedChannels = Array.from(set);
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.update({ content: `✅ Salon NSFW autorisé: <#${chId}>`, embeds: [], components: [] });
	}

	async handleAouvNsfwChannelRemove(interaction) {
		const guildId = interaction.guild.id;
		const chId = interaction.values[0];
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { nsfwAllowedChannels: [] };
		cfg.nsfwAllowedChannels = (cfg.nsfwAllowedChannels || []).filter(id => id !== chId);
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.update({ content: `✅ Salon NSFW retiré: <#${chId}>`, embeds: [], components: [] });
	}

	// ---- Prompts CRUD ----
	async showAouvPromptAddModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_prompt_add_modal').setTitle('Ajouter un prompt AouV');
		const kind = new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true);
		const texte = new TextInputBuilder().setCustomId('texte').setLabel('Contenu du prompt').setStyle(TextInputStyle.Paragraph).setRequired(true);
		modal.addComponents(new ActionRowBuilder().addComponents(kind), new ActionRowBuilder().addComponents(texte));
		await modalHandler.showModal(interaction, modal);
	}

	// === Nouvel assistant pagination ===
	buildPaginationRow(baseId, kind, page, totalPages) {
		const buttons = [];
		if (page > 1) {
			buttons.push(new ButtonBuilder().setCustomId(`${baseId}_${kind}_page_${page - 1}`).setLabel('◀️ Précédent').setStyle(ButtonStyle.Secondary));
		}
		if (page < totalPages) {
			buttons.push(new ButtonBuilder().setCustomId(`${baseId}_${kind}_page_${page + 1}`).setLabel('Suivant ▶️').setStyle(ButtonStyle.Secondary));
		}
		return buttons.length ? [new ActionRowBuilder().addComponents(buttons)] : [];
	}

	// === EDIT personnalisés (sélection type puis liste paginée) ===
	async showAouvPromptEditKindPicker(interaction) {
		const embed = new EmbedBuilder()
			.setColor('#f1c40f')
			.setTitle('✏️ Modifier un prompt personnalisé')
			.setDescription('Choisissez le type de prompt à modifier.');
		const select = new StringSelectMenuBuilder()
			.setCustomId('aouv_prompt_edit_kind_select')
			.setPlaceholder('Choisir un type...')
			.addOptions([
				{ label: 'Actions', value: 'action' },
				{ label: 'Vérités', value: 'verite' }
			]);
		await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
	}

	async handleAouvPromptEditKindSelect(interaction) {
		const kind = interaction.values[0];
		return this.showAouvPromptEditListPaged(interaction, kind, 1);
	}

	async showAouvPromptEditListPaged(interaction, kind, page = 1) {
		const guildId = interaction.guild.id;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { customActions: [], customTruths: [] };
		const list = kind === 'action' ? (cfg.customActions || []) : (cfg.customTruths || []);
		const per = 25;
		const totalPages = Math.max(1, Math.ceil(list.length / per));
		const start = (page - 1) * per;
		const slice = list.slice(start, start + per);

		const embed = new EmbedBuilder()
			.setColor('#f1c40f')
			.setTitle(`✏️ Modifier un prompt perso — ${kind === 'action' ? 'Actions' : 'Vérités'} (Page ${page}/${totalPages})`)
			.setDescription(slice.length ? 'Sélectionnez un prompt à modifier.' : 'Aucun prompt.');

		const select = new StringSelectMenuBuilder()
			.setCustomId(kind === 'action' ? 'aouv_prompt_edit_select_action' : 'aouv_prompt_edit_select_truth')
			.setPlaceholder(slice.length ? 'Choisir un prompt...' : 'Aucun prompt')
			.setMinValues(1)
			.setMaxValues(1)
			.setDisabled(slice.length === 0);
		slice.forEach((t, i) => {
			const absoluteIndex = start + i;
			const label = t.length > 95 ? t.slice(0, 95) + '…' : t;
			select.addOptions({ label, value: String(absoluteIndex) });
		});

		const rows = [new ActionRowBuilder().addComponents(select), ...this.buildPaginationRow('aouv_prompt_edit_list', kind, page, totalPages)];
		await interaction.update({ embeds: [embed], components: rows });
	}

	// === REMOVE personnalisés (sélection type puis liste paginée) ===
	async showAouvPromptRemoveKindPicker(interaction) {
		const embed = new EmbedBuilder()
			.setColor('#e74c3c')
			.setTitle('🗑️ Supprimer un prompt personnalisé')
			.setDescription('Choisissez le type de prompt à supprimer.');
		const select = new StringSelectMenuBuilder()
			.setCustomId('aouv_prompt_remove_kind_select')
			.setPlaceholder('Choisir un type...')
			.addOptions([
				{ label: 'Actions', value: 'action' },
				{ label: 'Vérités', value: 'verite' }
			]);
		await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
	}

	async handleAouvPromptRemoveKindSelect(interaction) {
		const kind = interaction.values[0];
		return this.showAouvPromptRemoveListPaged(interaction, kind, 1);
	}

	async showAouvPromptRemoveListPaged(interaction, kind, page = 1) {
		const guildId = interaction.guild.id;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { customActions: [], customTruths: [] };
		const list = kind === 'action' ? (cfg.customActions || []) : (cfg.customTruths || []);
		const per = 25;
		const totalPages = Math.max(1, Math.ceil(list.length / per));
		const start = (page - 1) * per;
		const slice = list.slice(start, start + per);

		const embed = new EmbedBuilder()
			.setColor('#e74c3c')
			.setTitle(`🗑️ Supprimer un prompt perso — ${kind === 'action' ? 'Actions' : 'Vérités'} (Page ${page}/${totalPages})`)
			.setDescription(slice.length ? 'Sélectionnez un prompt à supprimer.' : 'Aucun prompt.');

		const select = new StringSelectMenuBuilder()
			.setCustomId(kind === 'action' ? 'aouv_prompt_remove_select_action' : 'aouv_prompt_remove_select_truth')
			.setPlaceholder(slice.length ? 'Choisir un prompt...' : 'Aucun prompt')
			.setMinValues(1)
			.setMaxValues(1)
			.setDisabled(slice.length === 0);
		slice.forEach((t, i) => {
			const absoluteIndex = start + i;
			const label = t.length > 95 ? t.slice(0, 95) + '…' : t;
			select.addOptions({ label, value: String(absoluteIndex) });
		});

		const rows = [new ActionRowBuilder().addComponents(select), ...this.buildPaginationRow('aouv_prompt_remove_list', kind, page, totalPages)];
		await interaction.update({ embeds: [embed], components: rows });
	}

	async handleAouvPromptRemoveSelect(interaction, kind) {
		const guildId = interaction.guild.id;
		const index = parseInt(interaction.values[0], 10);
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		if (kind === 'action') {
			if (!Array.isArray(cfg.customActions) || index < 0 || index >= cfg.customActions.length) return interaction.update({ content: '❌ Indice invalide.', embeds: [], components: [] });
			cfg.customActions.splice(index, 1);
		} else {
			if (!Array.isArray(cfg.customTruths) || index < 0 || index >= cfg.customTruths.length) return interaction.update({ content: '❌ Indice invalide.', embeds: [], components: [] });
			cfg.customTruths.splice(index, 1);
		}
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.update({ content: '✅ Supprimé.', embeds: [], components: [] });
	}

	// === LIST personnalisés (sélection type puis pagination) ===
	async showAouvPromptListCustom(interaction) {
		const embed = new EmbedBuilder()
			.setColor('#3498db')
			.setTitle('📜 Lister prompts personnalisés')
			.setDescription('Choisissez le type à afficher.');
		const select = new StringSelectMenuBuilder()
			.setCustomId('aouv_prompt_list_custom_kind_select')
			.setPlaceholder('Choisir un type...')
			.addOptions([
				{ label: 'Actions', value: 'action' },
				{ label: 'Vérités', value: 'verite' }
			]);
		await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
	}

	async handleAouvPromptListCustomKindSelect(interaction) {
		const kind = interaction.values[0];
		return this.showAouvPromptListCustomPaged(interaction, kind, 1);
	}

	async showAouvPromptListCustomPaged(interaction, kind, page = 1) {
		const guildId = interaction.guild.id;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { customActions: [], customTruths: [] };
		const list = kind === 'action' ? (cfg.customActions || []) : (cfg.customTruths || []);
		const per = 20;
		const totalPages = Math.max(1, Math.ceil(list.length / per));
		const start = (page - 1) * per;
		const slice = list.slice(start, start + per);
		const lines = slice.map((t, i) => `${start + i}. ${t}`);
		const embed = new EmbedBuilder()
			.setColor('#3498db')
			.setTitle(`📜 ${kind === 'action' ? 'Actions' : 'Vérités'} personnalisées (Page ${page}/${totalPages})`)
			.setDescription(lines.length ? lines.join('\n') : '(Aucune entrée)');
		const rows = this.buildPaginationRow('aouv_prompt_list_custom', kind, page, totalPages);
		await interaction.update({ embeds: [embed], components: rows });
	}

	// === LIST base (sélection type puis pagination) ===
	async showAouvPromptListBaseMenu(interaction) {
		const embed = new EmbedBuilder()
			.setColor('#9b59b6')
			.setTitle('📚 Lister prompts intégrés')
			.setDescription('Choisissez le type à afficher.');
		const select = new StringSelectMenuBuilder()
			.setCustomId('aouv_prompt_list_base_kind_select')
			.setPlaceholder('Choisir un type...')
			.addOptions([
				{ label: 'Actions (base)', value: 'action' },
				{ label: 'Vérités (base)', value: 'verite' }
			]);
		await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
	}

	async handleAouvPromptListBaseKindSelect(interaction) {
		const kind = interaction.values[0];
		return this.showAouvPromptListBasePaged(interaction, kind, 1);
	}

	async showAouvPromptListBasePaged(interaction, kind, page = 1) {
		const { BASE_ACTIONS, BASE_TRUTHS } = require('../utils/aouvPrompts');
		const list = kind === 'action' ? BASE_ACTIONS : kind === 'verite' ? BASE_TRUTHS : null;
		if (!list) return interaction.reply({ content: '❌ Type invalide.', flags: 64 });
		const per = 20; const start = (page - 1) * per; const slice = list.slice(start, start + per);
		const totalPages = Math.max(1, Math.ceil(list.length / per));
		if (!slice.length) return interaction.reply({ content: 'Aucune entrée à cette page.', flags: 64 });
		const lines = slice.map((t, i) => `${start + i + 1}. ${t}`);
		const embed = new EmbedBuilder()
			.setColor('#9b59b6')
			.setTitle(`📚 ${kind === 'action' ? 'Actions' : 'Vérités'} intégrées (Page ${page}/${totalPages})`)
			.setDescription(lines.length ? lines.join('\n') : 'Aucune entrée à cette page.');
		const rows = this.buildPaginationRow('aouv_prompt_list_base', kind, page, totalPages);
		await interaction.update({ embeds: [embed], components: rows });
	}

	// === OVERRIDE base (sélection type puis liste paginée avec ouverture modal pré-remplie) ===
	async showAouvPromptOverrideBaseKindPicker(interaction) {
		const embed = new EmbedBuilder()
			.setColor('#f39c12')
			.setTitle('✏️ Modifier (override) un prompt intégré')
			.setDescription('Choisissez le type de prompt.');
		const select = new StringSelectMenuBuilder()
			.setCustomId('aouv_prompt_override_kind_select')
			.setPlaceholder('Choisir un type...')
			.addOptions([
				{ label: 'Actions (base)', value: 'action' },
				{ label: 'Vérités (base)', value: 'verite' }
			]);
		await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
	}

	async handleAouvPromptOverrideKindSelect(interaction) {
		const kind = interaction.values[0];
		return this.showAouvPromptOverrideBaseListPaged(interaction, kind, 1);
	}

	async showAouvPromptOverrideBaseListPaged(interaction, kind, page = 1) {
		const { BASE_ACTIONS, BASE_TRUTHS } = require('../utils/aouvPrompts');
		const list = kind === 'action' ? BASE_ACTIONS : kind === 'verite' ? BASE_TRUTHS : [];
		const per = 25;
		const totalPages = Math.max(1, Math.ceil(list.length / per));
		const start = (page - 1) * per;
		const slice = list.slice(start, start + per);

		const embed = new EmbedBuilder()
			.setColor('#f39c12')
			.setTitle(`✏️ Override prompt intégré — ${kind === 'action' ? 'Actions' : 'Vérités'} (Page ${page}/${totalPages})`)
			.setDescription(slice.length ? 'Sélectionnez un prompt intégré à remplacer.' : 'Aucune entrée.');

		const select = new StringSelectMenuBuilder()
			.setCustomId(kind === 'action' ? 'aouv_prompt_override_select_action' : 'aouv_prompt_override_select_truth')
			.setPlaceholder(slice.length ? 'Choisir un prompt (base)...' : 'Aucun prompt')
			.setMinValues(1)
			.setMaxValues(1)
			.setDisabled(slice.length === 0);
		slice.forEach((t, i) => {
			const absoluteIndex = start + i + 1; // base is 1-indexed in UI
			const label = t.length > 95 ? t.slice(0, 95) + '…' : t;
			select.addOptions({ label: `${absoluteIndex}. ${label}`, value: String(absoluteIndex) });
		});

		const rows = [new ActionRowBuilder().addComponents(select), ...this.buildPaginationRow('aouv_prompt_override_list', kind, page, totalPages)];
		await interaction.update({ embeds: [embed], components: rows });
	}

	async handleAouvPromptOverrideSelect(interaction, kind) {
		const numero = interaction.values[0];
		const { BASE_ACTIONS, BASE_TRUTHS } = require('../utils/aouvPrompts');
		const baseList = kind === 'action' ? BASE_ACTIONS : BASE_TRUTHS;
		const idx = Math.max(1, parseInt(numero, 10));
		const currentBase = baseList[idx - 1] || '';

		const modal = new ModalBuilder().setCustomId('aouv_prompt_override_base_modal').setTitle('Remplacer prompt intégré');
		const kindInput = new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true).setValue(kind);
		const numeroInput = new TextInputBuilder().setCustomId('numero').setLabel('Numéro (1..n) du prompt de base').setStyle(TextInputStyle.Short).setRequired(true).setValue(String(idx));
		const texteInput = new TextInputBuilder().setCustomId('texte').setLabel('Nouveau contenu (remplacement)').setStyle(TextInputStyle.Paragraph).setRequired(true).setValue(currentBase);
		modal.addComponents(new ActionRowBuilder().addComponents(kindInput), new ActionRowBuilder().addComponents(numeroInput), new ActionRowBuilder().addComponents(texteInput));
		await modalHandler.showModal(interaction, modal);
	}

	// Nouveau: sélecteur avant le modal d'édition
	async showAouvPromptEditPicker(interaction) {
		const guildId = interaction.guild.id;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { customActions: [], customTruths: [] };
		const actions = Array.isArray(cfg.customActions) ? cfg.customActions : [];
		const truths = Array.isArray(cfg.customTruths) ? cfg.customTruths : [];

		const embed = new EmbedBuilder()
			.setColor('#f1c40f')
			.setTitle('✏️ Choisir un prompt à modifier')
			.setDescription('Sélectionnez un prompt existant, puis le modal d\'édition s\'ouvrira pré-rempli.');

		const actionSelect = new StringSelectMenuBuilder()
			.setCustomId('aouv_prompt_edit_select_action')
			.setPlaceholder(actions.length ? 'Choisir un prompt Action...' : 'Aucun prompt Action')
			.setMinValues(1)
			.setMaxValues(1)
			.setDisabled(actions.length === 0);
		actions.slice(0, 25).forEach((t, i) => {
			const idx = i.toString();
			actionSelect.addOptions({ label: t.length > 95 ? t.slice(0, 95) + '…' : t, value: idx });
		});

		const truthSelect = new StringSelectMenuBuilder()
			.setCustomId('aouv_prompt_edit_select_truth')
			.setPlaceholder(truths.length ? 'Choisir un prompt Vérité...' : 'Aucun prompt Vérité')
			.setMinValues(1)
			.setMaxValues(1)
			.setDisabled(truths.length === 0);
		truths.slice(0, 25).forEach((t, i) => {
			const idx = i.toString();
			truthSelect.addOptions({ label: t.length > 95 ? t.slice(0, 95) + '…' : t, value: idx });
		});

		const rows = [new ActionRowBuilder().addComponents(actionSelect), new ActionRowBuilder().addComponents(truthSelect)];
		await interaction.update({ embeds: [embed], components: rows });
	}

	async showAouvPromptEditModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_prompt_edit_modal').setTitle('Modifier un prompt perso');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('index').setLabel('Indice (via liste)').setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('texte').setLabel('Nouveau contenu').setStyle(TextInputStyle.Paragraph).setRequired(true))
		);
		await modalHandler.showModal(interaction, modal);
	}

	// Nouveau: ouvrir le modal d'édition pré-rempli après sélection
	async handleAouvPromptEditSelect(interaction, kind) {
		const guildId = interaction.guild.id;
		const index = parseInt(interaction.values[0], 10);
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { customActions: [], customTruths: [] };
		const list = kind === 'action' ? (cfg.customActions || []) : (cfg.customTruths || []);
		const currentText = list[index] || '';

		const modal = new ModalBuilder().setCustomId('aouv_prompt_edit_modal').setTitle('Modifier un prompt perso');
		const kindInput = new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true).setValue(kind);
		const indexInput = new TextInputBuilder().setCustomId('index').setLabel('Indice (via liste)').setStyle(TextInputStyle.Short).setRequired(true).setValue(String(index));
		const texteInput = new TextInputBuilder().setCustomId('texte').setLabel('Nouveau contenu').setStyle(TextInputStyle.Paragraph).setRequired(true).setValue(currentText);
		modal.addComponents(new ActionRowBuilder().addComponents(kindInput), new ActionRowBuilder().addComponents(indexInput), new ActionRowBuilder().addComponents(texteInput));
		await modalHandler.showModal(interaction, modal);
	}

	async showAouvPromptRemoveModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_prompt_remove_modal').setTitle('Supprimer un prompt perso');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('index').setLabel('Indice à supprimer').setStyle(TextInputStyle.Short).setRequired(true))
		);
		await modalHandler.showModal(interaction, modal);
	}

	async showAouvPromptListCustomOld(interaction) {
		const guildId = interaction.guild.id;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { customActions: [], customTruths: [] };
		const a = (cfg.customActions || []).map((t, i) => `A${i}: ${t}`).join('\n') || '(Aucune action personnalisée)';
		const v = (cfg.customTruths || []).map((t, i) => `V${i}: ${t}`).join('\n') || '(Aucune vérité personnalisée)';
		await interaction.update({ content: `Actions:\n${a}\n\nVérités:\n${v}`, embeds: [], components: [] });
	}

	async showAouvPromptToggleBase(interaction, disable) {
		const modal = new ModalBuilder().setCustomId(disable ? 'aouv_prompt_disable_base_modal' : 'aouv_prompt_enable_base_modal').setTitle(disable ? 'Désactiver prompt de base' : 'Réactiver prompt de base');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('numero').setLabel('Numéro (1..n) du prompt de base').setStyle(TextInputStyle.Short).setRequired(true))
		);
		await modalHandler.showModal(interaction, modal);
	}

	// ---- Modals handlers ----
	async handleAouvPromptAddModal(interaction) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const texte = interaction.fields.getTextInputValue('texte') || '';
		if (!['action','verite'].includes(kind) || !texte.trim()) return interaction.reply({ content: '❌ Paramètres invalides.', flags: 64 });
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { customActions: [], customTruths: [] };
		if (kind === 'action') cfg.customActions = [...(cfg.customActions||[]), texte]; else cfg.customTruths = [...(cfg.customTruths||[]), texte];
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.reply({ content: '✅ Ajouté.', flags: 64 });
	}

	async handleAouvPromptEditModal(interaction) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const index = parseInt(interaction.fields.getTextInputValue('index') || '-1', 10);
		const texte = interaction.fields.getTextInputValue('texte') || '';
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		if (kind === 'action') {
			if (!Array.isArray(cfg.customActions) || index < 0 || index >= cfg.customActions.length) return interaction.reply({ content: '❌ Indice invalide.', flags: 64 });
			cfg.customActions[index] = texte;
		} else if (kind === 'verite') {
			if (!Array.isArray(cfg.customTruths) || index < 0 || index >= cfg.customTruths.length) return interaction.reply({ content: '❌ Indice invalide.', flags: 64 });
			cfg.customTruths[index] = texte;
		} else {
			return interaction.reply({ content: '❌ Type invalide.', flags: 64 });
		}
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.reply({ content: '✅ Modifié.', flags: 64 });
	}

	async handleAouvPromptRemoveModal(interaction) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const index = parseInt(interaction.fields.getTextInputValue('index') || '-1', 10);
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		if (kind === 'action') {
			if (!Array.isArray(cfg.customActions) || index < 0 || index >= cfg.customActions.length) return interaction.reply({ content: '❌ Indice invalide.', flags: 64 });
			cfg.customActions.splice(index, 1);
		} else if (kind === 'verite') {
			if (!Array.isArray(cfg.customTruths) || index < 0 || index >= cfg.customTruths.length) return interaction.reply({ content: '❌ Indice invalide.', flags: 64 });
			cfg.customTruths.splice(index, 1);
		} else {
			return interaction.reply({ content: '❌ Type invalide.', flags: 64 });
		}
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.reply({ content: '✅ Supprimé.', flags: 64 });
	}

	async handleAouvPromptBaseModal(interaction, disable) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const numero = parseInt(interaction.fields.getTextInputValue('numero') || '0', 10);
		const idx = Math.max(1, numero) - 1;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		const key = kind === 'action' ? 'disabledBaseActions' : 'disabledBaseTruths';
		const set = new Set(cfg[key] || []);
		if (disable) set.add(idx); else set.delete(idx);
		cfg[key] = Array.from(set);
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.reply({ content: `✅ ${disable ? 'Désactivé' : 'Réactivé'}: ${kind} #${numero}`, flags: 64 });
	}

	async showAouvPromptListBaseModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_prompt_list_base_modal').setTitle('Lister prompts intégrés');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('page').setLabel('Page (>=1)').setStyle(TextInputStyle.Short).setRequired(false))
		);
		await modalHandler.showModal(interaction, modal);
	}

	async handleAouvPromptListBaseModal(interaction) {
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const pageInput = interaction.fields.getTextInputValue('page') || '1';
		const page = Math.max(1, parseInt(pageInput, 10) || 1);
		const { BASE_ACTIONS, BASE_TRUTHS } = require('../utils/aouvPrompts');
		const list = kind === 'action' ? BASE_ACTIONS : kind === 'verite' ? BASE_TRUTHS : null;
		if (!list) return interaction.reply({ content: '❌ Type invalide.', flags: 64 });
		const per = 20; const start = (page - 1) * per; const slice = list.slice(start, start + per);
		if (!slice.length) return interaction.reply({ content: 'Aucune entrée à cette page.', flags: 64 });
		const lines = slice.map((t, i) => `${start + i + 1}. ${t}`);
		await interaction.reply({ content: lines.join('\n'), flags: 64 });
	}

	async showAouvPromptOverrideBaseModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_prompt_override_base_modal').setTitle('Remplacer prompt intégré');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('numero').setLabel('Numéro (1..n) du prompt de base').setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('texte').setLabel('Nouveau contenu (remplacement)').setStyle(TextInputStyle.Paragraph).setRequired(true))
		);
		await modalHandler.showModal(interaction, modal);
	}

	async showAouvPromptResetOverrideModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_prompt_reset_override_base_modal').setTitle('Réinitialiser remplacement intégré');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('numero').setLabel('Numéro (1..n) du prompt de base').setStyle(TextInputStyle.Short).setRequired(true))
		);
		await modalHandler.showModal(interaction, modal);
	}

	async handleAouvPromptOverrideModal(interaction) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const numero = parseInt(interaction.fields.getTextInputValue('numero') || '0', 10);
		const idx = Math.max(1, numero) - 1;
		const texte = interaction.fields.getTextInputValue('texte') || '';
		if (!['action','verite'].includes(kind) || !texte.trim()) return interaction.reply({ content: '❌ Paramètres invalides.', flags: 64 });
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		const key = kind === 'action' ? 'baseActionOverrides' : 'baseTruthOverrides';
		cfg[key] = cfg[key] || {};
		cfg[key][idx] = texte;
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.reply({ content: `✅ Remplacement enregistré pour ${kind} #${numero}.`, flags: 64 });
	}

	async handleAouvPromptResetOverrideModal(interaction) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const numero = parseInt(interaction.fields.getTextInputValue('numero') || '0', 10);
		const idx = Math.max(1, numero) - 1;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		const key = kind === 'action' ? 'baseActionOverrides' : 'baseTruthOverrides';
		if (cfg[key] && Object.prototype.hasOwnProperty.call(cfg[key], idx)) {
			delete cfg[key][idx];
			all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
			return interaction.reply({ content: `✅ Override supprimé pour ${kind} #${numero}.`, flags: 64 });
		}
		return interaction.reply({ content: 'ℹ️ Aucun override trouvé pour ce numéro.', flags: 64 });
	}

	// ===== NSFW: Prompts CRUD et base/overrides =====
	async showAouvNsfwPromptAddModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_nsfw_prompt_add_modal').setTitle('Ajouter un prompt NSFW');
		const kind = new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true);
		const texte = new TextInputBuilder().setCustomId('texte').setLabel('Contenu du prompt (18+, soft)').setStyle(TextInputStyle.Paragraph).setRequired(true);
		modal.addComponents(new ActionRowBuilder().addComponents(kind), new ActionRowBuilder().addComponents(texte));
		await modalHandler.showModal(interaction, modal);
	}

	async showAouvNsfwPromptEditPicker(interaction) {
		const guildId = interaction.guild.id;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { nsfwCustomActions: [], nsfwCustomTruths: [] };
		const actions = Array.isArray(cfg.nsfwCustomActions) ? cfg.nsfwCustomActions : [];
		const truths = Array.isArray(cfg.nsfwCustomTruths) ? cfg.nsfwCustomTruths : [];

		const embed = new EmbedBuilder()
			.setColor('#e91e63')
			.setTitle('🔞 Choisir un prompt NSFW à modifier')
			.setDescription('Sélectionnez un prompt NSFW, puis éditez-le.');

		const actionSelect = new StringSelectMenuBuilder()
			.setCustomId('aouv_nsfw_prompt_edit_select_action')
			.setPlaceholder(actions.length ? 'Choisir un prompt Action (NSFW)...' : 'Aucun prompt Action NSFW')
			.setMinValues(1)
			.setMaxValues(1)
			.setDisabled(actions.length === 0);
		actions.slice(0, 25).forEach((t, i) => {
			const idx = i.toString();
			actionSelect.addOptions({ label: t.length > 95 ? t.slice(0, 95) + '…' : t, value: idx });
		});

		const truthSelect = new StringSelectMenuBuilder()
			.setCustomId('aouv_nsfw_prompt_edit_select_truth')
			.setPlaceholder(truths.length ? 'Choisir un prompt Vérité (NSFW)...' : 'Aucun prompt Vérité NSFW')
			.setMinValues(1)
			.setMaxValues(1)
			.setDisabled(truths.length === 0);
		truths.slice(0, 25).forEach((t, i) => {
			const idx = i.toString();
			truthSelect.addOptions({ label: t.length > 95 ? t.slice(0, 95) + '…' : t, value: idx });
		});

		await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(actionSelect), new ActionRowBuilder().addComponents(truthSelect)] });
	}

	async handleAouvNsfwPromptEditSelect(interaction, kind) {
		const guildId = interaction.guild.id;
		const index = parseInt(interaction.values[0], 10);
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { nsfwCustomActions: [], nsfwCustomTruths: [] };
		const list = kind === 'action' ? (cfg.nsfwCustomActions || []) : (cfg.nsfwCustomTruths || []);
		const currentText = list[index] || '';

		const modal = new ModalBuilder().setCustomId('aouv_nsfw_prompt_edit_modal').setTitle('Modifier un prompt NSFW');
		const kindInput = new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true).setValue(kind);
		const indexInput = new TextInputBuilder().setCustomId('index').setLabel('Indice (via liste)').setStyle(TextInputStyle.Short).setRequired(true).setValue(String(index));
		const texteInput = new TextInputBuilder().setCustomId('texte').setLabel('Nouveau contenu (18+, soft)').setStyle(TextInputStyle.Paragraph).setRequired(true).setValue(currentText);
		modal.addComponents(new ActionRowBuilder().addComponents(kindInput), new ActionRowBuilder().addComponents(indexInput), new ActionRowBuilder().addComponents(texteInput));
		await modalHandler.showModal(interaction, modal);
	}

	async showAouvNsfwPromptRemoveModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_nsfw_prompt_remove_modal').setTitle('Supprimer un prompt NSFW');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('index').setLabel('Indice à supprimer').setStyle(TextInputStyle.Short).setRequired(true))
		);
		await modalHandler.showModal(interaction, modal);
	}

	async showAouvNsfwPromptListCustom(interaction) {
		const guildId = interaction.guild.id;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { nsfwCustomActions: [], nsfwCustomTruths: [] };
		const a = (cfg.nsfwCustomActions || []).map((t, i) => `A${i}: ${t}`).join('\n') || '(Aucune action NSFW personnalisée)';
		const v = (cfg.nsfwCustomTruths || []).map((t, i) => `V${i}: ${t}`).join('\n') || '(Aucune vérité NSFW personnalisée)';
		await interaction.update({ content: `NSFW — Actions:\n${a}\n\nNSFW — Vérités:\n${v}`, embeds: [], components: [] });
	}

	async showAouvNsfwPromptToggleBase(interaction, disable) {
		const modal = new ModalBuilder().setCustomId(disable ? 'aouv_nsfw_prompt_disable_base_modal' : 'aouv_nsfw_prompt_enable_base_modal').setTitle(disable ? 'Désactiver prompt NSFW de base' : 'Réactiver prompt NSFW de base');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('numero').setLabel('Numéro (1..n) du prompt NSFW de base').setStyle(TextInputStyle.Short).setRequired(true))
		);
		await modalHandler.showModal(interaction, modal);
	}

	async showAouvNsfwPromptListBaseModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_nsfw_prompt_list_base_modal').setTitle('Lister prompts NSFW intégrés');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('page').setLabel('Page (>=1)').setStyle(TextInputStyle.Short).setRequired(false))
		);
		await modalHandler.showModal(interaction, modal);
	}

	async handleAouvNsfwPromptListBaseModal(interaction) {
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const pageInput = interaction.fields.getTextInputValue('page') || '1';
		const page = Math.max(1, parseInt(pageInput, 10) || 1);
		const { BASE_NSFW_ACTIONS, BASE_NSFW_TRUTHS } = require('../utils/aouvPrompts');
		const list = kind === 'action' ? BASE_NSFW_ACTIONS : kind === 'verite' ? BASE_NSFW_TRUTHS : null;
		if (!list) return interaction.reply({ content: '❌ Type invalide.', flags: 64 });
		const per = 20; const start = (page - 1) * per; const slice = list.slice(start, start + per);
		if (!slice.length) return interaction.reply({ content: 'Aucune entrée à cette page.', flags: 64 });
		const lines = slice.map((t, i) => `${start + i + 1}. ${t}`);
		await interaction.reply({ content: lines.join('\n'), flags: 64 });
	}

	async showAouvNsfwPromptOverrideBaseModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_nsfw_prompt_override_base_modal').setTitle('Remplacer prompt NSFW intégré');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('numero').setLabel('Numéro (1..n) du prompt NSFW de base').setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('texte').setLabel('Nouveau contenu (NSFW soft)').setStyle(TextInputStyle.Paragraph).setRequired(true))
		);
		await modalHandler.showModal(interaction, modal);
	}

	async showAouvNsfwPromptResetOverrideModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_nsfw_prompt_reset_override_base_modal').setTitle('Réinitialiser remplacement NSFW');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('numero').setLabel('Numéro (1..n) du prompt NSFW de base').setStyle(TextInputStyle.Short).setRequired(true))
		);
		await modalHandler.showModal(interaction, modal);
	}

	async handleAouvNsfwPromptAddModal(interaction) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const texte = interaction.fields.getTextInputValue('texte') || '';
		if (!['action','verite'].includes(kind) || !texte.trim()) return interaction.reply({ content: '❌ Paramètres invalides.', flags: 64 });
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || { nsfwCustomActions: [], nsfwCustomTruths: [] };
		if (kind === 'action') cfg.nsfwCustomActions = [...(cfg.nsfwCustomActions||[]), texte]; else cfg.nsfwCustomTruths = [...(cfg.nsfwCustomTruths||[]), texte];
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.reply({ content: '✅ Ajouté (NSFW).', flags: 64 });
	}

	async handleAouvNsfwPromptEditModal(interaction) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const index = parseInt(interaction.fields.getTextInputValue('index') || '-1', 10);
		const texte = interaction.fields.getTextInputValue('texte') || '';
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		if (kind === 'action') {
			if (!Array.isArray(cfg.nsfwCustomActions) || index < 0 || index >= cfg.nsfwCustomActions.length) return interaction.reply({ content: '❌ Indice invalide.', flags: 64 });
			cfg.nsfwCustomActions[index] = texte;
		} else if (kind === 'verite') {
			if (!Array.isArray(cfg.nsfwCustomTruths) || index < 0 || index >= cfg.nsfwCustomTruths.length) return interaction.reply({ content: '❌ Indice invalide.', flags: 64 });
			cfg.nsfwCustomTruths[index] = texte;
		} else {
			return interaction.reply({ content: '❌ Type invalide.', flags: 64 });
		}
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.reply({ content: '✅ Modifié (NSFW).', flags: 64 });
	}

	async handleAouvNsfwPromptRemoveModal(interaction) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const index = parseInt(interaction.fields.getTextInputValue('index') || '-1', 10);
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		if (kind === 'action') {
			if (!Array.isArray(cfg.nsfwCustomActions) || index < 0 || index >= cfg.nsfwCustomActions.length) return interaction.reply({ content: '❌ Indice invalide.', flags: 64 });
			cfg.nsfwCustomActions.splice(index, 1);
		} else if (kind === 'verite') {
			if (!Array.isArray(cfg.nsfwCustomTruths) || index < 0 || index >= cfg.nsfwCustomTruths.length) return interaction.reply({ content: '❌ Indice invalide.', flags: 64 });
			cfg.nsfwCustomTruths.splice(index, 1);
		} else {
			return interaction.reply({ content: '❌ Type invalide.', flags: 64 });
		}
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.reply({ content: '✅ Supprimé (NSFW).', flags: 64 });
	}

	async handleAouvNsfwPromptBaseModal(interaction, disable) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const numero = parseInt(interaction.fields.getTextInputValue('numero') || '0', 10);
		const idx = Math.max(1, numero) - 1;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		const key = kind === 'action' ? 'nsfwDisabledBaseActions' : 'nsfwDisabledBaseTruths';
		const set = new Set(cfg[key] || []);
		if (disable) set.add(idx); else set.delete(idx);
		cfg[key] = Array.from(set);
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.reply({ content: `✅ ${disable ? 'Désactivé' : 'Réactivé'} (NSFW): ${kind} #${numero}`, flags: 64 });
	}

	async handleAouvNsfwPromptListBaseModal(interaction) {
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const pageInput = interaction.fields.getTextInputValue('page') || '1';
		const page = Math.max(1, parseInt(pageInput, 10) || 1);
		const { BASE_NSFW_ACTIONS, BASE_NSFW_TRUTHS } = require('../utils/aouvPrompts');
		const list = kind === 'action' ? BASE_NSFW_ACTIONS : kind === 'verite' ? BASE_NSFW_TRUTHS : null;
		if (!list) return interaction.reply({ content: '❌ Type invalide.', flags: 64 });
		const per = 20; const start = (page - 1) * per; const slice = list.slice(start, start + per);
		if (!slice.length) return interaction.reply({ content: 'Aucune entrée à cette page.', flags: 64 });
		const lines = slice.map((t, i) => `${start + i + 1}. ${t}`);
		await interaction.reply({ content: lines.join('\n'), flags: 64 });
	}

	async handleAouvNsfwPromptOverrideModal(interaction) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const numero = parseInt(interaction.fields.getTextInputValue('numero') || '0', 10);
		const idx = Math.max(1, numero) - 1;
		const texte = interaction.fields.getTextInputValue('texte') || '';
		if (!['action','verite'].includes(kind) || !texte.trim()) return interaction.reply({ content: '❌ Paramètres invalides.', flags: 64 });
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		const key = kind === 'action' ? 'nsfwBaseActionOverrides' : 'nsfwBaseTruthOverrides';
		cfg[key] = cfg[key] || {};
		cfg[key][idx] = texte;
		all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
		await interaction.reply({ content: `✅ Remplacement NSFW enregistré pour ${kind} #${numero}.`, flags: 64 });
	}

	async handleAouvNsfwPromptResetOverrideModal(interaction) {
		const guildId = interaction.guild.id;
		const kind = (interaction.fields.getTextInputValue('kind') || '').toLowerCase();
		const numero = parseInt(interaction.fields.getTextInputValue('numero') || '0', 10);
		const idx = Math.max(1, numero) - 1;
		const all = await this.dataManager.loadData('aouv_config.json', {});
		const cfg = all[guildId] || {};
		const key = kind === 'action' ? 'nsfwBaseActionOverrides' : 'nsfwBaseTruthOverrides';
		if (cfg[key] && Object.prototype.hasOwnProperty.call(cfg[key], idx)) {
			delete cfg[key][idx];
			all[guildId] = cfg; await this.dataManager.saveData('aouv_config.json', all);
			return interaction.reply({ content: `✅ Override NSFW supprimé pour ${kind} #${numero}.`, flags: 64 });
		}
		return interaction.reply({ content: 'ℹ️ Aucun override NSFW trouvé pour ce numéro.', flags: 64 });
	}
}

module.exports = AouvConfigHandler;