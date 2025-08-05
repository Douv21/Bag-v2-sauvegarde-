/**
 * Serveur de test pour le dashboard BAG
 * Version simplifiée sans Discord pour tester l'interface
 */

const express = require('express');
const path = require('path');

class TestDashboardServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 5000;
        this.setupRoutes();
    }

    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Page d'accueil
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                discord: 'test-mode',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                commands: 39,
                guilds: 3
            });
        });

        // Dashboard API
        this.app.get('/api/dashboard/overview', (req, res) => {
            const overview = {
                bot: {
                    status: 'online',
                    uptime: Math.floor(process.uptime()),
                    version: '3.0 Premium',
                    ping: 45
                },
                servers: {
                    total: 3,
                    members: 1247
                },
                economy: {
                    totalMoney: 125430,
                    totalUsers: 89,
                    richestUser: {
                        id: '123456789',
                        amount: 15420
                    },
                    dailyTransactions: 24
                },
                confessions: {
                    total: 156,
                    daily: 8,
                    pending: 2
                },
                karma: {
                    total: 2340,
                    activeUsers: 67,
                    topUser: {
                        id: '987654321',
                        karma: 245
                    }
                },
                activity: [
                    {
                        type: 'economy',
                        message: 'Utilisateur a gagné 100💰 en travaillant',
                        timestamp: new Date(),
                        icon: 'fas fa-coins'
                    },
                    {
                        type: 'level',
                        message: 'Utilisateur a atteint le niveau 15',
                        timestamp: new Date(Date.now() - 1800000),
                        icon: 'fas fa-star'
                    },
                    {
                        type: 'karma',
                        message: '+10 karma distribué pour une confession',
                        timestamp: new Date(Date.now() - 3600000),
                        icon: 'fas fa-heart'
                    },
                    {
                        type: 'confession',
                        message: 'Nouvelle confession approuvée',
                        timestamp: new Date(Date.now() - 5400000),
                        icon: 'fas fa-comment-dots'
                    },
                    {
                        type: 'economy',
                        message: 'Transaction: 500💰 envoyés',
                        timestamp: new Date(Date.now() - 7200000),
                        icon: 'fas fa-exchange-alt'
                    }
                ]
            };
            res.json(overview);
        });

        this.app.get('/api/dashboard/servers', (req, res) => {
            const servers = [
                {
                    id: '123456789012345678',
                    name: 'Serveur de Test #1',
                    memberCount: 456,
                    icon: null,
                    joinedAt: new Date('2023-01-15')
                },
                {
                    id: '234567890123456789',
                    name: 'Community Discord',
                    memberCount: 789,
                    icon: null,
                    joinedAt: new Date('2023-03-20')
                },
                {
                    id: '345678901234567890',
                    name: 'Gaming Server',
                    memberCount: 234,
                    icon: null,
                    joinedAt: new Date('2023-06-10')
                }
            ];
            res.json(servers);
        });

        // Autres endpoints API
        this.app.get('/api/stats', (req, res) => {
            res.json({
                activeMembers: 1247,
                todayMessages: 3456,
                commandsUsed: 789,
                totalMoney: 125430,
                totalKarma: 2340,
                confessions: 156
            });
        });

        // Route pour le dashboard
        this.app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
        });

        // Route catch-all
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Serveur de test démarré sur le port ${this.port}`);
            console.log(`📊 Dashboard disponible sur: http://localhost:${this.port}/dashboard`);
            console.log(`🏠 Page d'accueil: http://localhost:${this.port}`);
            console.log(`❤️ API Health: http://localhost:${this.port}/health`);
        });
    }
}

// Démarrer le serveur
const server = new TestDashboardServer();
server.start();