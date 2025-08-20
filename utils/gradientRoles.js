/**
 * RÔLES UNIQUES AVEC DÉGRADÉS ET STYLES AVANCÉS
 * Collection de rôles avec des couleurs dégradées et des designs uniques
 */

const gradientRoles = {
    premium: {
        name: '💎 Rôles Premium',
        description: 'Rôles exclusifs avec des dégradés uniques',
        exclusive: true,
        roles: [
            {
                name: 'Sunset Royalty',
                emoji: '👑',
                color: '#FF6B35', // Orange-rouge principal
                gradientColors: ['#FF6B35', '#F7931E', '#FFD700'], // Sunset gradient
                description: 'Majestueux comme un coucher de soleil royal',
                style: 'premium',
                rarity: 'legendary'
            },
            {
                name: 'Ocean Depths',
                emoji: '🌊',
                color: '#1e3c72', // Bleu océan profond
                gradientColors: ['#1e3c72', '#2a5298', '#74b9ff'], // Océan profond vers surface
                description: 'Mystérieux comme les profondeurs océaniques',
                style: 'premium',
                rarity: 'legendary'
            },
            {
                name: 'Aurora Borealis',
                emoji: '🌌',
                color: '#667eea', // Violet-bleu principal
                gradientColors: ['#667eea', '#764ba2', '#f093fb'], // Aurore boréale
                description: 'Magique comme les aurores boréales',
                style: 'premium',
                rarity: 'legendary'
            },
            {
                name: 'Neon Cyberpunk',
                emoji: '⚡',
                color: '#ff0080', // Rose néon
                gradientColors: ['#ff0080', '#ff8c00', '#00ff41'], // Cyberpunk néon
                description: 'Futuriste et électrisant',
                style: 'premium',
                rarity: 'epic'
            },
            {
                name: 'Golden Phoenix',
                emoji: '🔥',
                color: '#f12711', // Rouge feu
                gradientColors: ['#f12711', '#f5af19', '#ffd700'], // Feu vers or
                description: 'Renaît de ses cendres en or pur',
                style: 'premium',
                rarity: 'legendary'
            },
            {
                name: 'Cosmic Nebula',
                emoji: '🌟',
                color: '#8e2de2', // Violet cosmique
                gradientColors: ['#8e2de2', '#4a00e0', '#ff006e'], // Nébuleuse cosmique
                description: 'Né des étoiles et de la poussière cosmique',
                style: 'premium',
                rarity: 'legendary'
            }
        ]
    },

    elements: {
        name: '🌟 Éléments Mystiques',
        description: 'Maîtrisez les forces élémentaires',
        exclusive: true,
        roles: [
            {
                name: 'Fire Master',
                emoji: '🔥',
                color: '#ff4757', // Rouge feu intense
                gradientColors: ['#ff3838', '#ff4757', '#ff6348'], // Flammes ardentes
                description: 'Maître des flammes éternelles',
                style: 'elemental',
                rarity: 'epic'
            },
            {
                name: 'Ice Sovereign',
                emoji: '❄️',
                color: '#3742fa', // Bleu glace
                gradientColors: ['#70a1ff', '#3742fa', '#2f3542'], // Glace cristalline
                description: 'Souverain des terres gelées',
                style: 'elemental',
                rarity: 'epic'
            },
            {
                name: 'Storm Caller',
                emoji: '⚡',
                color: '#2ed573', // Vert électrique
                gradientColors: ['#7bed9f', '#2ed573', '#1e90ff'], // Orage électrique
                description: 'Invoque les tempêtes et la foudre',
                style: 'elemental',
                rarity: 'epic'
            },
            {
                name: 'Earth Guardian',
                emoji: '🗿',
                color: '#8b4513', // Brun terre
                gradientColors: ['#d2691e', '#8b4513', '#228b22'], // Terre fertile
                description: 'Protecteur de la nature sauvage',
                style: 'elemental',
                rarity: 'epic'
            },
            {
                name: 'Void Walker',
                emoji: '🌑',
                color: '#2c2c54', // Noir cosmique
                gradientColors: ['#40407a', '#2c2c54', '#000000'], // Vide intersidéral
                description: 'Marche entre les dimensions',
                style: 'elemental',
                rarity: 'legendary'
            }
        ]
    },

    cosmic: {
        name: '🌌 Entités Cosmiques',
        description: 'Beings from beyond the stars',
        exclusive: true,
        roles: [
            {
                name: 'Stellar Architect',
                emoji: '⭐',
                color: '#ffd700', // Or stellaire
                gradientColors: ['#fff700', '#ffd700', '#ff8c00'], // Étoile dorée
                description: 'Architecte des constellations',
                style: 'cosmic',
                rarity: 'legendary'
            },
            {
                name: 'Galactic Emperor',
                emoji: '👑',
                color: '#9c27b0', // Violet impérial
                gradientColors: ['#e91e63', '#9c27b0', '#673ab7'], // Majesté galactique
                description: 'Règne sur des galaxies entières',
                style: 'cosmic',
                rarity: 'mythic'
            },
            {
                name: 'Quantum Sage',
                emoji: '🔮',
                color: '#00bcd4', // Cyan quantique
                gradientColors: ['#4fc3f7', '#00bcd4', '#009688'], // Énergie quantique
                description: 'Maître des lois quantiques',
                style: 'cosmic',
                rarity: 'legendary'
            },
            {
                name: 'Time Weaver',
                emoji: '⏳',
                color: '#795548', // Bronze temporel
                gradientColors: ['#bcaaa4', '#795548', '#3e2723'], // Flux temporel
                description: 'Tisse les fils du temps',
                style: 'cosmic',
                rarity: 'mythic'
            }
        ]
    },

    neon: {
        name: '💫 Neon Dreams',
        description: 'Rôles aux couleurs néon vibrantes',
        exclusive: false,
        roles: [
            {
                name: 'Neon Pink',
                emoji: '💖',
                color: '#ff1493', // Rose néon
                gradientColors: ['#ff69b4', '#ff1493', '#dc143c'], // Rose électrique
                description: 'Vibrant comme les néons de Tokyo',
                style: 'neon',
                rarity: 'rare'
            },
            {
                name: 'Electric Blue',
                emoji: '⚡',
                color: '#00ffff', // Cyan électrique
                gradientColors: ['#87ceeb', '#00ffff', '#0000ff'], // Bleu électrique
                description: 'Électrisant comme un éclair',
                style: 'neon',
                rarity: 'rare'
            },
            {
                name: 'Laser Green',
                emoji: '💚',
                color: '#00ff00', // Vert laser
                gradientColors: ['#7fff00', '#00ff00', '#32cd32'], // Vert laser
                description: 'Précis comme un rayon laser',
                style: 'neon',
                rarity: 'rare'
            },
            {
                name: 'Plasma Purple',
                emoji: '🔮',
                color: '#8a2be2', // Violet plasma
                gradientColors: ['#da70d6', '#8a2be2', '#4b0082'], // Plasma violet
                description: 'Énergique comme le plasma',
                style: 'neon',
                rarity: 'rare'
            }
        ]
    },

    nature: {
        name: '🌿 Forces Naturelles',
        description: 'Connecté aux énergies de la nature',
        exclusive: false,
        roles: [
            {
                name: 'Forest Spirit',
                emoji: '🌲',
                color: '#228b22', // Vert forêt
                gradientColors: ['#90ee90', '#228b22', '#006400'], // Forêt profonde
                description: 'Esprit gardien de la forêt ancienne',
                style: 'nature',
                rarity: 'epic'
            },
            {
                name: 'Mountain Peak',
                emoji: '🏔️',
                color: '#708090', // Gris montagne
                gradientColors: ['#f5f5f5', '#708090', '#2f4f4f'], // Sommet enneigé
                description: 'Inébranlable comme les sommets',
                style: 'nature',
                rarity: 'epic'
            },
            {
                name: 'Desert Mirage',
                emoji: '🏜️',
                color: '#daa520', // Or désert
                gradientColors: ['#f4a460', '#daa520', '#cd853f'], // Sables dorés
                description: 'Mystérieux comme un mirage',
                style: 'nature',
                rarity: 'rare'
            },
            {
                name: 'Ocean Tide',
                emoji: '🌊',
                color: '#4682b4', // Bleu océan
                gradientColors: ['#87ceeb', '#4682b4', '#191970'], // Marées océaniques
                description: 'Fluide comme les marées',
                style: 'nature',
                rarity: 'rare'
            }
        ]
    },

    mythical: {
        name: '🐉 Créatures Mythiques',
        description: 'Incarnez des créatures légendaires',
        exclusive: true,
        roles: [
            {
                name: 'Dragon Lord',
                emoji: '🐉',
                color: '#8b0000', // Rouge dragon
                gradientColors: ['#ff4500', '#8b0000', '#000000'], // Flammes de dragon
                description: 'Seigneur des dragons ancestraux',
                style: 'mythical',
                rarity: 'mythic'
            },
            {
                name: 'Phoenix Rising',
                emoji: '🔥',
                color: '#ff6347', // Orange phoenix
                gradientColors: ['#ffd700', '#ff6347', '#8b0000'], // Renaissance du phoenix
                description: 'Renaît éternellement de ses cendres',
                style: 'mythical',
                rarity: 'mythic'
            },
            {
                name: 'Unicorn Grace',
                emoji: '🦄',
                color: '#dda0dd', // Violet licorne
                gradientColors: ['#ffffff', '#dda0dd', '#9370db'], // Pureté magique
                description: 'Grâce pure et magie ancestrale',
                style: 'mythical',
                rarity: 'legendary'
            },
            {
                name: 'Kraken Depths',
                emoji: '🐙',
                color: '#2f4f4f', // Vert-gris kraken
                gradientColors: ['#008080', '#2f4f4f', '#000080'], // Profondeurs abyssales
                description: 'Maître des abysses océaniques',
                style: 'mythical',
                rarity: 'legendary'
            }
        ]
    }
};

