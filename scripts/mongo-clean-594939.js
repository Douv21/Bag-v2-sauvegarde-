// scripts/mongo-clean-594939.js
require('dotenv').config();

(async () => {
  try {
    const mongoBackup = require('../utils/mongoBackupManager');
    const targetPrice = 594939;

    const connected = await mongoBackup.connect();
    if (!connected || !mongoBackup.db) {
      console.log('⚠️ MongoDB non configuré ou indisponible - aucun nettoyage distant effectué');
      process.exit(0);
    }

    const db = mongoBackup.db;

    async function cleanShopLikeCollection(collectionName) {
      try {
        const col = db.collection(collectionName);
        const docs = await col.find({}).toArray();
        let modifiedDocs = 0;
        let removedItems = 0;

        for (const doc of docs) {
          if (!doc || typeof doc.data !== 'object' || doc.data === null) continue;

          let changed = false;
          const newData = { ...doc.data };

          for (const [guildId, items] of Object.entries(newData)) {
            if (Array.isArray(items)) {
              const before = items.length;
              const afterItems = items.filter(it => !(it && typeof it === 'object' && it.price === targetPrice));
              if (afterItems.length !== before) {
                newData[guildId] = afterItems;
                removedItems += (before - afterItems.length);
                changed = true;
              }
            }
          }

          if (changed) {
            await col.updateOne({ _id: doc._id }, { $set: { data: newData, timestamp: new Date() } });
            modifiedDocs += 1;
          }
        }

        console.log(`🧹 ${collectionName}: ${modifiedDocs} document(s) mis à jour, ${removedItems} élément(s) supprimé(s)`);
      } catch (err) {
        console.log(`⚠️ Nettoyage ignoré pour ${collectionName}: ${err.message}`);
      }
    }

    // Collections possibles selon les mappings
    await cleanShopLikeCollection('backup_shop_items'); // mapping dédié
    await cleanShopLikeCollection('shop'); // ancien mapping générique

    await mongoBackup.disconnect();
    console.log('✅ Nettoyage MongoDB terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur script nettoyage Mongo:', error);
    process.exit(1);
  }
})();