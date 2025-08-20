/**
 * SCRIPT DE FORCE REGISTRATION - COMMANDES DISCORD
 * Enregistrement robuste avec retry et vérification
 */

const { REST, Routes } = require('discord.js');
try { require('dotenv').config(); } catch {}
const fs = require('fs');
const path = require('path');

async function forceRegisterCommands() {
    console.log('🚀 DÉBUT ENREGISTREMENT FORCÉ');
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const DISABLED_NAMES = new Set([
        'apercu-couleur',
        'mongodb-backup',
        'mongodb-diagnostic',
        'reset',
        'test-level-notif'
    ]);
    
    try {
        // 1. Charger toutes les commandes
        console.log('📂 Chargement des commandes...');
        const commands = [];
        const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
        
        for (const file of commandFiles) {
            try {
                const filePath = path.resolve('./commands', file);
                delete require.cache[filePath];
                const command = require(filePath);
                
                if (command && command.data && DISABLED_NAMES.has(command.data.name)) {
                    console.log(`  ⛔ ${command.data.name} (désactivée, ignorée)`);
                    continue;
                }

                if (command.data && command.execute) {
                    const commandJson = command.data.toJSON();
                    commands.push(commandJson);
                    console.log(`  ✅ ${command.data.name}`);
                    
                    // Log spécial pour arc-en-ciel
                    if (command.data.name === 'arc-en-ciel') {
                        console.log(`     🌈 Permissions: ${commandJson.default_member_permissions}`);
                        console.log(`     🌈 Sous-commandes: ${commandJson.options?.length}`);
                    }
                } else {
                    console.log(`  ❌ ${file}: Structure invalide`);
                }
            } catch (error) {
                console.error(`  ❌ ${file}: ${error.message}`);
            }
        }
        
        console.log(`📊 Total: ${commands.length} commandes à enregistrer`);
        
        // 2. Supprimer les anciennes commandes
        console.log('🗑️ Suppression des anciennes commandes...');
        const targetGuildId = (process.env.GUILD_ID || '').trim();
        const isGuildTarget = Boolean(targetGuildId);

        if (isGuildTarget) {
            console.log(`   🧭 Cible guilde: ${targetGuildId}`);
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, targetGuildId),
                { body: [] }
            );
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: [] }
            );
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Enregistrement avec retry
        let success = false;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!success && attempts < maxAttempts) {
            attempts++;
            console.log(`🔄 Tentative ${attempts}/${maxAttempts}...`);
            
            try {
                const result = await rest.put(
                    isGuildTarget
                        ? Routes.applicationGuildCommands(process.env.CLIENT_ID, targetGuildId)
                        : Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: commands }
                );
                
                console.log(`✅ Enregistrement réussi! (${result.length} commandes)`);
                success = true;
                
            } catch (error) {
                console.error(`❌ Tentative ${attempts} échouée:`, error.message);
                
                if (error.status === 429) {
                    console.log('⏳ Rate limit, attente plus longue...');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                } else {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }
        
        if (!success) {
            throw new Error(`Échec après ${maxAttempts} tentatives`);
        }
        
        // 4. Vérification finale
        console.log('🔍 Vérification finale...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const registeredCommands = await rest.get(
            isGuildTarget
                ? Routes.applicationGuildCommands(process.env.CLIENT_ID, targetGuildId)
                : Routes.applicationCommands(process.env.CLIENT_ID)
        );
        console.log(`📊 Commandes confirmées sur Discord: ${registeredCommands.length}`);
        
        // Vérifier arc-en-ciel spécifiquement
        const arcEnCiel = registeredCommands.find(c => c.name === 'arc-en-ciel');
        if (arcEnCiel) {
            console.log('🌈 /arc-en-ciel CONFIRMÉE!');
            console.log(`   - ID: ${arcEnCiel.id}`);
            console.log(`   - Permissions: ${arcEnCiel.default_member_permissions}`);
        } else {
            console.log('❌ /arc-en-ciel manquante');
        }
        
        // Liste finale
        console.log('\n📋 Commandes finales sur Discord:');
        registeredCommands
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(cmd => console.log(`  - ${cmd.name}`));
        
        console.log('\n✅ ENREGISTREMENT TERMINÉ AVEC SUCCÈS!');
        
    } catch (error) {
        console.error('❌ ERREUR CRITIQUE:', error);
        process.exit(1);
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    forceRegisterCommands();
}

module.exports = forceRegisterCommands;