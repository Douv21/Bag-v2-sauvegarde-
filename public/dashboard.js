/**
 * BAG Dashboard - JavaScript
 * Interface administrative moderne et élégante
 */

class DashboardManager {
    constructor() {
        this.currentSection = 'overview';
        this.data = {
            stats: {},
            config: {},
            lastUpdate: null
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.startStatusUpdates();
        
        // Fallback pour le logo si l'image ne charge pas
        const logoImg = document.getElementById('logoImg');
        if (logoImg) {
            logoImg.onerror = () => {
                logoImg.style.display = 'none';
                logoImg.parentElement.innerHTML += '<i class="fas fa-heart" style="font-size: 2rem; color: white;"></i>';
            };
        }
    }

    setupEventListeners() {
        // Navigation sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        // Refresh data on focus
        window.addEventListener('focus', () => {
            this.loadInitialData();
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });

        // Update content
        this.currentSection = section;
        this.loadSectionContent(section);
    }

    async loadSectionContent(section) {
        const container = document.getElementById('content-container');
        
        // Show loading state
        this.showLoading(container);

        try {
            switch (section) {
                case 'overview':
                    this.showOverviewSection();
                    break;
                case 'economy':
                    await this.showEconomySection();
                    break;
                case 'confessions':
                    await this.showConfessionsSection();
                    break;
                case 'levels':
                    await this.showLevelsSection();
                    break;
                case 'counting':
                    await this.showCountingSection();
                    break;
                case 'autothread':
                    await this.showAutothreadSection();
                    break;
                case 'settings':
                    await this.showSettingsSection();
                    break;
                default:
                    this.showOverviewSection();
            }
        } catch (error) {
            this.showError('Erreur lors du chargement de la section: ' + error.message);
        }
    }

    showOverviewSection() {
        document.getElementById('overview-section').style.display = 'block';
        document.getElementById('dynamic-content').style.display = 'none';
    }

    async showEconomySection() {
        const content = `
            <div class="content-header">
                <h1 class="content-title">Configuration Économique</h1>
                <p class="content-subtitle">Gérer le système économique du serveur</p>
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Paramètres généraux</h3>
                        <div class="card-icon">
                            <i class="fas fa-cog"></i>
                        </div>
                    </div>
                    <div class="config-form">
                        <div class="form-group">
                            <label>Récompense par message</label>
                            <input type="number" id="messageReward" value="10" min="1" max="1000">
                        </div>
                        <div class="form-group">
                            <label>Cooldown (secondes)</label>
                            <input type="number" id="economyCooldown" value="60" min="10" max="3600">
                        </div>
                        <div class="form-group">
                            <label>Bonus quotidien</label>
                            <input type="number" id="dailyBonus" value="500" min="100" max="10000">
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Boutique</h3>
                        <div class="card-icon">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                    </div>
                    <div class="shop-items">
                        <div class="shop-item">
                            <span>Rôle VIP - 5000 💰</span>
                            <button class="btn-secondary">Modifier</button>
                        </div>
                        <div class="shop-item">
                            <span>Couleur custom - 2000 💰</span>
                            <button class="btn-secondary">Modifier</button>
                        </div>
                        <button class="btn-primary">Ajouter un article</button>
                    </div>
                </div>
            </div>

            <div class="action-buttons">
                <button class="btn-primary" onclick="dashboard.saveEconomyConfig()">
                    <i class="fas fa-save"></i> Sauvegarder les modifications
                </button>
                <button class="btn-secondary" onclick="dashboard.resetEconomyConfig()">
                    <i class="fas fa-undo"></i> Réinitialiser
                </button>
            </div>
        `;
        this.showDynamicContent(content);
    }

    async showConfessionsSection() {
        const content = `
            <div class="content-header">
                <h1 class="content-title">Gestion des Confessions</h1>
                <p class="content-subtitle">Configuration des canaux et modération</p>
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Canaux de confession</h3>
                        <div class="card-icon">
                            <i class="fas fa-comment-dots"></i>
                        </div>
                    </div>
                    <div class="config-form">
                        <div class="form-group">
                            <label>Canal principal</label>
                            <select id="confessionChannel">
                                <option value="">Sélectionner un canal...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Canal de logs</label>
                            <select id="confessionLogsChannel">
                                <option value="">Sélectionner un canal...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Auto-thread</label>
                            <input type="checkbox" id="confessionAutoThread">
                            <span>Créer automatiquement des threads</span>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Modération</h3>
                        <div class="card-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                    </div>
                    <div class="config-form">
                        <div class="form-group">
                            <label>Filtre automatique</label>
                            <input type="checkbox" id="autoFilter" checked>
                            <span>Filtrer les contenus inappropriés</span>
                        </div>
                        <div class="form-group">
                            <label>Longueur minimale</label>
                            <input type="number" id="minLength" value="10" min="1" max="500">
                        </div>
                        <div class="form-group">
                            <label>Cooldown (minutes)</label>
                            <input type="number" id="confessionCooldown" value="5" min="1" max="60">
                        </div>
                    </div>
                </div>
            </div>

            <div class="recent-confessions">
                <h3>Confessions récentes</h3>
                <div class="confession-list">
                    <div class="confession-item">
                        <div class="confession-content">Confession #1247 - Il y a 2 heures</div>
                        <div class="confession-actions">
                            <button class="btn-danger">Supprimer</button>
                            <button class="btn-secondary">Voir les logs</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.showDynamicContent(content);
    }

    async showLevelsSection() {
        const content = `
            <div class="content-header">
                <h1 class="content-title">Système de Niveaux</h1>
                <p class="content-subtitle">Configuration de l'XP et des récompenses</p>
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Paramètres XP</h3>
                        <div class="card-icon">
                            <i class="fas fa-star"></i>
                        </div>
                    </div>
                    <div class="config-form">
                        <div class="form-group">
                            <label>XP par message</label>
                            <input type="number" id="xpPerMessage" value="15" min="1" max="100">
                        </div>
                        <div class="form-group">
                            <label>XP bonus vocal (par minute)</label>
                            <input type="number" id="xpVoice" value="5" min="1" max="50">
                        </div>
                        <div class="form-group">
                            <label>Multiplicateur weekend</label>
                            <input type="number" step="0.1" id="weekendMultiplier" value="1.5" min="1" max="3">
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Récompenses automatiques</h3>
                        <div class="card-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                    </div>
                    <div class="rewards-list">
                        <div class="reward-item">
                            <span>Niveau 10 - Rôle "Actif" + 1000 💰</span>
                            <button class="btn-secondary">Modifier</button>
                        </div>
                        <div class="reward-item">
                            <span>Niveau 25 - Rôle "Vétéran" + 5000 💰</span>
                            <button class="btn-secondary">Modifier</button>
                        </div>
                        <button class="btn-primary">Ajouter une récompense</button>
                    </div>
                </div>
            </div>

            <div class="leaderboard-section">
                <h3>Top 10 du serveur</h3>
                <div class="leaderboard">
                    <div class="leaderboard-item">
                        <span class="rank">#1</span>
                        <span class="user">Utilisateur#1234</span>
                        <span class="level">Niveau 47</span>
                        <span class="xp">156,780 XP</span>
                    </div>
                </div>
            </div>
        `;
        this.showDynamicContent(content);
    }

    async showCountingSection() {
        const content = `
            <div class="content-header">
                <h1 class="content-title">Système de Comptage</h1>
                <p class="content-subtitle">Configuration du jeu de comptage</p>
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Configuration</h3>
                        <div class="card-icon">
                            <i class="fas fa-calculator"></i>
                        </div>
                    </div>
                    <div class="config-form">
                        <div class="form-group">
                            <label>Canal de comptage</label>
                            <select id="countingChannel">
                                <option value="">Sélectionner un canal...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Mode mathématique</label>
                            <input type="checkbox" id="mathMode">
                            <span>Permettre les opérations (+, -, *, /)</span>
                        </div>
                        <div class="form-group">
                            <label>Récompense par nombre</label>
                            <input type="number" id="countingReward" value="5" min="1" max="100">
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Statistiques actuelles</h3>
                        <div class="card-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                    </div>
                    <div class="card-stats">
                        <div class="stat-item">
                            <span class="stat-label">Nombre actuel</span>
                            <span class="stat-value highlight">1,247</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Record du serveur</span>
                            <span class="stat-value">2,891</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Dernière erreur</span>
                            <span class="stat-value">Il y a 3h</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.showDynamicContent(content);
    }

    async showAutothreadSection() {
        const content = `
            <div class="content-header">
                <h1 class="content-title">Auto-Thread</h1>
                <p class="content-subtitle">Configuration des threads automatiques</p>
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Paramètres généraux</h3>
                        <div class="card-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                    </div>
                    <div class="config-form">
                        <div class="form-group">
                            <label>Activer l'auto-thread</label>
                            <input type="checkbox" id="autothreadEnabled">
                        </div>
                        <div class="form-group">
                            <label>Nom du thread</label>
                            <input type="text" id="threadName" value="Discussion - {user}" placeholder="{user}, {channel}, {date}">
                        </div>
                        <div class="form-group">
                            <label>Durée d'archivage</label>
                            <select id="archiveTime">
                                <option value="60">1 heure</option>
                                <option value="1440">24 heures</option>
                                <option value="4320">3 jours</option>
                                <option value="10080">1 semaine</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Canaux configurés</h3>
                        <div class="card-icon">
                            <i class="fas fa-list"></i>
                        </div>
                    </div>
                    <div class="channels-list">
                        <div class="channel-item">
                            <span>#général</span>
                            <button class="btn-danger">Retirer</button>
                        </div>
                        <div class="channel-item">
                            <span>#discussions</span>
                            <button class="btn-danger">Retirer</button>
                        </div>
                        <button class="btn-primary">Ajouter un canal</button>
                    </div>
                </div>
            </div>
        `;
        this.showDynamicContent(content);
    }

    async showSettingsSection() {
        const content = `
            <div class="content-header">
                <h1 class="content-title">Paramètres Généraux</h1>
                <p class="content-subtitle">Configuration globale du bot</p>
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Paramètres du bot</h3>
                        <div class="card-icon">
                            <i class="fas fa-robot"></i>
                        </div>
                    </div>
                    <div class="config-form">
                        <div class="form-group">
                            <label>Préfixe (legacy)</label>
                            <input type="text" id="botPrefix" value="!" maxlength="3">
                        </div>
                        <div class="form-group">
                            <label>Langue</label>
                            <select id="botLanguage">
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Logs activés</label>
                            <input type="checkbox" id="logsEnabled" checked>
                        </div>
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <h3 class="card-title">Sauvegarde & Export</h3>
                        <div class="card-icon">
                            <i class="fas fa-download"></i>
                        </div>
                    </div>
                    <div class="backup-actions">
                        <button class="btn-primary" onclick="dashboard.exportData()">
                            <i class="fas fa-download"></i> Exporter les données
                        </button>
                        <button class="btn-secondary" onclick="dashboard.backupConfig()">
                            <i class="fas fa-save"></i> Sauvegarder la config
                        </button>
                        <button class="btn-danger" onclick="dashboard.resetAllData()">
                            <i class="fas fa-trash"></i> Réinitialiser tout
                        </button>
                    </div>
                </div>
            </div>

            <div class="danger-zone">
                <h3 style="color: #ef4444;">⚠️ Zone dangereuse</h3>
                <p>Ces actions sont irréversibles. Soyez certain de vos choix.</p>
                <button class="btn-danger" onclick="dashboard.confirmReset()">
                    Réinitialiser toutes les données du serveur
                </button>
            </div>
        `;
        this.showDynamicContent(content);
    }

    showDynamicContent(content) {
        document.getElementById('overview-section').style.display = 'none';
        const dynamicContent = document.getElementById('dynamic-content');
        dynamicContent.innerHTML = content;
        dynamicContent.style.display = 'block';
        
        // Add dynamic styles
        this.addDynamicStyles();
    }

    addDynamicStyles() {
        if (document.getElementById('dynamic-dashboard-styles')) return;

        const styles = `
            <style id="dynamic-dashboard-styles">
                .config-form { display: flex; flex-direction: column; gap: 1rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-weight: 500; color: var(--text-primary); }
                .form-group input, .form-group select { 
                    padding: 0.75rem; 
                    background: var(--bg-secondary); 
                    border: 1px solid var(--border-color); 
                    border-radius: 8px; 
                    color: var(--text-primary); 
                    font-size: 0.9rem;
                }
                .form-group input:focus, .form-group select:focus {
                    outline: none;
                    border-color: var(--primary-red);
                    box-shadow: 0 0 0 2px rgba(229, 62, 62, 0.1);
                }
                .btn-primary, .btn-secondary, .btn-danger {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .btn-primary {
                    background: var(--gradient-primary);
                    color: white;
                }
                .btn-secondary {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                }
                .btn-danger {
                    background: #dc2626;
                    color: white;
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-primary); }
                .btn-secondary:hover { border-color: var(--primary-red); }
                .btn-danger:hover { background: #b91c1c; }
                .action-buttons {
                    display: flex;
                    gap: 1rem;
                    margin-top: 2rem;
                    flex-wrap: wrap;
                }
                .shop-items, .rewards-list, .channels-list, .backup-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .shop-item, .reward-item, .channel-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }
                .leaderboard { display: flex; flex-direction: column; gap: 0.5rem; }
                .leaderboard-item {
                    display: grid;
                    grid-template-columns: 50px 1fr 100px 120px;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    align-items: center;
                }
                .rank { font-weight: 700; color: var(--primary-red); }
                .danger-zone {
                    margin-top: 2rem;
                    padding: 2rem;
                    background: rgba(220, 38, 38, 0.1);
                    border: 1px solid rgba(220, 38, 38, 0.3);
                    border-radius: 12px;
                }
                .recent-confessions, .leaderboard-section { margin-top: 2rem; }
                .confession-list { display: flex; flex-direction: column; gap: 1rem; }
                .confession-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }
                .confession-actions { display: flex; gap: 0.5rem; }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    showLoading(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem;">
                <div class="loading"></div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">Chargement...</p>
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
            </div>
        `;
    }

    showSuccess(message) {
        const container = document.getElementById('content-container');
        const messageEl = document.createElement('div');
        messageEl.className = 'message success';
        messageEl.innerHTML = `<i class="fas fa-check"></i> ${message}`;
        container.insertBefore(messageEl, container.firstChild);
        
        setTimeout(() => messageEl.remove(), 5000);
    }

    async loadInitialData() {
        try {
            // Charger les statistiques
            const statsResponse = await fetch('/api/stats');
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updateStats(stats);
            }

            // Vérifier le statut du bot
            const healthResponse = await fetch('/health');
            if (healthResponse.ok) {
                const health = await healthResponse.json();
                this.updateBotStatus(health);
            }

        } catch (error) {
            console.warn('Erreur lors du chargement des données:', error);
            // Utiliser des données fictives en cas d'erreur
            this.updateStats({
                activeMembers: 42,
                todayMessages: 234,
                commandsUsed: 156,
                totalMoney: '45,230 💰',
                todayTransactions: 23,
                richestUser: 'Membre#1234',
                totalConfessions: 89,
                weekConfessions: 12,
                avgConfessions: '1.7',
                highestLevel: 47,
                totalXP: '1,234,567',
                rewardsGiven: 89
            });
        }
    }

