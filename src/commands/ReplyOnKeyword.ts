import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { ModelCtor, Model } from 'sequelize';
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
    ),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>,
    PresenceTable: ModelCtor<Model<any, any>>,
    ClientMessageLogs: ModelCtor<Model<any, any>>,
    PreferenceTable: ModelCtor<Model<any, any>>
  ) {
    const replyEmbed = new EmbedBuilder();
    const isAdmin = interaction.guild!.members.cache.map((m) =>
      m.roles.cache.map((r) =>
        r.permissions.toArray().includes('Administrator')
      )
    );
    if (isAdmin || interaction.user.id == devAdminId) {
      const keyword = interaction.options
        .getString('keyword')!
        .trim()
        .toLowerCase();
      const phrase = interaction.options
        .getString('phrase')!
        .trim()
        .toLowerCase();

      await PreferenceTable.upsert({
        guildId: interaction.guild!.id,
        key: 'keywordReply',
        value: keyword,
        classId: phrase,
      });

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
