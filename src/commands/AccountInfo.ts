import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { ExecuteParams } from '../types/Command';

export default {
  data: new SlashCommandBuilder()
    .setName('accountinfo')
    .setDescription('Replies with information about your discord account'),
  async execute({ interaction }: ExecuteParams): Promise<void> {
    const accDate = new Date(
      interaction.user.createdTimestamp
    ).toLocaleDateString('en-US');
    const replyEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Account info for ${interaction.user.username}`)
      .addFields(
        { name: 'Account created', value: `**${accDate}**`, inline: true },
        {
          name: `Username`,
          value: `\t**${interaction.user.username}**`,
          inline: true,
        },
        {
          name: 'Discord tag',
          value: `\t**${interaction.user.discriminator}**`,
          inline: true,
        }
      )
      .setImage(`${interaction.user.displayAvatarURL()}`)
      .setTimestamp();
    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};
