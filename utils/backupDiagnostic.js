const fs = require('fs').promises;
const path = require('path');

class BackupDiagnostic {
    constructor() {
        this.issues = [];
        this.recommendations = [];
    }

    async diagnoseAll() {
        console.log('🔍 === DIAGNOSTIC COMPLET DU SYSTÈME DE SAUVEGARDE ===\n');
        
        await this.checkEnvironmentVariables();
        await this.checkMongoDBModule();
        await this.checkBackupFiles();
        await this.checkAutoBackupStatus();
        await this.checkDataIntegrity();
        await this.checkForceBackupCommand();
        
        this.generateReport();
        return {
            issues: this.issues,
            recommendations: this.recommendations
        };
    }

    async checkEnvironmentVariables() {
        console.log('1️⃣ Vérification des variables d\'environnement MongoDB...');
        
        const requiredVars = ['MONGODB_USERNAME', 'MONGODB_PASSWORD', 'MONGODB_CLUSTER_URL'];
        const missingVars = [];
        
        for (const varName of requiredVars) {
            if (!process.env[varName]) {
                missingVars.push(varName);
            } else {
                console.log(`   ✅ ${varName}: Configuré`);
            }
        }
        
        if (missingVars.length > 0) {
            this.issues.push({
                type: 'mongodb_config',
                severity: 'high',
                message: `Variables MongoDB manquantes: ${missingVars.join(', ')}`,
                impact: 'Sauvegarde MongoDB impossible - utilisation locale uniquement'
            });
            
            this.recommendations.push({
                type: 'mongodb_config',
                action: 'Configurer les variables d\'environnement MongoDB dans Render',
                details: missingVars.map(v => `${v}=votre_valeur`).join('\n')
            });
            
            console.log(`   ❌ Variables manquantes: ${missingVars.join(', ')}`);
        } else {
            console.log('   ✅ Toutes les variables MongoDB sont configurées');
        }
        console.log('');
    }

    async checkMongoDBModule() {
        console.log('2️⃣ Vérification du module MongoDB...');
        
        try {
            require('mongodb');
            console.log('   ✅ Module MongoDB disponible');
        } catch (error) {
            this.issues.push({
                type: 'mongodb_module',
                severity: 'high',
                message: 'Module MongoDB non installé',
                impact: 'Sauvegarde MongoDB impossible'
            });
            
            this.recommendations.push({
                type: 'mongodb_module',
                action: 'Installer le module MongoDB',
                details: 'npm install mongodb'
            });
            
            console.log('   ❌ Module MongoDB manquant');
        }
        console.log('');
    }

    async checkBackupFiles() {
        console.log('3️⃣ Vérification des fichiers de sauvegarde...');
        
        const backupDir = path.join(__dirname, '..', 'data', 'backups');
        
        try {
            const files = await fs.readdir(backupDir);
            const backupFiles = files.filter(f => f.includes('backup') && (f.endsWith('.json') || f.endsWith('.gz')));
            
            if (backupFiles.length === 0) {
                this.issues.push({
                    type: 'backup_files',
                    severity: 'medium',
                    message: 'Aucun fichier de sauvegarde trouvé',
                    impact: 'Pas de sauvegardes disponibles pour restauration'
                });
                console.log('   ❌ Aucun fichier de sauvegarde trouvé');
            } else {
                console.log(`   ✅ ${backupFiles.length} fichiers de sauvegarde trouvés`);
                
                // Vérifier l'âge des sauvegardes
                const now = Date.now();
                let recentBackups = 0;
                
                for (const file of backupFiles) {
                    const filePath = path.join(backupDir, file);
                    const stats = await fs.stat(filePath);
                    const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
                    
                    if (ageHours < 1) recentBackups++;
                }
                
                if (recentBackups === 0) {
                    this.issues.push({
                        type: 'backup_age',
                        severity: 'medium',
                        message: 'Aucune sauvegarde récente (< 1h)',
                        impact: 'Sauvegarde automatique peut ne pas fonctionner'
                    });
                    console.log('   ⚠️ Aucune sauvegarde récente trouvée');
                } else {
                    console.log(`   ✅ ${recentBackups} sauvegarde(s) récente(s)`);
                }
            }
        } catch (error) {
            this.issues.push({
                type: 'backup_directory',
                severity: 'high',
                message: 'Dossier de sauvegarde inaccessible',
                impact: 'Impossible de créer ou lire les sauvegardes'
            });
            console.log('   ❌ Erreur accès dossier backups:', error.message);
        }
        console.log('');
    }

