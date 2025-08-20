/**
 * GESTIONNAIRE DE RÔLES PERSONNALISÉS
 * Système complet de gestion des rôles Discord
 */

const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

class RoleManager {
    constructor(dataManager, client) {
        this.dataManager = dataManager;
        this.client = client;
        
        // Types de données pour les rôles
        this.dataManager.dataTypes['custom_roles'] = 'custom_roles.json';
        this.dataManager.dataTypes['role_permissions'] = 'role_permissions.json';
        this.dataManager.dataTypes['role_categories'] = 'role_categories.json';
    }

    /**
     * Initialise les données par défaut des rôles
     */
    initializeRoleData(guildId) {
        // Rôles personnalisés
        const defaultRoles = {
            [guildId]: {
                roles: {},
                categories: {
                    'couleurs': {
                        name: '🎨 Couleurs',
                        description: 'Rôles de couleur pour personnaliser votre profil',
                        exclusive: true, // Un seul rôle par catégorie
                        roles: []
                    },
                    'hobbies': {
                        name: '🎮 Hobbies',
                        description: 'Rôles basés sur vos centres d\'intérêt',
                        exclusive: false,
                        roles: []
                    },
                    'notifications': {
                        name: '🔔 Notifications',
                        description: 'Rôles pour recevoir des notifications spécifiques',
                        exclusive: false,
                        roles: []
                    },
                    'region': {
                        name: '🌍 Région',
                        description: 'Rôles basés sur votre localisation',
                        exclusive: true,
                        roles: []
                    }
                }
            }
        };

        // Permissions par défaut
        const defaultPermissions = {
            [guildId]: {
                manageRoles: [], // IDs des rôles qui peuvent gérer les rôles personnalisés
                createRoles: [], // IDs des rôles qui peuvent créer des rôles
                deleteRoles: [], // IDs des rôles qui peuvent supprimer des rôles
                maxRolesPerUser: 10, // Limite de rôles par utilisateur
                allowedColors: [
                    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
                ]
            }
        };

        this.dataManager.setData('custom_roles', defaultRoles);
        this.dataManager.setData('role_permissions', defaultPermissions);
        
        return { roles: defaultRoles, permissions: defaultPermissions };
    }

    /**
     * Obtient les données des rôles pour une guilde
     */
    getRoleData(guildId) {
        let roleData = this.dataManager.getData('custom_roles') || {};
        let permData = this.dataManager.getData('role_permissions') || {};
        
        if (!roleData[guildId] || !permData[guildId]) {
            const initialized = this.initializeRoleData(guildId);
            roleData = initialized.roles;
            permData = initialized.permissions;
        }
        
        return { 
            roles: roleData[guildId], 
            permissions: permData[guildId] 
        };
    }

    /**
     * Vérifie si un utilisateur peut gérer les rôles
     */
    canManageRoles(member, guildId) {
        if (member.permissions.has(PermissionFlagsBits.ManageRoles)) return true;
        
        const { permissions } = this.getRoleData(guildId);
        return member.roles.cache.some(role => 
            permissions.manageRoles.includes(role.id)
        );
    }

    /**
     * Vérifie si un utilisateur peut créer des rôles
     */
    canCreateRoles(member, guildId) {
        if (member.permissions.has(PermissionFlagsBits.ManageRoles)) return true;
        
        const { permissions } = this.getRoleData(guildId);
        return member.roles.cache.some(role => 
            permissions.createRoles.includes(role.id)
        );
    }

