const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('arc-en-ciel')
        .setDescription('Créer ou supprimer un rôle arc-en-ciel (Admin uniquement)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('creer')
                .setDescription('Créer un rôle arc-en-ciel')
                .addStringOption(option =>
                    option.setName('nom')
                        .setDescription('Nom du rôle arc-en-ciel')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('supprimer')
                .setDescription('Supprimer un rôle arc-en-ciel')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Rôle arc-en-ciel à supprimer')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        try {
            // Vérification permissions admin
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                    flags: 64
                });
            }

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'creer') {
                const roleName = interaction.options.getString('nom');
                
                await interaction.deferReply({ flags: 64 });

                try {
                    // Créer le rôle avec une couleur de base
                    const role = await interaction.guild.roles.create({
                        name: roleName,
                        color: '#FF0000', // Rouge initial
                        permissions: [],
                        reason: `Rôle arc-en-ciel créé par ${interaction.user.tag}`
                    });

                    console.log(`🌈 Rôle arc-en-ciel créé: ${roleName} (${role.id})`);

                    // Démarrer l'animation arc-en-ciel
                    this.startRainbowAnimation(role);

                    await interaction.editReply({
                        content: `✅ Rôle arc-en-ciel **${roleName}** créé avec succès !\n🌈 Animation démarrée...`
                    });

                } catch (error) {
                    console.error('❌ Erreur création rôle:', error);
                    await interaction.editReply({
                        content: `❌ Erreur lors de la création du rôle: ${error.message}`
                    });
                }

            } else if (subcommand === 'supprimer') {
                const role = interaction.options.getRole('role');
                
                await interaction.deferReply({ flags: 64 });

                try {
                    // Arrêter l'animation si elle existe
                    this.stopRainbowAnimation(role.id);

                    // Supprimer le rôle
                    await role.delete(`Suppression demandée par ${interaction.user.tag}`);

                    console.log(`🗑️ Rôle arc-en-ciel supprimé: ${role.name} (${role.id})`);

                    await interaction.editReply({
                        content: `✅ Rôle arc-en-ciel **${role.name}** supprimé avec succès !`
                    });

                } catch (error) {
                    console.error('❌ Erreur suppression rôle:', error);
                    await interaction.editReply({
                        content: `❌ Erreur lors de la suppression du rôle: ${error.message}`
                    });
                }
            }

        } catch (error) {
            console.error('❌ Erreur arc-en-ciel:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de l\'exécution de la commande.'
                });
            } else {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
                    flags: 64
                });
            }
        }
    },

    // Animations arc-en-ciel actives
    rainbowAnimations: new Map(),

    startRainbowAnimation(role) {
        // Arrêter animation existante si elle existe
        this.stopRainbowAnimation(role.id);

        // Couleurs arc-en-ciel
        const rainbowColors = [
            '#FF0000', // Rouge
            '#FF7F00', // Orange
            '#FFFF00', // Jaune
            '#00FF00', // Vert
            '#0000FF', // Bleu
            '#4B0082', // Indigo
            '#9400D3'  // Violet
        ];

        let colorIndex = 0;

        const animation = setInterval(async () => {
            try {
                if (!role.guild) {
                    // Le rôle a été supprimé
                    this.stopRainbowAnimation(role.id);
                    return;
                }

                await role.setColor(rainbowColors[colorIndex], 'Animation arc-en-ciel');
                colorIndex = (colorIndex + 1) % rainbowColors.length;
                
            } catch (error) {
                console.error(`❌ Erreur animation arc-en-ciel pour ${role.name}:`, error);
                // Arrêter l'animation en cas d'erreur
                this.stopRainbowAnimation(role.id);
            }
        }, 3000); // Changement toutes les 3 secondes

        // Sauvegarder la référence de l'animation
        this.rainbowAnimations.set(role.id, animation);

        console.log(`🌈 Animation arc-en-ciel démarrée pour ${role.name} (${role.id})`);
    },

    stopRainbowAnimation(roleId) {
        const animation = this.rainbowAnimations.get(roleId);
        if (animation) {
            clearInterval(animation);
            this.rainbowAnimations.delete(roleId);
            console.log(`🛑 Animation arc-en-ciel arrêtée pour rôle ${roleId}`);
        }
    },

    // Arrêter toutes les animations au démarrage (nettoyage)
    stopAllAnimations() {
        for (const [roleId, animation] of this.rainbowAnimations) {
            clearInterval(animation);
        }
        this.rainbowAnimations.clear();
        console.log('🧹 Toutes les animations arc-en-ciel arrêtées');
    }
};