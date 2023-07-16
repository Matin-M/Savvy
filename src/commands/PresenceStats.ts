import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import { CustomClient } from '../types/CustomClient';
import { keywordFreq, keywordSort } from '../helpers/utils';

export default {
  data: new SlashCommandBuilder()
    .setName('activitystats')
    .setDescription('Returns number of occurances for user activities'),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>,
    PresenceTable: ModelCtor<Model<any, any>>
  ) {
    await interaction.deferReply({ ephemeral: true });

    // User presence
    const presences = (await PresenceTable.findAll({
      where: { guildId: interaction.guild!.id },
    }))!;
    let presenceMap = {};
    let musicMap = {};
    presences.forEach((t) => {
      if (
        t.get('name') === 'No Activity' ||
        t.get('name') === 'Custom Status'
      ) {
        return;
      }
      presenceMap = keywordFreq(presenceMap, t.get('name') as string, false);
      if (t.get('name') === 'Spotify' || t.get('name') === 'Apple Music') {
        musicMap = keywordFreq(
          musicMap,
          `⁍ \`${t.get('largeText')}\` by \`${t.get('state')}\``,
          false
        );
      }
    });
    const presenceRanking = keywordSort(presenceMap, (item) => item);
    const musicRanking = keywordSort(musicMap, (item) => item);

    const replyEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Activity information for ${interaction.guild!.name}`)
      .addFields({
        name: `Most common activities`,
        value: `**${presenceRanking}**`,
        inline: true,
      })
      .addFields({
        name: `Most popular songs`,
        value: `**${musicRanking}**`,
        inline: true,
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [replyEmbed] });
  },
};
