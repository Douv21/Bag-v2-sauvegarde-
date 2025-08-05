/**
 * BAG Dashboard Premium - JavaScript
 * Interface administrative complète avec gestion de configurations
 * @version 3.0
 */

class BAGDashboard {
    constructor() {
        this.currentSection = 'overview';
        this.data = {
            stats: {},
            configs: {},
            servers: [],
            users: [],
            lastUpdate: null
        };
        this.updateInterval = null;
        this.notifications = [];
        
        // Configuration par défaut
        this.defaultConfigs = {
            economy: {
                dailyReward: 100,
                workReward: { min: 50, max: 200 },
                crimeReward: { min: 100, max: 500 },
                crimeFail: { min: 20, max: 100 },
                betLimit: 1000,
                interestRate: 0.02
            },
            levels: {
                textXP: { min: 5, max: 15, cooldown: 60000 },
                voiceXP: { amount: 10, interval: 60000, perMinute: 10 },
                notifications: { enabled: true, channelId: null, cardStyle: 'futuristic' },
                roleRewards: [],
                levelFormula: { baseXP: 100, multiplier: 1.5 }
            },
            karma: {
                dailyBonus: 5,
                messageReward: 1,
                confessionReward: 10,
                maxKarma: 1000,
                discounts: []
            },
            confessions: {
                channelId: null,
                moderationEnabled: true,
                autoDelete: false,
                minLength: 10,
                maxLength: 2000
            },
            moderation: {
                autoMod: true,
                warnLimit: 3,
                muteTime: 600,
                banTime: 86400
            }
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation du BAG Dashboard Premium...');
        
        try {
            // Attendre que le DOM soit prêt
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            console.log('✅ DOM prêt, configuration des événements...');
            this.setupEventListeners();
            
            console.log('📊 Chargement des données initiales...');
            await this.loadInitialData();
            
            console.log('🔄 Démarrage des mises à jour en temps réel...');
            this.startRealTimeUpdates();
            
            console.log('🏠 Affichage de la section vue d\'ensemble...');
            this.showOverviewSection();
            
            this.showNotification('Dashboard initialisé avec succès!', 'success');
            console.log('✅ Dashboard prêt!');
            
        } catch (error) {
            console.error('❌ Erreur d\'initialisation:', error);
            this.showNotification('Erreur d\'initialisation du dashboard: ' + error.message, 'error');
        }
    }

    setupEventListeners() {
        console.log('🔗 Configuration des événements...');
        
        // Navigation sidebar
        const navLinks = document.querySelectorAll('.nav-link');
        console.log(`📋 ${navLinks.length} liens de navigation trouvés`);
        
        navLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                console.log(`🖱️ Clic sur la section: ${section}`);
                if (section && section !== this.currentSection) {
                    this.switchSection(section);
                }
            });
            console.log(`✅ Événement configuré pour: ${link.dataset.section}`);
        });

        // Boutons d'action
        document.addEventListener('click', (e) => {
            if (e.target.matches('.action-btn') || e.target.closest('.action-btn')) {
                e.preventDefault();
                const btn = e.target.matches('.action-btn') ? e.target : e.target.closest('.action-btn');
                const section = btn.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            }
        });

        // Refresh sur focus de la fenêtre
        window.addEventListener('focus', () => {
            this.loadInitialData();
        });

        // Gestion du responsive
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Menu mobile
        this.setupMobileMenu();
        
        console.log('✅ Tous les événements configurés');
    }

    switchSection(section) {
        console.log(`🔄 Changement de section: ${this.currentSection} → ${section}`);
        
        // Mettre à jour la navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
                console.log(`✅ Section active mise à jour: ${section}`);
            }
        });

        // Mettre à jour le contenu
        this.currentSection = section;
        this.loadSectionContent(section);
    }

    async loadSectionContent(section) {
        console.log(`📂 Chargement du contenu pour la section: ${section}`);
        const container = document.getElementById('content-container');
        const header = document.querySelector('.content-header');
        
        if (!container) {
            console.error('❌ Container de contenu non trouvé!');
            return;
        }
        
        // Mise à jour du header
        this.updateContentHeader(section);
        
        // Afficher l'état de chargement
        this.showLoading(container);

        try {
            switch (section) {
                case 'overview':
                    console.log('🏠 Affichage de la vue d\'ensemble...');
                    this.showOverviewSection();
                    break;
                case 'economy':
                    console.log('💰 Affichage de la section économie...');
                    await this.showEconomySection();
                    break;
                case 'levels':
                    console.log('📈 Affichage de la section niveaux...');
                    await this.showLevelsSection();
                    break;
                case 'karma':
                    console.log('❤️ Affichage de la section karma...');
                    await this.showKarmaSection();
                    break;
                case 'confessions':
                    console.log('💬 Affichage de la section confessions...');
                    await this.showConfessionsSection();
                    break;
                case 'moderation':
                    console.log('🛡️ Affichage de la section modération...');
                    await this.showModerationSection();
                    break;
                case 'backup':
                    console.log('💾 Affichage de la section sauvegardes...');
                    await this.showBackupSection();
                    break;
                case 'settings':
                    console.log('⚙️ Affichage de la section paramètres...');
                    await this.showSettingsSection();
                    break;
                default:
                    console.log('🏠 Section par défaut: vue d\'ensemble...');
                    this.showOverviewSection();
            }
            console.log(`✅ Section ${section} chargée avec succès`);
        } catch (error) {
            console.error(`❌ Erreur lors du chargement de la section ${section}:`, error);
            this.showError(container, `Erreur lors du chargement de la section ${section}: ${error.message}`);
        }
    }

    updateContentHeader(section) {
        const title = document.querySelector('.content-title');
        const subtitle = document.querySelector('.content-subtitle');
        
        const headers = {
            overview: {
                title: 'Vue d\'ensemble',
                subtitle: 'Tableau de bord principal et statistiques en temps réel'
            },
            economy: {
                title: 'Système Économique',
                subtitle: 'Configuration et gestion de l\'économie du serveur'
            },
            levels: {
                title: 'Système de Niveaux',
                subtitle: 'Configuration XP, récompenses et progression des membres'
            },
            karma: {
                title: 'Système Karma',
                subtitle: 'Gestion des points karma et récompenses'
            },
            confessions: {
                title: 'Confessions Anonymes',
                subtitle: 'Configuration des canaux et modération des confessions'
            },
            moderation: {
                title: 'Modération Automatique',
                subtitle: 'Outils et paramètres de modération du serveur'
            },
            backup: {
                title: 'Sauvegardes & Données',
                subtitle: 'Gestion des sauvegardes et intégrité des données'
            },
            settings: {
                title: 'Paramètres Généraux',
                subtitle: 'Configuration globale du bot et du dashboard'
            }
        };

        const header = headers[section] || headers.overview;
        if (title) title.textContent = header.title;
        if (subtitle) subtitle.textContent = header.subtitle;
    }

    showOverviewSection() {
        const container = document.getElementById('content-container');
        
        container.innerHTML = `
            <div class="dashboard-grid fade-in">
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Statistiques Générales</h3>
                        <div class="card-icon">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                    </div>
                    <div class="card-content">
                        <p>Aperçu global de l'activité du serveur</p>
                    </div>
                    <div class="card-stats">
                        <div class="stat">
                            <span class="stat-value" id="activeMembers">-</span>
                            <span class="stat-label">Membres actifs</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="todayMessages">-</span>
                            <span class="stat-label">Messages/jour</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="commandsUsed">-</span>
                            <span class="stat-label">Commandes</span>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Économie</h3>
                        <div class="card-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                    </div>
                    <div class="card-content">
                        <p>Système économique et transactions</p>
                    </div>
                    <div class="card-stats">
                        <div class="stat">
                            <span class="stat-value" id="totalMoney">-</span>
                            <span class="stat-label">Total en circulation</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="todayTransactions">-</span>
                            <span class="stat-label">Transactions/jour</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="richestUser">-</span>
                            <span class="stat-label">Plus riche</span>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Confessions</h3>
                        <div class="card-icon">
                            <i class="fas fa-comment-dots"></i>
                        </div>
                    </div>
                    <div class="card-content">
                        <p>Système de confessions anonymes</p>
                    </div>
                    <div class="card-stats">
                        <div class="stat">
                            <span class="stat-value" id="totalConfessions">-</span>
                            <span class="stat-label">Total confessions</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="weekConfessions">-</span>
                            <span class="stat-label">Cette semaine</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="avgConfessions">-</span>
                            <span class="stat-label">Moyenne/jour</span>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Niveaux & XP</h3>
                        <div class="card-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                    </div>
                    <div class="card-content">
                        <p>Système de progression et récompenses</p>
                    </div>
                    <div class="card-stats">
                        <div class="stat">
                            <span class="stat-value" id="highestLevel">-</span>
                            <span class="stat-label">Plus haut niveau</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="totalXP">-</span>
                            <span class="stat-label">XP total distribué</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="rewardsGiven">-</span>
                            <span class="stat-label">Récompenses</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="action-buttons fade-in">
                <button class="btn btn-primary" data-section="economy">
                    <i class="fas fa-coins"></i>
                    Configurer l'Économie
                </button>
                <button class="btn btn-primary" data-section="levels">
                    <i class="fas fa-chart-line"></i>
                    Gérer les Niveaux
                </button>
                <button class="btn btn-primary" data-section="confessions">
                    <i class="fas fa-comment-dots"></i>
                    Paramétrer les Confessions
                </button>
                <button class="btn btn-secondary" data-section="backup">
                    <i class="fas fa-database"></i>
                    Sauvegardes
                </button>
            </div>
        `;

        // Charger les statistiques
        this.loadOverviewStats();
    }

    async showEconomySection() {
        const container = document.getElementById('content-container');
        const config = this.data.configs.economy || this.defaultConfigs.economy;
        
        container.innerHTML = `
            <div class="config-section fade-in">
                <div class="config-header">
                    <h3 class="config-title">
                        <i class="fas fa-coins"></i>
                        Configuration Économique
                    </h3>
                </div>
                <div class="config-grid">
                    <div class="config-item">
                        <label class="config-label">Récompense quotidienne</label>
                        <input type="number" class="config-input" id="dailyReward" value="${config.dailyReward}" min="1" max="10000">
                        <p class="config-description">Montant reçu avec la commande /daily</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Travail - Récompense min</label>
                        <input type="number" class="config-input" id="workRewardMin" value="${config.workReward.min}" min="1" max="1000">
                        <p class="config-description">Montant minimum pour /travailler</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Travail - Récompense max</label>
                        <input type="number" class="config-input" id="workRewardMax" value="${config.workReward.max}" min="1" max="1000">
                        <p class="config-description">Montant maximum pour /travailler</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Crime - Récompense min</label>
                        <input type="number" class="config-input" id="crimeRewardMin" value="${config.crimeReward.min}" min="1" max="1000">
                        <p class="config-description">Gain minimum pour /crime</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Crime - Récompense max</label>
                        <input type="number" class="config-input" id="crimeRewardMax" value="${config.crimeReward.max}" min="1" max="1000">
                        <p class="config-description">Gain maximum pour /crime</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Limite de pari</label>
                        <input type="number" class="config-input" id="betLimit" value="${config.betLimit}" min="100" max="100000">
                        <p class="config-description">Montant maximum pour /parier</p>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="dashboard.saveEconomyConfig()">
                        <i class="fas fa-save"></i>
                        Sauvegarder
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.resetEconomyConfig()">
                        <i class="fas fa-undo"></i>
                        Réinitialiser
                    </button>
                </div>
            </div>
        `;
    }

    async showLevelsSection() {
        const container = document.getElementById('content-container');
        const config = this.data.configs.levels || this.defaultConfigs.levels;
        
        container.innerHTML = `
            <div class="config-section fade-in">
                <div class="config-header">
                    <h3 class="config-title">
                        <i class="fas fa-chart-line"></i>
                        Configuration Système de Niveaux
                    </h3>
                </div>
                <div class="config-grid">
                    <div class="config-item">
                        <label class="config-label">XP Messages - Minimum</label>
                        <input type="number" class="config-input" id="textXPMin" value="${config.textXP.min}" min="1" max="50">
                        <p class="config-description">XP minimum par message</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">XP Messages - Maximum</label>
                        <input type="number" class="config-input" id="textXPMax" value="${config.textXP.max}" min="1" max="50">
                        <p class="config-description">XP maximum par message</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Cooldown XP (secondes)</label>
                        <input type="number" class="config-input" id="textXPCooldown" value="${config.textXP.cooldown / 1000}" min="1" max="300">
                        <p class="config-description">Délai entre deux gains d'XP</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">XP Vocal par minute</label>
                        <input type="number" class="config-input" id="voiceXPAmount" value="${config.voiceXP.perMinute || config.voiceXP.amount}" min="1" max="100">
                        <p class="config-description">XP gagné par minute en vocal</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">XP Base pour level up</label>
                        <input type="number" class="config-input" id="baseXP" value="${config.levelFormula.baseXP}" min="50" max="1000">
                        <p class="config-description">XP de base pour monter de niveau</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Multiplicateur XP</label>
                        <input type="number" class="config-input" id="xpMultiplier" value="${config.levelFormula.multiplier}" min="1" max="3" step="0.1">
                        <p class="config-description">Multiplicateur de difficulté</p>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="dashboard.saveLevelsConfig()">
                        <i class="fas fa-save"></i>
                        Sauvegarder
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.resetLevelsConfig()">
                        <i class="fas fa-undo"></i>
                        Réinitialiser
                    </button>
                </div>
            </div>
        `;
    }

    async showKarmaSection() {
        const container = document.getElementById('content-container');
        const config = this.data.configs.karma || this.defaultConfigs.karma;
        
        container.innerHTML = `
            <div class="config-section fade-in">
                <div class="config-header">
                    <h3 class="config-title">
                        <i class="fas fa-heart"></i>
                        Configuration Système Karma
                    </h3>
                </div>
                <div class="config-grid">
                    <div class="config-item">
                        <label class="config-label">Bonus quotidien</label>
                        <input type="number" class="config-input" id="karmaDaily" value="${config.dailyBonus}" min="1" max="50">
                        <p class="config-description">Karma gratuit par jour</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Karma par message</label>
                        <input type="number" class="config-input" id="karmaMessage" value="${config.messageReward}" min="0" max="10">
                        <p class="config-description">Karma gagné par message</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Karma par confession</label>
                        <input type="number" class="config-input" id="karmaConfession" value="${config.confessionReward}" min="1" max="100">
                        <p class="config-description">Karma pour envoyer une confession</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Karma maximum</label>
                        <input type="number" class="config-input" id="karmaMax" value="${config.maxKarma}" min="100" max="10000">
                        <p class="config-description">Limite maximale de karma</p>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="dashboard.saveKarmaConfig()">
                        <i class="fas fa-save"></i>
                        Sauvegarder
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.resetKarmaConfig()">
                        <i class="fas fa-undo"></i>
                        Réinitialiser
                    </button>
                </div>
            </div>
        `;
    }

    async showConfessionsSection() {
        const container = document.getElementById('content-container');
        const config = this.data.configs.confessions || this.defaultConfigs.confessions;
        
        container.innerHTML = `
            <div class="config-section fade-in">
                <div class="config-header">
                    <h3 class="config-title">
                        <i class="fas fa-comment-dots"></i>
                        Configuration Confessions
                    </h3>
                </div>
                <div class="config-grid">
                    <div class="config-item">
                        <label class="config-label">Canal des confessions</label>
                        <input type="text" class="config-input" id="confessionChannel" value="${config.channelId || ''}" placeholder="ID du canal">
                        <p class="config-description">ID du canal où publier les confessions</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Longueur minimale</label>
                        <input type="number" class="config-input" id="minLength" value="${config.minLength}" min="1" max="100">
                        <p class="config-description">Nombre minimum de caractères</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Longueur maximale</label>
                        <input type="number" class="config-input" id="maxLength" value="${config.maxLength}" min="100" max="4000">
                        <p class="config-description">Nombre maximum de caractères</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Modération activée</label>
                        <select class="config-input" id="moderationEnabled">
                            <option value="true" ${config.moderationEnabled ? 'selected' : ''}>Activée</option>
                            <option value="false" ${!config.moderationEnabled ? 'selected' : ''}>Désactivée</option>
                        </select>
                        <p class="config-description">Modération automatique des confessions</p>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="dashboard.saveConfessionsConfig()">
                        <i class="fas fa-save"></i>
                        Sauvegarder
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.resetConfessionsConfig()">
                        <i class="fas fa-undo"></i>
                        Réinitialiser
                    </button>
                </div>
            </div>
        `;
    }

    async showModerationSection() {
        const container = document.getElementById('content-container');
        
        container.innerHTML = `
            <div class="config-section fade-in">
                <div class="config-header">
                    <h3 class="config-title">
                        <i class="fas fa-shield-alt"></i>
                        Outils de Modération
                    </h3>
                </div>
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3 class="card-title">Actions Rapides</h3>
                            <div class="card-icon">
                                <i class="fas fa-bolt"></i>
                            </div>
                        </div>
                        <div class="card-content">
                            <div class="action-buttons">
                                <button class="btn btn-secondary" onclick="dashboard.clearTestObjects()">
                                    <i class="fas fa-trash"></i>
                                    Nettoyer objets de test
                                </button>
                                <button class="btn btn-secondary" onclick="dashboard.resetCommands()">
                                    <i class="fas fa-sync"></i>
                                    Réinitialiser commandes
                                </button>
                                <button class="btn btn-secondary" onclick="dashboard.forceBackup()">
                                    <i class="fas fa-save"></i>
                                    Forcer sauvegarde
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async showBackupSection() {
        const container = document.getElementById('content-container');
        
        container.innerHTML = `
            <div class="config-section fade-in">
                <div class="config-header">
                    <h3 class="config-title">
                        <i class="fas fa-database"></i>
                        Gestion des Sauvegardes
                    </h3>
                </div>
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3 class="card-title">Statut des Sauvegardes</h3>
                            <div class="card-icon">
                                <i class="fas fa-hdd"></i>
                            </div>
                        </div>
                        <div class="card-content">
                            <p>Système de sauvegarde automatique actif</p>
                        </div>
                        <div class="card-stats">
                            <div class="stat">
                                <span class="stat-value" id="backupCount">-</span>
                                <span class="stat-label">Sauvegardes</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value" id="lastBackup">-</span>
                                <span class="stat-label">Dernière</span>
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3 class="card-title">Intégrité des Données</h3>
                            <div class="card-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </div>
                        <div class="card-content">
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="dashboard.checkDataIntegrity()">
                                    <i class="fas fa-search"></i>
                                    Vérifier intégrité
                                </button>
                                <button class="btn btn-secondary" onclick="dashboard.runDiagnostic()">
                                    <i class="fas fa-stethoscope"></i>
                                    Diagnostic complet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async showSettingsSection() {
        console.log('⚙️ Génération de la section paramètres...');
        const container = document.getElementById('content-container');
        
        container.innerHTML = `
            <div class="config-section fade-in">
                <div class="config-header">
                    <h3 class="config-title">
                        <i class="fas fa-cog"></i>
                        Paramètres Généraux
                    </h3>
                </div>
                <div class="config-grid">
                    <div class="config-item">
                        <label class="config-label">Langue du bot</label>
                        <select class="config-input" id="botLanguage">
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                        </select>
                        <p class="config-description">Langue des messages du bot</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Préfixe des commandes</label>
                        <input type="text" class="config-input" id="commandPrefix" value="/" readonly>
                        <p class="config-description">Utilise les slash commands</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Mode debug</label>
                        <select class="config-input" id="debugMode">
                            <option value="false">Désactivé</option>
                            <option value="true">Activé</option>
                        </select>
                        <p class="config-description">Logs détaillés pour le débogage</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Notifications</label>
                        <select class="config-input" id="notificationsEnabled">
                            <option value="true">Activées</option>
                            <option value="false">Désactivées</option>
                        </select>
                        <p class="config-description">Notifications dans le dashboard</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Auto-sauvegarde</label>
                        <select class="config-input" id="autoBackup">
                            <option value="true">Activée</option>
                            <option value="false">Désactivée</option>
                        </select>
                        <p class="config-description">Sauvegarde automatique des données</p>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Thème</label>
                        <select class="config-input" id="theme">
                            <option value="dark">Sombre</option>
                            <option value="light">Clair</option>
                        </select>
                        <p class="config-description">Thème de l'interface</p>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="dashboard.saveGeneralSettings()">
                        <i class="fas fa-save"></i>
                        Sauvegarder
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.restartBot()">
                        <i class="fas fa-restart"></i>
                        Redémarrer le bot
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.testDashboard()">
                        <i class="fas fa-vial"></i>
                        Tester le dashboard
                    </button>
                </div>
            </div>
            
            <div class="config-section fade-in" style="margin-top: 2rem;">
                <div class="config-header">
                    <h3 class="config-title">
                        <i class="fas fa-tools"></i>
                        Outils de Maintenance
                    </h3>
                </div>
                <div class="config-grid">
                    <div class="config-item">
                        <label class="config-label">Nettoyer les objets de test</label>
                        <p class="config-description">Supprime tous les objets de test de la base de données</p>
                        <button class="btn btn-secondary" onclick="dashboard.clearTestObjects()">
                            <i class="fas fa-broom"></i>
                            Nettoyer
                        </button>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Réinitialiser les commandes</label>
                        <p class="config-description">Force la réinitialisation des slash commands</p>
                        <button class="btn btn-secondary" onclick="dashboard.resetCommands()">
                            <i class="fas fa-sync"></i>
                            Réinitialiser
                        </button>
                    </div>
                    <div class="config-item">
                        <label class="config-label">Sauvegarde forcée</label>
                        <p class="config-description">Force une sauvegarde immédiate</p>
                        <button class="btn btn-secondary" onclick="dashboard.forceBackup()">
                            <i class="fas fa-download"></i>
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ Section paramètres générée avec succès');
    }

    // Méthodes de sauvegarde des configurations
    async saveEconomyConfig() {
        try {
            const config = {
                dailyReward: parseInt(document.getElementById('dailyReward').value),
                workReward: {
                    min: parseInt(document.getElementById('workRewardMin').value),
                    max: parseInt(document.getElementById('workRewardMax').value)
                },
                crimeReward: {
                    min: parseInt(document.getElementById('crimeRewardMin').value),
                    max: parseInt(document.getElementById('crimeRewardMax').value)
                },
                betLimit: parseInt(document.getElementById('betLimit').value)
            };

            const response = await this.apiCall('/api/config/economy', 'POST', config);
            if (response.success) {
                this.data.configs.economy = config;
                this.showNotification('Configuration économique sauvegardée!', 'success');
            } else {
                throw new Error(response.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('Erreur sauvegarde économie:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    async saveLevelsConfig() {
        try {
            const config = {
                textXP: {
                    min: parseInt(document.getElementById('textXPMin').value),
                    max: parseInt(document.getElementById('textXPMax').value),
                    cooldown: parseInt(document.getElementById('textXPCooldown').value) * 1000
                },
                voiceXP: {
                    perMinute: parseInt(document.getElementById('voiceXPAmount').value),
                    amount: parseInt(document.getElementById('voiceXPAmount').value),
                    interval: 60000
                },
                levelFormula: {
                    baseXP: parseInt(document.getElementById('baseXP').value),
                    multiplier: parseFloat(document.getElementById('xpMultiplier').value)
                }
            };

            const response = await this.apiCall('/api/config/levels', 'POST', config);
            if (response.success) {
                this.data.configs.levels = { ...this.data.configs.levels, ...config };
                this.showNotification('Configuration des niveaux sauvegardée!', 'success');
            } else {
                throw new Error(response.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('Erreur sauvegarde niveaux:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    async saveKarmaConfig() {
        try {
            const config = {
                dailyBonus: parseInt(document.getElementById('karmaDaily').value),
                messageReward: parseInt(document.getElementById('karmaMessage').value),
                confessionReward: parseInt(document.getElementById('karmaConfession').value),
                maxKarma: parseInt(document.getElementById('karmaMax').value)
            };

            const response = await this.apiCall('/api/config/karma', 'POST', config);
            if (response.success) {
                this.data.configs.karma = config;
                this.showNotification('Configuration karma sauvegardée!', 'success');
            } else {
                throw new Error(response.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('Erreur sauvegarde karma:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    async saveConfessionsConfig() {
        try {
            const config = {
                channelId: document.getElementById('confessionChannel').value,
                minLength: parseInt(document.getElementById('minLength').value),
                maxLength: parseInt(document.getElementById('maxLength').value),
                moderationEnabled: document.getElementById('moderationEnabled').value === 'true'
            };

            const response = await this.apiCall('/api/config/confessions', 'POST', config);
            if (response.success) {
                this.data.configs.confessions = config;
                this.showNotification('Configuration confessions sauvegardée!', 'success');
            } else {
                throw new Error(response.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('Erreur sauvegarde confessions:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    // Nouvelle fonction de test du dashboard
    async testDashboard() {
        console.log('🧪 Test du dashboard en cours...');
        
        try {
            // Test de la navigation
            const navLinks = document.querySelectorAll('.nav-link');
            console.log(`✅ Navigation: ${navLinks.length} liens trouvés`);
            
            // Test des sections
            const sections = ['overview', 'economy', 'levels', 'karma', 'confessions', 'moderation', 'backup', 'settings'];
            let workingSections = 0;
            
            for (const section of sections) {
                try {
                    await this.loadSectionContent(section);
                    workingSections++;
                    console.log(`✅ Section ${section} fonctionne`);
                } catch (error) {
                    console.error(`❌ Section ${section} en erreur:`, error);
                }
            }
            
            // Test des notifications
            this.showNotification('Test de notification', 'success');
            
            // Résultat du test
            const result = `Test terminé: ${workingSections}/${sections.length} sections fonctionnelles`;
            console.log(result);
            this.showNotification(result, workingSections === sections.length ? 'success' : 'warning');
            
            // Retourner à la vue d'ensemble
            this.switchSection('overview');
            
        } catch (error) {
            console.error('❌ Erreur lors du test:', error);
            this.showNotification('Erreur lors du test: ' + error.message, 'error');
        }
    }

    // Fonction pour sauvegarder les paramètres généraux
    async saveGeneralSettings() {
        try {
            const settings = {
                language: document.getElementById('botLanguage').value,
                debugMode: document.getElementById('debugMode').value === 'true',
                notifications: document.getElementById('notificationsEnabled').value === 'true',
                autoBackup: document.getElementById('autoBackup').value === 'true',
                theme: document.getElementById('theme').value
            };

            console.log('💾 Sauvegarde des paramètres généraux:', settings);
            
            // Simuler une sauvegarde (remplacer par un vrai appel API)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showNotification('Paramètres généraux sauvegardés!', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde paramètres:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    // Fonction pour redémarrer le bot
    async restartBot() {
        if (confirm('Êtes-vous sûr de vouloir redémarrer le bot ?')) {
            try {
                console.log('🔄 Redémarrage du bot...');
                this.showNotification('Redémarrage du bot en cours...', 'info');
                
                // Simuler un redémarrage (remplacer par un vrai appel API)
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                this.showNotification('Bot redémarré avec succès!', 'success');
            } catch (error) {
                console.error('Erreur redémarrage:', error);
                this.showNotification('Erreur lors du redémarrage', 'error');
            }
        }
    }

    // Méthodes utilitaires
    async loadInitialData() {
        try {
            console.log('📊 Chargement des données initiales...');
            
            // Charger les données du dashboard
            const overviewResponse = await fetch('/api/dashboard/overview');
            if (overviewResponse.ok) {
                const overview = await overviewResponse.json();
                this.updateDashboardData(overview);
            }
            
            // Charger les serveurs
            const serversResponse = await fetch('/api/dashboard/servers');
            if (serversResponse.ok) {
                this.data.servers = await serversResponse.json();
                this.updateServerCount();
            }
            
            // Charger les configurations par défaut
            this.data.configs = { ...this.defaultConfigs };

            this.data.lastUpdate = new Date();
            this.updateHeaderStats();
            
            console.log('✅ Données chargées');
            
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            this.data.configs = this.defaultConfigs;
        }
    }

    updateDashboardData(overview) {
        // Mettre à jour le statut du bot
        const botStatusEl = document.getElementById('bot-status');
        if (botStatusEl) {
            const isOnline = overview.bot.status === 'online';
            botStatusEl.innerHTML = `<i class="fas fa-circle"></i> ${isOnline ? 'En ligne' : 'Hors ligne'}`;
            botStatusEl.className = isOnline ? 'status-online' : 'status-offline';
        }

        // Mettre à jour l'uptime
        const uptimeEl = document.getElementById('bot-uptime');
        if (uptimeEl && overview.bot.uptime) {
            const hours = Math.floor(overview.bot.uptime / 3600);
            const minutes = Math.floor((overview.bot.uptime % 3600) / 60);
            uptimeEl.textContent = `${hours}h ${minutes}m`;
        }

        // Mettre à jour les serveurs
        const serversEl = document.getElementById('total-servers');
        if (serversEl) {
            serversEl.textContent = overview.servers.total || 0;
        }

        // Mettre à jour les utilisateurs
        const usersEl = document.getElementById('total-users');
        if (usersEl) {
            usersEl.textContent = overview.servers.members || 0;
        }

        // Mettre à jour l'économie
        if (overview.economy) {
            const totalMoneyEl = document.getElementById('total-money');
            if (totalMoneyEl) {
                totalMoneyEl.textContent = `${overview.economy.totalMoney.toLocaleString()} 💰`;
            }

            const dailyTransactionsEl = document.getElementById('daily-transactions');
            if (dailyTransactionsEl) {
                dailyTransactionsEl.textContent = overview.economy.dailyTransactions;
            }

            const richestUserEl = document.getElementById('richest-user');
            if (richestUserEl && overview.economy.richestUser) {
                richestUserEl.textContent = `${overview.economy.richestUser.amount.toLocaleString()} 💰`;
            }
        }

        // Mettre à jour les confessions
        if (overview.confessions) {
            const totalConfessionsEl = document.getElementById('total-confessions');
            if (totalConfessionsEl) {
                totalConfessionsEl.textContent = overview.confessions.total;
            }

            const dailyConfessionsEl = document.getElementById('daily-confessions');
            if (dailyConfessionsEl) {
                dailyConfessionsEl.textContent = overview.confessions.daily;
            }

            const pendingConfessionsEl = document.getElementById('pending-confessions');
            if (pendingConfessionsEl) {
                pendingConfessionsEl.textContent = overview.confessions.pending;
            }
        }

        // Mettre à jour le karma
        if (overview.karma) {
            const totalKarmaEl = document.getElementById('total-karma');
            if (totalKarmaEl) {
                totalKarmaEl.textContent = `${overview.karma.total} ❤️`;
            }

            const karmaUsersEl = document.getElementById('karma-users');
            if (karmaUsersEl) {
                karmaUsersEl.textContent = overview.karma.activeUsers;
            }

            const topKarmaUserEl = document.getElementById('top-karma-user');
            if (topKarmaUserEl && overview.karma.topUser) {
                topKarmaUserEl.textContent = `${overview.karma.topUser.karma} ❤️`;
            }
        }

        // Mettre à jour l'activité récente
        if (overview.activity) {
            this.updateRecentActivity(overview.activity);
        }

        // Mettre à jour les compteurs du header
        this.updateHeaderStatsWithData(overview);
    }

    updateServerCount() {
        const serverCountEl = document.getElementById('server-count');
        if (serverCountEl && this.data.servers) {
            serverCountEl.textContent = `${this.data.servers.length} serveurs`;
        }

        const userCountEl = document.getElementById('user-count');
        if (userCountEl && this.data.servers) {
            const totalUsers = this.data.servers.reduce((sum, server) => sum + server.memberCount, 0);
            userCountEl.textContent = `${totalUsers.toLocaleString()} utilisateurs`;
        }
    }

    updateRecentActivity(activities) {
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer || !activities.length) return;

        activityContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <i class="${activity.icon}"></i>
                <span class="activity-message">${activity.message}</span>
                <span class="activity-time">${this.formatTimeAgo(new Date(activity.timestamp))}</span>
            </div>
        `).join('');
    }

    updateHeaderStatsWithData(overview) {
        // Mettre à jour le statut dans le header si nécessaire
        const headerStatus = document.querySelector('.header .status-indicator');
        if (headerStatus && overview.bot) {
            headerStatus.style.background = overview.bot.status === 'online' ? '#00ff88' : '#ff6b6b';
        }
    }

    formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Il y a quelques secondes';
        if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
        return `Il y a ${Math.floor(diffInSeconds / 86400)} jour(s)`;
    }

    setupMobileMenu() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        if (!toggleBtn || !sidebar || !overlay) return;

        const openMenu = () => {
            sidebar.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        };

        const closeMenu = () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        };

        toggleBtn.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        overlay.addEventListener('click', closeMenu);

        // Fermer le menu lors du redimensionnement sur desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        });

        // Fermer le menu lors de la navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeMenu();
                }
            });
        });
    }

    async loadOverviewStats() {
        try {
            const response = await this.apiCall('/api/stats');
            if (response.success) {
                const stats = response.data;
                
                // Mettre à jour les éléments de l'overview
                this.updateElement('activeMembers', stats.activeMembers || 0);
                this.updateElement('todayMessages', stats.todayMessages || 0);
                this.updateElement('commandsUsed', stats.commandsUsed || 0);
                this.updateElement('totalMoney', this.formatNumber(stats.totalMoney || 0));
                this.updateElement('todayTransactions', stats.todayTransactions || 0);
                this.updateElement('richestUser', stats.richestUser || 'N/A');
                this.updateElement('totalConfessions', stats.totalConfessions || 0);
                this.updateElement('weekConfessions', stats.weekConfessions || 0);
                this.updateElement('avgConfessions', stats.avgConfessions || 0);
                this.updateElement('highestLevel', stats.highestLevel || 0);
                this.updateElement('totalXP', this.formatNumber(stats.totalXP || 0));
                this.updateElement('rewardsGiven', stats.rewardsGiven || 0);
            }
        } catch (error) {
            console.error('Erreur chargement stats overview:', error);
        }
    }

    updateHeaderStats() {
        this.updateElement('server-count', `${this.data.stats.serverCount || 0} serveurs`);
        this.updateElement('user-count', `${this.formatNumber(this.data.stats.userCount || 0)} utilisateurs`);
    }

    startRealTimeUpdates() {
        // Mise à jour toutes les 30 secondes
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.loadInitialData();
            if (this.currentSection === 'overview') {
                this.loadOverviewStats();
            }
        }, 30000);
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(endpoint, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Erreur API ${endpoint}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Actions rapides
    async clearTestObjects() {
        try {
            const response = await this.apiCall('/api/admin/clear-test-objects', 'POST');
            if (response.success) {
                this.showNotification('Objets de test supprimés!', 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification('Erreur lors du nettoyage', 'error');
        }
    }

    async resetCommands() {
        try {
            const response = await this.apiCall('/api/admin/reset-commands', 'POST');
            if (response.success) {
                this.showNotification('Commandes réinitialisées!', 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification('Erreur lors de la réinitialisation', 'error');
        }
    }

    async forceBackup() {
        try {
            const response = await this.apiCall('/api/admin/force-backup', 'POST');
            if (response.success) {
                this.showNotification('Sauvegarde forcée effectuée!', 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    // Interface utilitaires
    showLoading(container) {
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Chargement...</span>
                </div>
            `;
        }
    }

    showError(container, message) {
        if (container) {
            container.innerHTML = `
                <div class="config-section">
                    <div style="text-align: center; padding: 2rem; color: #ef4444;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Erreur</h3>
                        <p>${message}</p>
                        <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 1rem;">
                            <i class="fas fa-refresh"></i>
                            Recharger
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(notification);

        // Afficher l'animation
        setTimeout(() => notification.classList.add('show'), 100);

        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    handleResize() {
        // Gérer le responsive si nécessaire
        if (window.innerWidth <= 968) {
            // Mode mobile
        } else {
            // Mode desktop
        }
    }

    // Méthodes de réinitialisation
    resetEconomyConfig() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration économique ?')) {
            const config = this.defaultConfigs.economy;
            document.getElementById('dailyReward').value = config.dailyReward;
            document.getElementById('workRewardMin').value = config.workReward.min;
            document.getElementById('workRewardMax').value = config.workReward.max;
            document.getElementById('crimeRewardMin').value = config.crimeReward.min;
            document.getElementById('crimeRewardMax').value = config.crimeReward.max;
            document.getElementById('betLimit').value = config.betLimit;
            this.showNotification('Configuration réinitialisée', 'info');
        }
    }

    resetLevelsConfig() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration des niveaux ?')) {
            const config = this.defaultConfigs.levels;
            document.getElementById('textXPMin').value = config.textXP.min;
            document.getElementById('textXPMax').value = config.textXP.max;
            document.getElementById('textXPCooldown').value = config.textXP.cooldown / 1000;
            document.getElementById('voiceXPAmount').value = config.voiceXP.perMinute || config.voiceXP.amount;
            document.getElementById('baseXP').value = config.levelFormula.baseXP;
            document.getElementById('xpMultiplier').value = config.levelFormula.multiplier;
            this.showNotification('Configuration réinitialisée', 'info');
        }
    }

    resetKarmaConfig() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration karma ?')) {
            const config = this.defaultConfigs.karma;
            document.getElementById('karmaDaily').value = config.dailyBonus;
            document.getElementById('karmaMessage').value = config.messageReward;
            document.getElementById('karmaConfession').value = config.confessionReward;
            document.getElementById('karmaMax').value = config.maxKarma;
            this.showNotification('Configuration réinitialisée', 'info');
        }
    }

    resetConfessionsConfig() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration des confessions ?')) {
            const config = this.defaultConfigs.confessions;
            document.getElementById('confessionChannel').value = config.channelId || '';
            document.getElementById('minLength').value = config.minLength;
            document.getElementById('maxLength').value = config.maxLength;
            document.getElementById('moderationEnabled').value = config.moderationEnabled;
            this.showNotification('Configuration réinitialisée', 'info');
        }
    }

    // Nettoyage
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialisation globale
let dashboard;

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dashboard = new BAGDashboard();
    });
} else {
    dashboard = new BAGDashboard();
}

// Nettoyage en cas de fermeture
window.addEventListener('beforeunload', () => {
    if (dashboard) {
        dashboard.destroy();
    }
});

// Export pour usage global
window.dashboard = dashboard;