/**
 * Génère un nom de rôle avec des caractères Unicode spéciaux
 */
function generateStyledRoleName(roleData) {
    const styles = {
        premium: (name) => `✦ ${name} ✦`,
        elemental: (name) => `◆ ${name} ◆`,
        cosmic: (name) => `⟐ ${name} ⟐`,
        neon: (name) => `◊ ${name} ◊`,
        nature: (name) => `❋ ${name} ❋`,
        mythical: (name) => `⟢ ${name} ⟣`
    };

    const rarityPrefix = {
        'mythic': '⚜️',
        'legendary': '🌟',
        'epic': '💎',
        'rare': '✨',
        'common': '⚪'
    };

    const prefix = rarityPrefix[roleData.rarity] || '';
    const styledName = styles[roleData.style] ? styles[roleData.style](roleData.name) : roleData.name;
    
    return `${prefix} ${styledName}`.trim();
}

/**
 * Obtient la couleur principale d'un dégradé
 */
function getPrimaryGradientColor(gradientColors) {
    // Retourne la couleur du milieu du dégradé
    const middleIndex = Math.floor(gradientColors.length / 2);
    return gradientColors[middleIndex];
}

/**
 * Crée une description enrichie avec des émojis et du style
 */
function generateEnrichedDescription(roleData) {
    const rarityDescriptions = {
        'mythic': '🏆 **MYTHIQUE** - Extrêmement rare et puissant',
        'legendary': '🌟 **LÉGENDAIRE** - Rare et prestigieux',
        'epic': '💎 **ÉPIQUE** - Remarquable et distinctif',
        'rare': '✨ **RARE** - Spécial et recherché',
        'common': '⚪ **COMMUN** - Accessible à tous'
    };

    const gradientInfo = roleData.gradientColors ? 
        `\n🎨 **Dégradé:** ${roleData.gradientColors.join(' → ')}` : '';

    return `${roleData.description}\n\n${rarityDescriptions[roleData.rarity] || ''}${gradientInfo}`;
}

