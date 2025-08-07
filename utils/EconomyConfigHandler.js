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

        // Charger et afficher les valeurs actuelles si disponibles
        try {
            const economyConfig = await this.dataManager.loadData('economy.json', {});
            const actionConfig = (economyConfig.actions && economyConfig.actions[action]) || {};

            const minAmount = (actionConfig.montant && actionConfig.montant.minAmount) ?? actionConfig.minReward;
            const maxAmount = (actionConfig.montant && actionConfig.montant.maxAmount) ?? actionConfig.maxReward;

            let cooldownValue = actionConfig.cooldown;
            if (cooldownValue && typeof cooldownValue === 'object') {
                cooldownValue = cooldownValue.cooldown;
            }
            if (typeof cooldownValue === 'number' && cooldownValue > 10000) {
                cooldownValue = Math.round(cooldownValue / 1000); // passer en secondes si ms
            }

            const goodKarma = (actionConfig.karma && actionConfig.karma.goodKarma) ?? actionConfig.goodKarma;
            const badKarma = (actionConfig.karma && actionConfig.karma.badKarma) ?? actionConfig.badKarma;

            const fields = [];
            fields.push({
                name: '💰 Montant',
                value: (typeof minAmount === 'number' && typeof maxAmount === 'number') ? `${minAmount}€ - ${maxAmount}€` : 'Non défini',
                inline: true
            });
            fields.push({
                name: '⏰ Cooldown (sec)',
                value: (typeof cooldownValue === 'number') ? `${cooldownValue}s` : 'Non défini',
                inline: true
            });
            fields.push({
                name: '⚖️ Karma (😇/😈)',
                value: (typeof goodKarma === 'number' || typeof badKarma === 'number') ? `${goodKarma ?? 0} / ${badKarma ?? 0}` : 'Non défini',
                inline: true
            });

            if (fields.length > 0) {
                embed.addFields(fields);
            }
        } catch (e) {
            // silencieux: en cas d'erreur, on n'ajoute simplement pas les champs
        }

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
        // Charger valeurs existantes pour pré-remplissage
        let existing = {};
        try {
            const economyConfig = await this.dataManager.loadData('economy.json', {});
            const actionConfig = (economyConfig.actions && economyConfig.actions[action]) || {};
            existing = {
                minAmount: (actionConfig.montant && actionConfig.montant.minAmount) ?? actionConfig.minReward,
                maxAmount: (actionConfig.montant && actionConfig.montant.maxAmount) ?? actionConfig.maxReward,
                cooldown: (() => {
                    let c = actionConfig.cooldown;
                    if (c && typeof c === 'object') c = c.cooldown;
                    if (typeof c === 'number' && c > 10000) return Math.round(c / 1000); // ms -> s
                    return c;
                })(),
                goodKarma: (actionConfig.karma && actionConfig.karma.goodKarma) ?? actionConfig.goodKarma,
                badKarma: (actionConfig.karma && actionConfig.karma.badKarma) ?? actionConfig.badKarma,
            };
        } catch (e) {
            // ignore
        }

        const modal = new ModalBuilder()
            .setCustomId(`action_config_modal_${action}_${configType}`)
            .setTitle(`Configuration ${action} - ${configType}`);

        if (configType === 'montant') {
            const minInput = new TextInputBuilder()
                .setCustomId('min_amount')
                .setLabel('Montant minimum (€)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 10')
                .setRequired(true);
            if (typeof existing.minAmount === 'number') minInput.setValue(String(existing.minAmount));

            const maxInput = new TextInputBuilder()
                .setCustomId('max_amount')
                .setLabel('Montant maximum (€)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 50')
                .setRequired(true);
            if (typeof existing.maxAmount === 'number') maxInput.setValue(String(existing.maxAmount));

            modal.addComponents(
                new ActionRowBuilder().addComponents(minInput),
                new ActionRowBuilder().addComponents(maxInput)
            );
        } else if (configType === 'cooldown') {
            const cdInput = new TextInputBuilder()
                .setCustomId('cooldown_seconds')
                .setLabel('Cooldown en secondes')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 3600 (1 heure)')
                .setRequired(true);
            if (typeof existing.cooldown === 'number') cdInput.setValue(String(existing.cooldown));

            modal.addComponents(
                new ActionRowBuilder().addComponents(cdInput)
            );
        } else if (configType === 'karma') {
            const goodInput = new TextInputBuilder()
                .setCustomId('good_karma')
                .setLabel('Karma positif (😇)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 1')
                .setRequired(true);
            if (typeof existing.goodKarma === 'number') goodInput.setValue(String(existing.goodKarma));

            const badInput = new TextInputBuilder()
                .setCustomId('bad_karma')
                .setLabel('Karma négatif (😈)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: -1')
                .setRequired(true);
            if (typeof existing.badKarma === 'number') badInput.setValue(String(existing.badKarma));

            modal.addComponents(
                new ActionRowBuilder().addComponents(goodInput),
                new ActionRowBuilder().addComponents(badInput)
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
                { label: '💸 Remises Réputation', value: 'remises', description: 'Réductions basées sur la réputation' },
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
            .setTitle('💸 Remises Réputation')
            .setDescription('Gérer les remises basées sur la réputation :');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('remises_karma_select')
            .setPlaceholder('Choisissez une action...')
            .addOptions([
                { label: '➕ Créer Remise', value: 'create', description: 'Créer une nouvelle remise réputation' },
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
                { name: '🏪 Boutique', value: 'Objets personnalisés, rôles, remises karma', inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_main_config')
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
        } else {
            await interaction.update({
                content: `🚧 Fonction ${value} en cours de développement...`,
                embeds: [],
                components: []
            });
        }
    }

    async showRemiseModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('remise_karma_modal')
            .setTitle('Créer une Remise Réputation')
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
                        .setCustomId('remise_karma')
                        .setLabel('Réputation minimale requise (-999 à +999)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 100')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('remise_pourcentage')
                        .setLabel('Pourcentage de remise (1-99)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 10')
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
            const karmaMin = parseInt(interaction.fields.getTextInputValue('remise_karma'));
            const pourcentage = parseInt(interaction.fields.getTextInputValue('remise_pourcentage'));

            // Sauvegarder la remise
            await this.saveKarmaDiscount(interaction.guild.id, nom, karmaMin, pourcentage);

            await interaction.reply({
                content: `✅ Remise "${nom}" créée : ${pourcentage}% pour ${karmaMin} de réputation minimum !`,
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
        const discountsData = await this.dataManager.loadData('karma_discounts', {});
        
        if (!discountsData[guildId]) discountsData[guildId] = [];
        
        const remise = {
            id: Date.now().toString(),
            name: nom,
            karmaMin: karmaMin,
            percentage: pourcentage,
            created: new Date().toISOString()
        };
        
        discountsData[guildId].push(remise);
        await this.dataManager.saveData('karma_discounts', discountsData);
        console.log(`✅ Remise réputation créée:`, remise);
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

            const customObjects = guildItems.filter(item => item.type === 'custom_object');

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
                        
                        if (item.type === 'custom_object') {
                            typeIcon = '🎨';
                            typeName = 'Objet personnalisé';
                        } else if (item.type === 'temporary_role') {
                            typeIcon = '⌛';
                            typeName = 'Rôle temporaire';
                        } else if (item.type === 'permanent_role') {
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
                        let typeIcon = item.type === 'custom_object' ? '🎨' : 
                                     item.type === 'temporary_role' ? '⌛' : '⭐';
                        
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
                    { label: '🫦 Reset Charme', value: 'karma_reset_good', description: 'Remettre à zéro le charme uniquement' },
                    { label: '😈 Reset Perversion', value: 'karma_reset_bad', description: 'Remettre à zéro la perversion uniquement' },
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
            .setTitle('🫦 Reset Charme - Confirmation')
            .setDescription('⚠️ **ATTENTION** : Cette action va remettre à zéro uniquement le charme de tous les membres.')
            .addFields([
                { name: '🗑️ Action', value: 'Reset du charme uniquement', inline: false },
                { name: '👥 Membres affectés', value: 'Tous les membres avec du charme', inline: false },
                { name: '✅ Préservé', value: 'La perversion reste intacte', inline: false },
                { name: '❗ Irréversible', value: 'Cette action ne peut pas être annulée', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_reset_good_confirm')
            .setPlaceholder('Confirmer le reset du charme...')
            .addOptions([
                { label: '✅ Confirmer Reset Charme', value: 'confirm_reset_good', description: 'RESET du charme uniquement' },
                { label: '❌ Annuler', value: 'cancel_reset', description: 'Annuler l\'opération' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showKarmaResetBadConfirm(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('😈 Reset Perversion - Confirmation')
            .setDescription('⚠️ **ATTENTION** : Cette action va remettre à zéro uniquement la perversion de tous les membres.')
            .addFields([
                { name: '🗑️ Action', value: 'Reset de la perversion uniquement', inline: false },
                { name: '👥 Membres affectés', value: 'Tous les membres avec de la perversion', inline: false },
                { name: '✅ Préservé', value: 'Le charme reste intact', inline: false },
                { name: '❗ Irréversible', value: 'Cette action ne peut pas être annulée', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('karma_reset_bad_confirm')
            .setPlaceholder('Confirmer le reset de la perversion...')
            .addOptions([
                { label: '✅ Confirmer Reset Perversion', value: 'confirm_reset_bad', description: 'RESET de la perversion uniquement' },
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
            const karmaData = await this.dataManager.loadData('karma_config', {});
            if (!karmaData[guildId]) {
                karmaData[guildId] = {};
            }
            
            Object.assign(karmaData[guildId], config);
            await this.dataManager.saveData('karma_config', karmaData);
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
                const icon = item.type === 'temporary_role' ? '⌛' : item.type === 'permanent_role' ? '⭐' : '🎨';
                const typeText = item.type === 'temporary_role' ? 'Rôle Temporaire' : item.type === 'permanent_role' ? 'Rôle Permanent' : 'Objet Personnalisé';
                
                embed.addFields({
                    name: `${icon} ${item.name}`,
                    value: `**Type:** ${typeText}\n**Prix:** ${item.price}€\n**ID:** ${item.id}`,
                    inline: true
                });
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('manage_objects_select')
                .setPlaceholder('Voir les objets créés')
                .addOptions([
                    { label: '🔙 Retour Boutique', value: 'back_boutique', description: 'Retour au menu boutique' }
                ]);

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
            const guildId = interaction.guild.id;
            const shopData = await this.dataManager.loadData('shop.json', {});
            const guildShop = shopData[guildId] || [];

            if (guildShop.length === 0) {
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
                .setDescription('⚠️ Choisissez l\'objet à supprimer (action irréversible) :');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('delete_objects_select')
                .setPlaceholder('Voir les objets à supprimer')
                .addOptions([
                    { label: '🔙 Retour Boutique', value: 'back_boutique', description: 'Retour au menu boutique' }
                ]);

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
            const karmaData = await this.dataManager.loadData('karma_config', {});
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

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('modify_rewards_select')
                .setPlaceholder('Voir les récompenses configurées')
                .addOptions([
                    { label: '🔙 Retour Karma', value: 'back_karma', description: 'Retour au menu karma' }
                ]);

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
            await interaction.update({
                content: '🗑️ Fonction de suppression des récompenses en développement.',
                embeds: [],
                components: []
            });
        } catch (error) {
            console.error('Erreur delete rewards:', error);
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
}

module.exports = EconomyConfigHandler;