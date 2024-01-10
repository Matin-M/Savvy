import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { ModelCtor, Model, Sequelize } from 'sequelize';
import { CustomClient } from '../types/CustomClient';
import { devAdminId } from '../config.json';

export default {
  data: new SlashCommandBuilder()
    .setName('replyonkeyword')
    .setDescription(
      'Auto-reply with phrase if message contains keyword. Optionally set phrase to <DELETE> or <CLEAR>'
    )
    .addStringOption((option) =>
      option
        .setName('keyword')
        .setDescription('Keyword to trigger auto-reply')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('phrase')
        .setDescription('Phrase to auto-reply with')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('case')
        .setDescription('If set to true, keyword is case-sensitive')
        .setRequired(false)
    ),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const replyEmbed = new EmbedBuilder();
    const adminRoles = interaction.guild!.roles.cache.find((role) => {
      if (role.permissions.toArray().includes('Administrator')) {
        return true;
      } else {
        return false;
      }
    });
    const adminArray = adminRoles!.members.map((m) => m.id);
    if (
      adminArray.includes(interaction.user.id) ||
      interaction.user.id == devAdminId
    ) {
      const keyword = interaction.options.getString('keyword');
      const phrase = interaction.options.getString('phrase');

      await Tags.update(
        {
          message_reply_keywords: Sequelize.fn(
            'array_append',
            Sequelize.col('message_reply_keywords'),
            `${keyword}`
          ),
        },
        { where: { guildId: interaction.guild!.id } }
      );
      await Tags.update(
        {
          message_reply_phrases: Sequelize.fn(
            'array_append',
            Sequelize.col('message_reply_phrases'),
            `${phrase}`
          ),
        },
        { where: { guildId: interaction.guild!.id } }
      );

      replyEmbed.setColor('#0099ff').setTimestamp();
      if (phrase === '<DELETE>') {
        replyEmbed.setTitle(
          `Savvy will delete a channel message if it contains the keyword ${keyword}`
        );
      } else if (phrase === '<CLEAR>') {
        replyEmbed.setTitle(
          `Savvy will no longer reply to messages containing keyword ${keyword}`
        );
      } else {
        replyEmbed.setTitle(
          `Savvy will reply with ${phrase} if a channel message contains the keyword ${keyword}`
        );
      }
    } else {
      replyEmbed
        .setColor('#FF0000')
        .setTitle(`You do not have the permission to use this command!`)
        .setTimestamp();
    }

    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};
