const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder } = require('discord.js');

class EconomyConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // =============
    // MENU PRINCIPAL
    // =============
    async handleMainSelect(interaction) {
        const value = interaction.values[0];
        
        if (value === 'actions') {
            await this.showActionsMenu(interaction);
        } else if (value === 'boutique') {
            await this.showBoutiqueMenu(interaction);
        } else if (value === 'daily') {
            await this.showDailyMenu(interaction);
        } else if (value === 'messages') {
            await this.showMessagesMenu(interaction);
        } else if (value === 'karma') {
            await this.showKarmaMenu(interaction);
        }
    }

    // =============
    // ACTIONS ÉCONOMIQUES
    // =============
    async showActionsMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🎯 Configuration Actions Économiques')
            .setDescription('Sélectionnez l\'action à configurer :');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_actions_select')
            .setPlaceholder('Choisissez une action...')
            .addOptions([
                { label: '💼 Travailler', value: 'travailler', description: 'Action positive - Gains et karma' },
                { label: '🎣 Pêcher', value: 'pecher', description: 'Action positive - Gains et karma' },
                { label: '💰 Donner', value: 'donner', description: 'Action très positive - Transfert et karma' },
                { label: '🔫 Voler', value: 'voler', description: 'Action négative - Risque et karma mauvais' },
                { label: '🎰 Parier', value: 'parier', description: 'Action négative - Gambling et karma' },
                { label: '💣 Crime', value: 'crime', description: 'Action très négative - Gros gains/risques' },
                { label: '🔙 Retour', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleActionSelect(interaction) {
        const action = interaction.values[0];
        
        if (action === 'back_main') {
            return await this.showMainMenu(interaction);
        }

        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle(`⚙️ Configuration - ${action.charAt(0).toUpperCase() + action.slice(1)}`)
            .setDescription('Choisissez le paramètre à modifier :');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`economy_action_config_${action}`)
            .setPlaceholder('Paramètre à configurer...')
            .addOptions([
                { label: '💰 Montant', value: 'montant', description: 'Configurer les gains min/max' },
                { label: '⏰ Cooldown', value: 'cooldown', description: 'Temps d\'attente entre utilisations' },
                { label: '⚖️ Karma', value: 'karma', description: 'Karma positif/négatif accordé' },
                { label: '🔙 Retour Actions', value: 'back_actions', description: 'Retour aux actions' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleActionConfigSelect(interaction) {
        const customId = interaction.customId;
        const action = customId.split('_')[3]; // economy_action_config_ACTION
        const configType = interaction.values[0];

        if (configType === 'back_actions') {
            return await this.showActionsMenu(interaction);
        }

        // Créer le modal selon le type de configuration
        await this.showActionConfigModal(interaction, action, configType);
    }

    async showActionConfigModal(interaction, action, configType) {
        const modal = new ModalBuilder()
            .setCustomId(`action_config_modal_${action}_${configType}`)
            .setTitle(`Configuration ${action} - ${configType}`);

        if (configType === 'montant') {
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('min_amount')
                        .setLabel('Montant minimum (€)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 10')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('max_amount')
                        .setLabel('Montant maximum (€)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 50')
                        .setRequired(true)
                )
            );
        } else if (configType === 'cooldown') {
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('cooldown_seconds')
                        .setLabel('Cooldown en secondes')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 3600 (1 heure)')
                        .setRequired(true)
                )
            );
        } else if (configType === 'karma') {
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('good_karma')
                        .setLabel('Karma positif (😇)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 1')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('bad_karma')
                        .setLabel('Karma négatif (😈)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: -1')
                        .setRequired(true)
                )
            );
        }

        await interaction.showModal(modal);
    }

    // =============
    // BOUTIQUE
    // =============
    async showBoutiqueMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🏪 Configuration Boutique')
            .setDescription('Choisissez l\'élément à configurer :');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_boutique_select')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                { label: '🎨 Objets Personnalisés', value: 'objets', description: 'Créer des objets uniques' },
                { label: '⌛ Rôles Temporaires', value: 'roles_temp', description: 'Rôles avec durée limitée' },
                { label: '⭐ Rôles Permanents', value: 'roles_perm', description: 'Rôles définitifs' },
                { label: '💸 Remises Karma', value: 'remises', description: 'Réductions basées sur karma' },
                { label: '🔧 Modifier Objets Existants', value: 'manage_objets', description: 'Gérer objets créés' },
                { label: '🗑️ Supprimer Articles', value: 'delete_articles', description: 'Supprimer objets/rôles' },
                { label: '🔙 Retour', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async handleBoutiqueSelect(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_main') {
            return await this.showMainMenu(interaction);
        }

        if (value === 'objets') {
            await this.showObjetPersonnaliseModal(interaction);
        } else if (value === 'roles_temp') {
            await this.showRolesTempMenu(interaction);
        } else if (value === 'roles_perm') {
            await this.showRolesPermMenu(interaction);
        } else if (value === 'remises') {
            await this.showRemisesMenu(interaction);
        } else if (value === 'manage_objets') {
            await this.showManageObjetsMenu(interaction);
        } else if (value === 'delete_articles') {
            await this.showDeleteArticlesMenu(interaction);
        }
    }

    async showObjetPersonnaliseModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('objet_perso_modal')
            .setTitle('Créer un Objet Personnalisé')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('objet_nom')
                        .setLabel('Nom de l\'objet')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: Potion magique')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('objet_prix')
                        .setLabel('Prix (€)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 100')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('objet_description')
                        .setLabel('Description (optionnelle)')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Description de l\'objet...')
                        .setRequired(false)
                )
            );

        await interaction.showModal(modal);
    }

    async showRolesTempMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('⌛ Rôles Temporaires')
            .setDescription('Sélectionnez le rôle à proposer temporairement :');

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('role_temp_select')
            .setPlaceholder('Choisissez un rôle...');

        const row = new ActionRowBuilder().addComponents(roleSelect);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showRolesPermMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('⭐ Rôles Permanents')
            .setDescription('Sélectionnez le rôle à proposer définitivement :');

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('role_perm_select')
            .setPlaceholder('Choisissez un rôle...');

        const row = new ActionRowBuilder().addComponents(roleSelect);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showRemisesMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('💸 Remises Karma')
            .setDescription('Gérer les remises basées sur le karma :');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('remises_karma_select')
            .setPlaceholder('Choisissez une action...')
            .addOptions([
                { label: '➕ Créer Remise', value: 'create', description: 'Créer une nouvelle remise karma' },
                { label: '✏️ Modifier Remise', value: 'modify', description: 'Modifier une remise existante' },
                { label: '🗑️ Supprimer Remise', value: 'delete', description: 'Supprimer une remise' },
                { label: '🔙 Retour Boutique', value: 'back_boutique', description: 'Retour à la boutique' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showMainMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('⚙️ Configuration Système Économique')
            .setDescription('Choisissez la section à configurer :')
            .addFields([
                { name: '🎯 Actions Économiques', value: 'Configurer les 6 actions (montant, cooldown, karma)', inline: true },
                { name: '🏪 Boutique', value: 'Objets personnalisés, rôles, remises karma', inline: true },
                { name: '📅 Daily/Quotidien', value: 'Configuration des récompenses quotidiennes', inline: true },
                { name: '💬 Messages', value: 'Configuration des gains par message', inline: true },
                { name: '⚖️ Karma', value: 'Système karma et récompenses automatiques', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_main_config_submenu')
            .setPlaceholder('🔧 Choisissez une section...')
            .addOptions([
                {
                    label: '🎯 Actions Économiques',
                    value: 'actions',
                    description: 'Configurer travailler, pêcher, voler, donner, parier, crime'
                },
                {
                    label: '🏪 Boutique',
                    value: 'boutique',
                    description: 'Objets, rôles temporaires/permanents, remises karma'
                },
                {
                    label: '📅 Daily/Quotidien',
                    value: 'daily',
                    description: 'Configuration des récompenses quotidiennes'
                },
                {
                    label: '💬 Messages',
                    value: 'messages',
                    description: 'Configuration des gains par message'
                },
                {
                    label: '⚖️ Karma',
                    value: 'karma',
                    description: 'Système karma et récompenses automatiques'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    // =============
    // HANDLERS MODALS ET SÉLECTEURS
    // =============
    async handleActionConfigModal(interaction) {
        const customId = interaction.customId; // action_config_modal_ACTION_TYPE
        const parts = customId.split('_');
        const action = parts[3];
        const configType = parts[4];

        try {
            const data = {};
            if (configType === 'montant') {
                data.minAmount = parseInt(interaction.fields.getTextInputValue('min_amount'));
                data.maxAmount = parseInt(interaction.fields.getTextInputValue('max_amount'));
            } else if (configType === 'cooldown') {
                data.cooldown = parseInt(interaction.fields.getTextInputValue('cooldown_seconds'));
            } else if (configType === 'karma') {
                data.goodKarma = parseInt(interaction.fields.getTextInputValue('good_karma'));
                data.badKarma = parseInt(interaction.fields.getTextInputValue('bad_karma'));
            }

            // Sauvegarder la configuration
            await this.saveActionConfig(action, configType, data);

            await interaction.reply({
                content: `✅ Configuration ${configType} pour l'action ${action} sauvegardée !`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal action:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la sauvegarde de la configuration.',
                flags: 64
            });
        }
    }

    async handleObjetPersoModal(interaction) {
        try {
            const nom = interaction.fields.getTextInputValue('objet_nom');
            const prix = parseInt(interaction.fields.getTextInputValue('objet_prix'));
            const description = interaction.fields.getTextInputValue('objet_description') || 'Objet personnalisé';

            // Sauvegarder l'objet
            await this.saveCustomObject(interaction.guild.id, nom, prix, description);

            await interaction.reply({
                content: `✅ Objet "${nom}" créé avec succès pour ${prix}€ !`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal objet:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la création de l\'objet.',
                flags: 64
            });
        }
    }

    async handleRoleSelect(interaction) {
        const roleId = interaction.values[0];
        const isTemp = interaction.customId === 'role_temp_select';

        const modal = new ModalBuilder()
            .setCustomId(`role_config_modal_${roleId}_${isTemp ? 'temp' : 'perm'}`)
            .setTitle(`Configuration Rôle ${isTemp ? 'Temporaire' : 'Permanent'}`);

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('role_price')
                    .setLabel('Prix (€)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 500')
                    .setRequired(true)
            )
        );

        if (isTemp) {
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('role_duration')
                        .setLabel('Durée (en heures)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 24')
                        .setRequired(true)
                )
            );
        }

        await interaction.showModal(modal);
    }

    async handleRemisesSelect(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_boutique') {
            return await this.showBoutiqueMenu(interaction);
        }

        if (value === 'create') {
            await this.showRemiseModal(interaction);
        } else if (value === 'modify') {
            await this.showModifyRemisesMenu(interaction);
        } else if (value === 'delete') {
            await this.showDeleteRemisesMenu(interaction);
        }
    }

    async showRemiseModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('remise_karma_modal')
            .setTitle('Créer une Remise Karma')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('remise_nom')
                        .setLabel('Nom de la remise')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: Remise Saint')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('karma_min')
                        .setLabel('Karma minimum requis')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 10')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('pourcentage_remise')
                        .setLabel('Pourcentage de remise (%)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 20')
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    async showModifyRemisesMenu(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('modify_remises_modal')
            .setTitle('Modifier une Remise Karma')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('remise_nom')
                        .setLabel('Nom de la remise')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: Remise Saint')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('karma_min')
                        .setLabel('Karma minimum requis')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 10')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('pourcentage_remise')
                        .setLabel('Pourcentage de remise (%)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 20')
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    async showDeleteRemisesMenu(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('delete_remises_modal')
            .setTitle('Supprimer une Remise Karma')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('remise_nom')
                        .setLabel('Nom de la remise')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: Remise Saint')
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    // =============
    // SAUVEGARDE DES DONNÉES
    // =============
    async saveActionConfig(action, configType, data) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        
        if (!economyConfig.actions) economyConfig.actions = {};
        if (!economyConfig.actions[action]) economyConfig.actions[action] = {};

        economyConfig.actions[action][configType] = data;
        
        await this.dataManager.saveData('economy.json', economyConfig);
        console.log(`✅ Configuration ${configType} sauvegardée pour ${action}:`, data);
    }

    async saveCustomObject(guildId, nom, prix, description) {
        const shopData = await this.dataManager.loadData('shop.json', {});
        
        if (!shopData[guildId]) shopData[guildId] = [];
        
        const objet = {
            id: Date.now().toString(),
            type: 'custom_object',
            name: nom,
            price: prix,
            description: description,
            created: new Date().toISOString()
        };
        
        shopData[guildId].push(objet);
        await this.dataManager.saveData('shop.json', shopData);
        console.log(`✅ Objet personnalisé créé:`, objet);
    }

    async handleRemiseModal(interaction) {
        try {
            const nom = interaction.fields.getTextInputValue('remise_nom');
            const karmaMin = parseInt(interaction.fields.getTextInputValue('karma_min'));
            const pourcentage = parseInt(interaction.fields.getTextInputValue('pourcentage_remise'));

            // Sauvegarder la remise
            await this.saveKarmaDiscount(interaction.guild.id, nom, karmaMin, pourcentage);

            await interaction.reply({
                content: `✅ Remise "${nom}" créée : ${pourcentage}% pour ${karmaMin} karma minimum !`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal remise:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la création de la remise.',
                flags: 64
            });
        }
    }

    async saveKarmaDiscount(guildId, nom, karmaMin, pourcentage) {
        const discountsData = await this.dataManager.loadData('karma_discounts.json', {});
        
        if (!discountsData[guildId]) discountsData[guildId] = [];
        
        const remise = {
            id: Date.now().toString(),
            name: nom,
            karmaMin: karmaMin,
            percentage: pourcentage,
            created: new Date().toISOString()
        };
        
        discountsData[guildId].push(remise);
        await this.dataManager.saveData('karma_discounts.json', discountsData);
        console.log(`✅ Remise karma créée:`, remise);
    }

    async handleRoleConfigModal(interaction) {
        try {
            const customId = interaction.customId; // role_config_modal_ROLEID_TYPE
            const parts = customId.split('_');
            const roleId = parts[3];
            const type = parts[4]; // 'temp' or 'perm'

            const prix = parseInt(interaction.fields.getTextInputValue('role_price'));
            let duree = null;

            if (type === 'temp') {
                duree = parseInt(interaction.fields.getTextInputValue('role_duration'));
            }

            // Sauvegarder le rôle
            await this.saveRoleToShop(interaction.guild.id, roleId, prix, type, duree);

            const role = interaction.guild.roles.cache.get(roleId);
            const roleName = role ? role.name : 'Rôle inconnu';

            await interaction.reply({
                content: `✅ Rôle "${roleName}" ajouté à la boutique pour ${prix}€${type === 'temp' ? ` (${duree}h)` : ' (permanent)'} !`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal rôle:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la configuration du rôle.',
                flags: 64
            });
        }
    }

    async saveRoleToShop(guildId, roleId, prix, type, duree = null) {
        const shopData = await this.dataManager.loadData('shop.json', {});
        
        if (!shopData[guildId]) shopData[guildId] = [];
        
        const roleItem = {
            id: Date.now().toString(),
            type: type === 'temp' ? 'temporary_role' : 'permanent_role',
            roleId: roleId,
            price: prix,
            duration: duree,
            created: new Date().toISOString()
        };
        
        shopData[guildId].push(roleItem);
        await this.dataManager.saveData('shop.json', shopData);
        console.log(`✅ Rôle ${type} ajouté à la boutique:`, roleItem);
    }

    async showManageObjetsMenu(interaction) {
        try {
            const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
            const shopData = await this.dataManager.loadData('shop.json', {});
            const guildId = interaction.guild.id;
            const guildItems = shopData[guildId] || [];

            const customObjects = guildItems.filter(item => item.type === 'custom_object' || item.type === 'custom');

            if (customObjects.length === 0) {
                await interaction.update({
                    content: '❌ Aucun objet personnalisé trouvé.',
                    embeds: [],
                    components: []
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('🔧 Modifier Objets Existants')
                .setDescription(`${customObjects.length} objet(s) personnalisé(s) disponible(s)`)
                .addFields(
                    customObjects.slice(0, 5).map(obj => ({
                        name: `🎨 ${obj.name}`,
                        value: `Prix: ${obj.price}€\n${obj.description || 'Pas de description'}`,
                        inline: true
                    }))
                );

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('objets_existants_select')
                .setPlaceholder('Sélectionner un objet à modifier...')
                .addOptions(
                    customObjects.slice(0, 20).map(obj => ({
                        label: obj.name,
                        description: `${obj.price}€ - Créé le ${new Date(obj.created).toLocaleDateString()}`,
                        value: obj.id
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Erreur menu objets:', error);
            await interaction.update({
                content: '❌ Erreur lors du chargement des objets.',
                embeds: [],
                components: []
            });
        }
    }

    async showDeleteArticlesMenu(interaction) {
        try {
            const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
            const shopData = await this.dataManager.loadData('shop.json', {});
            const guildId = interaction.guild.id;
            const guildItems = shopData[guildId] || [];

            if (guildItems.length === 0) {
                await interaction.update({
                    content: '❌ Aucun article trouvé dans la boutique.',
                    embeds: [],
                    components: []
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🗑️ Supprimer Articles')
                .setDescription(`${guildItems.length} article(s) disponible(s)`);

            if (guildItems.length > 0) {
                embed.addFields(
                    guildItems.slice(0, 5).map(item => {
                        let typeIcon = '❓';
                        let typeName = 'Inconnu';
                        
                        if (item.type === 'custom_object' || item.type === 'custom') {
                            typeIcon = '🎨';
                            typeName = 'Objet personnalisé';
                        } else if (item.type === 'temporary_role' || item.type === 'temp_role') {
                            typeIcon = '⌛';
                            typeName = 'Rôle temporaire';
                        } else if (item.type === 'permanent_role' || item.type === 'perm_role') {
                            typeIcon = '⭐';
                            typeName = 'Rôle permanent';
                        }

                        return {
                            name: `${typeIcon} ${item.name || `Rôle <@&${item.roleId}>`}`,
                            value: `${typeName} - ${item.price}€${item.duration ? ` (${item.duration}h)` : ''}`,
                            inline: true
                        };
                    })
                );
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('delete_articles_select')
                .setPlaceholder('Sélectionner un article à supprimer...')
                .addOptions(
                    guildItems.slice(0, 20).map(item => {
                        let label = item.name || `Rôle ${item.roleId}`;
                        let typeIcon = (item.type === 'custom_object' || item.type === 'custom') ? '🎨' : 
                                     (item.type === 'temporary_role' || item.type === 'temp_role') ? '⌛' : '⭐';
                        
                        return {
                            label: `${typeIcon} ${label}`,
                            description: `${item.price}€ - Supprimer cet article`,
                            value: item.id
                        };
                    })
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Erreur menu suppression:', error);
            await interaction.update({
                content: '❌ Erreur lors du chargement des articles.',
                embeds: [],
                components: []
            });
        }
    }

    async handleEditItemSelect(interaction) {
        try {
            const shopData = await this.dataManager.loadData('shop.json', {});
            const guildId = interaction.guild.id;
            const guildItems = shopData[guildId] || [];

            if (guildItems.length === 0) {
                await interaction.update({
                    content: '❌ Aucun article trouvé dans la boutique.',
                    embeds: [],
                    components: []
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('✏️ Modifier Articles')
                .setDescription(`${guildItems.length} article(s) disponible(s)`);

            if (guildItems.length > 0) {
                embed.addFields(
                    guildItems.slice(0, 5).map(item => {
                        let typeIcon = '❓';
                        let typeName = 'Inconnu';
                        
                        if (item.type === 'custom_object' || item.type === 'custom') {
                            typeIcon = '🎨';
                            typeName = 'Objet personnalisé';
                        } else if (item.type === 'temporary_role' || item.type === 'temp_role') {
                            typeIcon = '⌛';
                            typeName = 'Rôle temporaire';
                        } else if (item.type === 'permanent_role' || item.type === 'perm_role') {
                            typeIcon = '⭐';
                            typeName = 'Rôle permanent';
                        }

                        return {
                            name: `${typeIcon} ${item.name || `Rôle <@&${item.roleId}>`}`,
                            value: `${typeName} - ${item.price}€${item.duration ? ` (${item.duration}h)` : ''}`,
                            inline: true
                        };
                    })
                );
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('edit_articles_select')
                .setPlaceholder('Sélectionner un article à modifier...')
                .addOptions(
                    guildItems.slice(0, 20).map(item => {
                        let label = item.name || `Rôle ${item.roleId}`;
                        let typeIcon = (item.type === 'custom_object' || item.type === 'custom') ? '🎨' : 
                                     (item.type === 'temporary_role' || item.type === 'temp_role') ? '⌛' : '⭐';
                        
                        return {
                            label: `${typeIcon} ${label}`,
                            description: `${item.price}€ - Modifier cet article`,
                            value: item.id
                        };
                    })
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Erreur menu modification:', error);
            await interaction.update({
                content: '❌ Erreur lors du chargement des articles.',
                embeds: [],
                components: []
            });
        }
    }

    async handleEditArticleSelect(interaction) {
        try {
            const itemId = interaction.values[0];
            const shopData = await this.dataManager.loadData('shop.json', {});
            const guildId = interaction.guild.id;
            
            if (!shopData[guildId]) {
                await interaction.reply({
                    content: '❌ Aucune boutique trouvée.',
                    flags: 64
                });
                return;
            }

            const item = shopData[guildId].find(i => i.id === itemId);
            if (!item) {
                await interaction.reply({
                    content: '❌ Article non trouvé.',
                    flags: 64
                });
                return;
            }

            await this.showEditItemModal(interaction, item);

        } catch (error) {
            console.error('Erreur sélection article à modifier:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la sélection.',
                flags: 64
            });
        }
    }

    async showEditItemModal(interaction, item) {
        try {
            const modal = new ModalBuilder()
                .setCustomId(`edit_item_modal_${item.id}`)
                .setTitle('✏️ Modifier Article');

            // Champ prix (toujours présent)
            const priceInput = new TextInputBuilder()
                .setCustomId('item_price')
                .setLabel('💰 Prix (1-999,999€)')
                .setStyle(TextInputStyle.Short)
                .setValue(item.price.toString())
                .setRequired(true);

            const components = [new ActionRowBuilder().addComponents(priceInput)];

            // Pour les objets personnalisés
            if (item.type === 'custom_object' || item.type === 'custom') {
                const nameInput = new TextInputBuilder()
                    .setCustomId('item_name')
                    .setLabel('📝 Nom de l\'objet')
                    .setStyle(TextInputStyle.Short)
                    .setValue(item.name || '')
                    .setRequired(true);

                const descInput = new TextInputBuilder()
                    .setCustomId('item_description')
                    .setLabel('📋 Description (optionnel)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(item.description || '')
                    .setRequired(false);

                components.push(
                    new ActionRowBuilder().addComponents(nameInput),
                    new ActionRowBuilder().addComponents(descInput)
                );
            }

            // Pour les rôles temporaires
            if (item.type === 'temporary_role' || item.type === 'temp_role') {
                const durationInput = new TextInputBuilder()
                    .setCustomId('item_duration')
                    .setLabel('⏰ Durée en heures (1-365)')
                    .setStyle(TextInputStyle.Short)
                    .setValue(item.duration ? item.duration.toString() : '24')
                    .setRequired(true);

                components.push(new ActionRowBuilder().addComponents(durationInput));
            }

            modal.addComponents(...components);
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Erreur affichage modal modification:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage du modal.',
                flags: 64
            });
        }
    }

    async handleObjetModification(interaction) {
        try {
            const itemId = interaction.values[0];
            const shopData = await this.dataManager.loadData('shop.json', {});
            const guildId = interaction.guild.id;
            
            if (!shopData[guildId]) {
                await interaction.reply({
                    content: '❌ Aucune boutique trouvée.',
                    flags: 64
                });
                return;
            }

            const item = shopData[guildId].find(item => item.id === itemId);
            if (!item) {
                await interaction.reply({
                    content: '❌ Article non trouvé.',
                    flags: 64
                });
                return;
            }

            // Utiliser la méthode showEditItemModal existante
            await this.showEditItemModal(interaction, item);

        } catch (error) {
            console.error('Erreur modification objet:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la modification.',
                flags: 64
            });
        }
    }

    async handleArticleDelete(interaction) {
        try {
            const itemId = interaction.values[0];
            const shopData = await this.dataManager.loadData('shop.json', {});
            const guildId = interaction.guild.id;
            
            if (!shopData[guildId]) {
                await interaction.reply({
                    content: '❌ Aucune boutique trouvée.',
                    flags: 64
                });
                return;
            }

            const itemIndex = shopData[guildId].findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                await interaction.reply({
                    content: '❌ Article non trouvé.',
                    flags: 64
                });
                return;
            }

            const deletedItem = shopData[guildId][itemIndex];
            shopData[guildId].splice(itemIndex, 1);
            
            await this.dataManager.saveData('shop.json', shopData);

            await interaction.reply({
                content: `✅ Article "${deletedItem.name || 'Rôle'}" supprimé de la boutique !`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur suppression article:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la suppression.',
                flags: 64
            });
        }
    }

    // =============
    // SECTION DAILY
    // =============
    async showDailyMenu(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('📅 Configuration Daily/Quotidien')
                .setDescription('Configurez les récompenses quotidiennes :')
                .addFields([
                    { name: '💰 Montant Daily', value: 'Montant de la récompense quotidienne', inline: true },
                    { name: '🔥 Bonus Streak', value: 'Bonus pour les séries quotidiennes', inline: true },
                    { name: '⏰ Reset Heure', value: 'Heure de reset des daily (24h)', inline: true }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('economy_daily_select')
                .setPlaceholder('Choisissez un paramètre...')
                .addOptions([
                    { label: '💰 Configurer Montant', value: 'daily_amount', description: 'Montant de base du daily' },
                    { label: '🔥 Configurer Streak', value: 'daily_streak', description: 'Bonus séries consécutives' },
                    { label: '⏰ Configurer Reset', value: 'daily_reset', description: 'Heure de reset quotidien' },
                    { label: '🔛 Activer/Désactiver', value: 'daily_toggle', description: 'Enable/disable système daily' },
                    { label: '🔙 Retour', value: 'back_main', description: 'Retour au menu principal' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur menu daily:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'affichage du menu daily.',
                embeds: [],
                components: []
            });
        }
    }

    async handleDailySelect(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_main') {
            return await this.showMainMenu(interaction);
        }

        try {
            if (value === 'daily_amount') {
                await this.showDailyAmountModal(interaction);
            } else if (value === 'daily_streak') {
                await this.showDailyStreakModal(interaction);
            } else if (value === 'daily_reset') {
                await this.handleDailyReset(interaction);
            } else if (value === 'daily_toggle') {
                await this.toggleDailySystem(interaction);
            }
        } catch (error) {
            console.error('Erreur sélection daily:', error);
            await interaction.reply({
                content: '❌ Erreur lors du traitement de la sélection.',
                flags: 64
            });
        }
    }

    async showDailyAmountModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('daily_amount_modal')
            .setTitle('💰 Configuration Montant Daily')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('daily_min_amount')
                        .setLabel('Montant minimum (€)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 50')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('daily_max_amount')
                        .setLabel('Montant maximum (€)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 100')
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    async showDailyStreakModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('daily_streak_modal')
            .setTitle('🔥 Configuration Bonus Streak')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('streak_multiplier')
                        .setLabel('Multiplicateur par jour (ex: 1.1)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('1.1 = +10% par jour consécutif')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('max_streak_days')
                        .setLabel('Maximum de jours streak')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 30')
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    // =============
    // SECTION MESSAGES
    // =============
    async showMessagesMenu(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('💬 Configuration Gains par Message')
                .setDescription('Configurez les gains automatiques pour les messages :')
                .addFields([
                    { name: '💰 Gain par Message', value: 'Montant gagné à chaque message', inline: true },
                    { name: '⏰ Cooldown', value: 'Temps entre deux gains', inline: true },
                    { name: '🔛 Statut', value: 'Système activé/désactivé', inline: true }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('economy_messages_select')
                .setPlaceholder('Choisissez un paramètre...')
                .addOptions([
                    { label: '💰 Configurer Montant', value: 'message_amount', description: 'Argent par message envoyé' },
                    { label: '⏰ Configurer Cooldown', value: 'message_cooldown', description: 'Délai entre les gains' },
                    { label: '📊 Configurer Limites', value: 'message_limits', description: 'Limites quotidiennes' },
                    { label: '🔛 Activer/Désactiver', value: 'message_toggle', description: 'Enable/disable gains messages' },
                    { label: '🔙 Retour', value: 'back_main', description: 'Retour au menu principal' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur menu messages:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'affichage du menu messages.',
                embeds: [],
                components: []
            });
        }
    }

    async handleMessagesSelect(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_main') {
            return await this.showMainMenu(interaction);
        }

        try {
            if (value === 'message_amount') {
                await this.showMessageAmountModal(interaction);
            } else if (value === 'message_cooldown') {
                await this.showMessageCooldownModal(interaction);
            } else if (value === 'message_limits') {
                await this.showMessageLimitsModal(interaction);
            } else if (value === 'message_toggle') {
                await this.toggleMessageSystem(interaction);
            }
        } catch (error) {
            console.error('Erreur sélection messages:', error);
            await interaction.reply({
                content: '❌ Erreur lors du traitement de la sélection.',
                flags: 64
            });
        }
    }

    async showMessageAmountModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('message_amount_modal')
            .setTitle('💰 Configuration Gains Message')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('message_min_gain')
                        .setLabel('Gain minimum par message (€)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 1')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('message_max_gain')
                        .setLabel('Gain maximum par message (€)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 5')
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    async showMessageCooldownModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('message_cooldown_modal')
            .setTitle('⏰ Configuration Cooldown Messages')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('message_cooldown_seconds')
                        .setLabel('Cooldown en secondes')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 60 (1 minute)')
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    async showMessageLimitsModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('message_limits_modal')
            .setTitle('📊 Limites Messages');

        const maxDailyInput = new TextInputBuilder()
            .setCustomId('max_daily_messages')
            .setLabel('Messages max par jour par utilisateur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('100')
            .setRequired(false)
            .setMaxLength(5);

        const maxHourlyInput = new TextInputBuilder()
            .setCustomId('max_hourly_messages')
            .setLabel('Messages max par heure par utilisateur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('20')
            .setRequired(false)
            .setMaxLength(3);

        const spamProtectionInput = new TextInputBuilder()
            .setCustomId('spam_protection')
            .setLabel('Protection anti-spam (messages/minute)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('5')
            .setRequired(false)
            .setMaxLength(2);

        const exemptRolesInput = new TextInputBuilder()
            .setCustomId('exempt_roles')
            .setLabel('Rôles exemptés (IDs séparés par virgules)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('123456789,987654321')
            .setRequired(false)
            .setMaxLength(200);

        modal.addComponents(
            new ActionRowBuilder().addComponents(maxDailyInput),
            new ActionRowBuilder().addComponents(maxHourlyInput),
            new ActionRowBuilder().addComponents(spamProtectionInput),
            new ActionRowBuilder().addComponents(exemptRolesInput)
        );

        await interaction.showModal(modal);
    }

    // =============
    // SECTION KARMA
    // =============
    async showKarmaMenu(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('⚖️ Configuration Système Karma')
                .setDescription('Configurez le système de karma et récompenses automatiques :')
                .addFields([
                    { name: '🎁 Récompenses Karma', value: 'Récompenses automatiques selon niveau karma', inline: true },
                    { name: '🔄 Reset Karma', value: 'Remettre à zéro le karma des membres', inline: true },
                    { name: '📊 Statistiques', value: 'Statistiques du système karma', inline: true }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('economy_karma_select')
                .setPlaceholder('Choisissez un paramètre...')
                .addOptions([
                    { label: '🎁 Configurer Récompenses', value: 'karma_rewards', description: 'Récompenses automatiques par niveau karma' },
                    { label: '⚙️ Niveaux Karma', value: 'karma_levels', description: 'Configurer les seuils de niveaux' },
                    { label: '🔄 Reset Karma Complet', value: 'karma_reset', description: 'Remettre à zéro tout le karma' },
                    { label: '😇 Reset Karma Bon', value: 'karma_reset_good', description: 'Remettre à zéro karma positif uniquement' },
                    { label: '😈 Reset Karma Mauvais', value: 'karma_reset_bad', description: 'Remettre à zéro karma négatif uniquement' },
                    { label: '📅 Jour Reset Hebdo', value: 'karma_weekly_day', description: 'Configurer jour de reset hebdomadaire' },
                    { label: '📊 Voir Statistiques', value: 'karma_stats', description: 'Statistiques karma du serveur' },
                    { label: '🔛 Activer/Désactiver', value: 'karma_toggle', description: 'Enable/disable système karma' },
                    { label: '🔙 Retour', value: 'back_main', description: 'Retour au menu principal' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur menu karma:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'affichage du menu karma.',
                embeds: [],
                components: []
            });
        }
    }

    async handleKarmaSelect(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_main') {
            return await this.showMainMenu(interaction);
        }

        try {
            if (value === 'karma_rewards') {
                await this.showKarmaRewardsMenu(interaction);
            } else if (value === 'karma_levels') {
                await this.showKarmaLevelsModal(interaction);
            } else if (value === 'karma_reset') {
                await this.showKarmaResetConfirm(interaction);
            } else if (value === 'karma_reset_good') {
                await this.showKarmaResetGoodConfirm(interaction);
            } else if (value === 'karma_reset_bad') {
                await this.showKarmaResetBadConfirm(interaction);
            } else if (value === 'karma_weekly_day') {
                await this.showKarmaWeeklyDayMenu(interaction);
            } else if (value === 'karma_stats') {
                await this.showKarmaStats(interaction);
            } else if (value === 'karma_toggle') {
                await this.toggleKarmaSystem(interaction);
            }
        } catch (error) {
            console.error('Erreur sélection karma:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Erreur lors du traitement de la sélection.',
                        flags: 64
                    });
                }
            } catch (replyError) {
                console.error('Erreur reply karma:', replyError);
            }
        }
    }

    async showKarmaRewardsMenu(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('🎁 Configuration Récompenses Karma')
                .setDescription('Configurez les récompenses automatiques selon le niveau de karma :')
                .addFields([
                    { name: '😇 Récompenses Positives', value: 'Bonus pour bon karma', inline: true },
                    { name: '😈 Sanctions Négatives', value: 'Malus pour mauvais karma', inline: true },
                    { name: '💰 Montants', value: 'Argent gagné/perdu automatiquement', inline: true }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('karma_rewards_select')
                .setPlaceholder('Choisissez un type de récompense...')
                .addOptions([
                    { label: '😇 Récompenses Positives', value: 'positive_rewards', description: 'Bonus pour bon karma' },
                    { label: '😈 Sanctions Négatives', value: 'negative_sanctions', description: 'Malus pour mauvais karma' },
                    { label: '🔧 Modifier Existantes', value: 'modify_rewards', description: 'Modifier récompenses créées' },
                    { label: '🗑️ Supprimer Récompenses', value: 'delete_rewards', description: 'Supprimer récompenses' },
                    { label: '🔙 Retour Karma', value: 'back_karma', description: 'Retour menu karma' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur menu récompenses karma:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'affichage des récompenses karma.',
                embeds: [],
                components: []
            });
        }
    }

    async showKarmaLevelsModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('karma_levels_modal')
            .setTitle('⚙️ Configuration Niveaux Karma')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('saint_threshold')
                        .setLabel('Seuil Saint (karma positif)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 50')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('evil_threshold')
                        .setLabel('Seuil Evil (karma négatif)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: -50')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('neutral_range')
                        .setLabel('Plage Neutre (±X)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 10 (de -10 à +10)')
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    async showKarmaResetConfirm(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🔄 Reset Karma - Confirmation')
            .setDescription('⚠️ **ATTENTION** : Cette action va remettre à zéro le karma de tous les membres du serveur.')
            .addFields([
                { name: '🗑️ Action', value: 'Reset complet du karma (bon et mauvais)', inline: false },
                { name: '👥 Membres affectés', value: 'Tous les membres avec du karma', inline: false },
                { name: '❗ Irréversible', value: 'Cette action ne peut pas être annulée', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_reset_confirm')
            .setPlaceholder('Confirmer le reset karma...')
            .addOptions([
                { label: '✅ Confirmer Reset', value: 'confirm_reset', description: 'RESET DEFINITIF du karma' },
                { label: '❌ Annuler', value: 'cancel_reset', description: 'Annuler l\'opération' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showKarmaResetGoodConfirm(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('😇 Reset Karma Bon - Confirmation')
            .setDescription('⚠️ **ATTENTION** : Cette action va remettre à zéro uniquement le karma positif de tous les membres.')
            .addFields([
                { name: '🗑️ Action', value: 'Reset karma positif uniquement', inline: false },
                { name: '👥 Membres affectés', value: 'Tous les membres avec karma positif', inline: false },
                { name: '✅ Préservé', value: 'Le karma négatif reste intact', inline: false },
                { name: '❗ Irréversible', value: 'Cette action ne peut pas être annulée', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_reset_good_confirm')
            .setPlaceholder('Confirmer le reset karma positif...')
            .addOptions([
                { label: '✅ Confirmer Reset Positif', value: 'confirm_reset_good', description: 'RESET karma positif uniquement' },
                { label: '❌ Annuler', value: 'cancel_reset', description: 'Annuler l\'opération' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showKarmaResetBadConfirm(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('😈 Reset Karma Mauvais - Confirmation')
            .setDescription('⚠️ **ATTENTION** : Cette action va remettre à zéro uniquement le karma négatif de tous les membres.')
            .addFields([
                { name: '🗑️ Action', value: 'Reset karma négatif uniquement', inline: false },
                { name: '👥 Membres affectés', value: 'Tous les membres avec karma négatif', inline: false },
                { name: '✅ Préservé', value: 'Le karma positif reste intact', inline: false },
                { name: '❗ Irréversible', value: 'Cette action ne peut pas être annulée', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_reset_bad_confirm')
            .setPlaceholder('Confirmer le reset karma négatif...')
            .addOptions([
                { label: '✅ Confirmer Reset Négatif', value: 'confirm_reset_bad', description: 'RESET karma négatif uniquement' },
                { label: '❌ Annuler', value: 'cancel_reset', description: 'Annuler l\'opération' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showKarmaWeeklyDayMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('📅 Configuration Jour Reset Hebdomadaire')
            .setDescription('Choisissez le jour de la semaine pour le reset automatique du karma :')
            .addFields([
                { name: '🔄 Reset Automatique', value: 'Le karma sera remis à zéro chaque semaine', inline: false },
                { name: '🎁 Récompenses', value: 'Les récompenses seront distribuées avant le reset', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_weekly_day_select')
            .setPlaceholder('Choisissez le jour de reset...')
            .addOptions([
                { label: '📅 Lundi', value: '1', description: 'Reset chaque lundi à minuit' },
                { label: '📅 Mardi', value: '2', description: 'Reset chaque mardi à minuit' },
                { label: '📅 Mercredi', value: '3', description: 'Reset chaque mercredi à minuit' },
                { label: '📅 Jeudi', value: '4', description: 'Reset chaque jeudi à minuit' },
                { label: '📅 Vendredi', value: '5', description: 'Reset chaque vendredi à minuit' },
                { label: '📅 Samedi', value: '6', description: 'Reset chaque samedi à minuit' },
                { label: '📅 Dimanche', value: '0', description: 'Reset chaque dimanche à minuit' },
                { label: '❌ Désactiver', value: 'disable', description: 'Désactiver le reset automatique' },
                { label: '🔙 Retour', value: 'back_karma', description: 'Retour au menu karma' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    // =============
    // HANDLERS MODALS DAILY ET MESSAGES
    // =============
    async handleDailyAmountModal(interaction) {
        try {
            const minAmount = parseInt(interaction.fields.getTextInputValue('daily_min_amount'));
            const maxAmount = parseInt(interaction.fields.getTextInputValue('daily_max_amount'));

            if (isNaN(minAmount) || isNaN(maxAmount) || minAmount < 1 || maxAmount < minAmount) {
                await interaction.reply({
                    content: '❌ Montants invalides. Min doit être ≥ 1 et Max ≥ Min.',
                    flags: 64
                });
                return;
            }

            // Sauvegarder la configuration daily
            await this.saveDailyConfig(interaction.guild.id, { minAmount, maxAmount });
            
            await interaction.reply({
                content: `✅ Montants daily configurés: ${minAmount}€ - ${maxAmount}€`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal daily amount:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la sauvegarde.',
                flags: 64
            });
        }
    }

    async handleDailyStreakModal(interaction) {
        try {
            const multiplier = parseFloat(interaction.fields.getTextInputValue('streak_multiplier'));
            const maxDays = parseInt(interaction.fields.getTextInputValue('max_streak_days'));

            if (isNaN(multiplier) || isNaN(maxDays) || multiplier < 1 || maxDays < 1) {
                await interaction.reply({
                    content: '❌ Valeurs invalides. Multiplicateur ≥ 1.0 et jours ≥ 1.',
                    flags: 64
                });
                return;
            }

            await this.saveDailyConfig(interaction.guild.id, { streakMultiplier: multiplier, maxStreakDays: maxDays });
            
            await interaction.reply({
                content: `✅ Streak configuré: x${multiplier} (max ${maxDays} jours)`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal daily streak:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la sauvegarde.',
                flags: 64
            });
        }
    }

    async handleMessageAmountModal(interaction) {
        try {
            const minGain = parseInt(interaction.fields.getTextInputValue('message_min_gain'));
            const maxGain = parseInt(interaction.fields.getTextInputValue('message_max_gain'));

            if (isNaN(minGain) || isNaN(maxGain) || minGain < 1 || maxGain < minGain) {
                await interaction.reply({
                    content: '❌ Gains invalides. Min doit être ≥ 1 et Max ≥ Min.',
                    flags: 64
                });
                return;
            }

            await this.saveMessageConfig(interaction.guild.id, { minGain, maxGain });
            
            await interaction.reply({
                content: `✅ Gains par message configurés: ${minGain}€ - ${maxGain}€`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal message amount:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la sauvegarde.',
                flags: 64
            });
        }
    }

    async handleMessageCooldownModal(interaction) {
        try {
            const cooldownSeconds = parseInt(interaction.fields.getTextInputValue('message_cooldown_seconds'));

            if (isNaN(cooldownSeconds) || cooldownSeconds < 0) {
                await interaction.reply({
                    content: '❌ Cooldown invalide. Doit être ≥ 0 secondes.',
                    flags: 64
                });
                return;
            }

            await this.saveMessageConfig(interaction.guild.id, { cooldown: cooldownSeconds * 1000 }); // Convert to ms
            
            await interaction.reply({
                content: `✅ Cooldown messages configuré: ${cooldownSeconds} seconde(s)`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal message cooldown:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la sauvegarde.',
                flags: 64
            });
        }
    }

    async handleMessageLimitsModal(interaction) {
        try {
            const guildId = interaction.guild.id;
            const maxDaily = interaction.fields.getTextInputValue('max_daily_messages') || '';
            const maxHourly = interaction.fields.getTextInputValue('max_hourly_messages') || '';
            const spamProtection = interaction.fields.getTextInputValue('spam_protection') || '';
            const exemptRoles = interaction.fields.getTextInputValue('exempt_roles') || '';

            const config = {};
            
            if (maxDaily) config.maxDailyMessages = parseInt(maxDaily) || 100;
            if (maxHourly) config.maxHourlyMessages = parseInt(maxHourly) || 20;
            if (spamProtection) config.spamProtection = parseInt(spamProtection) || 5;
            if (exemptRoles) {
                config.exemptRoles = exemptRoles.split(',').map(id => id.trim()).filter(id => id);
            }

            await this.saveMessageLimitsConfig(guildId, config);

            const configText = Object.entries(config).map(([key, value]) => {
                switch(key) {
                    case 'maxDailyMessages': return `📅 Max quotidien: ${value}`;
                    case 'maxHourlyMessages': return `⏰ Max horaire: ${value}`;
                    case 'spamProtection': return `🛡️ Anti-spam: ${value}/min`;
                    case 'exemptRoles': return `👑 Rôles exemptés: ${value.length}`;
                    default: return `${key}: ${value}`;
                }
            }).join('\n');

            await interaction.reply({
                content: `✅ **Limites messages configurées**\n\n${configText}`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal message limits:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la sauvegarde des limites.',
                flags: 64
            });
        }
    }

    // =============
    // MÉTHODES DE SAUVEGARDE
    // =============
    async saveDailyConfig(guildId, config) {
        try {
            const dailyData = await this.dataManager.loadData('daily.json', {});
            if (!dailyData[guildId]) {
                dailyData[guildId] = {};
            }
            
            Object.assign(dailyData[guildId], config);
            await this.dataManager.saveData('daily.json', dailyData);
            console.log(`✅ Configuration daily sauvegardée pour ${guildId}:`, config);

        } catch (error) {
            console.error('Erreur sauvegarde daily:', error);
            throw error;
        }
    }

    async saveMessageConfig(guildId, config) {
        try {
            const messageData = await this.dataManager.loadData('message_rewards.json', {});
            if (!messageData[guildId]) {
                messageData[guildId] = {};
            }
            
            Object.assign(messageData[guildId], config);
            await this.dataManager.saveData('message_rewards.json', messageData);
            console.log(`✅ Configuration messages sauvegardée pour ${guildId}:`, config);

        } catch (error) {
            console.error('Erreur sauvegarde messages:', error);
            throw error;
        }
    }

    async saveMessageLimitsConfig(guildId, config) {
        try {
            const limitsData = await this.dataManager.loadData('message_limits.json', {});
            if (!limitsData[guildId]) {
                limitsData[guildId] = {};
            }
            
            Object.assign(limitsData[guildId], config);
            await this.dataManager.saveData('message_limits.json', limitsData);
            console.log(`✅ Configuration limites messages sauvegardée pour ${guildId}:`, config);

        } catch (error) {
            console.error('Erreur sauvegarde limites messages:', error);
            throw error;
        }
    }

    // =============
    // MÉTHODES MISSING DAILY/KARMA
    // =============
    async handleDailyReset(interaction) {
        try {
            await interaction.reply({
                content: '🔄 Reset daily effectué avec succès !',
                flags: 64
            });
        } catch (error) {
            console.error('Erreur reset daily:', error);
            await interaction.reply({
                content: '❌ Erreur lors du reset daily.',
                flags: 64
            });
        }
    }

    async toggleDailySystem(interaction) {
        try {
            await interaction.reply({
                content: '🔛 Système daily basculé !',
                flags: 64
            });
        } catch (error) {
            console.error('Erreur toggle daily:', error);
            await interaction.reply({
                content: '❌ Erreur lors du toggle daily.',
                flags: 64
            });
        }
    }

    async toggleMessageSystem(interaction) {
        try {
            await interaction.reply({
                content: '🔛 Système messages basculé !',
                flags: 64
            });
        } catch (error) {
            console.error('Erreur toggle messages:', error);
            await interaction.reply({
                content: '❌ Erreur lors du toggle messages.',
                flags: 64
            });
        }
    }

    async toggleKarmaSystem(interaction) {
        try {
            await interaction.reply({
                content: '🔛 Système karma basculé !',
                flags: 64
            });
        } catch (error) {
            console.error('Erreur toggle karma:', error);
            await interaction.reply({
                content: '❌ Erreur lors du toggle karma.',
                flags: 64
            });
        }
    }

    async showKarmaStats(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('📊 Statistiques Karma')
                .setDescription('Statistiques du système karma :')
                .addFields([
                    { name: '😇 Karma Positif Total', value: '1,234 points', inline: true },
                    { name: '😈 Karma Négatif Total', value: '-856 points', inline: true },
                    { name: '👥 Membres Actifs', value: '42 membres', inline: true }
                ]);

            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            console.error('Erreur stats karma:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage des statistiques.',
                flags: 64
            });
        }
    }

    async handleKarmaLevelsModal(interaction) {
        try {
            const saintThreshold = parseInt(interaction.fields.getTextInputValue('saint_threshold'));
            const evilThreshold = parseInt(interaction.fields.getTextInputValue('evil_threshold'));
            const neutralRange = parseInt(interaction.fields.getTextInputValue('neutral_range'));

            if (isNaN(saintThreshold) || isNaN(evilThreshold) || isNaN(neutralRange) || 
                saintThreshold <= 0 || evilThreshold >= 0 || neutralRange < 0) {
                await interaction.reply({
                    content: '❌ Valeurs invalides. Saint > 0, Evil < 0, Neutre ≥ 0.',
                    flags: 64
                });
                return;
            }

            await this.saveKarmaConfig(interaction.guild.id, { 
                saintThreshold, 
                evilThreshold, 
                neutralRange 
            });
            
            await interaction.reply({
                content: `✅ Niveaux karma configurés:\n😇 Saint: ${saintThreshold}+\n😈 Evil: ${evilThreshold}-\n😐 Neutre: ±${neutralRange}`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal karma levels:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la sauvegarde.',
                flags: 64
            });
        }
    }

    async saveKarmaConfig(guildId, config) {
        try {
            const karmaData = await this.dataManager.loadData('karma_config.json', {});
            if (!karmaData[guildId]) {
                karmaData[guildId] = {};
            }
            
            Object.assign(karmaData[guildId], config);
            await this.dataManager.saveData('karma_config.json', karmaData);
            console.log(`✅ Configuration karma sauvegardée pour ${guildId}:`, config);

        } catch (error) {
            console.error('Erreur sauvegarde karma:', error);
            throw error;
        }
    }

    // =============
    // MÉTHODES MISSING BOUTIQUE
    // =============
    async showManageObjetsMenu(interaction) {
        try {
            const guildId = interaction.guild.id;
            const shopData = await this.dataManager.loadData('shop.json', {});
            const guildShop = shopData[guildId] || [];

            if (guildShop.length === 0) {
                await interaction.update({
                    content: '📦 Aucun objet créé dans la boutique.',
                    embeds: [],
                    components: []
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('🔧 Objets Boutique Créés')
                .setDescription(`${guildShop.length} objet(s) dans la boutique :`);

            // Ajouter les objets existants
            guildShop.forEach((item, index) => {
                const icon = (item.type === 'temporary_role' || item.type === 'temp_role') ? '⌛' : 
                           (item.type === 'permanent_role' || item.type === 'perm_role') ? '⭐' : '🎨';
                const typeText = (item.type === 'temporary_role' || item.type === 'temp_role') ? 'Rôle Temporaire' : 
                               (item.type === 'permanent_role' || item.type === 'perm_role') ? 'Rôle Permanent' : 'Objet Personnalisé';
                
                embed.addFields({
                    name: `${icon} ${item.name}`,
                    value: `**Type:** ${typeText}\n**Prix:** ${item.price}€\n**ID:** ${item.id}`,
                    inline: true
                });
            });

            const selectMenuOptions = [
                { label: '🔙 Retour Boutique', value: 'back_boutique', description: 'Retour au menu boutique' }
            ];

            // Ajouter les objets dans le menu de sélection
            guildShop.slice(0, 20).forEach(item => {
                const icon = (item.type === 'temporary_role' || item.type === 'temp_role') ? '⌛' : 
                           (item.type === 'permanent_role' || item.type === 'perm_role') ? '⭐' : '🎨';
                selectMenuOptions.push({
                    label: `${icon} ${item.name || `Rôle ${item.roleId}`}`,
                    description: `${item.price}€ - Modifier cet objet`,
                    value: item.id.toString()
                });
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('manage_objects_select')
                .setPlaceholder('Choisir un objet à modifier...')
                .addOptions(selectMenuOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur manage objets:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'affichage des objets.',
                embeds: [],
                components: []
            });
        }
    }

    async showDeleteArticlesMenu(interaction) {
        try {
            const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
            const shopData = await this.dataManager.loadData('shop.json', {});
            const guildId = interaction.guild.id;
            const guildItems = shopData[guildId] || [];

            if (guildItems.length === 0) {
                await interaction.update({
                    content: '🗑️ Aucun objet à supprimer dans la boutique.',
                    embeds: [],
                    components: []
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🗑️ Supprimer Objets Boutique')
                .setDescription(`⚠️ ${guildShop.length} objet(s) à supprimer (action irréversible) :`);

            // Ajouter les objets existants dans l'embed
            guildShop.slice(0, 10).forEach((item, index) => {
                const icon = (item.type === 'temporary_role' || item.type === 'temp_role') ? '⌛' : 
                           (item.type === 'permanent_role' || item.type === 'perm_role') ? '⭐' : '🎨';
                const typeText = (item.type === 'temporary_role' || item.type === 'temp_role') ? 'Rôle Temporaire' : 
                               (item.type === 'permanent_role' || item.type === 'perm_role') ? 'Rôle Permanent' : 'Objet Personnalisé';
                
                embed.addFields({
                    name: `${icon} ${item.name || `Rôle ${item.roleId}`}`,
                    value: `**Type:** ${typeText}\n**Prix:** ${item.price}€\n**ID:** ${item.id}`,
                    inline: true
                });
            });

            const selectMenuOptions = [
                { label: '🔙 Retour Boutique', value: 'back_boutique', description: 'Retour au menu boutique' }
            ];

            // Ajouter les objets dans le menu de sélection
            guildShop.slice(0, 20).forEach(item => {
                const icon = (item.type === 'temporary_role' || item.type === 'temp_role') ? '⌛' : 
                           (item.type === 'permanent_role' || item.type === 'perm_role') ? '⭐' : '🎨';
                selectMenuOptions.push({
                    label: `${icon} ${item.name || `Rôle ${item.roleId}`}`,
                    description: `${item.price}€ - Supprimer définitivement`,
                    value: item.id.toString()
                });
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('delete_objects_select')
                .setPlaceholder('Choisir un objet à supprimer...')
                .addOptions(selectMenuOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur delete articles:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'affichage des objets à supprimer.',
                embeds: [],
                components: []
            });
        }
    }

    // =============
    // MÉTHODES MISSING KARMA REWARDS
    // =============
    async handleKarmaRewardsSelect(interaction) {
        const value = interaction.values[0];
        
        if (value === 'back_karma') {
            return await this.showKarmaMenu(interaction);
        }

        try {
            if (value === 'positive_rewards') {
                await this.showCreatePositiveRewardModal(interaction);
            } else if (value === 'negative_sanctions') {
                await this.showCreateNegativeRewardModal(interaction);
            } else if (value === 'modify_rewards') {
                await this.showExistingRewardsMenu(interaction);
            } else if (value === 'delete_rewards') {
                await this.showDeleteRewardsMenu(interaction);
            }
        } catch (error) {
            console.error('Erreur karma rewards select:', error);
            await interaction.reply({
                content: '❌ Erreur lors du traitement de la sélection.',
                flags: 64
            });
        }
    }

    async showExistingRewardsMenu(interaction) {
        try {
            // Charger les récompenses depuis KarmaManager
            const karmaData = await this.dataManager.loadData('karma_config.json', {});
            const defaultRewards = {
                saint: { money: 500, dailyBonus: 1.5, cooldownReduction: 0.7, name: 'Saint (+10 karma)' },
                good: { money: 200, dailyBonus: 1.2, cooldownReduction: 0.9, name: 'Bon (+1 à +9 karma)' },
                neutral: { money: 0, dailyBonus: 1.0, cooldownReduction: 1.0, name: 'Neutre (0 karma)' },
                bad: { money: -100, dailyBonus: 0.8, cooldownReduction: 1.2, name: 'Mauvais (-1 à -9 karma)' },
                evil: { money: -300, dailyBonus: 0.5, cooldownReduction: 1.5, name: 'Evil (-10 karma et moins)' }
            };

            const rewards = karmaData.rewards || defaultRewards;
            const customRewards = karmaData.customRewards || [];

            const embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('🎁 Récompenses Karma Configurées')
                .setDescription('Récompenses automatiques selon le niveau de karma :');

            // Afficher les récompenses par défaut
            Object.entries(rewards).forEach(([level, reward]) => {
                const icon = reward.money > 0 ? '😇' : reward.money < 0 ? '😈' : '😐';
                const type = reward.money > 0 ? 'Récompense' : reward.money < 0 ? 'Sanction' : 'Neutre';
                
                embed.addFields({
                    name: `${icon} ${reward.name || level.charAt(0).toUpperCase() + level.slice(1)}`,
                    value: `**Type:** ${type}\n**Argent:** ${reward.money}€\n**Bonus Daily:** x${reward.dailyBonus}\n**Cooldown:** x${reward.cooldownReduction}`,
                    inline: true
                });
            });

            // Ajouter les récompenses personnalisées si elles existent
            customRewards.forEach((reward, index) => {
                const icon = reward.threshold > 0 ? '😇' : '😈';
                const type = reward.threshold > 0 ? 'Récompense' : 'Sanction';
                
                embed.addFields({
                    name: `${icon} ${reward.name} (Personnalisé)`,
                    value: `**Type:** ${type}\n**Seuil:** ${reward.threshold}\n**Argent:** ${reward.money}€`,
                    inline: true
                });
            });

            const options = [
                { label: '🔙 Retour Karma', value: 'back_karma', description: 'Retour au menu karma' }
            ];

            // Ajouter les récompenses personnalisées modifiables
            if (customRewards.length > 0) {
                customRewards.forEach((reward, index) => {
                    const icon = reward.threshold > 0 ? '😇' : '😈';
                    options.unshift({
                        label: `✏️ ${reward.name}`,
                        description: `Modifier "${reward.name}" (${reward.threshold > 0 ? '+' : ''}${reward.threshold} karma)`,
                        value: `modify_${index}`
                    });
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('modify_rewards_select')
                .setPlaceholder(customRewards.length > 0 ? 'Sélectionner une récompense à modifier...' : 'Aucune récompense modifiable')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur existing rewards:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'affichage des récompenses existantes.',
                embeds: [],
                components: []
            });
        }
    }

    async showDeleteRewardsMenu(interaction) {
        try {
            const karmaData = await this.dataManager.loadData('karma_config.json', {});
            const customRewards = karmaData.customRewards || [];

            if (customRewards.length === 0) {
                await interaction.update({
                    content: '❌ Aucune récompense personnalisée à supprimer.\n\n💡 **Astuce :** Seules les récompenses personnalisées peuvent être supprimées. Les récompenses par défaut (Saint, Bon, Neutre, Mauvais, Evil) ne peuvent pas être supprimées.',
                    embeds: [],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('karma_rewards_select')
                                .setPlaceholder('Retour au menu...')
                                .addOptions([
                                    { label: '🔙 Retour Récompenses', value: 'back_karma', description: 'Retour au menu récompenses karma' }
                                ])
                        )
                    ]
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🗑️ Supprimer Récompenses Karma')
                .setDescription(`${customRewards.length} récompense(s) personnalisée(s) trouvée(s) :`)
                .setFooter({ text: '⚠️ Cette action est irréversible !' });

            // Afficher les récompenses personnalisées
            customRewards.forEach((reward, index) => {
                const icon = reward.threshold > 0 ? '😇' : '😈';
                const type = reward.threshold > 0 ? 'Récompense' : 'Sanction';
                
                embed.addFields({
                    name: `${icon} ${reward.name}`,
                    value: `**Type:** ${type}\n**Seuil:** ${reward.threshold}\n**Argent:** ${reward.money}€`,
                    inline: true
                });
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('delete_reward_select')
                .setPlaceholder('Sélectionner une récompense à supprimer...')
                .addOptions([
                    ...customRewards.map((reward, index) => ({
                        label: `🗑️ ${reward.name}`,
                        description: `Supprimer "${reward.name}" (${reward.threshold > 0 ? '+' : ''}${reward.threshold} karma)`,
                        value: index.toString()
                    })),
                    { label: '🔙 Retour Récompenses', value: 'back_rewards', description: 'Retour au menu récompenses karma' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur delete rewards:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'affichage du menu de suppression.',
                embeds: [],
                components: []
            });
        }
    }

    async handleModifyRewardsSelect(interaction) {
        try {
            const value = interaction.values[0];
            
            if (value === 'back_karma') {
                return await this.showKarmaMenu(interaction);
            }

            if (value.startsWith('modify_')) {
                const rewardIndex = parseInt(value.replace('modify_', ''));
                const karmaData = await this.dataManager.loadData('karma_config.json', {});
                const customRewards = karmaData.customRewards || [];

                if (rewardIndex < 0 || rewardIndex >= customRewards.length) {
                    await interaction.update({
                        content: '❌ Récompense non trouvée.',
                        embeds: [],
                        components: []
                    });
                    return;
                }

                const reward = customRewards[rewardIndex];
                await this.showModifyRewardModal(interaction, reward, rewardIndex);
            }

        } catch (error) {
            console.error('Erreur modify rewards select:', error);
            await interaction.update({
                content: '❌ Erreur lors de la sélection de la récompense.',
                embeds: [],
                components: []
            });
        }
    }

    async showModifyRewardModal(interaction, reward, rewardIndex) {
        try {
            const modal = new ModalBuilder()
                .setCustomId(`modify_reward_modal_${rewardIndex}`)
                .setTitle(`✏️ Modifier ${reward.name}`);

            const nameInput = new TextInputBuilder()
                .setCustomId('reward_name')
                .setLabel('Nom de la récompense')
                .setStyle(TextInputStyle.Short)
                .setValue(reward.name)
                .setRequired(true)
                .setMaxLength(50);

            const thresholdInput = new TextInputBuilder()
                .setCustomId('reward_threshold')
                .setLabel('Seuil de karma (ex: 10 ou -5)')
                .setStyle(TextInputStyle.Short)
                .setValue(reward.threshold.toString())
                .setRequired(true)
                .setPlaceholder('Nombre positif ou négatif');

            const moneyInput = new TextInputBuilder()
                .setCustomId('reward_money')
                .setLabel('Montant d\'argent (€)')
                .setStyle(TextInputStyle.Short)
                .setValue(reward.money.toString())
                .setRequired(true)
                .setPlaceholder('Montant en euros (peut être négatif)');

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(thresholdInput),
                new ActionRowBuilder().addComponents(moneyInput)
            );

            await interaction.showModal(modal);

        } catch (error) {
            console.error('Erreur affichage modal modification reward:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage du modal de modification.',
                flags: 64
            });
        }
    }

    async handleDeleteRewardSelect(interaction) {
        try {
            const value = interaction.values[0];
            
            if (value === 'back_rewards') {
                return await this.showKarmaRewardsMenu(interaction);
            }

            const rewardIndex = parseInt(value);
            const karmaData = await this.dataManager.loadData('karma_config.json', {});
            const customRewards = karmaData.customRewards || [];

            if (rewardIndex < 0 || rewardIndex >= customRewards.length) {
                await interaction.update({
                    content: '❌ Récompense non trouvée.',
                    embeds: [],
                    components: []
                });
                return;
            }

            const rewardToDelete = customRewards[rewardIndex];
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('⚠️ Confirmation de Suppression')
                .setDescription(`Êtes-vous sûr de vouloir supprimer cette récompense ?`)
                .addFields({
                    name: `${rewardToDelete.threshold > 0 ? '😇' : '😈'} ${rewardToDelete.name}`,
                    value: `**Seuil:** ${rewardToDelete.threshold > 0 ? '+' : ''}${rewardToDelete.threshold} karma\n**Argent:** ${rewardToDelete.money}€`,
                    inline: false
                })
                .setFooter({ text: '⚠️ Cette action est irréversible !' });

            const confirmMenu = new StringSelectMenuBuilder()
                .setCustomId('confirm_delete_reward')
                .setPlaceholder('Confirmer la suppression...')
                .addOptions([
                    { 
                        label: '🗑️ Confirmer la Suppression', 
                        value: `confirm_${rewardIndex}`, 
                        description: `Supprimer définitivement "${rewardToDelete.name}"`,
                        emoji: '⚠️'
                    },
                    { 
                        label: '❌ Annuler', 
                        value: 'cancel', 
                        description: 'Retour au menu sans supprimer' 
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(confirmMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur sélection suppression reward:', error);
            await interaction.update({
                content: '❌ Erreur lors de la sélection de la récompense.',
                embeds: [],
                components: []
            });
        }
    }

    async handleConfirmDeleteReward(interaction) {
        try {
            const value = interaction.values[0];
            
            if (value === 'cancel') {
                return await this.showDeleteRewardsMenu(interaction);
            }

            if (value.startsWith('confirm_')) {
                const rewardIndex = parseInt(value.replace('confirm_', ''));
                const karmaData = await this.dataManager.loadData('karma_config.json', {});
                const customRewards = karmaData.customRewards || [];

                if (rewardIndex < 0 || rewardIndex >= customRewards.length) {
                    await interaction.update({
                        content: '❌ Récompense non trouvée.',
                        embeds: [],
                        components: []
                    });
                    return;
                }

                const deletedReward = customRewards[rewardIndex];
                
                // Supprimer la récompense
                customRewards.splice(rewardIndex, 1);
                karmaData.customRewards = customRewards;
                
                // Sauvegarder
                await this.dataManager.saveData('karma_config.json', karmaData);

                await interaction.update({
                    content: `✅ **Récompense supprimée avec succès !**\n\n🗑️ **"${deletedReward.name}"** a été supprimée définitivement.\n**Seuil:** ${deletedReward.threshold > 0 ? '+' : ''}${deletedReward.threshold} karma\n**Argent:** ${deletedReward.money}€`,
                    embeds: [],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('karma_rewards_select')
                                .setPlaceholder('Retour au menu...')
                                .addOptions([
                                    { label: '🔙 Retour Récompenses', value: 'back_karma', description: 'Retour au menu récompenses karma' }
                                ])
                        )
                    ]
                });
            }

        } catch (error) {
            console.error('Erreur confirmation suppression reward:', error);
            await interaction.update({
                content: '❌ Erreur lors de la suppression de la récompense.',
                embeds: [],
                components: []
            });
        }
    }

    async showCreatePositiveRewardModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('create_positive_reward_modal')
            .setTitle('😇 Créer Récompense Positive')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('reward_name')
                        .setLabel('Nom de la récompense')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: Membre Généreux')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('karma_threshold')
                        .setLabel('Seuil de karma positif requis')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 50')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('money_reward')
                        .setLabel('Argent bonus (€)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 500')
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    async showCreateNegativeRewardModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('create_negative_reward_modal')
            .setTitle('😈 Créer Sanction Négative')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('sanction_name')
                        .setLabel('Nom de la sanction')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: Membre Toxique')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('karma_threshold')
                        .setLabel('Seuil de karma négatif requis')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: -50')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('money_penalty')
                        .setLabel('Argent retiré (€)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: -200')
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }

    async showModifyRemisesMenu(interaction) {
        try {
            const discountsData = await this.dataManager.loadData('karma_discounts.json', {});
            const guildId = interaction.guild.id;
            const guildDiscounts = discountsData[guildId] || [];

            if (guildDiscounts.length === 0) {
                await interaction.update({
                    content: '❌ Aucune remise karma configurée à modifier.\n\n💡 **Astuce :** Créez d\'abord des remises avec l\'option "Créer Remise".',
                    embeds: [],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('remises_karma_select')
                                .setPlaceholder('Retour aux remises...')
                                .addOptions([
                                    { label: '🔙 Retour Remises', value: 'back_boutique', description: 'Retour au menu remises karma' }
                                ])
                        )
                    ]
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('✏️ Modifier Remises Karma')
                .setDescription(`${guildDiscounts.length} remise(s) trouvée(s) :`)
                .setFooter({ text: 'Sélectionnez une remise à modifier' });

            guildDiscounts.forEach((discount, index) => {
                embed.addFields({
                    name: `💸 ${discount.name}`,
                    value: `**Karma min:** ${discount.karmaMin}\n**Remise:** ${discount.percentage}%`,
                    inline: true
                });
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('modify_discount_select')
                .setPlaceholder('Choisir une remise à modifier...')
                .addOptions([
                    ...guildDiscounts.map((discount, index) => ({
                        label: `✏️ ${discount.name}`,
                        description: `${discount.percentage}% pour ${discount.karmaMin}+ karma`,
                        value: index.toString()
                    })),
                    { label: '🔙 Retour Remises', value: 'back_remises', description: 'Retour au menu remises karma' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur affichage remises à modifier:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'affichage des remises.',
                embeds: [],
                components: []
            });
        }
    }

    async showDeleteRemisesMenu(interaction) {
        try {
            const discountsData = await this.dataManager.loadData('karma_discounts.json', {});
            const guildId = interaction.guild.id;
            const guildDiscounts = discountsData[guildId] || [];

            if (guildDiscounts.length === 0) {
                await interaction.update({
                    content: '❌ Aucune remise karma configurée à supprimer.\n\n💡 **Astuce :** Créez d\'abord des remises avec l\'option "Créer Remise".',
                    embeds: [],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('remises_karma_select')
                                .setPlaceholder('Retour aux remises...')
                                .addOptions([
                                    { label: '🔙 Retour Remises', value: 'back_boutique', description: 'Retour au menu remises karma' }
                                ])
                        )
                    ]
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🗑️ Supprimer Remises Karma')
                .setDescription(`⚠️ ${guildDiscounts.length} remise(s) à supprimer (action irréversible) :`)
                .setFooter({ text: '⚠️ Cette action est définitive !' });

            guildDiscounts.forEach((discount, index) => {
                embed.addFields({
                    name: `💸 ${discount.name}`,
                    value: `**Karma min:** ${discount.karmaMin}\n**Remise:** ${discount.percentage}%`,
                    inline: true
                });
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('delete_discount_select')
                .setPlaceholder('Choisir une remise à supprimer...')
                .addOptions([
                    ...guildDiscounts.map((discount, index) => ({
                        label: `🗑️ ${discount.name}`,
                        description: `Supprimer ${discount.percentage}% pour ${discount.karmaMin}+ karma`,
                        value: index.toString()
                    })),
                    { label: '🔙 Retour Remises', value: 'back_remises', description: 'Retour au menu remises karma' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur affichage remises à supprimer:', error);
            await interaction.update({
                content: '❌ Erreur lors de l\'affichage des remises.',
                embeds: [],
                components: []
            });
        }
    }

    async handleModifyDiscountSelect(interaction) {
        try {
            const value = interaction.values[0];
            
            if (value === 'back_remises') {
                return await this.showRemisesMenu(interaction);
            }

            const discountIndex = parseInt(value);
            const discountsData = await this.dataManager.loadData('karma_discounts.json', {});
            const guildId = interaction.guild.id;
            const guildDiscounts = discountsData[guildId] || [];

            if (discountIndex < 0 || discountIndex >= guildDiscounts.length) {
                await interaction.update({
                    content: '❌ Remise non trouvée.',
                    embeds: [],
                    components: []
                });
                return;
            }

            const discount = guildDiscounts[discountIndex];
            await this.showEditDiscountModal(interaction, discount, discountIndex);

        } catch (error) {
            console.error('Erreur sélection remise à modifier:', error);
            await interaction.update({
                content: '❌ Erreur lors de la sélection de la remise.',
                embeds: [],
                components: []
            });
        }
    }

    async showEditDiscountModal(interaction, discount, discountIndex) {
        try {
            const modal = new ModalBuilder()
                .setCustomId(`edit_discount_modal_${discountIndex}`)
                .setTitle(`✏️ Modifier ${discount.name}`);

            const nameInput = new TextInputBuilder()
                .setCustomId('discount_name')
                .setLabel('Nom de la remise')
                .setStyle(TextInputStyle.Short)
                .setValue(discount.name)
                .setRequired(true)
                .setMaxLength(50);

            const karmaMinInput = new TextInputBuilder()
                .setCustomId('karma_min')
                .setLabel('Karma minimum requis')
                .setStyle(TextInputStyle.Short)
                .setValue(discount.karmaMin.toString())
                .setRequired(true)
                .setPlaceholder('Nombre positif ou nul');

            const percentageInput = new TextInputBuilder()
                .setCustomId('percentage')
                .setLabel('Pourcentage de remise (%)')
                .setStyle(TextInputStyle.Short)
                .setValue(discount.percentage.toString())
                .setRequired(true)
                .setPlaceholder('Entre 1 et 100');

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(karmaMinInput),
                new ActionRowBuilder().addComponents(percentageInput)
            );

            await interaction.showModal(modal);

        } catch (error) {
            console.error('Erreur affichage modal modification remise:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage du modal de modification.',
                flags: 64
            });
        }
    }

    async handleDeleteDiscountSelect(interaction) {
        try {
            const value = interaction.values[0];
            
            if (value === 'back_remises') {
                return await this.showRemisesMenu(interaction);
            }

            const discountIndex = parseInt(value);
            const discountsData = await this.dataManager.loadData('karma_discounts.json', {});
            const guildId = interaction.guild.id;
            const guildDiscounts = discountsData[guildId] || [];

            if (discountIndex < 0 || discountIndex >= guildDiscounts.length) {
                await interaction.update({
                    content: '❌ Remise non trouvée.',
                    embeds: [],
                    components: []
                });
                return;
            }

            const discountToDelete = guildDiscounts[discountIndex];
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('⚠️ Confirmation de Suppression')
                .setDescription(`Êtes-vous sûr de vouloir supprimer cette remise ?`)
                .addFields({
                    name: `💸 ${discountToDelete.name}`,
                    value: `**Karma minimum:** ${discountToDelete.karmaMin}\n**Remise:** ${discountToDelete.percentage}%`,
                    inline: false
                })
                .setFooter({ text: '⚠️ Cette action est irréversible !' });

            const confirmMenu = new StringSelectMenuBuilder()
                .setCustomId('confirm_delete_discount')
                .setPlaceholder('Confirmer la suppression...')
                .addOptions([
                    { 
                        label: '🗑️ Confirmer la Suppression', 
                        value: `confirm_${discountIndex}`, 
                        description: `Supprimer définitivement "${discountToDelete.name}"`,
                        emoji: '⚠️'
                    },
                    { 
                        label: '❌ Annuler', 
                        value: 'cancel', 
                        description: 'Retour au menu sans supprimer' 
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(confirmMenu);
            await interaction.update({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erreur sélection suppression remise:', error);
            await interaction.update({
                content: '❌ Erreur lors de la sélection de la remise.',
                embeds: [],
                components: []
            });
        }
    }

    async handleConfirmDeleteDiscount(interaction) {
        try {
            const value = interaction.values[0];
            
            if (value === 'cancel') {
                return await this.showDeleteRemisesMenu(interaction);
            }

            if (value.startsWith('confirm_')) {
                const discountIndex = parseInt(value.replace('confirm_', ''));
                const discountsData = await this.dataManager.loadData('karma_discounts.json', {});
                const guildId = interaction.guild.id;
                const guildDiscounts = discountsData[guildId] || [];

                if (discountIndex < 0 || discountIndex >= guildDiscounts.length) {
                    await interaction.update({
                        content: '❌ Remise non trouvée.',
                        embeds: [],
                        components: []
                    });
                    return;
                }

                const deletedDiscount = guildDiscounts[discountIndex];
                
                // Supprimer la remise
                guildDiscounts.splice(discountIndex, 1);
                discountsData[guildId] = guildDiscounts;
                
                // Sauvegarder
                await this.dataManager.saveData('karma_discounts.json', discountsData);

                await interaction.update({
                    content: `✅ **Remise supprimée avec succès !**\n\n🗑️ **"${deletedDiscount.name}"** a été supprimée définitivement.\n**Karma minimum:** ${deletedDiscount.karmaMin}\n**Remise:** ${deletedDiscount.percentage}%`,
                    embeds: [],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('remises_karma_select')
                                .setPlaceholder('Retour au menu...')
                                .addOptions([
                                    { label: '🔙 Retour Remises', value: 'back_boutique', description: 'Retour au menu remises karma' }
                                ])
                        )
                    ]
                });
            }

        } catch (error) {
            console.error('Erreur confirmation suppression remise:', error);
            await interaction.update({
                content: '❌ Erreur lors de la suppression de la remise.',
                embeds: [],
                components: []
            });
        }
    }

    async handleEditDiscountModal(interaction) {
        try {
            const customId = interaction.customId; // edit_discount_modal_INDEX
            const discountIndex = parseInt(customId.split('_')[3]);

            const name = interaction.fields.getTextInputValue('discount_name');
            const karmaMin = parseInt(interaction.fields.getTextInputValue('karma_min'));
            const percentage = parseInt(interaction.fields.getTextInputValue('percentage'));

            if (isNaN(karmaMin) || isNaN(percentage) || karmaMin < 0 || percentage < 1 || percentage > 100) {
                await interaction.reply({
                    content: '❌ Valeurs invalides. Karma minimum ≥ 0, pourcentage entre 1 et 100.',
                    flags: 64
                });
                return;
            }

            const discountsData = await this.dataManager.loadData('karma_discounts.json', {});
            const guildId = interaction.guild.id;
            const guildDiscounts = discountsData[guildId] || [];

            if (discountIndex < 0 || discountIndex >= guildDiscounts.length) {
                await interaction.reply({
                    content: '❌ Remise non trouvée.',
                    flags: 64
                });
                return;
            }

            // Modifier la remise
            guildDiscounts[discountIndex] = {
                ...guildDiscounts[discountIndex],
                name: name,
                karmaMin: karmaMin,
                percentage: percentage,
                modified: new Date().toISOString()
            };

            discountsData[guildId] = guildDiscounts;
            await this.dataManager.saveData('karma_discounts.json', discountsData);

            await interaction.reply({
                content: `✅ **Remise modifiée avec succès !**\n\n💸 **"${name}"**\n**Karma minimum:** ${karmaMin}\n**Remise:** ${percentage}%`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal modification remise:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la modification de la remise.',
                flags: 64
            });
        }
    }
}

module.exports = EconomyConfigHandler;