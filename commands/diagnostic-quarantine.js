// Diagnostic du système de quarantaine
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diagnostic-quarantine')
    .setDescription('Diagnostic complet du système de quarantaine')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 5,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ 
        content: '❌ Vous devez être administrateur pour utiliser cette commande.', 
        ephemeral: true 
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const bot = interaction.client;
      let diagnostic = `🔍 **Diagnostic du système de quarantaine**\n\n`;

      // Test 1: Vérifier si les méthodes sont attachées
      diagnostic += `**1. Méthodes attachées au client:**\n`;
      diagnostic += `• quarantineMember: ${typeof bot.quarantineMember}\n`;
      diagnostic += `• grantAccess: ${typeof bot.grantAccess}\n`;
      diagnostic += `• getQuarantineInfo: ${typeof bot.getQuarantineInfo}\n`;
      diagnostic += `• ensureQuarantineRole: ${typeof bot.ensureQuarantineRole}\n`;
      diagnostic += `• createQuarantineChannels: ${typeof bot.createQuarantineChannels}\n\n`;

      // Test 2: Vérifier les managers
      diagnostic += `**2. Managers disponibles:**\n`;
      diagnostic += `• moderationManager: ${typeof bot.moderationManager}\n`;
      diagnostic += `• dataManager: ${bot.dataManager ? 'object' : 'undefined'}\n`;
      diagnostic += `• logManager: ${typeof bot.logManager}\n\n`;

      // Test 3: Vérifier la configuration de sécurité
      if (bot.moderationManager && typeof bot.moderationManager.getSecurityConfig === 'function') {
        try {
          const config = await bot.moderationManager.getSecurityConfig(interaction.guild.id);
          diagnostic += `**3. Configuration de sécurité:**\n`;
          diagnostic += `• Configuration trouvée: ✅\n`;
          diagnostic += `• Quarantine activée: ${config.accessControl?.enabled ? '✅' : '❌'}\n`;
          diagnostic += `• Rôle quarantaine ID: ${config.accessControl?.quarantineRoleId || 'Non configuré'}\n`;
          diagnostic += `• Nom rôle quarantaine: ${config.accessControl?.quarantineRoleName || 'Quarantaine'}\n\n`;
        } catch (configError) {
          diagnostic += `**3. Configuration de sécurité:**\n`;
          diagnostic += `• ❌ Erreur: ${configError.message}\n\n`;
        }
      } else {
        diagnostic += `**3. Configuration de sécurité:**\n`;
        diagnostic += `• ❌ moderationManager.getSecurityConfig non disponible\n\n`;
      }

      // Test 4: Permissions du bot
      diagnostic += `**4. Permissions du bot:**\n`;
      const botMember = interaction.guild.members.cache.get(bot.user.id);
      if (botMember) {
        const perms = botMember.permissions;
        diagnostic += `• Gérer les rôles: ${perms.has('ManageRoles') ? '✅' : '❌'}\n`;
        diagnostic += `• Gérer les canaux: ${perms.has('ManageChannels') ? '✅' : '❌'}\n`;
        diagnostic += `• Gérer les permissions: ${perms.has('ManageRoles') ? '✅' : '❌'}\n`;
      } else {
        diagnostic += `• ❌ Impossible de récupérer les permissions du bot\n`;
      }

      // Test 5: Test d'appel simple
      diagnostic += `\n**5. Test d'appel de méthode:**\n`;
      if (typeof bot.quarantineMember === 'function') {
        diagnostic += `• ✅ La méthode quarantineMember peut être appelée\n`;
      } else {
        diagnostic += `• ❌ La méthode quarantineMember n'est pas disponible\n`;
      }

      await interaction.editReply({ content: diagnostic });

    } catch (error) {
      console.error('Erreur diagnostic quarantaine:', error);
      await interaction.editReply({
        content: `❌ **Erreur lors du diagnostic:**\n\`\`\`\n${error.message}\n\`\`\``
      });
    }
  }
};