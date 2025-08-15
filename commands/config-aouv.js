const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-aouv')
        .setDescription('Configuration complète du jeu Action ou Vérité (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
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
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });

        // Afficher immédiatement le menu AouV depuis le handler indépendant si besoin
        try {
            const AouvConfigHandler = require('../handlers/AouvConfigHandler');
            const dataManager = require('../utils/simpleDataManager');
            const aouvHandler = new AouvConfigHandler(dataManager);
            await aouvHandler.showAouvMenu({ update: (p)=>interaction.editReply(p) });
        } catch (_) {}

    }
};