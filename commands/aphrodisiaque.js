const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function num(val, fb = 0) { const n = Number(val); return Number.isFinite(n) ? n : fb; }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aphrodisiaque')
    .setDescription('Offrir un aphrodisiaque à un membre (NSFW)')
    .addUserOption(o => o.setName('membre').setDescription('Membre ciblé').setRequired(true)),

  async execute(interaction, dataManager) {
    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const target = interaction.options.getUser('membre');

      if (target.bot || target.id === userId) {
        return await interaction.reply({ content: '❌ Choisissez un membre valide (hors vous et bots).', flags: 64 });
      }

      const economyConfig = await dataManager.loadData('economy.json', {});
      const cfg = (economyConfig.actions?.aphrodisiaque) || {};
      const enabled = cfg.enabled !== false;
      const minReward = num(cfg.minReward, 20);
      const maxReward = num(cfg.maxReward, 60);
      const cooldown = num(cfg.cooldown, 3_600_000);
      const gK = num(cfg.goodKarma, 1);
      const bK = num(cfg.badKarma, 0);

      if (!enabled) {
        return await interaction.reply({ content: '❌ La commande /aphrodisiaque est désactivée.', flags: 64 });
      }

      const userData = await dataManager.getUser(userId, guildId);
      const now = Date.now();
      if (userData.lastAphro && (now - userData.lastAphro) < cooldown) {
        const remaining = Math.ceil((cooldown - (now - userData.lastAphro)) / 60000);
        return await interaction.reply({ content: `⏰ Attendez **${remaining} min** avant de recommencer.`, flags: 64 });
      }

      const gain = Math.floor(Math.random() * (Math.max(0, maxReward - minReward) + 1)) + minReward;
      userData.balance = (userData.balance || 1000) + gain;
      userData.goodKarma = (userData.goodKarma || 0) + gK;
      userData.badKarma = (userData.badKarma || 0) + bK;
      userData.lastAphro = now;

      await dataManager.updateUser(userId, guildId, userData);

      const karmaNet = (userData.goodKarma || 0) + (userData.badKarma || 0);
      const embed = new EmbedBuilder()
        .setColor('#e84393')
        .setTitle('🍷 Aphrodisiaque !')
        .setDescription(`Vous offrez un aphrodisiaque à <@${target.id}> et gagnez **+${gain}💋**`)
        .addFields(
          { name: '💋 Plaisir', value: `${userData.balance}💋`, inline: true },
          { name: '😇 Karma Positif', value: `${gK >= 0 ? '+' : ''}${gK} (${userData.goodKarma})`, inline: true },
          { name: '😈 Karma Négatif', value: `${bK >= 0 ? '+' : ''}${bK} (${userData.badKarma})`, inline: true },
          { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
          { name: '⏰ Cooldown', value: `${Math.floor(cooldown / 60000)} min`, inline: true }
        );

      await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
    } catch (error) {
      console.error('❌ Erreur aphrodisiaque:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
    }
  }
};