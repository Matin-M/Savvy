const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const process = require("process");
const osu = require("node-os-utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription(`Returns Savvy's runtime statistics`),
  async execute(client, interaction, Tags) {
    const memoryUsed = process.memoryUsage().heapUsed;
    const cpu = osu.cpu;
    const mem = osu.mem;
    const cpuUtil = await cpu.usage();
    const memUtil = await mem.info();

    const replyEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`Savvy's current status`)
      .addFields(
        {
          name: "Uptime",
          value: `**${msToTime(client.uptime)}**`,
          inline: true,
        },
        {
          name: "# of guilds joined",
          value: `**${client.guilds.cache.size}**`,
          inline: true,
        },
        {
          name: `Created on`,
          value: `**${client.application.createdAt.toLocaleDateString(
            "en-US"
          )}**`,
          inline: true,
        },
        {
          name: `Heap usage`,
          value: `**${Math.round(memoryUsed * 100) / 100 / 1000.0} kB**`,
          inline: true,
        },
        {
          name: `Free system memory`,
          value: `**${memUtil.freeMemPercentage}%**`,
          inline: true,
        },
        { name: `CPU usage`, value: `**${cpuUtil}%**`, inline: true },
        { name: `CPU model`, value: `**${cpu.model()}**`, inline: true },
        { name: `CPU core count`, value: `**${cpu.count()}**`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [replyEmbed] });
  },
};

function msToTime(ms) {
  const seconds = (ms / 1000).toFixed(1);
  const minutes = (ms / (1000 * 60)).toFixed(1);
  const hours = (ms / (1000 * 60 * 60)).toFixed(1);
  const days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
  if (seconds < 60) return `${seconds} Sec`;
  else if (minutes < 60) return `${minutes} Min`;
  else if (hours < 24) return `${hours} Hrs`;
  else return `${days} Days`;
}
