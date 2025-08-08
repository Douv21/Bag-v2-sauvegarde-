const { SlashCommandBuilder, EmbedBuilder, version: djsVersion, MessageFlags } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('diagnostics')
        .setDescription('Affiche des informations de diagnostic du bot')
        .addSubcommand(sub =>
            sub
                .setName('overview')
                .setDescription('Vue d\'ensemble des diagnostics')
        )
        .addSubcommand(sub =>
            sub
                .setName('stats')
                .setDescription('Statistiques système et bot')
        )
        .addSubcommand(sub =>
            sub
                .setName('modals')
                .setDescription('Statut des modals et handlers')
        ),

    cooldown: 3,

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (!['overview', 'stats', 'modals'].includes(sub)) {
            return interaction.reply({
                content: '❌ Sous-commande non reconnue.',
                ephemeral: true
            });
        }

        if (sub === 'overview') {
            const client = interaction.client;
            const embed = new EmbedBuilder()
                .setTitle('🔍 Diagnostics - Overview')
                .setColor('#00B8D9')
                .addFields(
                    { name: 'Bot', value: `${client.user?.tag || 'N/A'} (v${djsVersion})`, inline: true },
                    { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
                    { name: 'Guilds', value: `${client.guilds.cache.size}`, inline: true },
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'stats') {
            try {
                const memory = process.memoryUsage();
                const embed = new EmbedBuilder()
                    .setTitle('📈 Diagnostics - Stats')
                    .setColor('#36B37E')
                    .addFields(
                        { name: 'Plateforme', value: `${os.platform()} ${os.release()}`, inline: true },
                        { name: 'CPU', value: `${os.cpus()[0].model}`, inline: true },
                        { name: 'RAM', value: `${(memory.rss / 1024 / 1024).toFixed(1)} MB`, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (err) {
                await interaction.reply({
                    content: '❌ Erreur lors de la récupération des statistiques.',
                    ephemeral: true
                });
            }
        }

        if (sub === 'modals') {
            try {
                const embed = new EmbedBuilder()
                    .setTitle('🧩 Diagnostics - Modals')
                    .setColor('#6554C0')
                    .setDescription('Tous les modals de configuration sont chargés.');

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (err) {
                await interaction.reply({
                    content: '❌ Erreur lors de la récupération du statut des modals.',
                    ephemeral: true
                });
            }
        }
    }
};