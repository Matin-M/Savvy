import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import { fortnite_api_key } from '../config.json';
import { CustomClient } from '../types/CustomClient';
import axios, { AxiosResponse } from 'axios';

interface ServerResponse {
  response: number;
  data: OverallStats;
}

interface OverallStats {
  account: Record<string, string>;
  battlePass: Record<string, number>;
  image: string;
  stats: {
    all: {
      overall: Record<string, number>;
    };
  };
}

export default {
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
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const replyEmbed = new EmbedBuilder();
    const username = interaction.options.getString('username');
    const timespan = interaction.options.getBoolean('lifetime');
    await axios
      .get<ServerResponse>(
        `https://fortnite-api.com/v2/stats/br/v2?name=${username}&accountType=epic&timeWindow=${
          timespan ? 'lifetime' : 'season'
        }&image=all`,
        {
          headers: { Authorization: fortnite_api_key },
        }
      )
      .catch((err) => {
        console.error(err);
      })
      .then((res: void | AxiosResponse<ServerResponse, any>) => {
        if (!res) {
          replyEmbed
            .setColor([255, 0, 0])
            .setTitle('Error!')
            .setDescription('A user with the specified username was not found');
          interaction.reply({ embeds: [replyEmbed], ephemeral: true });
          return;
        }
        const { data } = res;
        // lol
        const overallStats = data.data.stats.all.overall;
        replyEmbed
          .setTitle(
            `${data.data.account.name}'s ${
              timespan ? 'lifetime' : 'season'
            } Stats`
          )
          .addFields(
            {
              name: 'Playtime',
              value: `${(overallStats.minutesPlayed / 60).toFixed(2)} Hours`,
              inline: true,
            },
            {
              name: 'Battlepass Level',
              value: `${data.data.battlePass.level}`,
              inline: true,
            },
            {
              name: 'Players Outlived',
              value: `${overallStats.playersOutlived}`,
              inline: true,
            },
            {
              name: 'Score',
              value: `${overallStats.score}`,
              inline: true,
            },
            {
              name: 'Score/min',
              value: `${overallStats.scorePerMin}`,
              inline: true,
            },
            {
              name: 'Score/match',
              value: `${overallStats.scorePerMatch}`,
              inline: true,
            },
            {
              name: 'Top 10',
              value: `${overallStats.top10} finishes`,
              inline: true,
            },
            {
              name: 'Top 5',
              value: `${overallStats.top5} finishes`,
              inline: true,
            },
            {
              name: 'Top 3',
              value: `${overallStats.top3} finishes`,
              inline: true,
            }
          )
          .setImage(data.data.image);
        interaction.reply({ embeds: [replyEmbed] });
        return;
      });
  },
};
