/**
 * GESTIONNAIRE D'INTERACTIONS POUR LE SYSTÈME DE RÔLES
 * Gère les boutons, menus et modals du système de rôles
 */

const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

class RoleInteractionHandler {
    constructor(roleManager) {
        this.roleManager = roleManager;
    }

    /**
     * Gère toutes les interactions liées aux rôles
     */
    async handleInteraction(interaction) {
        try {
            if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenu(interaction);
            } else if (interaction.isButton()) {
                await this.handleButton(interaction);
            } else if (interaction.isModalSubmit()) {
                await this.handleModal(interaction);
            }
        } catch (error) {
            console.error('Erreur interaction rôles:', error);
            
            const errorMessage = {
                content: '❌ Une erreur s\'est produite lors du traitement de votre interaction.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }

    /**
     * Gère les menus de sélection
     */
    async handleSelectMenu(interaction) {
        const { customId } = interaction;

        if (customId === 'role_category_select') {
            await this.handleCategorySelect(interaction);
        } else if (customId.startsWith('role_select_')) {
            await this.handleRoleSelect(interaction);
        }
    }

    /**
     * Gère la sélection d'une catégorie
     */
    async handleCategorySelect(interaction) {
        const categoryId = interaction.values[0];
        const { roles } = this.roleManager.getRoleData(interaction.guild.id);
        
        const category = roles.categories[categoryId];
        if (!category) {
            return await interaction.reply({
                content: '❌ Catégorie introuvable.',
                ephemeral: true
            });
        }

        // Créer l'embed de la catégorie
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(category.name)
            .setDescription(category.description)
            .setTimestamp();

        // Créer le menu de sélection des rôles
        const availableRoles = category.roles
            .map(roleId => {
                const roleInfo = roles.roles[roleId];
                const discordRole = interaction.guild.roles.cache.get(roleId);
                
                if (roleInfo && discordRole) {
                    return {
                        label: roleInfo.name,
                        value: roleId,
                        description: roleInfo.description.substring(0, 100),
                        emoji: roleInfo.emoji
                    };
                }
                return null;
            })
            .filter(Boolean)
            .slice(0, 25); // Limite Discord

        if (availableRoles.length === 0) {
            embed.addFields({
                name: 'Aucun rôle disponible',
                value: 'Cette catégorie ne contient aucun rôle pour le moment.',
                inline: false
            });
            
            return await interaction.update({ embeds: [embed], components: [] });
        }

        // Ajouter les informations sur les rôles à l'embed
        let roleList = '';
        const userRoles = interaction.member.roles.cache;
        
        for (const roleOption of availableRoles) {
            const hasRole = userRoles.has(roleOption.value);
            const status = hasRole ? '✅' : '⭕';
            const emoji = roleOption.emoji || '•';
            roleList += `${status} ${emoji} **${roleOption.label}**\n`;
        }

        embed.addFields({
            name: 'Rôles disponibles',
            value: roleList,
            inline: false
        });

        // Créer le menu de sélection
        const roleSelectMenu = new StringSelectMenuBuilder()
            .setCustomId(`role_select_${categoryId}`)
            .setPlaceholder('Choisissez un rôle...')
            .setMaxValues(category.exclusive ? 1 : Math.min(availableRoles.length, 10))
            .addOptions(availableRoles);

        const selectRow = new ActionRowBuilder().addComponents(roleSelectMenu);

        // Boutons d'action
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('role_back_to_categories')
                    .setLabel('← Retour aux catégories')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`role_remove_all_${categoryId}`)
                    .setLabel('Retirer tous')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(!category.roles.some(roleId => userRoles.has(roleId)))
            );

        await interaction.update({
            embeds: [embed],
            components: [selectRow, actionRow]
        });
    }

