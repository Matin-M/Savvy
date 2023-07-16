import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import ICommand from '../types/Command';
import { CustomClient } from '../types/CustomClient';
import { useQueue, useMasterPlayer } from 'discord-player';

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
    const player = useMasterPlayer()!;

    if (!channel) {
      replyEmbed
        .setColor('#FF0000')
        .setDescription('You need to join a voice channel first!');
      return interaction.reply({ embeds: [replyEmbed], ephemeral: true });
    }
    if (!channel.joinable) {
      replyEmbed
        .setColor('#FF0000')
        .setDescription(
          'I do not have permissions to join your voice channels!'
        );
      return interaction.reply({ embeds: [replyEmbed], ephemeral: true });
    }

    try {
      await interaction.deferReply({
        ephemeral: false,
      });
      replyEmbed
        .setColor('#FFA500')
        .setDescription('Searching for your song...');
      await interaction.editReply({ embeds: [replyEmbed] });

      const searchResult = await player.search(query, {
        requestedBy: interaction.user,
      });
      if (!searchResult.hasTracks()) {
        replyEmbed
          .setColor('#FF0000')
          .setDescription(`We found no tracks for ${query}!`);
        return interaction.editReply({ embeds: [replyEmbed] });
      } else {
        const { track } = await player.play(channel, searchResult, {
          nodeOptions: {
            metadata: interaction,
          },
        });
        replyEmbed
          .setColor(track ? '#00FF00' : '#FF0000')
          .setDescription(
            `${track ? 'Now playing' : 'Unable to play'} **${
              track ? track : query
            }** in voice channel **${channel?.name}**`
          );
        await interaction.editReply({
          embeds: [replyEmbed],
        });
      }
    } catch (e) {
      console.log(`[MusicPlayerError]: ${e}`);
      replyEmbed.setColor('#FF0000').setDescription(`Error occurred: ${e}`);
      await interaction.editReply({ embeds: [replyEmbed] });
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
