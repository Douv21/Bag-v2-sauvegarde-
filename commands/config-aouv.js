const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-aouv')
        .setDescription('Configuration complète du jeu Action ou Vérité (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    	async execute(interaction) {
		if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return await interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', flags: 64 });
		}

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
                { label: '📝+ Ajouter plusieurs prompts', value: 'prompt_add_bulk', description: 'Ajouter plusieurs prompts en une fois' },
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
                { label: '🔞+ Ajouter plusieurs prompts NSFW', value: 'nsfw_prompt_add_bulk', description: 'Ajouter plusieurs prompts 18+ en une fois' },
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
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });

        // Le menu sera géré par le MainRouterHandler via les interactions

    }
};