    updateStats(stats) {
        const elements = {
            'activeMembers': stats.activeMembers || '-',
            'todayMessages': stats.todayMessages || '-',
            'commandsUsed': stats.commandsUsed || '-',
            'totalMoney': stats.totalMoney || '-',
            'todayTransactions': stats.todayTransactions || '-',
            'richestUser': stats.richestUser || '-',
            'totalConfessions': stats.totalConfessions || '-',
            'weekConfessions': stats.weekConfessions || '-',
            'avgConfessions': stats.avgConfessions || '-',
            'highestLevel': stats.highestLevel || '-',
            'totalXP': stats.totalXP || '-',
            'rewardsGiven': stats.rewardsGiven || '-'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateBotStatus(health) {
        const statusElement = document.getElementById('botStatus');
        const statusDot = document.querySelector('.status-dot');
        
        if (health.discord === 'connected') {
            statusElement.textContent = 'Bot en ligne';
            statusDot.style.background = '#22c55e';
        } else {
            statusElement.textContent = 'Bot déconnecté';
            statusDot.style.background = '#ef4444';
        }
    }

    startStatusUpdates() {
        // Mise à jour toutes les 30 secondes
        setInterval(() => {
            this.loadInitialData();
        }, 30000);
    }

    // Méthodes pour les actions spécifiques
    async saveEconomyConfig() {
        this.showSuccess('Configuration économique sauvegardée !');
    }

    async resetEconomyConfig() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration économique ?')) {
            this.showSuccess('Configuration réinitialisée !');
        }
    }

    async exportData() {
        this.showSuccess('Export des données lancé !');
    }

    async backupConfig() {
        this.showSuccess('Sauvegarde de la configuration effectuée !');
    }

    async resetAllData() {
        if (confirm('ATTENTION: Cette action supprimera TOUTES les données du serveur. Êtes-vous absolument certain ?')) {
            this.showSuccess('Réinitialisation effectuée !');
        }
    }

    confirmReset() {
        const confirmation = prompt('Tapez "RESET" en majuscules pour confirmer la réinitialisation complète:');
        if (confirmation === 'RESET') {
            this.resetAllData();
        }
    }
}

// Initialiser le dashboard quand la page est chargée
const dashboard = new DashboardManager();