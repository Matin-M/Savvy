import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { keywordSort, wordFreq } from '../helpers/utils';
import { ExecuteParams } from '../types/Command';

export default {
  data: new SlashCommandBuilder()
    .setName('chatstats')
    .setDescription('Returns chat statistics'),
  async execute({
    interaction,
    ClientMessageLogs,
  }: ExecuteParams): Promise<void> {
    const messages = (await ClientMessageLogs.findAll({
      where: { guildId: interaction.guild!.id },
    }))!;
    const freq = wordFreq(
      messages.map((msg) => msg.get('contents') as string) as [string]
    );
    const freqTable = keywordSort(freq, (item) => item);

    const members = await interaction.guild!.members.fetch();
    const userFreq = wordFreq(
      messages.map((msg) => msg.get('userId') as string) as [string]
    );
    const userFreqTable = keywordSort(userFreq, (userID) =>
      members.find(
        (member) =>
          member.id === userID && !member.user.bot && member.user.username
      )
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
