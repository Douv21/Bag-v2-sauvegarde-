const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aguicher')
    .setDescription('Aguicher pour gagner du plaisir (Action positive 😇)'),

  async execute(interaction, dataManager) {
    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      const economyConfig = await dataManager.loadData('economy.json', {});
      const actionConfig = economyConfig.actions?.aguicher || {
        enabled: true,
        minReward: 15,
        maxReward: 60,
        cooldown: 1_200_000, // 20 minutes
        goodKarma: 1,
        badKarma: 0
      };

      if (!actionConfig.enabled) {
        await interaction.reply({ content: '❌ La commande /aguicher est actuellement désactivée.', flags: 64 });
        return;
      }

      const userData = await dataManager.getUser(userId, guildId);
      const now = Date.now();
      const cooldownTime = actionConfig.cooldown;

      if (userData.lastTease && (now - userData.lastTease) < cooldownTime) {
        const remaining = Math.ceil((cooldownTime - (now - userData.lastTease)) / 60000);
        return await interaction.reply({ content: `⏰ Attendez **${remaining} min** avant d'aguicher à nouveau.`, flags: 64 });
      }

      const gain = Math.floor(Math.random() * (actionConfig.maxReward - actionConfig.minReward + 1)) + actionConfig.minReward;

      userData.balance = (userData.balance || 1000) + gain;
      userData.goodKarma = (userData.goodKarma || 0) + (actionConfig.goodKarma || 0);
      userData.badKarma = (userData.badKarma || 0) + (actionConfig.badKarma || 0);
      userData.lastTease = now;

      await dataManager.updateUser(userId, guildId, userData);

      const karmaNet = (userData.goodKarma || 0) - (userData.badKarma || 0);

      const embed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle('😉 Aguichage Réussi !')
        .setDescription(`Votre petite provocation a fait son effet... **+${gain}💋**`)
        .addFields(
          { name: '💋 Nouveau Plaisir', value: `${userData.balance}💋`, inline: true },
          { name: '😇 Karma Positif', value: `+${actionConfig.goodKarma || 0} (${userData.goodKarma})`, inline: true },
          { name: '😈 Karma Négatif', value: `${actionConfig.badKarma || 0 >= 0 ? '+' : ''}${actionConfig.badKarma || 0} (${userData.badKarma})`, inline: true },
          { name: '⚖️ Karma Net', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
          { name: '⏰ Cooldown', value: `${Math.floor(cooldownTime / 60000)} min`, inline: true }
        )
        .setFooter({ text: 'Revenez aguicher un peu plus tard...' });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Erreur aguicher:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
    }
  }
};