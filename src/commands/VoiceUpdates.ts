import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { ExecuteParams } from '../types/Command';
import { Sequelize } from 'sequelize';

export default {
  data: new SlashCommandBuilder()
    .setName('voiceupdates')
    .setDescription(
      'Savvy will ping you when a user connects to any voice channel in this server'
    ),
  async execute({ interaction, Tags }: ExecuteParams): Promise<void> {
    const replyEmbed = new EmbedBuilder();
    const tag = (await Tags.findOne({
      where: { guildId: interaction.guild!.id },
    }))!;
    const subscribedUsers = tag.get('voice_subscribers_list') as string[];
    if (subscribedUsers.includes(interaction.user.id)) {
      replyEmbed
        .setColor('#ffcc00')
        .setTitle(
          `${interaction.user.username}, you will no longer receive voice status updates in this server`
        )
        .setTimestamp();
      Tags.update(
        {
          voice_subscribers_list: subscribedUsers.filter(
            (user) => user != interaction.user.id
          ),
        },
        { where: { guildId: interaction.guild!.id } }
      );
    } else {
      await Tags.update(
        {
          voice_subscribers_list: Sequelize.fn(
            'array_append',
            Sequelize.col('voice_subscribers_list'),
            `${interaction.user.id}`
          ),
        },
        { where: { guildId: interaction.guild!.id } }
      );

      replyEmbed
        .setColor('#00FF00')
        .setTitle(
          `${interaction.user.username}, you will now receive status updates for voice channels in this server`
        )
        .setTimestamp();
    }

    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};
