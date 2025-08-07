const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seduire-mass')
    .setDescription('Séduire la foule pour un gros gain de plaisir (très risqué 😈)'),

  async execute(interaction, dataManager) {
    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      const economyConfig = await dataManager.loadData('economy.json', {});
      const actionConfig = economyConfig.actions?.seduire_mass || {
        enabled: true,
        cooldown: 7_200_000, // 2h
        successChance: 0.5,
        min: 150,
        max: 500,
        goodKarma: -1,
        badKarma: 2
      };

      if (!actionConfig.enabled) {
        await interaction.reply({ content: '❌ La commande /seduire-mass est désactivée.', flags: 64 });
        return;
      }

      const userData = await dataManager.getUser(userId, guildId);
      const now = Date.now();

      if (userData.lastMassSeduce && (now - userData.lastMassSeduce) < actionConfig.cooldown) {
        const remaining = Math.ceil((actionConfig.cooldown - (now - userData.lastMassSeduce)) / 60000);
        return await interaction.reply({ content: `⏰ Attendez **${remaining} min** avant de recommencer.`, flags: 64 });
      }

      const success = Math.random() < (actionConfig.successChance || 0.5);
      let delta = 0;

      if (success) {
        const gain = Math.floor(Math.random() * ((actionConfig.max || 500) - (actionConfig.min || 150) + 1)) + (actionConfig.min || 150);
        delta = gain;
        userData.balance = (userData.balance || 1000) + gain;
      } else {
        // Pénalité proportionnelle
        const penalty = Math.max(30, Math.floor((userData.balance || 0) * 0.1));
        delta = -Math.min(penalty, userData.balance || 0);
        userData.balance = Math.max(0, (userData.balance || 0) + delta);
      }

      userData.goodKarma = (userData.goodKarma || 0) + (actionConfig.goodKarma || 0);
      userData.badKarma = (userData.badKarma || 0) + (actionConfig.badKarma || 0);
      userData.lastMassSeduce = now;

      await dataManager.updateUser(userId, guildId, userData);

      const karmaNet = (userData.goodKarma || 0) - (userData.badKarma || 0);

      const embed = new EmbedBuilder()
        .setColor(success ? '#FF1493' : '#9b59b6')
        .setTitle(success ? '💃 Séduction de Masse !' : '🙃 Ça n’a pas pris...')
        .setDescription(success ? `La foule est conquise ! **+${delta}💋**` : `Petit flop... **${delta}💋**`)
        .addFields(
          { name: '💋 Plaisir', value: `${userData.balance}💋`, inline: true },
          { name: '⚖️ Karma Net', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
          { name: '⏰ Cooldown', value: `${Math.floor((actionConfig.cooldown || 0) / 60000)} min`, inline: true }
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Erreur seduire-mass:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
    }
  }
};