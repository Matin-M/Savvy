import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import ICommand from '../types/Command';
import { CustomClient } from '../types/CustomClient';

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
    const videoLink = interaction.options.getString('video') as string;
    const members = await interaction.guild!.members.fetch();
    const member = members.find((m) => m.id === interaction.user.id);
    console.log(`[MusicPlayer]: ${interaction.guild!.id}`);
    try {
      const guildQueue = client.player.getQueue(interaction.guild!.id);
      const queue = client.player.createQueue(interaction.guild!.id);
      await queue.join(member!.voice.channel?.id as string);
      replyEmbed.setDescription('Fetching video...');
      await interaction.reply({
        embeds: [replyEmbed],
        ephemeral: false,
        fetchReply: true,
      });

      const video = await queue.play(videoLink).catch((err) => {
        replyEmbed.setColor('#FF0000').setDescription(`Invalid search query!`);
        if (!guildQueue) queue.stop();
      });
      replyEmbed
        .setColor(video ? '#0099ff' : '#FF0000')
        .setDescription(
          `${video ? 'Now playing' : 'Unable to play'} **${
            video ? video : videoLink
          }** in voice channel **${queue.connection!.channel.name}**`
        );
      await interaction.editReply({ embeds: [replyEmbed] });
    } catch (e) {
      replyEmbed.setColor('#FF0000').setDescription(`${e}`);
      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
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
    const replyEmbed = new EmbedBuilder().setColor('#FF0000').setTimestamp();
    try {
      const queue = client.player.getQueue(interaction.guild!.id);
      queue!.setPaused(true);
      replyEmbed.setColor('#ffcc00').setDescription(`Pausing playback`);
    } catch (e) {
      replyEmbed
        .setColor('#FF0000')
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

const Resume = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription(`Resuming the current video`),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const replyEmbed = new EmbedBuilder().setColor('#FF0000').setTimestamp();
    try {
      const queue = client.player.getQueue(interaction.guild!.id);
      queue!.setPaused(false);
      replyEmbed.setColor('#ffcc00').setDescription(`Resuming playback`);
    } catch (e) {
      replyEmbed
        .setColor('#FF0000')
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
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
    const replyEmbed = new EmbedBuilder().setColor('#FF0000').setTimestamp();
    try {
      const queue = client.player.getQueue(interaction.guild!.id);
      queue!.stop();
      replyEmbed
        .setColor('#ffcc00')
        .setDescription(`Stopping playback and leaving voice channel`);
    } catch (e) {
      replyEmbed
        .setColor('#FF0000')
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
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
    const replyEmbed = new EmbedBuilder().setColor('#FF0000').setTimestamp();
    try {
      const queue = client.player.getQueue(interaction.guild!.id);
      queue!.skip();
      replyEmbed.setColor('#ffcc00').setDescription(`Skipping current video`);
    } catch (e) {
      replyEmbed
        .setColor('#FF0000')
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
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
    const replyEmbed = new EmbedBuilder().setColor('#FF0000');
    try {
      const queue = client.player.getQueue(interaction.guild!.id);
      queue!.skip();
      replyEmbed.setColor('#ffcc00').setDescription(`Clearing the queue`);
    } catch (e) {
      replyEmbed
        .setColor('#FF0000')
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

const VideoProgress = {
  data: new SlashCommandBuilder()
    .setName('videoprogress')
    .setDescription(`Show video progress`),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const replyEmbed = new EmbedBuilder().setColor('#FF0000');
    try {
      const queue = client.player.getQueue(interaction.guild!.id);
      const ProgressBar = queue!.createProgressBar();
      replyEmbed.setColor('#ffcc00').setDescription(ProgressBar.prettier);
    } catch (e) {
      replyEmbed
        .setColor('#FF0000')
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

const audioCommandList = [
  Play,
  Pause,
  Resume,
  Stop,
  Skip,
  ClearQueue,
  VideoProgress,
];

export default audioCommandList as [ICommand];
