import { SlashCommandBuilder } from '@discordjs/builders';
import { ExecuteParams } from '../types/Command';

export default {
  data: new SlashCommandBuilder()
    .setName('latency')
    .setDescription(`Returns Savvy's ping`),
  async execute({ interaction }: ExecuteParams): Promise<void> {
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
