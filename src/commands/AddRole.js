const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageSelectMenu } = require("discord.js");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addrole")
    .setDescription("Give yourself a role"),
  async execute(client, interaction, Tags) {
    const replyEmbed = new MessageEmbed();
    const tag = await Tags.findOne({
      where: { guildId: interaction.guild.id },
    });
    let userRoles = tag.get("self_assign_roles");
    if (!userRoles || userRoles.length == 0 || userRoles[0] == "") {
      replyEmbed
        .setColor("#ffcc00")
        .setTitle(`No roles available at this time`)
        .setTimestamp();
      interaction.reply({ embeds: [replyEmbed], ephemeral: true });
      return;
    }
    userRoles = userRoles.map((role) => {
      return {
        label: role,
        description: "Click to select role",
        value: role,
      };
    });
    console.log(userRoles);
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("role-selector")
        .setPlaceholder("...")
        .addOptions(userRoles)
    );
    replyEmbed.setColor("#0099ff").setDescription(`Please select a role`);
    await interaction.reply({
      embeds: [replyEmbed],
      components: [row],
      ephemeral: true,
    });
  },
};
