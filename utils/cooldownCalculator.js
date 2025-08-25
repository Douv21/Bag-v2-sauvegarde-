/**
 * Utilitaire pour calculer les cooldowns avec réductions actives
 */

/**
 * Calculer le cooldown final avec les buffs actifs de l'utilisateur
 * @param {Object} userData - Données de l'utilisateur
 * @param {number} baseCooldown - Cooldown de base en millisecondes
 * @returns {number} Cooldown final en millisecondes
 */
function calculateReducedCooldown(userData, baseCooldown) {
    // Nettoyer les buffs expirés d'abord
    const now = Date.now();
    if (userData.cooldownBuffs) {
        userData.cooldownBuffs = userData.cooldownBuffs.filter(buff => {
            const expiresAt = new Date(buff.expiresAt).getTime();
            return expiresAt > now;
        });
    }

    // Si pas de buffs actifs, retourner le cooldown de base
    if (!userData.cooldownBuffs || userData.cooldownBuffs.length === 0) {
        return baseCooldown;
    }

    // Trouver la meilleure réduction active (la plus élevée)
    const bestReduction = Math.max(...userData.cooldownBuffs.map(buff => buff.reductionPercent || 0));

    // Si réduction de 100%, pas de cooldown
    if (bestReduction >= 100) {
        return 0;
    }

    // Appliquer la réduction
    const reducedCooldown = Math.floor(baseCooldown * (100 - bestReduction) / 100);
    return Math.max(0, reducedCooldown);
}

/**
 * Obtenir des informations sur les buffs actifs pour affichage
 * @param {Object} userData - Données de l'utilisateur
 * @returns {Object} Informations sur les buffs actifs
 */
function getActiveCooldownBuffs(userData) {
    const now = Date.now();
    
    // Nettoyer les buffs expirés
    if (userData.cooldownBuffs) {
        userData.cooldownBuffs = userData.cooldownBuffs.filter(buff => {
            const expiresAt = new Date(buff.expiresAt).getTime();
            return expiresAt > now;
        });
    }

    if (!userData.cooldownBuffs || userData.cooldownBuffs.length === 0) {
        return {
            hasActiveBuffs: false,
            bestReduction: 0,
            activeBuffs: []
        };
    }

    const bestReduction = Math.max(...userData.cooldownBuffs.map(buff => buff.reductionPercent || 0));
    
    return {
        hasActiveBuffs: true,
        bestReduction,
        activeBuffs: userData.cooldownBuffs,
        isUnlimited: bestReduction >= 100
    };
}

/**
 * Formatter un message sur les buffs actifs pour l'affichage
 * @param {Object} userData - Données de l'utilisateur
 * @returns {string} Message formaté ou chaîne vide
 */
function formatCooldownBuffMessage(userData) {
    const buffInfo = getActiveCooldownBuffs(userData);
    
    if (!buffInfo.hasActiveBuffs) {
        return '';
    }

    if (buffInfo.isUnlimited) {
        return '\n🚀 **Actions illimitées actives !** Aucun cooldown !';
    }

    return `\n⚡ **Réduction de cooldown active !** -${buffInfo.bestReduction}% sur toutes les actions !`;
}

/**
 * Nettoyer les buffs expirés des données utilisateur
 * @param {Object} userData - Données de l'utilisateur à nettoyer
 * @returns {boolean} True si des buffs ont été supprimés
 */
function cleanExpiredBuffs(userData) {
    if (!userData.cooldownBuffs || userData.cooldownBuffs.length === 0) {
        return false;
    }

    const now = Date.now();
    const initialLength = userData.cooldownBuffs.length;
    
    userData.cooldownBuffs = userData.cooldownBuffs.filter(buff => {
        const expiresAt = new Date(buff.expiresAt).getTime();
        return expiresAt > now;
    });

    return userData.cooldownBuffs.length < initialLength;
}

module.exports = {
    calculateReducedCooldown,
    getActiveCooldownBuffs,
    formatCooldownBuffMessage,
    cleanExpiredBuffs
};