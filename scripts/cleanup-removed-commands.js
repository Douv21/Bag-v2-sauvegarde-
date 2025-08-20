#!/usr/bin/env node
/**
 * SCRIPT DE NETTOYAGE DES COMMANDES SUPPRIMÉES
 * Supprime automatiquement les commandes obsolètes lors du déploiement Render
 */

const { REST, Routes } = require('discord.js');

// Charger les variables d'environnement
try {
    require('dotenv').config();
} catch (e) {
    console.log('⚠️ dotenv non installé, utilisation des variables d\'environnement système');
}

const REMOVED_COMMANDS = [
    'profil-carte',
    'apercu-couleur'
];

class CommandCleanup {
    constructor() {
        this.token = process.env.DISCORD_TOKEN;
        this.clientId = process.env.CLIENT_ID;
        this.guildId = process.env.GUILD_ID;
        
        if (!this.token || !this.clientId) {
            console.error('❌ Variables manquantes: DISCORD_TOKEN et CLIENT_ID requis');
            process.exit(1);
        }
        
        this.rest = new REST({ version: '10' }).setToken(this.token);
    }

    async cleanupGlobalCommands() {
        try {
            console.log('🧹 Nettoyage des commandes globales...');
            
            // Récupérer toutes les commandes globales
            const globalCommands = await this.rest.get(Routes.applicationCommands(this.clientId));
            
            let removedCount = 0;
            for (const command of globalCommands) {
                if (REMOVED_COMMANDS.includes(command.name)) {
                    console.log(`🗑️ Suppression commande globale: ${command.name}`);
                    await this.rest.delete(Routes.applicationCommand(this.clientId, command.id));
                    removedCount++;
                }
            }
            
            console.log(`✅ ${removedCount} commande(s) globale(s) supprimée(s)`);
            return removedCount;
            
        } catch (error) {
            console.error('❌ Erreur nettoyage commandes globales:', error.message);
            return 0;
        }
    }

    async cleanupGuildCommands() {
        if (!this.guildId) {
            console.log('⚠️ GUILD_ID non défini, nettoyage des commandes de guilde ignoré');
            return 0;
        }

        try {
            console.log(`🧹 Nettoyage des commandes de guilde (${this.guildId})...`);
            
            // Récupérer toutes les commandes de guilde
            const guildCommands = await this.rest.get(Routes.applicationGuildCommands(this.clientId, this.guildId));
            
            let removedCount = 0;
            for (const command of guildCommands) {
                if (REMOVED_COMMANDS.includes(command.name)) {
                    console.log(`🗑️ Suppression commande guilde: ${command.name}`);
                    await this.rest.delete(Routes.applicationGuildCommand(this.clientId, this.guildId, command.id));
                    removedCount++;
                }
            }
            
            console.log(`✅ ${removedCount} commande(s) de guilde supprimée(s)`);
            return removedCount;
            
        } catch (error) {
            console.error('❌ Erreur nettoyage commandes de guilde:', error.message);
            return 0;
        }
    }

    async run() {
        console.log('🚀 === SCRIPT DE NETTOYAGE DES COMMANDES SUPPRIMÉES ===');
        console.log(`📋 Commandes à supprimer: ${REMOVED_COMMANDS.join(', ')}`);
        console.log('');

        const startTime = Date.now();

        try {
            // Nettoyage des commandes globales et de guilde
            const globalRemoved = await this.cleanupGlobalCommands();
            const guildRemoved = await this.cleanupGuildCommands();
            
            const totalRemoved = globalRemoved + guildRemoved;
            const duration = Date.now() - startTime;

            console.log('');
            console.log('📊 === RÉSUMÉ DU NETTOYAGE ===');
            console.log(`🗑️ Commandes globales supprimées: ${globalRemoved}`);
            console.log(`🗑️ Commandes de guilde supprimées: ${guildRemoved}`);
            console.log(`📊 Total supprimé: ${totalRemoved}`);
            console.log(`⏱️ Durée: ${duration}ms`);
            
            if (totalRemoved > 0) {
                console.log('✅ Nettoyage terminé avec succès');
                console.log('💡 Les commandes supprimées ne seront plus visibles dans Discord');
            } else {
                console.log('ℹ️ Aucune commande à supprimer trouvée');
            }

        } catch (error) {
            console.error('❌ Erreur durant le nettoyage:', error);
            process.exit(1);
        }
    }
}

// Exécution du script
if (require.main === module) {
    const cleanup = new CommandCleanup();
    cleanup.run().catch(console.error);
}

module.exports = CommandCleanup;