    /**
     * Crée un nouveau rôle personnalisé
     */
    async createCustomRole(guild, options) {
        const { 
            name, 
            color, 
            category, 
            description, 
            emoji, 
            mentionable = false,
            gradientColors = null,
            style = 'default',
            rarity = 'common'
        } = options;
        
        try {
            // Créer le rôle Discord
            const discordRole = await guild.roles.create({
                name: emoji ? `${emoji} ${name}` : name,
                color: color || '#99AAB5',
                mentionable: mentionable,
                reason: 'Rôle personnalisé créé via le système de rôles'
            });

            // Sauvegarder dans les données
            const roleData = this.dataManager.getData('custom_roles') || {};
            if (!roleData[guild.id]) roleData[guild.id] = { roles: {}, categories: {} };

            roleData[guild.id].roles[discordRole.id] = {
                name: name,
                category: category,
                description: description || 'Aucune description',
                emoji: emoji || null,
                color: color || '#99AAB5',
                gradientColors: gradientColors,
                style: style,
                rarity: rarity,
                createdAt: Date.now(),
                memberCount: 0
            };

            // Ajouter à la catégorie
            if (category && roleData[guild.id].categories[category]) {
                if (!roleData[guild.id].categories[category].roles.includes(discordRole.id)) {
                    roleData[guild.id].categories[category].roles.push(discordRole.id);
                }
            }

            this.dataManager.setData('custom_roles', roleData);
            
            return { success: true, role: discordRole };
        } catch (error) {
            console.error('Erreur création rôle:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Supprime un rôle personnalisé
     */
    async deleteCustomRole(guild, roleId) {
        try {
            const discordRole = guild.roles.cache.get(roleId);
            if (discordRole) {
                await discordRole.delete('Rôle personnalisé supprimé');
            }

            // Supprimer des données
            const roleData = this.dataManager.getData('custom_roles') || {};
            if (roleData[guild.id] && roleData[guild.id].roles[roleId]) {
                const category = roleData[guild.id].roles[roleId].category;
                
                // Supprimer de la catégorie
                if (category && roleData[guild.id].categories[category]) {
                    roleData[guild.id].categories[category].roles = 
                        roleData[guild.id].categories[category].roles.filter(id => id !== roleId);
                }
                
                delete roleData[guild.id].roles[roleId];
                this.dataManager.setData('custom_roles', roleData);
            }

            return { success: true };
        } catch (error) {
            console.error('Erreur suppression rôle:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Attribue un rôle à un utilisateur
     */
    async assignRole(member, roleId) {
        try {
            const guild = member.guild;
            const role = guild.roles.cache.get(roleId);
            
            if (!role) {
                return { success: false, error: 'Rôle introuvable' };
            }

            const { roles } = this.getRoleData(guild.id);
            const roleInfo = roles.roles[roleId];
            
            if (!roleInfo) {
                return { success: false, error: 'Rôle non géré par le système' };
            }

            // Vérifier si le rôle est exclusif
            const category = roleInfo.category;
            if (category && roles.categories[category]?.exclusive) {
                // Retirer les autres rôles de cette catégorie
                const categoryRoles = roles.categories[category].roles;
                for (const otherRoleId of categoryRoles) {
                    if (otherRoleId !== roleId && member.roles.cache.has(otherRoleId)) {
                        const otherRole = guild.roles.cache.get(otherRoleId);
                        if (otherRole) {
                            await member.roles.remove(otherRole);
                        }
                    }
                }
            }

            // Ajouter le rôle
            await member.roles.add(role);
            
            // Mettre à jour le compteur
            this.updateRoleMemberCount(guild.id, roleId);
            
            return { success: true, role };
        } catch (error) {
            console.error('Erreur attribution rôle:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Retire un rôle à un utilisateur
     */
    async removeRole(member, roleId) {
        try {
            const role = member.guild.roles.cache.get(roleId);
            
            if (!role) {
                return { success: false, error: 'Rôle introuvable' };
            }

            if (!member.roles.cache.has(roleId)) {
                return { success: false, error: 'Vous n\'avez pas ce rôle' };
            }

            await member.roles.remove(role);
            this.updateRoleMemberCount(member.guild.id, roleId);
            
            return { success: true, role };
        } catch (error) {
            console.error('Erreur retrait rôle:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Met à jour le compteur de membres pour un rôle
     */
    updateRoleMemberCount(guildId, roleId) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return;

        const role = guild.roles.cache.get(roleId);
        if (!role) return;

        const roleData = this.dataManager.getData('custom_roles') || {};
        if (roleData[guildId] && roleData[guildId].roles[roleId]) {
            roleData[guildId].roles[roleId].memberCount = role.members.size;
            this.dataManager.setData('custom_roles', roleData);
        }
    }

    /**
     * Crée une catégorie de rôles
     */
    createCategory(guildId, categoryId, options) {
        const { name, description, exclusive = false, emoji } = options;
        
        const roleData = this.dataManager.getData('custom_roles') || {};
        if (!roleData[guildId]) roleData[guildId] = { roles: {}, categories: {} };

        roleData[guildId].categories[categoryId] = {
            name: emoji ? `${emoji} ${name}` : name,
            description: description || 'Aucune description',
            exclusive: exclusive,
            roles: [],
            createdAt: Date.now()
        };

        this.dataManager.setData('custom_roles', roleData);
        return { success: true };
    }

    /**
     * Génère un embed pour afficher les rôles disponibles
     */
    generateRoleListEmbed(guild, category = null) {
        const { roles } = this.getRoleData(guild.id);
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTimestamp()
            .setFooter({ text: `${guild.name} • Système de Rôles` });

        if (category) {
            const cat = roles.categories[category];
            if (!cat) return null;

            embed.setTitle(`${cat.name}`)
                .setDescription(cat.description);

            let roleList = '';
            for (const roleId of cat.roles) {
                const roleInfo = roles.roles[roleId];
                const discordRole = guild.roles.cache.get(roleId);
                
                if (roleInfo && discordRole) {
                    const emoji = roleInfo.emoji || '•';
                    const memberCount = discordRole.members.size;
                    const rarityEmoji = this.getRarityEmoji(roleInfo.rarity);
                    const gradientInfo = roleInfo.gradientColors ? 
                        ` 🌈` : '';
                    
                    roleList += `${emoji} **${roleInfo.name}**${rarityEmoji}${gradientInfo} - ${memberCount} membre(s)\n`;
                    if (roleInfo.description !== 'Aucune description') {
                        const shortDesc = roleInfo.description.split('\n')[0]; // Première ligne seulement
                        roleList += `  └ *${shortDesc}*\n`;
                    }
                }
            }

            embed.addFields({
                name: 'Rôles disponibles',
                value: roleList || 'Aucun rôle dans cette catégorie',
                inline: false
            });
        } else {
            embed.setTitle('🎭 Système de Rôles Personnalisés')
                .setDescription('Choisissez vos rôles pour personnaliser votre profil !');

            for (const [catId, cat] of Object.entries(roles.categories)) {
                let roleList = '';
                let roleCount = 0;
                
                for (const roleId of cat.roles) {
                    const roleInfo = roles.roles[roleId];
                    const discordRole = guild.roles.cache.get(roleId);
                    
                    if (roleInfo && discordRole) {
                        roleCount++;
                        if (roleCount <= 5) { // Limiter l'affichage
                            const emoji = roleInfo.emoji || '•';
                            roleList += `${emoji} ${roleInfo.name}\n`;
                        }
                    }
                }
                
                if (roleCount > 5) {
                    roleList += `... et ${roleCount - 5} autre(s)`;
                }

                embed.addFields({
                    name: cat.name,
                    value: roleList || 'Aucun rôle',
                    inline: true
                });
            }
        }

        return embed;
    }

    /**
     * Obtient l'emoji de rareté
     */
    getRarityEmoji(rarity) {
        const rarityEmojis = {
            'mythic': ' ⚜️',
            'legendary': ' 🌟',
            'epic': ' 💎',
            'rare': ' ✨',
            'common': ''
        };
        return rarityEmojis[rarity] || '';
    }

    /**
     * Génère un embed pour les rôles d'un utilisateur
     */
    generateUserRolesEmbed(member) {
        const { roles } = this.getRoleData(member.guild.id);
        
        const embed = new EmbedBuilder()
            .setColor(member.displayColor || '#5865F2')
            .setTitle(`🎭 Rôles de ${member.displayName}`)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

        const userCustomRoles = member.roles.cache.filter(role => 
            roles.roles[role.id]
        );

        if (userCustomRoles.size === 0) {
            embed.setDescription('Aucun rôle personnalisé');
            return embed;
        }

        // Grouper par catégorie
        const rolesByCategory = {};
        userCustomRoles.forEach(role => {
            const roleInfo = roles.roles[role.id];
            const category = roleInfo.category || 'autres';
            
            if (!rolesByCategory[category]) {
                rolesByCategory[category] = [];
            }
            
            rolesByCategory[category].push({
                role: role,
                info: roleInfo
            });
        });

        for (const [categoryId, categoryRoles] of Object.entries(rolesByCategory)) {
            const categoryInfo = roles.categories[categoryId];
            const categoryName = categoryInfo?.name || '📋 Autres';
            
            const roleList = categoryRoles.map(({ role, info }) => {
                const emoji = info.emoji || '•';
                return `${emoji} ${role.name}`;
            }).join('\n');
            
            embed.addFields({
                name: categoryName,
                value: roleList,
                inline: true
            });
        }

        return embed;
    }
}

module.exports = RoleManager;