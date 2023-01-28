import { SlashCommandBuilder } from '@discordjs/builders';
import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import { CustomClient } from '../types/CustomClient';

export default {
  data: new SlashCommandBuilder()
    .setName('latency')
    .setDescription(`Returns Savvy's ping`),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const sent = await interaction.reply({
      content: 'Pinging...',
      fetchReply: true,
    });
    interaction.editReply(
      `Roundtrip latency: **${
        sent.createdTimestamp - interaction.createdTimestamp
      }ms**`
    );
  },
};
