const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');

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
				{ label: '✅ Réactiver prompt de base', value: 'prompt_enable_base', description: 'Réactiver un prompt intégré' }
			]);

		const row = new ActionRowBuilder().addComponents(select);
		await interaction.update({ embeds: [embed], components: [row] });
	}

	async handleAouvSelect(interaction) {
		const choice = interaction.values[0];
		if (choice === 'back_main') return this.showMainMenu(interaction);

		if (choice === 'channels') return this.showAouvChannelsMenu(interaction);
		if (choice === 'prompt_add') return this.showAouvPromptAddModal(interaction);
		if (choice === 'prompt_edit') return this.showAouvPromptEditPicker(interaction);
		if (choice === 'prompt_remove') return this.showAouvPromptRemoveModal(interaction);
		if (choice === 'prompt_list_custom') return this.showAouvPromptListCustom(interaction);
		if (choice === 'prompt_list_base') return this.showAouvPromptListBaseModal(interaction);
		if (choice === 'prompt_override_base') return this.showAouvPromptOverrideBaseModal(interaction);
		if (choice === 'prompt_reset_override') return this.showAouvPromptResetOverrideModal(interaction);
		if (choice === 'prompt_disable_base') return this.showAouvPromptToggleBase(interaction, true);
		if (choice === 'prompt_enable_base') return this.showAouvPromptToggleBase(interaction, false);
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

	// ---- Prompts CRUD ----
	async showAouvPromptAddModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_prompt_add_modal').setTitle('Ajouter un prompt AouV');
		const kind = new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true);
		const texte = new TextInputBuilder().setCustomId('texte').setLabel('Contenu du prompt').setStyle(TextInputStyle.Paragraph).setRequired(true);
		modal.addComponents(new ActionRowBuilder().addComponents(kind), new ActionRowBuilder().addComponents(texte));
		await interaction.showModal(modal);
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
		await interaction.showModal(modal);
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
		await interaction.showModal(modal);
	}

	async showAouvPromptRemoveModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_prompt_remove_modal').setTitle('Supprimer un prompt perso');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('index').setLabel('Indice à supprimer').setStyle(TextInputStyle.Short).setRequired(true))
		);
		await interaction.showModal(modal);
	}

	async showAouvPromptListCustom(interaction) {
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
		await interaction.showModal(modal);
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
		await interaction.showModal(modal);
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
		await interaction.showModal(modal);
	}

	async showAouvPromptResetOverrideModal(interaction) {
		const modal = new ModalBuilder().setCustomId('aouv_prompt_reset_override_base_modal').setTitle('Réinitialiser remplacement intégré');
		modal.addComponents(
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kind').setLabel("Type ('action' ou 'verite')").setStyle(TextInputStyle.Short).setRequired(true)),
			new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('numero').setLabel('Numéro (1..n) du prompt de base').setStyle(TextInputStyle.Short).setRequired(true))
		);
		await interaction.showModal(modal);
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
}

module.exports = AouvConfigHandler;