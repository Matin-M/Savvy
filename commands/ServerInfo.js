const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Returns info about this discord server"),
  async execute(client, interaction, Tags) {
    const replyEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle(`Server info for ${interaction.guild.name}`)
      .addFields(
        {
          name: "Member count",
          value: `\t**${interaction.guild.memberCount}**`,
          inline: true,
        },
        {
          name: "\tCreated on",
          value: `**${new Date(
            interaction.guild.createdTimestamp
          ).toLocaleDateString("en-US")}**`,
          inline: true,
        },
        {
          name: `\tMax VC bitrate`,
          value: `\t**${interaction.guild.maximumBitrate} bits/s**`,
          inline: true,
        },
        {
          name: `Max members`,
          value: `**${interaction.guild.maximumMembers}**`,
          inline: true,
        },
        {
          name: `\tNumber of boosts`,
          value: `\t**${interaction.guild.premiumSubscriptionCount}**`,
          inline: true,
        },
        {
          name: `Server ID`,
          value: `**${interaction.guild.id}**`,
          inline: true,
        }
      )
      .setImage(`${interaction.guild.iconURL()}`)
      .setTimestamp();
    await interaction.reply({ embeds: [replyEmbed] });
  },
};
