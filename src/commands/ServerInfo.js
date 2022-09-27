const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Returns info about this discord server"),
  async execute(client, interaction, Tags) {
    const tag = await Tags.findOne({
      where: { guildId: interaction.guild.id },
    });
    const messages = [...new Set(tag.get("user_message_logs"))];
    const deleted_messages = [...new Set(tag.get("deleted_user_message_logs"))];

    const freq = wordFreq(messages.map((msg) => msg.userMessage));
    let retString = "";
    Object.keys(freq)
      .sort((word) => parseInt(freq[word]))
      .forEach((word) => {
        retString += `${word} → ${freq[word]}\n`;
      });

    const replyEmbed = new EmbedBuilder()
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
          value: `\t**${
            parseFloat(interaction.guild.maximumBitrate) / 1000
          } kbps**`,
          inline: true,
        },
        {
          name: `Messages sent`,
          value: `**${messages.length}**`,
          inline: true,
        },
        {
          name: `Messages deleted`,
          value: `\t**${deleted_messages.length}**`,
          inline: true,
        },
        {
          name: `Server ID`,
          value: `**${interaction.guild.id}**`,
          inline: true,
        },
        {
          name: `Message frequency distribution`,
          value: `**${retString}**`,
          inline: true,
        }
      )
      .setImage(`${interaction.guild.iconURL()}`)
      .setTimestamp();
    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};

function wordFreq(strings) {
  const freqMap = {};
  strings.forEach((string) => {
    const words = string.replace(/[.]/g, "").split(/\s/);
    words.forEach((w) => {
      if (!freqMap[w]) {
        freqMap[w] = 0;
      }
      freqMap[w] += 1;
    });
  });

  return freqMap;
}
