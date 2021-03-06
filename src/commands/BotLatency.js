const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("latency")
    .setDescription(`Returns Savvy's ping`),
  async execute(client, interaction, Tags) {
    const sent = await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });
    interaction.editReply(
      `Roundtrip latency: **${
        sent.createdTimestamp - interaction.createdTimestamp
      }ms**`
    );
  },
};
