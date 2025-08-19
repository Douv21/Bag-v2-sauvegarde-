const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Vérifier un membre et évaluer le risque')
    .addUserOption(o => o.setName('membre').setDescription('Membre à vérifier').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 3,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const targetUser = interaction.options.getUser('membre', true);
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Membre introuvable sur ce serveur.', flags: 64 });

    const vm = interaction.client.verificationManager;
    if (!vm) return interaction.reply({ content: '❌ Vérification indisponible.', flags: 64 });

    const result = await vm.verifyMember(member);
    const embed = vm.formatVerificationEmbed(member, result);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`verify:ban:${member.id}`).setStyle(ButtonStyle.Danger).setLabel('Ban'),
      new ButtonBuilder().setCustomId(`verify:kick:${member.id}`).setStyle(ButtonStyle.Secondary).setLabel('Kick'),
      new ButtonBuilder().setCustomId(`verify:warn:${member.id}`).setStyle(ButtonStyle.Primary).setLabel('Warn'),
      new ButtonBuilder().setCustomId(`verify:flag:${member.id}`).setStyle(ButtonStyle.Secondary).setLabel('Signaler'),
      new ButtonBuilder().setCustomId(`verify:restrict:${member.id}`).setStyle(ButtonStyle.Secondary).setLabel('Restreindre')
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};

