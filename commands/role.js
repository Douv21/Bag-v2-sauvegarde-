const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('🎭 Système complet de gestion des rôles personnalisés')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 Afficher tous les rôles disponibles')
                .addStringOption(option =>
                    option.setName('categorie')
                        .setDescription('Filtrer par catégorie')
                        .setRequired(false)
                        .addChoices(
                            { name: '🎨 Couleurs', value: 'couleurs' },
                            { name: '🎮 Hobbies', value: 'hobbies' },
                            { name: '🔔 Notifications', value: 'notifications' },
                            { name: '🌍 Région', value: 'region' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('✅ Obtenir un rôle')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle à obtenir')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('❌ Retirer un rôle')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle à retirer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mes-roles')
                .setDescription('👤 Voir vos rôles personnalisés')
                .addUserOption(option =>
                    option.setName('utilisateur')
                        .setDescription('Utilisateur à vérifier (optionnel)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('🆕 Créer un nouveau rôle (Admin)')
                .addStringOption(option =>
                    option.setName('nom')
                        .setDescription('Nom du rôle')
                        .setRequired(true)
                        .setMaxLength(32)
                )
                .addStringOption(option =>
                    option.setName('categorie')
                        .setDescription('Catégorie du rôle')
                        .setRequired(true)
                        .addChoices(
                            { name: '🎨 Couleurs', value: 'couleurs' },
                            { name: '🎮 Hobbies', value: 'hobbies' },
                            { name: '🔔 Notifications', value: 'notifications' },
                            { name: '🌍 Région', value: 'region' }
                        )
                )
                .addStringOption(option =>
                    option.setName('couleur')
                        .setDescription('Couleur du rôle (hex, ex: #FF5733)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('Emoji pour le rôle')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description du rôle')
                        .setRequired(false)
                        .setMaxLength(100)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('🗑️ Supprimer un rôle (Admin)')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle à supprimer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('🎛️ Panneau interactif de sélection des rôles')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('⚙️ Configuration du système de rôles (Admin)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('category')
                .setDescription('📁 Gérer les catégories de rôles (Admin)')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action à effectuer')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Créer', value: 'create' },
                            { name: 'Modifier', value: 'edit' },
                            { name: 'Supprimer', value: 'delete' }
                        )
                )
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('ID de la catégorie')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('🚀 Initialiser le système avec des rôles prédéfinis (Admin)')
                .addBooleanOption(option =>
                    option.setName('force')
                        .setDescription('Forcer la création même si des rôles existent déjà')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('gradient')
                .setDescription('🌈 Installer des rôles uniques avec dégradés (Admin)')
                .addBooleanOption(option =>
                    option.setName('force')
                        .setDescription('Forcer la création même si des rôles existent déjà')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const roleManager = interaction.client.roleManager;
        
        if (!roleManager) {
            return await interaction.reply({
                content: '❌ Le système de rôles n\'est pas disponible.',
                ephemeral: true
            });
        }

        try {
            switch (subcommand) {
                case 'list':
                    await this.handleList(interaction, roleManager);
                    break;
                case 'get':
                    await this.handleGet(interaction, roleManager);
                    break;
                case 'remove':
                    await this.handleRemove(interaction, roleManager);
                    break;
                case 'mes-roles':
                    await this.handleMyRoles(interaction, roleManager);
                    break;
                case 'create':
                    await this.handleCreate(interaction, roleManager);
                    break;
                case 'delete':
                    await this.handleDelete(interaction, roleManager);
                    break;
                case 'panel':
                    await this.handlePanel(interaction, roleManager);
                    break;
                case 'config':
                    await this.handleConfig(interaction, roleManager);
                    break;
                case 'category':
                    await this.handleCategory(interaction, roleManager);
                    break;
                case 'setup':
                    await this.handleSetup(interaction, roleManager);
                    break;
                case 'gradient':
                    await this.handleGradient(interaction, roleManager);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Sous-commande non reconnue.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Erreur commande role:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erreur')
                .setDescription('Une erreur s\'est produite lors de l\'exécution de la commande.')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleList(interaction, roleManager) {
        const category = interaction.options.getString('categorie');
        const embed = roleManager.generateRoleListEmbed(interaction.guild, category);
        
        if (!embed) {
            return await interaction.reply({
                content: '❌ Catégorie introuvable.',
                ephemeral: true
            });
        }

        await interaction.reply({ embeds: [embed] });
    },

    async handleGet(interaction, roleManager) {
        const role = interaction.options.getRole('role');
        const member = interaction.member;

        // Vérifier si c'est un rôle géré par le système
        const { roles } = roleManager.getRoleData(interaction.guild.id);
        if (!roles.roles[role.id]) {
            return await interaction.reply({
                content: '❌ Ce rôle n\'est pas géré par le système de rôles personnalisés.',
                ephemeral: true
            });
        }

        // Vérifier si l'utilisateur a déjà ce rôle
        if (member.roles.cache.has(role.id)) {
            return await interaction.reply({
                content: `❌ Vous avez déjà le rôle **${role.name}**.`,
                ephemeral: true
            });
        }

        const result = await roleManager.assignRole(member, role.id);
        
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Rôle Attribué')
                .setDescription(`Vous avez reçu le rôle **${result.role.name}** !`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            await interaction.reply({
                content: `❌ Erreur: ${result.error}`,
                ephemeral: true
            });
        }
    },

    async handleRemove(interaction, roleManager) {
        const role = interaction.options.getRole('role');
        const member = interaction.member;

        // Vérifier si c'est un rôle géré par le système
        const { roles } = roleManager.getRoleData(interaction.guild.id);
        if (!roles.roles[role.id]) {
            return await interaction.reply({
                content: '❌ Ce rôle n\'est pas géré par le système de rôles personnalisés.',
                ephemeral: true
            });
        }

        const result = await roleManager.removeRole(member, role.id);
        
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#FF6600')
                .setTitle('✅ Rôle Retiré')
                .setDescription(`Le rôle **${result.role.name}** vous a été retiré.`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            await interaction.reply({
                content: `❌ Erreur: ${result.error}`,
                ephemeral: true
            });
        }
    },

    async handleMyRoles(interaction, roleManager) {
        const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        
        const embed = roleManager.generateUserRolesEmbed(targetMember);
        await interaction.reply({ embeds: [embed] });
    },

    async handleCreate(interaction, roleManager) {
        // Vérifier les permissions
        if (!roleManager.canCreateRoles(interaction.member, interaction.guild.id)) {
            return await interaction.reply({
                content: '❌ Vous n\'avez pas la permission de créer des rôles.',
                ephemeral: true
            });
        }

        const name = interaction.options.getString('nom');
        const category = interaction.options.getString('categorie');
        const color = interaction.options.getString('couleur');
        const emoji = interaction.options.getString('emoji');
        const description = interaction.options.getString('description');

        // Valider la couleur si fournie
        if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
            return await interaction.reply({
                content: '❌ Format de couleur invalide. Utilisez le format hex: #FF5733',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const result = await roleManager.createCustomRole(interaction.guild, {
            name,
            category,
            color,
            emoji,
            description,
            mentionable: false
        });

        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor(color || '#5865F2')
                .setTitle('✅ Rôle Créé')
                .setDescription(`Le rôle **${result.role.name}** a été créé avec succès !`)
                .addFields(
                    { name: 'Catégorie', value: category, inline: true },
                    { name: 'ID', value: result.role.id, inline: true }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({
                content: `❌ Erreur lors de la création: ${result.error}`
            });
        }
    },

    async handleDelete(interaction, roleManager) {
        // Vérifier les permissions
        if (!roleManager.canCreateRoles(interaction.member, interaction.guild.id)) {
            return await interaction.reply({
                content: '❌ Vous n\'avez pas la permission de supprimer des rôles.',
                ephemeral: true
            });
        }

        const role = interaction.options.getRole('role');
        
        // Vérifier si c'est un rôle géré par le système
        const { roles } = roleManager.getRoleData(interaction.guild.id);
        if (!roles.roles[role.id]) {
            return await interaction.reply({
                content: '❌ Ce rôle n\'est pas géré par le système de rôles personnalisés.',
                ephemeral: true
            });
        }

        // Confirmation
        const confirmEmbed = new EmbedBuilder()
            .setColor('#FF6600')
            .setTitle('⚠️ Confirmation de Suppression')
            .setDescription(`Êtes-vous sûr de vouloir supprimer le rôle **${role.name}** ?\n\nCette action est irréversible et retirera le rôle à tous les membres qui l'ont.`);

        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_delete_role_${role.id}`)
                    .setLabel('Confirmer')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_delete_role')
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [confirmEmbed],
            components: [confirmRow],
            ephemeral: true
        });
    },

    async handlePanel(interaction, roleManager) {
        const { roles } = roleManager.getRoleData(interaction.guild.id);
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎭 Panneau de Rôles Interactif')
            .setDescription('Sélectionnez une catégorie pour voir les rôles disponibles !')
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('role_category_select')
            .setPlaceholder('Choisissez une catégorie...')
            .addOptions(
                Object.entries(roles.categories).map(([id, category]) => ({
                    label: category.name.replace(/^\p{Emoji}\s*/u, ''),
                    value: id,
                    description: category.description.substring(0, 100),
                    emoji: category.name.match(/^\p{Emoji}/u)?.[0]
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    },

    async handleConfig(interaction, roleManager) {
        // Vérifier les permissions admin
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({
                content: '❌ Vous devez avoir la permission "Gérer les rôles" pour accéder à la configuration.',
                ephemeral: true
            });
        }

        const { permissions } = roleManager.getRoleData(interaction.guild.id);
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('⚙️ Configuration du Système de Rôles')
            .addFields(
                { 
                    name: 'Limite de rôles par utilisateur', 
                    value: permissions.maxRolesPerUser.toString(), 
                    inline: true 
                },
                { 
                    name: 'Couleurs autorisées', 
                    value: permissions.allowedColors.length.toString(), 
                    inline: true 
                }
            )
            .setTimestamp();

        const configRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_max_roles')
                    .setLabel('Limite Rôles')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_colors')
                    .setLabel('Couleurs')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_permissions')
                    .setLabel('Permissions')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({
            embeds: [embed],
            components: [configRow],
            ephemeral: true
        });
    },

    async handleCategory(interaction, roleManager) {
        // Vérifier les permissions admin
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({
                content: '❌ Vous devez avoir la permission "Gérer les rôles" pour gérer les catégories.',
                ephemeral: true
            });
        }

        const action = interaction.options.getString('action');
        const categoryId = interaction.options.getString('id');

        switch (action) {
            case 'create':
                // Ouvrir un modal pour créer une catégorie
                const createModal = new ModalBuilder()
                    .setCustomId(`create_category_${categoryId}`)
                    .setTitle('Créer une Catégorie');

                const nameInput = new TextInputBuilder()
                    .setCustomId('category_name')
                    .setLabel('Nom de la catégorie')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(50)
                    .setRequired(true);

                const descInput = new TextInputBuilder()
                    .setCustomId('category_description')
                    .setLabel('Description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(200)
                    .setRequired(true);

                const exclusiveInput = new TextInputBuilder()
                    .setCustomId('category_exclusive')
                    .setLabel('Exclusif ? (oui/non)')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(3)
                    .setValue('non')
                    .setRequired(true);

                createModal.addComponents(
                    new ActionRowBuilder().addComponents(nameInput),
                    new ActionRowBuilder().addComponents(descInput),
                    new ActionRowBuilder().addComponents(exclusiveInput)
                );

                await interaction.showModal(createModal);
                break;

            default:
                await interaction.reply({
                    content: '❌ Action non implémentée.',
                    ephemeral: true
                });
        }
    },

    async handleSetup(interaction, roleManager) {
        // Vérifier les permissions admin
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({
                content: '❌ Vous devez avoir la permission "Gérer les rôles" pour initialiser le système.',
                ephemeral: true
            });
        }

        const force = interaction.options.getBoolean('force') || false;
        
        // Vérifier si des rôles existent déjà
        const { roles } = roleManager.getRoleData(interaction.guild.id);
        const existingRoles = Object.keys(roles.roles).length;
        
        if (existingRoles > 0 && !force) {
            const embed = new EmbedBuilder()
                .setColor('#FF6600')
                .setTitle('⚠️ Rôles Existants Détectés')
                .setDescription(`Ce serveur a déjà **${existingRoles}** rôle(s) personnalisé(s).\n\nUtilisez \`force: true\` pour créer les rôles prédéfinis en plus des existants.`)
                .addFields({
                    name: 'Rôles prédéfinis disponibles',
                    value: '• 🎨 **Couleurs** (8 rôles)\n• 🎮 **Hobbies** (10 rôles)\n• 🔔 **Notifications** (5 rôles)\n• 🌍 **Région** (8 rôles)\n• ⭐ **Niveau** (4 rôles)\n• ✨ **Spéciaux** (5 rôles)',
                    inline: false
                })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        // Importer et créer les rôles par défaut
        const { createDefaultRoles } = require('../utils/defaultRoles');
        
        try {
            const results = await createDefaultRoles(interaction.guild, roleManager);
            
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🚀 Initialisation Terminée !')
                .setDescription(`Le système de rôles a été initialisé avec succès !`)
                .addFields(
                    { name: '✅ Rôles créés', value: results.success.toString(), inline: true },
                    { name: '❌ Erreurs', value: results.errors.toString(), inline: true },
                    { name: '📊 Total', value: (results.success + results.errors).toString(), inline: true }
                )
                .setTimestamp();

            // Ajouter les détails si il y a des erreurs
            if (results.errors > 0) {
                const errorDetails = results.details
                    .filter(detail => detail.startsWith('❌'))
                    .slice(0, 10) // Limiter l'affichage
                    .join('\n');
                
                if (errorDetails) {
                    embed.addFields({
                        name: '⚠️ Détails des erreurs',
                        value: errorDetails,
                        inline: false
                    });
                }
            }

            embed.addFields({
                name: '🎭 Utilisation',
                value: '• `/role panel` - Panneau interactif\n• `/role list` - Voir tous les rôles\n• `/role get` - Obtenir un rôle\n• `/role mes-roles` - Voir vos rôles',
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur setup rôles:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erreur d\'Initialisation')
                .setDescription(`Une erreur s'est produite lors de l'initialisation:\n\`\`\`${error.message}\`\`\``)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleGradient(interaction, roleManager) {
        // Vérifier les permissions admin
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({
                content: '❌ Vous devez avoir la permission "Gérer les rôles" pour installer les rôles dégradés.',
                ephemeral: true
            });
        }

        const force = interaction.options.getBoolean('force') || false;
        
        // Vérifier si des rôles existent déjà
        const { roles } = roleManager.getRoleData(interaction.guild.id);
        const existingRoles = Object.keys(roles.roles).length;
        
        if (existingRoles > 0 && !force) {
            const { getGradientRolesStats } = require('../utils/gradientRoles');
            const stats = getGradientRolesStats();
            
            const embed = new EmbedBuilder()
                .setColor('#FF6600')
                .setTitle('⚠️ Rôles Existants Détectés')
                .setDescription(`Ce serveur a déjà **${existingRoles}** rôle(s) personnalisé(s).\n\nUtilisez \`force: true\` pour créer les rôles dégradés en plus des existants.`)
                .addFields({
                    name: '🌈 Rôles Dégradés Disponibles',
                    value: `• 💎 **Premium** (6 rôles légendaires)\n• 🌟 **Éléments Mystiques** (5 rôles épiques)\n• 🌌 **Entités Cosmiques** (4 rôles mythiques)\n• 💫 **Neon Dreams** (4 rôles néon)\n• 🌿 **Forces Naturelles** (4 rôles nature)\n• 🐉 **Créatures Mythiques** (4 rôles légendaires)\n\n**Total: ${stats.totalRoles} rôles uniques avec dégradés**`,
                    inline: false
                })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        // Importer et créer les rôles dégradés
        const { createGradientRoles, getGradientRolesStats } = require('../utils/gradientRoles');
        
        try {
            const results = await createGradientRoles(interaction.guild, roleManager);
            const stats = getGradientRolesStats();
            
            const embed = new EmbedBuilder()
                .setColor('#7289DA')
                .setTitle('🌈 Rôles Dégradés Installés !')
                .setDescription(`Collection exclusive de rôles avec des couleurs dégradées uniques !`)
                .addFields(
                    { name: '✅ Rôles créés', value: results.success.toString(), inline: true },
                    { name: '📁 Catégories', value: results.categories.toString(), inline: true },
                    { name: '❌ Erreurs', value: results.errors.toString(), inline: true }
                )
                .setTimestamp();

            // Ajouter les statistiques de rareté
            let rarityStats = '';
            const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'common'];
            const rarityEmojis = {
                'mythic': '⚜️',
                'legendary': '🌟',
                'epic': '💎',
                'rare': '✨',
                'common': '⚪'
            };

            for (const rarity of rarityOrder) {
                if (stats.rarityCount[rarity]) {
                    rarityStats += `${rarityEmojis[rarity]} **${rarity.toUpperCase()}**: ${stats.rarityCount[rarity]}\n`;
                }
            }

            if (rarityStats) {
                embed.addFields({
                    name: '🏆 Répartition par Rareté',
                    value: rarityStats,
                    inline: false
                });
            }

            // Ajouter les détails si il y a des erreurs
            if (results.errors > 0) {
                const errorDetails = results.details
                    .filter(detail => detail.startsWith('❌'))
                    .slice(0, 5) // Limiter l'affichage
                    .join('\n');
                
                if (errorDetails) {
                    embed.addFields({
                        name: '⚠️ Détails des erreurs',
                        value: errorDetails,
                        inline: false
                    });
                }
            }

            embed.addFields({
                name: '🎭 Fonctionnalités Spéciales',
                value: '🌈 **Dégradés de couleurs** - Chaque rôle a des couleurs uniques\n⚜️ **Système de rareté** - Mythique, Légendaire, Épique, Rare\n✦ **Noms stylisés** - Caractères Unicode spéciaux\n🎨 **Descriptions enrichies** - Informations détaillées',
                inline: false
            });

            embed.addFields({
                name: '🎮 Utilisation',
                value: '• `/role panel` - Interface interactive avec les nouveaux rôles\n• `/role list` - Voir tous les rôles dégradés\n• `/role mes-roles` - Affichage amélioré avec rareté',
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur setup rôles dégradés:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erreur d\'Installation')
                .setDescription(`Une erreur s'est produite lors de l'installation des rôles dégradés:\n\`\`\`${error.message}\`\`\``)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};