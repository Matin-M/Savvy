import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import { CustomClient } from '../types/CustomClient';
import { keywordFreq, keywordSort, formatUserName } from '../helpers/utils';

export default {
  data: new SlashCommandBuilder()
    .setName('activitystats')
    .setDescription('Returns number of occurances for user activities'),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    PresenceTable: ModelCtor<Model<any, any>>
  ) {
    await interaction.deferReply({ ephemeral: true });

    // User presence
    const presences = (await PresenceTable.findAll({
      where: { guildId: interaction.guild!.id },
    }))!;

    let presenceMap = {};
    let musicMap = {};
    const uniqueUsers = new Set();
    const userStatusCount = {
      online: 0,
      idle: 0,
      dnd: 0,
      offline: 0,
    };
    const userActivityCount: { [userId: string]: number } = {};

    presences.forEach((t) => {
      const userId = t.get('userId') as string;
      if (userActivityCount[userId]) {
        userActivityCount[userId]++;
      } else {
        userActivityCount[userId] = 1;
      }

      uniqueUsers.add(t.get('userId'));

      // Count user statuses
      const status = t.get('userStatus') as keyof typeof userStatusCount;
      if (status in userStatusCount) {
        userStatusCount[status]++;
      }

      if (
        t.get('name') === 'No Activity' ||
        t.get('name') === 'Custom Status'
      ) {
        return;
      }
      presenceMap = keywordFreq(presenceMap, t.get('name') as string, false);
      if (t.get('name') === 'Spotify' || t.get('name') === 'Apple Music') {
        musicMap = keywordFreq(
          musicMap,
          `⁍ \`${t.get('largeText')}\` by \`${t.get('state')}\``,
          false
        );
      }
    });
    const presenceRanking = keywordSort(presenceMap, (item) => item);
    const musicRanking = keywordSort(musicMap, (item) => item);
    const sortedUsers = Object.entries(userActivityCount).sort(
      (a, b) => b[1] - a[1]
    );
    const top10Users = sortedUsers.slice(0, 10);
    const top10Display = top10Users
      .map(([id, count], index) => {
        const formattedName = formatUserName(id, interaction.guild!, client);
        return `${index + 1}. ${formattedName}: ${count} presences`;
      })
      .join('\n');

    const replyEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Activity information for ${interaction.guild!.name}`)
      .addFields(
        { name: '📊 Basic Stats', value: '\u200b' },
        { name: '🏆 Top 10 Active Users', value: top10Display },
        {
          name: `Total presences logged`,
          value: `${presences.length}`,
          inline: true,
        },
        { name: '👥 User Status', value: '\u200b' },
        {
          name: `Status Distribution`,
          value: `Online: ${userStatusCount.online}\nIdle: ${userStatusCount.idle}\nDND: ${userStatusCount.dnd}\nOffline: ${userStatusCount.offline}`,
          inline: true,
        },
        { name: '🎮 Most Common Activities', value: `${presenceRanking}` },
        { name: '🎵 Most Popular Songs', value: `${musicRanking}` }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [replyEmbed] });
  },
};
