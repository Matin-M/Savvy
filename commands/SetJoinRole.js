const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("joinrole")
    .setDescription(
      "The role that new users will get upoun joining this server"
    )
    .addStringOption((option) =>
      option.setName("role").setDescription("role name").setRequired(true)
    ),
  async execute(client, interaction, Tags) {
    const replyEmbed = new MessageEmbed();
    const adminRoles = interaction.guild.roles.cache.find((role) => {
      if (role.permissions.toArray().includes("ADMINISTRATOR")) {
        return role;
      }
    });
    const adminArray = adminRoles.members.map((m) => m.id);
    if (
      adminArray.includes(interaction.user.id) ||
      interaction.user.id == "192416580557209610"
    ) {
      const role = interaction.options.getString("role");
      await Tags.update(
        { joinRole: role },
        { where: { guildId: interaction.guild.id } }
      );

      replyEmbed
        .setColor("#0099ff")
        .setDescription(`New users will have their role set to **${role}**`)
        .setTimestamp();
    } else {
      replyEmbed
        .setColor("#FF0000")
        .setDescription(`You do not have the permission to use this command!`)
        .setTimestamp();
    }

    await interaction.reply({ embeds: [replyEmbed] });
  },
};
