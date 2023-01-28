import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import { CustomClient } from '../types/CustomClient';

export default {
  data: new SlashCommandBuilder()
    .setName('proxydm')
    .setDescription('Use Savvy to direct message any user in this server')
    .addStringOption((option) =>
      option
        .setName('nickname')
        .setDescription('Discord username')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Message to send')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const nick = interaction.options.getString('nickname');
    const message = interaction.options.getString('message');
    const members = await interaction.guild!.members.fetch();
    const memberMap = members.map((u) => u.user);
    const selectedMember = memberMap.filter((member) => {
      if (String(member['username']) === String(nick)) {
        return member;
      }
    })[0];
    const replyEmbed = new EmbedBuilder().setColor('#0099ff').setTimestamp();
    try {
      const user = await client.users.fetch(selectedMember.id);
      await user.send(`Message from ${interaction.user.username}: ${message}`);
      replyEmbed.setTitle(`Sent ${message} to ${nick}`);
    } catch (error) {
      replyEmbed.setColor('#ff0000');
      replyEmbed.setTitle(`Oops! Something went wrong`);
      if (String(error).includes('undefined')) {
        replyEmbed.setDescription('User does not exist!');
      } else {
        replyEmbed.setDescription(`Error message: ${error}`);
      }
    }

    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};
