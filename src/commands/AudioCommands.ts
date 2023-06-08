import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import ICommand from '../types/Command';
import { CustomClient } from '../types/CustomClient';
import { useQueue } from 'discord-player';

const Play = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(`Stream audio from YouTube videos into a VC`)
    .addStringOption((option) =>
      option
        .setName('video')
        .setDescription('Enter a YouTube link or search query')
        .setRequired(true)
    ),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const replyEmbed = new EmbedBuilder().setColor('#0099ff').setTimestamp();
    const query = interaction.options.getString('video') as string;
    const members = await interaction.guild!.members.fetch();
    const member = members.find((m) => m.id === interaction.user.id);
    const channel = member!.voice.channel;
    console.log(`[MusicPlayer]: ${interaction.guild!.id}`);
    try {
      const searchResult = await client.player.search(query, {
        requestedBy: interaction.user,
      });
      if (!searchResult.hasTracks()) {
        await interaction.reply(`We found no tracks for ${query}!`);
        return;
      } else {
        const { track } = await client.player.play(channel!, searchResult, {
          nodeOptions: {
            metadata: interaction,
          },
        });
        replyEmbed
          .setColor(track ? '#0099ff' : '#FF0000')
          .setDescription(
            `${track ? 'Now playing' : 'Unable to play'} **${
              track ? track : query
            }** in voice channel **${channel?.name}**`
          );
        await interaction.reply({
          embeds: [replyEmbed],
          ephemeral: track ? false : true,
          fetchReply: true,
        });
      }
    } catch (e) {
      console.log(`[MusicPlayerError]: ${e}`);
      // await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
    }
  },
};

const Pause = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription(`Pause the current video`),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const queue = useQueue(interaction.guildId!);
    if (!queue) {
      await interaction.reply(`No video is currently playing!`);
      return;
    }
    queue.node.setPaused(true);
    await interaction.reply(`Pausing playback`);
  },
};

const Resume = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription(`Resume the current video`),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const queue = useQueue(interaction.guildId!);
    if (!queue) {
      await interaction.reply(`No video is currently playing!`);
      return;
    }
    queue.node.setPaused(false);
    await interaction.reply(`Resuming playback`);
  },
};

const Stop = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription(
      `Stop the current video and disconnect from the voice channel`
    ),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const queue = useQueue(interaction.guildId!);
    if (!queue) {
      await interaction.reply(`No video is currently playing!`);
      return;
    }
    queue.delete();
    await interaction.reply(`Stopping playback and leaving voice channel`);
  },
};

const Skip = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription(`Skip the current video`),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const queue = useQueue(interaction.guildId!);
    if (!queue) {
      await interaction.reply(`No video is currently playing!`);
      return;
    }
    queue.node.skip();
    await interaction.reply(`Skipping current video`);
  },
};

const ClearQueue = {
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription(`Clear the queue`),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const queue = useQueue(interaction.guildId!);
    if (!queue) {
      await interaction.reply(`No video is currently playing!`);
      return;
    }
    queue.tracks.clear();
    await interaction.reply(`Clearing the queue`);
  },
};

const audioCommandList = [Play, Pause, Resume, Stop, Skip, ClearQueue];

export default audioCommandList as [ICommand];
