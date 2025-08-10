const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function resolveNumber(val, fallback) {
  return typeof val === 'number' && !Number.isNaN(val) ? val : fallback;
}

function resolveActionParams(cfg, defaults) {
  const minReward = resolveNumber(cfg?.minReward ?? cfg?.montant?.minAmount, defaults.min);
  const maxReward = resolveNumber(cfg?.maxReward ?? cfg?.montant?.maxAmount, defaults.max);
  const cooldown = resolveNumber(
    typeof cfg?.cooldown === 'number' ? cfg.cooldown : cfg?.cooldown?.cooldown,
    defaults.cooldown
  );
  const goodKarma = resolveNumber(cfg?.goodKarma ?? cfg?.karma?.goodKarma, defaults.goodKarma);
  const badKarma = resolveNumber(cfg?.badKarma ?? cfg?.karma?.badKarma, defaults.badKarma);
  const enabled = cfg?.enabled !== false;
  return { minReward, maxReward, cooldown, goodKarma, badKarma, enabled };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aguicher')
    .setDescription('Aguicher un membre pour gagner du plaisir (NSFW)')
    .addUserOption(opt => opt.setName('membre').setDescription('Membre ciblé').setRequired(true)),

  async execute(interaction, dataManager) {
    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const targetUser = interaction.options.getUser('membre');

      const economyConfig = await dataManager.loadData('economy.json', {});
      const rawCfg = economyConfig.actions?.aguicher || {};
      const params = resolveActionParams(rawCfg, { min: 15, max: 60, cooldown: 1_200_000, goodKarma: 1, badKarma: 0 });

      if (!params.enabled) {
        await interaction.reply({ content: '❌ La commande /aguicher est actuellement désactivée.', flags: 64 });
        return;
      }

      const userData = await dataManager.getUser(userId, guildId);
      const now = Date.now();

      if (userData.lastTease && (now - userData.lastTease) < params.cooldown) {
        const remaining = Math.ceil((params.cooldown - (now - userData.lastTease)) / 60000);
        return await interaction.reply({ content: `⏰ Attendez **${remaining} min** avant d'aguicher à nouveau.`, flags: 64 });
      }

      const gain = Math.floor(Math.random() * (params.maxReward - params.minReward + 1)) + params.minReward;

      userData.balance = (userData.balance || 1000) + gain;
      userData.goodKarma = (userData.goodKarma || 0) + (params.goodKarma || 0);
      userData.badKarma = (userData.badKarma || 0) + (params.badKarma || 0);
      userData.lastTease = now;

      await dataManager.updateUser(userId, guildId, userData);

      const karmaNet = (userData.goodKarma || 0) - (userData.badKarma || 0);

      const embed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle('😉 Aguichage Réussi !')
        .setDescription(`Vous avez aguiché <@${targetUser.id}> et gagné **+${gain}💋**`)
        .addFields(
          { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
          { name: '😇 Karma Positif', value: `+${params.goodKarma || 0} (${userData.goodKarma})`, inline: true },
          { name: '😈 Karma Négatif', value: `${(params.badKarma || 0) >= 0 ? '+' : ''}${params.badKarma || 0} (${userData.badKarma})`, inline: true },
          { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
          { name: '⏰ Cooldown', value: `${Math.floor(params.cooldown / 60000)} min`, inline: true }
        )
        .setFooter({ text: 'Revenez aguicher un peu plus tard...' });

      await interaction.reply({ content: `<@${targetUser.id}>`, embeds: [embed] });
    } catch (error) {
      console.error('❌ Erreur aguicher:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
    }
  }
};