    async checkAutoBackupStatus() {
        console.log('4️⃣ Vérification du système de sauvegarde automatique...');
        
        try {
            const deploymentManager = require('./deploymentManager');
            const mongoBackup = require('./mongoBackupManager');
            
            // Vérifier si le système a été initialisé
            const lastDeploymentFile = path.join(__dirname, '..', 'data', '.last_deployment');
            
            try {
                await fs.access(lastDeploymentFile);
                console.log('   ✅ Système de déploiement initialisé');
            } catch {
                this.issues.push({
                    type: 'deployment_init',
                    severity: 'medium',
                    message: 'Système de déploiement non initialisé',
                    impact: 'Sauvegarde automatique peut ne pas démarrer'
                });
                console.log('   ⚠️ Système de déploiement non initialisé');
            }
            
            // Tester la connexion MongoDB
            if (process.env.MONGODB_PASSWORD && process.env.MONGODB_USERNAME && process.env.MONGODB_CLUSTER_URL) {
                console.log('   🔄 Test connexion MongoDB...');
                const connected = await mongoBackup.connect();
                if (connected) {
                    console.log('   ✅ Connexion MongoDB réussie');
                } else {
                    this.issues.push({
                        type: 'mongodb_connection',
                        severity: 'high',
                        message: 'Impossible de se connecter à MongoDB',
                        impact: 'Sauvegarde MongoDB échoue'
                    });
                    console.log('   ❌ Connexion MongoDB échouée');
                }
                await mongoBackup.disconnect();
            } else {
                console.log('   ⚠️ Variables MongoDB manquantes - mode local uniquement');
            }
            
        } catch (error) {
            this.issues.push({
                type: 'auto_backup_system',
                severity: 'high',
                message: 'Erreur dans le système de sauvegarde automatique',
                impact: 'Sauvegarde automatique non fonctionnelle'
            });
            console.log('   ❌ Erreur système sauvegarde:', error.message);
        }
        console.log('');
    }

    async checkDataIntegrity() {
        console.log('5️⃣ Vérification de l\'intégrité des données...');
        
        const criticalFiles = [
            'economy.json',
            'level_users.json',
            'level_config.json',
            'confessions.json',
            'counting.json',
            'autothread.json',
            'shop.json',
            'karma_config.json',
            'message_rewards.json'
        ];
        
        let validFiles = 0;
        let corruptedFiles = [];
        
        for (const filename of criticalFiles) {
            const filePath = path.join(__dirname, '..', 'data', filename);
            
            try {
                const data = await fs.readFile(filePath, 'utf8');
                JSON.parse(data);
                validFiles++;
                console.log(`   ✅ ${filename}: Valide`);
            } catch (error) {
                corruptedFiles.push(filename);
                console.log(`   ❌ ${filename}: ${error.message}`);
            }
        }
        
        if (corruptedFiles.length > 0) {
            this.issues.push({
                type: 'data_integrity',
                severity: 'high',
                message: `${corruptedFiles.length} fichiers corrompus: ${corruptedFiles.join(', ')}`,
                impact: 'Perte potentielle de données utilisateur'
            });
            
            this.recommendations.push({
                type: 'data_repair',
                action: 'Réparer les fichiers corrompus',
                details: 'Utiliser le système de réparation automatique ou restaurer depuis sauvegarde'
            });
        }
        
        console.log(`   📊 ${validFiles}/${criticalFiles.length} fichiers critiques valides`);
        console.log('');
    }

