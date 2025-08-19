/**
 * Script de test pour la fonctionnalité d'historique cross-serveur
 */

const DataManager = require('./managers/DataManager');
const ModerationManager = require('./managers/ModerationManager');

// Mock client simple pour les tests
const mockClient = {
  guilds: {
    cache: new Map([
      ['123456789', { id: '123456789', name: 'Serveur Test 1' }],
      ['987654321', { id: '987654321', name: 'Serveur Test 2' }]
    ])
  }
};

async function testHistoriqueGlobal() {
  console.log('🧪 Test de l\'historique de modération cross-serveur...\n');

  try {
    // Initialiser les managers
    const dataManager = new DataManager();
    const moderationManager = new ModerationManager(dataManager, mockClient);

    const testUserId = '111111111111111111';
    const testModeratorId = '222222222222222222';

    console.log('1️⃣ Ajout d\'actions de test...');

    // Ajouter quelques actions de test
    await moderationManager.addBanToHistory(
      testUserId, 
      '123456789', 
      'Spam répété', 
      testModeratorId
    );

    await moderationManager.addToGlobalHistory(
      testUserId,
      '987654321',
      'warn',
      'Langage inapproprié',
      testModeratorId
    );

    await moderationManager.addKickToHistory(
      testUserId,
      '123456789',
      'Violation des règles',
      testModeratorId
    );

    await moderationManager.addMuteToHistory(
      testUserId,
      '987654321',
      'Flood dans le chat',
      testModeratorId,
      2 * 60 * 60 * 1000 // 2 heures
    );

    console.log('✅ Actions ajoutées avec succès');

    console.log('\n2️⃣ Récupération de l\'historique...');

    // Récupérer l'historique
    const history = await moderationManager.getGlobalModerationHistory(testUserId);

    console.log(`📋 Historique trouvé: ${history.length} action(s)`);

    if (history.length > 0) {
      console.log('\n📝 Détails de l\'historique:');
      history.forEach((action, index) => {
        const date = new Date(action.timestamp).toLocaleString('fr-FR');
        console.log(`  ${index + 1}. [${action.type.toUpperCase()}] ${action.guildName}`);
        console.log(`     📅 ${date}`);
        console.log(`     📝 ${action.reason}`);
        console.log(`     👮 Modérateur: ${action.moderatorId}`);
        console.log('');
      });
    }

    console.log('\n3️⃣ Test de formatage de durée...');
    console.log(`1 heure: ${moderationManager.formatDuration(60 * 60 * 1000)}`);
    console.log(`2 jours 3 heures: ${moderationManager.formatDuration(2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)}`);
    console.log(`30 minutes: ${moderationManager.formatDuration(30 * 60 * 1000)}`);

    console.log('\n✅ Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur pendant le test:', error);
  }
}

// Exécuter le test si le script est lancé directement
if (require.main === module) {
  testHistoriqueGlobal();
}

module.exports = { testHistoriqueGlobal };