/**
 * Crée tous les rôles dégradés pour une guilde
 */
async function createGradientRoles(guild, roleManager) {
    console.log(`🌈 Création des rôles dégradés pour ${guild.name}...`);
    
    const results = {
        success: 0,
        errors: 0,
        details: [],
        categories: 0
    };

    for (const [categoryId, categoryData] of Object.entries(gradientRoles)) {
        try {
            // Créer la catégorie
            roleManager.createCategory(guild.id, categoryId, {
                name: categoryData.name,
                description: categoryData.description,
                exclusive: categoryData.exclusive
            });
            results.categories++;

            // Créer les rôles de la catégorie
            for (const roleData of categoryData.roles) {
                try {
                    const styledName = generateStyledRoleName(roleData);
                    const primaryColor = roleData.gradientColors ? 
                        getPrimaryGradientColor(roleData.gradientColors) : 
                        roleData.color;
                    const enrichedDescription = generateEnrichedDescription(roleData);

                    const result = await roleManager.createCustomRole(guild, {
                        name: styledName,
                        emoji: roleData.emoji,
                        color: primaryColor,
                        description: enrichedDescription,
                        category: categoryId,
                        mentionable: false,
                        // Données étendues pour les dégradés
                        gradientColors: roleData.gradientColors,
                        style: roleData.style,
                        rarity: roleData.rarity
                    });

                    if (result.success) {
                        results.success++;
                        results.details.push(`✅ ${roleData.emoji} ${styledName} (${roleData.rarity})`);
                    } else {
                        results.errors++;
                        results.details.push(`❌ ${roleData.name}: ${result.error}`);
                    }

                    // Délai pour éviter les limites de taux
                    await new Promise(resolve => setTimeout(resolve, 150));
                } catch (error) {
                    results.errors++;
                    results.details.push(`❌ ${roleData.name}: ${error.message}`);
                }
            }
        } catch (error) {
            console.error(`Erreur création catégorie ${categoryId}:`, error);
        }
    }

    console.log(`🌈 Création terminée: ${results.success} rôles, ${results.categories} catégories`);
    return results;
}