    async checkForceBackupCommand() {
        console.log('6️⃣ Test de la commande force-backup...');
        
        try {
            const deploymentManager = require('./deploymentManager');
            
            console.log('   🔄 Test sauvegarde d\'urgence...');
            const result = await deploymentManager.emergencyBackup();
            
            if (result) {
                console.log('   ✅ Commande force-backup fonctionnelle');
            } else {
                this.issues.push({
                    type: 'force_backup',
                    severity: 'medium',
                    message: 'Commande force-backup échoue',
                    impact: 'Impossible de déclencher une sauvegarde manuelle'
                });
                console.log('   ❌ Commande force-backup échoue');
            }
        } catch (error) {
            this.issues.push({
                type: 'force_backup_error',
                severity: 'high',
                message: 'Erreur lors du test force-backup',
                impact: 'Commande force-backup non fonctionnelle'
            });
            console.log('   ❌ Erreur test force-backup:', error.message);
        }
        console.log('');
    }

    generateReport() {
        console.log('📋 === RAPPORT DE DIAGNOSTIC ===\n');
        
        if (this.issues.length === 0) {
            console.log('🎉 Aucun problème détecté ! Le système de sauvegarde fonctionne correctement.\n');
            return;
        }
        
        console.log('🚨 PROBLÈMES DÉTECTÉS:\n');
        
        const highIssues = this.issues.filter(i => i.severity === 'high');
        const mediumIssues = this.issues.filter(i => i.severity === 'medium');
        
        if (highIssues.length > 0) {
            console.log('🔴 CRITIQUES:');
            highIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue.message}`);
                console.log(`      Impact: ${issue.impact}\n`);
            });
        }
        
        if (mediumIssues.length > 0) {
            console.log('🟡 MOYENS:');
            mediumIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue.message}`);
                console.log(`      Impact: ${issue.impact}\n`);
            });
        }
        
        if (this.recommendations.length > 0) {
            console.log('💡 RECOMMANDATIONS:\n');
            this.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec.action}`);
                if (rec.details) {
                    console.log(`      Détails: ${rec.details}\n`);
                }
            });
        }
        
        console.log('🎯 RÉSUMÉ:');
        console.log(`   • ${highIssues.length} problème(s) critique(s)`);
        console.log(`   • ${mediumIssues.length} problème(s) moyen(s)`);
        console.log(`   • ${this.recommendations.length} recommandation(s)\n`);
    }

    async fixCommonIssues() {
        console.log('🔧 === RÉPARATION AUTOMATIQUE ===\n');
        
        let fixedIssues = 0;
        
        // Créer le dossier backups s'il n'existe pas
        const backupDir = path.join(__dirname, '..', 'data', 'backups');
        try {
            await fs.mkdir(backupDir, { recursive: true });
            console.log('✅ Dossier backups créé/vérifié');
            fixedIssues++;
        } catch (error) {
            console.log('❌ Erreur création dossier backups:', error.message);
        }
        
        // Initialiser le fichier de déploiement
        const lastDeploymentFile = path.join(__dirname, '..', 'data', '.last_deployment');
        try {
            await fs.access(lastDeploymentFile);
        } catch {
            const deploymentId = process.env.RENDER_SERVICE_ID || `local-${Date.now()}`;
            await fs.writeFile(lastDeploymentFile, deploymentId);
            console.log('✅ Fichier de déploiement initialisé');
            fixedIssues++;
        }
        
        // Réparer les fichiers JSON corrompus
        const dataValidator = require('./dataValidator');
        try {
            const repairResult = await dataValidator.autoRepair();
            if (repairResult.repaired > 0) {
                console.log(`✅ ${repairResult.repaired} fichier(s) réparé(s)`);
                fixedIssues += repairResult.repaired;
            }
        } catch (error) {
            console.log('⚠️ Erreur réparation données:', error.message);
        }
        
        console.log(`\n🎉 ${fixedIssues} problème(s) corrigé(s) automatiquement\n`);
        
        return fixedIssues;
    }
}

module.exports = new BackupDiagnostic();

// Si exécuté directement
if (require.main === module) {
    const diagnostic = new BackupDiagnostic();
    diagnostic.diagnoseAll()
        .then(() => diagnostic.fixCommonIssues())
        .then(() => {
            console.log('🏁 Diagnostic et réparation terminés');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erreur diagnostic:', error);
            process.exit(1);
        });
}