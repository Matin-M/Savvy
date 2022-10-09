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
    let freqTable = "";
    Object.keys(freq)
      .sort((a, b) => {
        return freq[b] - freq[a];
      })
      .forEach((word, index) => {
        index < 10 ? (freqTable += `${word} → ${freq[word]}\n`) : undefined;
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
          name: `Word frequency`,
          value: `**${freqTable}**`,
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
      if (w.includes("https://") || w === "" || !w) return;
      if (!freqMap[w]) {
        freqMap[w] = 0;
      }
      freqMap[w] += 1;
    });
  });

  return freqMap;
}
