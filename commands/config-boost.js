const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-boost')
        .setDescription('Activer ou désactiver le système d\'avantages pour les boosters (Admin)')
        .addBooleanOption(opt =>
            opt
                .setName('enabled')
                .setDescription('Activer (true) ou désactiver (false) les avantages Booster')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
            }

            const enable = interaction.options.getBoolean('enabled', true);

            await interaction.deferReply({ flags: 64 });

            const levelManager = require('../utils/levelManager');
            const dataHooks = require('../utils/dataHooks');

            const cfg = levelManager.loadConfig();
            cfg.boosterPerks = cfg.boosterPerks || {
                enabled: true,
                xpMultiplier: 1.5,
                voiceXpMultiplier: 1.5,
                textCooldownFactor: 0.5
            };
            cfg.boosterPerks.enabled = !!enable;

            levelManager.saveConfig(cfg);

            try { dataHooks.triggerBackup('save_level_config_booster'); } catch {}

            const embed = new EmbedBuilder()
                .setTitle('💎 Configuration Boosters')
                .setColor(enable ? 0x2ecc71 : 0xe74c3c)
                .setDescription(enable ? 'Les avantages Booster sont maintenant ACTIVÉS.' : 'Les avantages Booster sont maintenant DÉSACTIVÉS.')
                .addFields(
                    { name: 'État', value: enable ? '✅ Activé' : '❌ Désactivé', inline: true },
                    { name: 'XP Messages (x)', value: String(cfg.boosterPerks.xpMultiplier ?? 1.5), inline: true },
                    { name: 'XP Vocal (x)', value: String(cfg.boosterPerks.voiceXpMultiplier ?? cfg.boosterPerks.xpMultiplier ?? 1.5), inline: true },
                    { name: 'Cooldown messages (%)', value: `${Math.round(100 * (cfg.boosterPerks.textCooldownFactor ?? 0.5))}%`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erreur /config-boost:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ Une erreur est survenue.' });
            } else {
                await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
            }
        }
    }
};