    /**
     * Gère la sélection de rôles
     */
    async handleRoleSelect(interaction) {
        const categoryId = interaction.customId.replace('role_select_', '');
        const selectedRoles = interaction.values;
        const member = interaction.member;
        
        await interaction.deferUpdate();

        const { roles } = this.roleManager.getRoleData(interaction.guild.id);
        const category = roles.categories[categoryId];
        
        if (!category) {
            return await interaction.editReply({
                content: '❌ Catégorie introuvable.',
                components: []
            });
        }

        const results = [];
        const userCurrentRoles = member.roles.cache;
        
        // Si la catégorie est exclusive, retirer tous les rôles de cette catégorie d'abord
        if (category.exclusive) {
            for (const roleId of category.roles) {
                if (userCurrentRoles.has(roleId) && !selectedRoles.includes(roleId)) {
                    const result = await this.roleManager.removeRole(member, roleId);
                    if (result.success) {
                        results.push(`❌ **${result.role.name}** retiré`);
                    }
                }
            }
        }

        // Traiter les rôles sélectionnés
        for (const roleId of selectedRoles) {
            const hasRole = userCurrentRoles.has(roleId);
            
            if (hasRole) {
                // Retirer le rôle
                const result = await this.roleManager.removeRole(member, roleId);
                if (result.success) {
                    results.push(`❌ **${result.role.name}** retiré`);
                } else {
                    results.push(`❌ Erreur: ${result.error}`);
                }
            } else {
                // Ajouter le rôle
                const result = await this.roleManager.assignRole(member, roleId);
                if (result.success) {
                    results.push(`✅ **${result.role.name}** ajouté`);
                } else {
                    results.push(`❌ Erreur: ${result.error}`);
                }
            }
        }

        // Créer l'embed de résultat
        const resultEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`🎭 Modification des rôles - ${category.name}`)
            .setDescription(results.join('\n') || 'Aucune modification effectuée.')
            .setTimestamp();

        // Retourner à la vue de la catégorie
        await this.handleCategorySelect(interaction);
        
