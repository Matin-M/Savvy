const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { dbConnectionString, devAdminId } = require("../../config.json");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConnectionString);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("replyonkeyword")
    .setDescription(
      "Auto-reply if message contains keyword. Set phrase to <DELETE> to delete message instead"
    )
    .addStringOption((option) =>
      option
        .setName("keyword")
        .setDescription("keyword")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("phrase")
        .setDescription("phrase")
        .setRequired(true)
        .setAutocomplete(true)
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
      interaction.user.id == devAdminId
    ) {
      const keyword = interaction.options.getString("keyword");
      const phrase = interaction.options.getString("phrase");

      await Tags.update(
        {
          message_reply_keywords: sequelize.fn(
            "array_append",
            sequelize.col("message_reply_keywords"),
            `${keyword}`
          ),
        },
        { where: { guildId: interaction.guild.id } }
      );
      await Tags.update(
        {
          message_reply_phrases: sequelize.fn(
            "array_append",
            sequelize.col("message_reply_phrases"),
            `${phrase}`
          ),
        },
        { where: { guildId: interaction.guild.id } }
      );

      replyEmbed.setColor("#0099ff").setTimestamp();
      if (phrase === "<DELETE>") {
        replyEmbed.setTitle(
          `Savvy will delete a channel message if it contains the keyword **${keyword}**`
        );
      } else {
        replyEmbed.setTitle(
          `Savvy will reply with **${phrase}** if a channel message contains the keyword **${keyword}**`
        );
      }
    } else {
      replyEmbed
        .setColor("#FF0000")
        .setTitle(`You do not have the permission to use this command!`)
        .setTimestamp();
    }

    await interaction.reply({ embeds: [replyEmbed] });
  },
};
