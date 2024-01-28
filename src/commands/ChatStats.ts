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
    .setName('chatstats')
    .setDescription('Returns chat statistics'),
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
      .setTitle(`Chat stats for ${interaction.guild!.name}`)
      .addFields(
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
      .setTimestamp();
    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};