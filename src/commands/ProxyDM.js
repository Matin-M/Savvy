const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("proxydm")
    .setDescription("Use Savvy to direct message any user in this server")
    .addStringOption((option) =>
      option
        .setName("nickname")
        .setDescription("discord username")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("message to send")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async execute(client, interaction, Tags) {
    const nick = interaction.options.getString("nickname");
    const message = interaction.options.getString("message");
    let members = await interaction.guild.members.fetch();
    members = members.map((u) => u.user);
    const selectedMember = members.filter((member) => {
      if (String(member["username"]) === String(nick)) {
        return member;
      }
    })[0];
    const replyEmbed = new MessageEmbed().setColor("#0099ff").setTimestamp();
    try {
      const user = await client.users.fetch(selectedMember.id);
      await user.send(
        `Proxy message from ${interaction.user.username}: ${message}`
      );
      replyEmbed.setTitle(`Sent **${message}** to user **${nick}**`);
    } catch (error) {
      replyEmbed.setColor("#ff0000");
      replyEmbed.setTitle(`Oops! Something went wrong`);
      if (String(error).includes("undefined")) {
        replyEmbed.setDescription("User does not exist!");
      } else {
        replyEmbed.setDescription("Error message: " + error);
      }
    }

    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};
