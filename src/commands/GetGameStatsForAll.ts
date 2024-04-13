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
    .setName('getallfortnitestats')
    .setDescription('Get fortnite stats for all players in server')
    .addStringOption((option) =>
      option
        .setName('usernames')
        .setDescription(
          'A list of comma separated Epic Games usernames. If not provided, stored usernames will be used.'
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
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>,
    PresenceTable: ModelCtor<Model<any, any>>,
    ClientMessageLogs: ModelCtor<Model<any, any>>,
    PreferenceTable: ModelCtor<Model<any, any>>
  ) {
    const replyEmbed = new EmbedBuilder();
    const usernames = interaction.options.getString('usernames');
    const timespan = interaction.options.getBoolean('lifetime')
      ? 'lifetime'
      : 'season';
    const usernamesArray = [];
    if (usernames) {
      usernamesArray.push(
        ...usernames.split(',').map((username) => username.trim())
      );
      await PreferenceTable.upsert({
        guildId: interaction.guild!.id,
        key: 'fortniteUsernameList',
        value: usernames,
        classId: interaction.user.id,
      });
    } else {
      const storedUserNames = (await PreferenceTable.findOne({
        where: {
          guildId: interaction.guild!.id,
          key: 'fortniteUsernameList',
        },
      }))!;
      if (!storedUserNames || !storedUserNames.get('value')) {
        replyEmbed
          .setColor([255, 0, 0])
          .setTitle('Error!')
          .setDescription('No usernames found');
        interaction.reply({ embeds: [replyEmbed], ephemeral: true });
        return;
      }
      (storedUserNames.get('value') as string)
        .split(',')
        .forEach((username) => {
          usernamesArray.push(username);
        });
    }

    let result = '';
    for (const username of usernamesArray) {
      const response = await makeFortniteAPIRequest(username, timespan);
      if (!response) {
        replyEmbed
          .setColor([255, 0, 0])
          .setTitle('Error!')
          .setDescription('A user with the specified username was not found');
        interaction.reply({ embeds: [replyEmbed], ephemeral: true });
        return;
      }
      const data = response.data;
      result +=
        `**${data.account.name}'s ${
          timespan ? 'Season' : 'Lifetime'
        } Stats**\n` +
        `***Playtime***: ${(data.stats.all.overall.minutesPlayed / 60).toFixed(
          2
        )} Hours\n` +
        `***BP Level***: ${data.battlePass.level}\n` +
        `***Outlived***: ${data.stats.all.overall.playersOutlived}\n` +
        `***Score***: ${data.stats.all.overall.score} (***Per Min***: ${data.stats.all.overall.scorePerMin}, ***Per Match***: ${data.stats.all.overall.scorePerMatch})\n` +
        `***Top Finishes***: ***10***: ${data.stats.all.overall.top10}, ***5***: ${data.stats.all.overall.top5}, ***3***: ${data.stats.all.overall.top3}\n` +
        `${data.image}\n\n`;
    }

    interaction.reply(result);
  },
};
