const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const axios = require('axios');
const { fortnite_api_key } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fortnitestats')
    .setDescription('Get fortnite stats for a player')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('Epic games username')
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('lifetime')
        .setDescription('Set timespan to lifetime')
        .setRequired(false)
    ),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder();
    const username = interaction.options.getString('username');
    const timespan = interaction.options.getString('lifetime');
    const res = await axios
      .get(
        `https://fortnite-api.com/v2/stats/br/v2?name=${username}&accountType=epic&timeWindow=${
          timespan ? 'lifetime' : 'season'
        }&image=all`,
        {
          headers: { Authorization: fortnite_api_key },
        }
      )
      .catch((err) => {
        //Something here just to prevent the error from being thrown
      })
      .then((res) => {
        if (!res) {
          replyEmbed
            .setColor([255, 0, 0])
            .setTitle('Error!')
            .setDescription('A user with the specified username was not found');
          interaction.reply({ embeds: [replyEmbed], ephemeral: true });
          return;
        }
        const data = res.data.data;
        interaction.reply(data.image);
        return;
      });
  },
};
