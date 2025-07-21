// Script pour corriger tous les handlers
const fs = require('fs');
const path = require('path');

const handlersPath = './handlers';
const files = ['CountingConfigHandler.js', 'ConfessionConfigHandler.js', 'AutoThreadConfigHandler.js', 'EconomyConfigHandler.js'];

files.forEach(filename => {
    const filePath = path.join(handlersPath, filename);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remplacer tous les anciens composants par StringSelectMenuBuilder
        content = content.replace(/type: 3,/g, '');
        content = content.replace(/customId:/g, '.setCustomId(');
        content = content.replace(/placeholder:/g, '.setPlaceholder(');
        content = content.replace(/options:/g, '.addOptions(');
        
        // Ajouter StringSelectMenuBuilder aux imports si pas présent
        if (!content.includes('StringSelectMenuBuilder')) {
            content = content.replace(
                /const { ([^}]+) } = require\('discord\.js'\);/,
                "const { $1, StringSelectMenuBuilder } = require('discord.js');"
            );
        }
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${filename} corrigé`);
    }
});

console.log('Tous les handlers ont été corrigés');