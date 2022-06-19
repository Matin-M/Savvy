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
    var userRoles = tag.get("self_assign_roles");
    userRoles = userRoles.map((role) => {
      return {
        label: role,
        description: "Role",
        value: role,
      };
    });
    console.log(userRoles);
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("roleSelector")
        .setPlaceholder("Please select a role...")
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
