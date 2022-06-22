const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
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

    const replyEmbed = new MessageEmbed()
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
          value: `**${Math.round(memoryUsed * 100) / 100} bytes**`,
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

function msToTime(duration) {
  let milliseconds = Math.floor((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor(duration / (1000 * 60 * 60) / 24);

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}