        // Envoyer le résultat en message éphémère
        await interaction.followUp({
            embeds: [resultEmbed],
            ephemeral: true
        });
    }

    /**
     * Gère les boutons
     */
    async handleButton(interaction) {
        const { customId } = interaction;

        if (customId === 'role_back_to_categories') {
            await this.handleBackToCategories(interaction);
        } else if (customId.startsWith('role_remove_all_')) {
            await this.handleRemoveAll(interaction);
        } else if (customId.startsWith('confirm_delete_role_')) {
            await this.handleConfirmDeleteRole(interaction);
        } else if (customId === 'cancel_delete_role') {
            await this.handleCancelDeleteRole(interaction);
        } else if (customId.startsWith('config_')) {
            await this.handleConfigButton(interaction);
        }
    }

    /**
     * Retour aux catégories
     */
    async handleBackToCategories(interaction) {
        const { roles } = this.roleManager.getRoleData(interaction.guild.id);
        
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
        
        await interaction.update({
            embeds: [embed],
            components: [row]
        });
    }

    /**
     * Retire tous les rôles d'une catégorie
     */
    async handleRemoveAll(interaction) {
        const categoryId = interaction.customId.replace('role_remove_all_', '');
        const member = interaction.member;
        
        await interaction.deferUpdate();

        const { roles } = this.roleManager.getRoleData(interaction.guild.id);
        const category = roles.categories[categoryId];
        
        if (!category) {
            return await interaction.editReply({
                content: '❌ Catégorie introuvable.',
                components: []
            });
        }

        const results = [];
        const userCurrentRoles = member.roles.cache;

        for (const roleId of category.roles) {
            if (userCurrentRoles.has(roleId)) {
                const result = await this.roleManager.removeRole(member, roleId);
                if (result.success) {
                    results.push(`❌ **${result.role.name}** retiré`);
                }
            }
        }

        // Créer l'embed de résultat
        const resultEmbed = new EmbedBuilder()
            .setColor('#FF6600')
            .setTitle(`🗑️ Rôles retirés - ${category.name}`)
            .setDescription(results.join('\n') || 'Aucun rôle à retirer.')
            .setTimestamp();

        // Retourner à la vue de la catégorie
        await this.handleCategorySelect(interaction);
        
        // Envoyer le résultat en message éphémère
        await interaction.followUp({
            embeds: [resultEmbed],
            ephemeral: true
        });
    }

    /**
     * Confirme la suppression d'un rôle
     */
    async handleConfirmDeleteRole(interaction) {
        const roleId = interaction.customId.replace('confirm_delete_role_', '');
        
        await interaction.deferUpdate();
        
        const result = await this.roleManager.deleteCustomRole(interaction.guild, roleId);
        
        const embed = new EmbedBuilder()
            .setColor(result.success ? '#00FF00' : '#FF0000')
            .setTitle(result.success ? '✅ Rôle Supprimé' : '❌ Erreur')
            .setDescription(
                result.success 
                    ? 'Le rôle a été supprimé avec succès.'
                    : `Erreur lors de la suppression: ${result.error}`
            )
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed],
            components: []
        });
    }

    /**
     * Annule la suppression d'un rôle
     */
    async handleCancelDeleteRole(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#999999')
            .setTitle('❌ Suppression Annulée')
            .setDescription('La suppression du rôle a été annulée.')
            .setTimestamp();

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }

    /**
     * Gère les boutons de configuration
     */
    async handleConfigButton(interaction) {
        const action = interaction.customId.replace('config_', '');
        
        switch (action) {
            case 'max_roles':
                const maxRolesModal = new ModalBuilder()
                    .setCustomId('config_max_roles_modal')
                    .setTitle('Configuration - Limite de Rôles');

                const maxRolesInput = new TextInputBuilder()
                    .setCustomId('max_roles_input')
                    .setLabel('Nombre maximum de rôles par utilisateur')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(3)
                    .setRequired(true);

                maxRolesModal.addComponents(
                    new ActionRowBuilder().addComponents(maxRolesInput)
                );

                await interaction.showModal(maxRolesModal);
                break;

            default:
                await interaction.reply({
                    content: '❌ Configuration non implémentée.',
                    ephemeral: true
                });
        }
    }

    /**
     * Gère les modals
     */
    async handleModal(interaction) {
        const { customId } = interaction;

        if (customId.startsWith('create_category_')) {
            await this.handleCreateCategoryModal(interaction);
        } else if (customId === 'config_max_roles_modal') {
            await this.handleMaxRolesModal(interaction);
        }
    }

    /**
     * Gère la création de catégorie via modal
     */
    async handleCreateCategoryModal(interaction) {
        const categoryId = interaction.customId.replace('create_category_', '');
        const name = interaction.fields.getTextInputValue('category_name');
        const description = interaction.fields.getTextInputValue('category_description');
        const exclusiveInput = interaction.fields.getTextInputValue('category_exclusive').toLowerCase();
        const exclusive = exclusiveInput === 'oui' || exclusiveInput === 'yes' || exclusiveInput === 'true';

        const result = this.roleManager.createCategory(interaction.guild.id, categoryId, {
            name,
            description,
            exclusive
        });

        const embed = new EmbedBuilder()
            .setColor(result.success ? '#00FF00' : '#FF0000')
            .setTitle(result.success ? '✅ Catégorie Créée' : '❌ Erreur')
            .setDescription(
                result.success 
                    ? `La catégorie **${name}** a été créée avec succès !`
                    : `Erreur lors de la création: ${result.error}`
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    /**
     * Gère la configuration de la limite de rôles
     */
    async handleMaxRolesModal(interaction) {
        const maxRolesValue = interaction.fields.getTextInputValue('max_roles_input');
        const maxRoles = parseInt(maxRolesValue);

        if (isNaN(maxRoles) || maxRoles < 1 || maxRoles > 100) {
            return await interaction.reply({
                content: '❌ Veuillez entrer un nombre valide entre 1 et 100.',
                ephemeral: true
            });
        }

        // Mettre à jour la configuration
        const permData = this.roleManager.dataManager.getData('role_permissions') || {};
        if (!permData[interaction.guild.id]) {
            permData[interaction.guild.id] = {};
        }
        
        permData[interaction.guild.id].maxRolesPerUser = maxRoles;
        this.roleManager.dataManager.setData('role_permissions', permData);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Configuration Mise à Jour')
            .setDescription(`La limite de rôles par utilisateur a été définie à **${maxRoles}**.`)
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
}

module.exports = RoleInteractionHandler;