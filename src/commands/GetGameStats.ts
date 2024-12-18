import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { makeFortniteAPIRequest } from '../helpers/utils';
import { ExecuteParams } from '../types/Command';
import { OverallStats } from '../types/APIInterfaces';

export default {
  data: new SlashCommandBuilder()
    .setName('fortnitestats')
    .setDescription('Get Fortnite stats for a player')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription(
          'Epic Games username. If not provided, stored username will be used.'
        )
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('lifetime')
        .setDescription(
          'If set to true, lifetime stats will be shown. Default is season stats.'
        )
        .setRequired(false)
    ),
  async execute({
    interaction,
    PreferenceTable,
  }: ExecuteParams): Promise<void> {
    const replyEmbed = new EmbedBuilder();
    let username = interaction.options.getString('username');
    const timespan = interaction.options.getBoolean('lifetime') ?? false;

    if (!username) {
      const storedUsername = await PreferenceTable.findOne({
        where: {
          guildId: interaction.guild!.id,
          key: 'fortniteUsername',
          classId: interaction.user.id,
        },
        order: [['createdAt', 'DESC']],
      });

      if (!storedUsername || !storedUsername.get('value')) {
        replyEmbed
          .setColor([255, 0, 0])
          .setTitle('Error!')
          .setDescription('No username provided and no stored username found.');
        await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
        return;
      }
      username = storedUsername.get('value') as string;
    } else {
      await PreferenceTable.upsert({
        guildId: interaction.guild!.id,
        key: 'fortniteUsername',
        value: username.trim(),
        classId: interaction.user.id,
      });
    }

    const response = await makeFortniteAPIRequest(username, timespan);

    if (!response) {
      replyEmbed
        .setColor([255, 0, 0])
        .setTitle('Error!')
        .setDescription('A user with the specified username was not found');
      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
      return;
    }
    const data = response.data;

    const statsKey = `fortniteStats-${
      timespan ? 'lifetime' : 'season'
    }-${username}`;

    const previousStatsEntry = await PreferenceTable.findOne({
      where: {
        guildId: interaction.guild!.id,
        key: statsKey,
      },
      order: [['createdAt', 'DESC']],
    });

    let previousStats: OverallStats | null = null;
    if (previousStatsEntry && previousStatsEntry.get('value')) {
      try {
        previousStats = JSON.parse(
          previousStatsEntry.get('value') as string
        ) as OverallStats;
      } catch (error) {
        console.error('Error parsing previous stats:', error);
      }
    }

    const sanitizeValue = (value: unknown): string =>
      value === null || value === undefined || value === ''
        ? 'N/A'
        : value.toString();

    const statsToCompare = [
      {
        name: 'K/D Diff',
        compute: (stats: OverallStats) =>
          stats.stats.all.overall.deaths > 0
            ? stats.stats.all.overall.kills / stats.stats.all.overall.deaths
            : stats.stats.all.overall.kills,
        format: (val: number) => val.toFixed(2),
      },
      {
        name: 'KPM Diff',
        compute: (stats: OverallStats) =>
          stats.stats.all.overall.minutesPlayed > 0
            ? stats.stats.all.overall.kills /
              stats.stats.all.overall.minutesPlayed
            : stats.stats.all.overall.kills,
        format: (val: number) => val.toFixed(2),
      },
      {
        name: 'Win Diff',
        compute: (stats: OverallStats) =>
          stats.stats.all.overall.matches > 0
            ? (stats.stats.all.overall.wins / stats.stats.all.overall.matches) *
              100
            : 0,
        format: (val: number) => `${val.toFixed(2)}%`,
      },
      {
        name: 'Score/min',
        path: 'stats.all.overall.scorePerMin',
        format: (val: number) => `${val.toFixed(2)}`,
      },
      {
        name: 'Score/match',
        path: 'stats.all.overall.scorePerMatch',
        format: (val: number) => `${val.toFixed(2)}`,
      },
    ];

    const fields = statsToCompare.map((stat) => {
      let currentValue: number;
      if (stat.compute) {
        currentValue = stat.compute(data);
      } else {
        currentValue = getValueByPath(data, stat.path) as number;
      }
      const formattedCurrentValue = sanitizeValue(stat.format(currentValue));

      let deltaText = '';
      if (previousStats) {
        let previousValue: number;
        if (stat.compute) {
          previousValue = stat.compute(previousStats);
        } else {
          previousValue = getValueByPath(previousStats, stat.path) as number;
        }

        if (previousValue != null) {
          const delta = currentValue - previousValue;
          const truncatedDelta = Math.trunc(delta * 100) / 100;
          if (truncatedDelta > 0) {
            deltaText = ` ⬆️ (+${truncatedDelta.toFixed(2)})`;
          } else if (truncatedDelta < 0) {
            deltaText = ` ⬇️ (${truncatedDelta.toFixed(2)})`;
          } else {
            deltaText = '0 (no change)';
          }
        } else {
          deltaText = 'No Data';
        }
      }

      return {
        name: stat.name,
        value: sanitizeValue(
          stat.name.includes('Diff') || deltaText == 'No Data'
            ? deltaText
            : `${formattedCurrentValue}${deltaText}`
        ),
        inline: true,
      };
    });

    const staticFields = [
      {
        name: 'Playtime',
        value: sanitizeValue(
          `${(data.stats.all.overall.minutesPlayed / 60).toFixed(2)} Hours`
        ),
      },
      {
        name: 'Battlepass Level',
        value: sanitizeValue(data.battlePass.level),
        inline: true,
      },
      {
        name: 'Players Outlived',
        value: sanitizeValue(data.stats.all.overall.playersOutlived),
        inline: true,
      },
      {
        name: 'Score',
        value: sanitizeValue(data.stats.all.overall.score),
        inline: true,
      },
      {
        name: 'Top 10',
        value: sanitizeValue(`${data.stats.all.overall.top10} finishes`),
        inline: true,
      },
      {
        name: 'Top 5',
        value: sanitizeValue(`${data.stats.all.overall.top5} finishes`),
        inline: true,
      },
      {
        name: 'Top 3',
        value: sanitizeValue(`${data.stats.all.overall.top3} finishes`),
        inline: true,
      },
    ];

    const statsToStore: OverallStats = {
      account: data.account,
      battlePass: data.battlePass,
      image: data.image,
      stats: {
        all: {
          overall: data.stats.all.overall,
        },
      },
    };

    await PreferenceTable.upsert({
      guildId: interaction.guild!.id,
      key: statsKey,
      value: JSON.stringify(statsToStore),
      classId: interaction.user.id,
    });

    replyEmbed
      .setTitle(
        `${data.account.name}'s ${timespan ? 'Lifetime' : 'Season'} Stats`
      )
      .addFields(staticFields)
      .addFields(fields)
      .setImage(data.image);

    await interaction.reply({ embeds: [replyEmbed] });

    function getValueByPath(obj: any, path: string): unknown {
      return (
        path
          .split('.')
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          .reduce((prev: any, curr: string) => (prev ? prev[curr] : null), obj)
      );
    }
  },
};
