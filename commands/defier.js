const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('defier')
    .setDescription('Lancer un défi osé pour beaucoup de plaisir (risqué 😈)'),

  async execute(interaction, dataManager) {
    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      const economyConfig = await dataManager.loadData('economy.json', {});
      const actionConfig = economyConfig.actions?.defier || {
        enabled: true,
        cooldown: 2_400_000, // 40 minutes
        goodKarma: 0,
        badKarma: 1,
        winChance: 0.55,
        base: 80
      };

      if (!actionConfig.enabled) {
        await interaction.reply({ content: '❌ La commande /defier est désactivée.', flags: 64 });
        return;
      }

      const userData = await dataManager.getUser(userId, guildId);
      const now = Date.now();

      if (userData.lastDare && (now - userData.lastDare) < actionConfig.cooldown) {
        const remaining = Math.ceil((actionConfig.cooldown - (now - userData.lastDare)) / 60000);
        return await interaction.reply({ content: `⏰ Attendez **${remaining} min** avant de redéfier.`, flags: 64 });
      }

      const win = Math.random() < (actionConfig.winChance || 0.5);
      let delta = 0;

      if (win) {
        delta = Math.floor((actionConfig.base || 80) * (1 + Math.random())); // 100%-200% base
        userData.balance = (userData.balance || 1000) + delta;
      } else {
        delta = Math.min((actionConfig.base || 80), userData.balance || 0);
        userData.balance = Math.max(0, (userData.balance || 0) - delta);
      }

      userData.badKarma = (userData.badKarma || 0) + (actionConfig.badKarma || 0);
      userData.goodKarma = (userData.goodKarma || 0) + (actionConfig.goodKarma || 0);
      userData.lastDare = now;

      await dataManager.updateUser(userId, guildId, userData);

      const karmaNet = (userData.goodKarma || 0) - (userData.badKarma || 0);

      const embed = new EmbedBuilder()
        .setColor(win ? '#FFD700' : '#FF4D4D')
        .setTitle(win ? '🔥 Défi Réussi !' : '❌ Défi Raté !')
        .setDescription(win ? `Vous gagnez **+${delta}💋**` : `Vous perdez **-${delta}💋**`)
        .addFields(
          { name: '💋 Plaisir', value: `${userData.balance}💋`, inline: true },
          { name: '😈 Risque', value: `${Math.round((actionConfig.winChance || 0.5) * 100)}% de succès`, inline: true },
          { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
          { name: '⏰ Cooldown', value: `${Math.floor((actionConfig.cooldown || 0) / 60000)} min`, inline: true }
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Erreur defier:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
    }
  }
};