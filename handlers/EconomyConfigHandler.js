const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder } = require('discord.js');

class EconomyConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // =============
    // UTILITAIRES DE GESTION DES INTERACTIONS
    // =============
    async safeReply(interaction, options) {
        try {
            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp({ ...options, ephemeral: true });
            } else {
                return await interaction.reply({ ...options, ephemeral: true });
            }
        } catch (error) {
            console.error('Erreur safeReply:', error.message);
            // Si l'interaction a expiré, on ne peut plus rien faire
            return null;
        }
    }

    async safeUpdate(interaction, options) {
        try {
            if (interaction.replied || interaction.deferred) {
                return await interaction.editReply(options);
            } else {
                return await interaction.update(options);
            }
        } catch (error) {
            console.error('Erreur safeUpdate:', error.message);
            // Essayer de répondre si l'update a échoué
            try {
                if (!interaction.replied && !interaction.deferred) {
                    return await interaction.reply({ ...options, ephemeral: true });
                }
            } catch (replyError) {
                console.error('Erreur safeUpdate fallback:', replyError.message);
            }
            return null;
        }
    }

    async safeShowModal(interaction, modal) {
        try {
            if (interaction.replied || interaction.deferred) {
                console.warn('Impossible d\'afficher un modal sur une interaction déjà répondue');
                return null;
            }
            return await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur safeShowModal:', error.message);
            return null;
        }
    }

    // =============
    // MENU PRINCIPAL
    // =============
    async handleMainSelect(interaction) {
        if (!interaction.isStringSelectMenu()) return;
        
        const value = interaction.values[0];
        
        try {
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
        } catch (error) {
            console.error('Erreur handleMainSelect:', error);
            await this.safeReply(interaction, {
                content: '❌ Erreur lors du traitement de votre sélection.',
                flags: 64
            });
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
        await this.safeUpdate(interaction, { embeds: [embed], components: [row] });
    }

    async handleActionSelect(interaction) {
        if (!interaction.isStringSelectMenu()) return;
        
        const action = interaction.values[0];
        
        try {
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
            await this.safeUpdate(interaction, { embeds: [embed], components: [row] });
            
        } catch (error) {
            console.error('Erreur handleActionSelect:', error);
            await this.safeReply(interaction, {
                content: '❌ Erreur lors de l\'affichage de la configuration.',
                flags: 64
            });
        }
    }

    async handleActionConfigSelect(interaction) {
        if (!interaction.isStringSelectMenu()) return;
        
        const customId = interaction.customId;
        const action = customId.split('_')[3]; // economy_action_config_ACTION
        const configType = interaction.values[0];

        try {
            if (configType === 'back_actions') {
                return await this.showActionsMenu(interaction);
            }

            // Créer le modal selon le type de configuration
            await this.showActionConfigModal(interaction, action, configType);
            
        } catch (error) {
            console.error('Erreur handleActionConfigSelect:', error);
            await this.safeReply(interaction, {
                content: '❌ Erreur lors de l\'affichage du modal.',
                flags: 64
            });
        }
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

        await this.safeShowModal(interaction, modal);
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
        await this.safeUpdate(interaction, { embeds: [embed], components: [row] });
    }

    async handleBoutiqueSelect(interaction) {
        if (!interaction.isStringSelectMenu()) return;
        
        const value = interaction.values[0];
        
        try {
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
            
        } catch (error) {
            console.error('Erreur handleBoutiqueSelect:', error);
            await this.safeReply(interaction, {
                content: '❌ Erreur lors du traitement de votre sélection.',
                flags: 64
            });
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

        await this.safeShowModal(interaction, modal);
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
        await this.safeUpdate(interaction, { embeds: [embed], components: [row] });
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
        await this.safeUpdate(interaction, { embeds: [embed], components: [row] });
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
        await this.safeUpdate(interaction, { embeds: [embed], components: [row] });
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
                },
                {
                    label: '⚖️ Karma',
                    value: 'karma',
                    description: 'Configuration du système karma'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await this.safeUpdate(interaction, { embeds: [embed], components: [row] });
    }

    // =============
    // HANDLERS MODALS ET SÉLECTEURS
    // =============
    async handleActionConfigModal(interaction) {
        if (!interaction.isModalSubmit()) return;
        
        const customId = interaction.customId; // action_config_modal_ACTION_TYPE
        const parts = customId.split('_');
        const action = parts[3];
        const configType = parts[4];

        try {
            const data = {};
            if (configType === 'montant') {
                data.minAmount = parseInt(interaction.fields.getTextInputValue('min_amount'));
                data.maxAmount = parseInt(interaction.fields.getTextInputValue('max_amount'));
                
                if (isNaN(data.minAmount) || isNaN(data.maxAmount) || data.minAmount < 1 || data.maxAmount < data.minAmount) {
                    await this.safeReply(interaction, {
                        content: '❌ Montants invalides. Min doit être ≥ 1 et Max ≥ Min.',
                        flags: 64
                    });
                    return;
                }
            } else if (configType === 'cooldown') {
                data.cooldown = parseInt(interaction.fields.getTextInputValue('cooldown_seconds'));
                
                if (isNaN(data.cooldown) || data.cooldown < 0) {
                    await this.safeReply(interaction, {
                        content: '❌ Cooldown invalide. Doit être ≥ 0 secondes.',
                        flags: 64
                    });
                    return;
                }
            } else if (configType === 'karma') {
                data.goodKarma = parseInt(interaction.fields.getTextInputValue('good_karma'));
                data.badKarma = parseInt(interaction.fields.getTextInputValue('bad_karma'));
                
                if (isNaN(data.goodKarma) || isNaN(data.badKarma)) {
                    await this.safeReply(interaction, {
                        content: '❌ Valeurs karma invalides. Doivent être des nombres.',
                        flags: 64
                    });
                    return;
                }
            }

            // Sauvegarder la configuration
            await this.saveActionConfig(action, configType, data);

            await this.safeReply(interaction, {
                content: `✅ Configuration ${configType} pour l'action ${action} sauvegardée !`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal action:', error);
            await this.safeReply(interaction, {
                content: '❌ Erreur lors de la sauvegarde de la configuration.',
                flags: 64
            });
        }
    }

    async handleObjetPersoModal(interaction) {
        if (!interaction.isModalSubmit()) return;
        
        try {
            const nom = interaction.fields.getTextInputValue('objet_nom');
            const prixInput = interaction.fields.getTextInputValue('objet_prix');
            const description = interaction.fields.getTextInputValue('objet_description') || 'Objet personnalisé';

            const prix = parseInt(prixInput);
            if (isNaN(prix) || prix < 1) {
                await this.safeReply(interaction, {
                    content: '❌ Prix invalide. Doit être un nombre ≥ 1.',
                    flags: 64
                });
                return;
            }

            if (!nom || nom.trim().length === 0) {
                await this.safeReply(interaction, {
                    content: '❌ Le nom de l\'objet est requis.',
                    flags: 64
                });
                return;
            }

            // Sauvegarder l'objet
            await this.saveCustomObject(interaction.guild.id, nom.trim(), prix, description.trim());

            await this.safeReply(interaction, {
                content: `✅ Objet "${nom}" créé avec succès pour ${prix}€ !`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal objet:', error);
            await this.safeReply(interaction, {
                content: '❌ Erreur lors de la création de l\'objet.',
                flags: 64
            });
        }
    }

    async handleRoleSelect(interaction) {
        if (!interaction.isRoleSelectMenu()) return;
        
        try {
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

            await this.safeShowModal(interaction, modal);
            
        } catch (error) {
            console.error('Erreur handleRoleSelect:', error);
            await this.safeReply(interaction, {
                content: '❌ Erreur lors de l\'affichage du modal.',
                flags: 64
            });
        }
    }

    async handleRemisesSelect(interaction) {
        if (!interaction.isStringSelectMenu()) return;
        
        const value = interaction.values[0];
        
        try {
            if (value === 'back_boutique') {
                return await this.showBoutiqueMenu(interaction);
            }

            if (value === 'create') {
                await this.showRemiseModal(interaction);
            } else {
                await this.safeUpdate(interaction, {
                    content: `🚧 Fonction ${value} en cours de développement...`,
                    embeds: [],
                    components: []
                });
            }
            
        } catch (error) {
            console.error('Erreur handleRemisesSelect:', error);
            await this.safeReply(interaction, {
                content: '❌ Erreur lors du traitement de la sélection.',
                flags: 64
            });
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

        await this.safeShowModal(interaction, modal);
    }

    // =============
    // SAUVEGARDE DES DONNÉES
    // =============
    async saveActionConfig(action, configType, data) {
        try {
            const economyConfig = await this.dataManager.loadData('economy.json', {});
            
            if (!economyConfig.actions) economyConfig.actions = {};
            if (!economyConfig.actions[action]) economyConfig.actions[action] = {};

            economyConfig.actions[action][configType] = data;
            
            await this.dataManager.saveData('economy.json', economyConfig);
            console.log(`✅ Configuration ${configType} sauvegardée pour ${action}:`, data);
        } catch (error) {
            console.error('Erreur sauvegarde action config:', error);
            throw error;
        }
    }

    async saveCustomObject(guildId, nom, prix, description) {
        try {
            const shopData = await this.dataManager.loadData('shop.json', {});
            
            if (!shopData[guildId]) shopData[guildId] = [];
            
            const objet = {
                id: Date.now().toString(),
                type: 'custom',
                name: nom,
                price: prix,
                description: description,
                created: new Date().toISOString()
            };
            
            shopData[guildId].push(objet);
            await this.dataManager.saveData('shop.json', shopData);
            console.log(`✅ Objet personnalisé créé:`, objet);
        } catch (error) {
            console.error('Erreur sauvegarde objet:', error);
            throw error;
        }
    }

    async handleRemiseModal(interaction) {
        if (!interaction.isModalSubmit()) return;
        
        try {
            const nom = interaction.fields.getTextInputValue('remise_nom');
            const karmaMinInput = interaction.fields.getTextInputValue('karma_min');
            const pourcentageInput = interaction.fields.getTextInputValue('pourcentage_remise');

            const karmaMin = parseInt(karmaMinInput);
            const pourcentage = parseInt(pourcentageInput);

            if (isNaN(karmaMin) || isNaN(pourcentage)) {
                await this.safeReply(interaction, {
                    content: '❌ Valeurs invalides. Karma et pourcentage doivent être des nombres.',
                    flags: 64
                });
                return;
            }

            if (pourcentage < 1 || pourcentage > 100) {
                await this.safeReply(interaction, {
                    content: '❌ Le pourcentage doit être entre 1 et 100.',
                    flags: 64
                });
                return;
            }

            if (!nom || nom.trim().length === 0) {
                await this.safeReply(interaction, {
                    content: '❌ Le nom de la remise est requis.',
                    flags: 64
                });
                return;
            }

            // Sauvegarder la remise
            await this.saveKarmaDiscount(interaction.guild.id, nom.trim(), karmaMin, pourcentage);

            await this.safeReply(interaction, {
                content: `✅ Remise "${nom}" créée : ${pourcentage}% pour ${karmaMin} karma minimum !`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur modal remise:', error);
            await this.safeReply(interaction, {
                content: '❌ Erreur lors de la création de la remise.',
                flags: 64
            });
        }
    }

    async saveKarmaDiscount(guildId, nom, karmaMin, pourcentage) {
        try {
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
        } catch (error) {
            console