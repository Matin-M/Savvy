import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import { CustomClient } from '../types/CustomClient';
import { keySort, wordFreq } from '../helpers/utils';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Returns info about this discord server'),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const tag = (await Tags.findOne({
      where: { guildId: interaction.guild!.id },
    }))!;
    const messages = [
      ...new Set(tag.get('user_message_logs') as [Record<string, any>]),
    ];
    const deleted_messages = [
      ...new Set(tag.get('deleted_user_message_logs') as string[]),
    ];
    const freq = wordFreq(
      messages.map((msg) => msg.userMessage as string) as [string]
    );
    const freqTable = keySort(freq, (item) => item);

    const members = await interaction.guild!.members.fetch();
    const userFreq = wordFreq(
      messages.map((msg) => msg.userID as string) as [string]
    );
    const userFreqTable = keySort(userFreq, (userID) =>
      members.find((member) => member.id === userID)
    );

    const replyEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Server info for ${interaction.guild!.name}`)
      .addFields(
        {
          name: 'Member count',
          value: `\t**${interaction.guild!.memberCount}**`,
          inline: true,
        },
        {
          name: '\tCreated on',
          value: `**${new Date(
            interaction.guild!.createdTimestamp
          ).toLocaleDateString('en-US')}**`,
          inline: true,
        },
        {
          name: `\tMax VC bitrate`,
          value: `\t**${interaction.guild!.maximumBitrate / 1000} kbps**`,
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
          value: `**${interaction.guild!.id}**`,
          inline: true,
        },
        {
          name: `Word frequency`,
          value: `**${freqTable}**`,
          inline: true,
        },
        {
          name: `Most active chatters`,
          value: `**${userFreqTable}**`,
          inline: true,
        }
      )
      .setImage(
        `${
          interaction.guild!.iconURL()
            ? interaction.guild!.iconURL()
            : 'https://us.123rf.com/450wm/pavelstasevich/pavelstasevich1811/pavelstasevich181101028/pavelstasevich181101028.jpg'
        }`
      )
      .setTimestamp();
    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};