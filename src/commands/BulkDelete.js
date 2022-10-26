const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { devAdminId } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bulkdelete')
    .setDescription('Delete messages in bulk')
    .addStringOption((option) =>
      option
        .setName('quantity')
        .setDescription('Number of messages to delete')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder();
    const adminRoles = interaction.guild.roles.cache.find((role) => {
      if (role.permissions.toArray().includes('Administrator')) {
        return role;
      }
    });
    const adminArray = adminRoles.members.map((m) => m.id);
    if (
      adminArray.includes(interaction.user.id) ||
      interaction.user.id == devAdminId
    ) {
      const quantity = interaction.options.getString('quantity');
      interaction.channel.bulkDelete(quantity, true);
      replyEmbed
        .setColor('#0099ff')
        .setTitle(`The last ${quantity} messages have been deleted`)
        .setTimestamp();
    } else {
      replyEmbed
        .setColor('#FF0000')
        .setTitle(`You do not have the permission to use this command!`)
        .setTimestamp();
    }

    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};
