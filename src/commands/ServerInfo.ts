import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { ExecuteParams } from '../types/Command';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Returns info about this discord server'),
  async eexecute({ interaction }: ExecuteParams): Promise<void> {
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
          name: `Server ID`,
          value: `**${interaction.guild!.id}**`,
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
