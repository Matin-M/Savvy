import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { makeFortniteAPIRequest } from '../helpers/utils';
import { Model, ModelCtor } from 'sequelize/types';
import { CustomClient } from '../types/CustomClient';

export default {
  data: new SlashCommandBuilder()
    .setName('fortnitestats')
    .setDescription('Get fortnite stats for a player')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription(
          'Epic games username. If not provided, stored username will be used.'
        )
        .setRequired(false)
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
    Tags: ModelCtor<Model<any, any>>,
    PresenceTable: ModelCtor<Model<any, any>>,
    ClientMessageLogs: ModelCtor<Model<any, any>>,
    PreferenceTable: ModelCtor<Model<any, any>>
  ) {
    const replyEmbed = new EmbedBuilder();
    let username = interaction.options.getString('username');
    const timespan = interaction.options.getBoolean('lifetime')
      ? 'lifetime'
      : 'season';

    if (!username) {
      const storedUsername = await PreferenceTable.findOne({
        where: { guildId: interaction.guild!.id, key: 'fortniteUsername' },
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
        value: username,
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
    replyEmbed
      .setTitle(
        `${data.account.name}'s ${timespan ? 'Season' : 'Lifetime'} Stats`
      )
      .addFields(
        {
          name: 'Playtime',
          value: `${(data.stats.all.overall.minutesPlayed / 60).toFixed(
            2
          )} Hours`,
          inline: true,
        },
        {
          name: 'Battlepass Level',
          value: `${data.battlePass.level}`,
          inline: true,
        },
        {
          name: 'Players Outlived',
          value: `${data.stats.all.overall.playersOutlived}`,
          inline: true,
        },
        {
          name: 'Score',
          value: `${data.stats.all.overall.score}`,
          inline: true,
        },
        {
          name: 'Score/min',
          value: `${data.stats.all.overall.scorePerMin}`,
          inline: true,
        },
        {
          name: 'Score/match',
          value: `${data.stats.all.overall.scorePerMatch}`,
          inline: true,
        },
        {
          name: 'Top 10',
          value: `${data.stats.all.overall.top10} finishes`,
          inline: true,
        },
        {
          name: 'Top 5',
          value: `${data.stats.all.overall.top5} finishes`,
          inline: true,
        },
        {
          name: 'Top 3',
          value: `${data.stats.all.overall.top3} finishes`,
          inline: true,
        }
      )
      .setImage(data.image);
    await interaction.reply({ embeds: [replyEmbed] });
  },
};
