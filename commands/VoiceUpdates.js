const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { dbConnectionString } = require("../config.json");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConnectionString);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("voiceupdates")
    .setDescription(
      "Savvy will ping you when a user connects to any voice channel in this server"
    ),
  async execute(client, interaction, Tags) {
    const replyEmbed = new MessageEmbed();
    const tag = await Tags.findOne({
      where: { guildId: interaction.guild.id },
    });
    let subscribedUsers = tag.get("voice_subscribers_list");
    if (subscribedUsers.includes(interaction.user.id)) {
      replyEmbed
        .setColor("#ffcc00")
        .setDescription(
          `**${interaction.user.username}**, you will no longer receive voice status updates in this server.`
        )
        .setTimestamp();
      Tags.update(
        {
          voice_subscribers_list: subscribedUsers.filter(
            (user) => user != interaction.user.id
          ),
        },
        { where: { guildId: interaction.guild.id } }
      );
    } else {
      await Tags.update(
        {
          voice_subscribers_list: sequelize.fn(
            "array_append",
            sequelize.col("voice_subscribers_list"),
            `${interaction.user.id}`
          ),
        },
        { where: { guildId: interaction.guild.id } }
      );

      replyEmbed
        .setColor("#00FF00")
        .setDescription(
          `**${interaction.user.username}**, you will now receive status updates for voice channels in this server.`
        )
        .setTimestamp();
    }

    await interaction.reply({ embeds: [replyEmbed] });
  },
};
