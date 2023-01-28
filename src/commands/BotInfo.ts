// To Be Fixed
/*
import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import { devAdminId } from '../config.json';
import { CustomClient } from '../types/CustomClient';

import process from 'process';
import { osu } from 'node-os-utils';
import { msToTime } from '../helpers/formatting';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription(`Returns Savvy's runtime statistics`),
  async execute(client, interaction, Tags) {
    const memoryUsed = process.memoryUsage().heapUsed;
    const cpu = osu.cpu;
    const mem = osu.mem;
    const os = osu.os;
    const cpuUtil = await cpu.usage();
    const memUtil = await mem.info();

    const replyEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Savvy's current status`)
      .addFields(
        {
          name: 'Uptime',
          value: `**${msToTime(client.uptime)}**`,
          inline: true,
        },
        {
          name: '# of servers joined',
          value: `**${client.guilds.cache.size}**`,
          inline: true,
        },
        {
          name: `Total mem`,
          value: `**${mem.totalMem()} Bytes**`,
          inline: true,
        },
        {
          name: `Heap usage`,
          value: `**${(
            Math.round(memoryUsed * 100) /
            100 /
            1000.0 /
            1000.0
          ).toFixed(2)} MB**`,
          inline: true,
        },
        {
          name: `Free system mem %`,
          value: `**${memUtil.freeMemPercentage}%**`,
          inline: true,
        },
        { name: `CPU usage`, value: `**${cpuUtil}%**`, inline: true },
        { name: `CPU model`, value: `**${cpu.model()}**`, inline: true },
        { name: `CPU core count`, value: `**${cpu.count()}**`, inline: true },
        {
          name: `OS`,
          value: `**${os.arch()}, ${await os.oos()}**`,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [replyEmbed] });
  },
};
*/