/**
 * Obtient la liste des rôles dégradés pour affichage
 */
function getGradientRolesList() {
    const list = [];
    
    for (const [categoryId, categoryData] of Object.entries(gradientRoles)) {
        list.push(`\n**${categoryData.name}**`);
        list.push(`*${categoryData.description}*`);
        
        // Grouper par rareté
        const rolesByRarity = {};
        categoryData.roles.forEach(role => {
            if (!rolesByRarity[role.rarity]) {
                rolesByRarity[role.rarity] = [];
            }
            rolesByRarity[role.rarity].push(role);
        });

        // Afficher par ordre de rareté
        const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'common'];
        for (const rarity of rarityOrder) {
            if (rolesByRarity[rarity]) {
                for (const role of rolesByRarity[rarity].slice(0, 2)) {
                    const styledName = generateStyledRoleName(role);
                    list.push(`${role.emoji} ${styledName}`);
                }
                if (rolesByRarity[rarity].length > 2) {
                    list.push(`... et ${rolesByRarity[rarity].length - 2} autres ${rarity}`);
                }
            }
        }
    }
    
    return list.join('\n');
}

/**
 * Obtient les statistiques des rôles dégradés
 */
function getGradientRolesStats() {
    let totalRoles = 0;
    let totalCategories = 0;
    const rarityCount = {};
    const styleCount = {};

    for (const [categoryId, categoryData] of Object.entries(gradientRoles)) {
        totalCategories++;
        totalRoles += categoryData.roles.length;

        categoryData.roles.forEach(role => {
            rarityCount[role.rarity] = (rarityCount[role.rarity] || 0) + 1;
            styleCount[role.style] = (styleCount[role.style] || 0) + 1;
        });
    }

    return {
        totalRoles,
        totalCategories,
        rarityCount,
        styleCount
    };
}

module.exports = {
    gradientRoles,
    createGradientRoles,
    getGradientRolesList,
    getGradientRolesStats,
    generateStyledRoleName,
    generateEnrichedDescription,
    getPrimaryGradientColor
};