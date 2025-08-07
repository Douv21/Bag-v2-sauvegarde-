const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('after-dark')
    .setDescription('After Dark: bonus de plaisir selon l’heure (NSFW)')
    .addIntegerOption(o => o.setName('mise').setDescription('Mise en 💋 (10-200)').setMinValue(10).setMaxValue(200).setRequired(true)),

  async execute(interaction, dataManager) {
    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const stake = interaction.options.getInteger('mise');

      const economyConfig = await dataManager.loadData('economy.json', {});
      const actionConfig = economyConfig.actions?.after_dark || {
        enabled: true,
        cooldown: 3_600_000, // 1h
        goodKarma: 0,
        badKarma: 0
      };

      if (!actionConfig.enabled) {
        await interaction.reply({ content: '❌ La commande /after-dark est désactivée.', flags: 64 });
        return;
      }

      const userData = await dataManager.getUser(userId, guildId);
      if ((userData.balance || 0) < stake) {
        return await interaction.reply({ content: `❌ Pas assez de plaisir (solde: ${userData.balance}💋).`, flags: 64 });
      }

      const now = Date.now();
      if (userData.lastAfterDark && (now - userData.lastAfterDark) < (actionConfig.cooldown || 0)) {
        const remaining = Math.ceil(((actionConfig.cooldown || 0) - (now - userData.lastAfterDark)) / 60000);
        return await interaction.reply({ content: `⏰ Attendez **${remaining} min** avant de relancer.`, flags: 64 });
      }

      const hour = new Date().getHours();
      const isPeak = (hour >= 22 || hour < 3); // 22h-3h bonus
      const multiplier = isPeak ? 2.0 : 1.2;

      // Résultat aléatoire, légèrement à l’avantage pendant les heures de pointe
      const luck = Math.random();
      let delta = 0;
      if (luck < 0.45 * (isPeak ? 1.2 : 1)) {
        delta = Math.floor(stake * multiplier);
        userData.balance = (userData.balance || 0) + delta;
      } else {
        delta = -stake;
        userData.balance = Math.max(0, (userData.balance || 0) + delta);
      }

      userData.lastAfterDark = now;
      userData.goodKarma = (userData.goodKarma || 0) + (actionConfig.goodKarma || 0);
      userData.badKarma = (userData.badKarma || 0) + (actionConfig.badKarma || 0);

      await dataManager.updateUser(userId, guildId, userData);

      const karmaNet = (userData.goodKarma || 0) - (userData.badKarma || 0);

      const embed = new EmbedBuilder()
        .setColor(delta >= 0 ? '#8e44ad' : '#2c3e50')
        .setTitle('🌙 After Dark')
        .setDescription(delta >= 0 ? `Heures chaudes${isPeak ? ' (peak)' : ''}... **+${delta}💋**` : `La nuit est capricieuse... **${delta}💋**`)
        .addFields(
          { name: '🕒 Tranche', value: isPeak ? 'Peak 22h-3h' : 'Standard', inline: true },
          { name: '📈 Multiplicateur', value: `${multiplier}x`, inline: true },
          { name: '💋 Plaisir', value: `${userData.balance}💋`, inline: true },
          { name: '⚖️ Karma Net', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true }
        )
        .setFooter({ text: `Cooldown: ${Math.floor((actionConfig.cooldown || 0) / 60000)} min` });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Erreur after-dark:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
    }
  }
};