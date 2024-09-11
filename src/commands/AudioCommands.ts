import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import ICommand from '../types/Command';
import { useQueue, useMainPlayer } from 'discord-player';
import { ExecuteParams } from '../types/Command';

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
  async execute({ interaction, PresenceTable }: ExecuteParams): Promise<void> {
    const replyEmbed = new EmbedBuilder().setColor('#0099ff').setTimestamp();
    const query = interaction.options.getString('video') as string;
    const members = await interaction.guild!.members.fetch();
    const member = members.find((m) => m.id === interaction.user.id);
    const channel = member!.voice.channel;
    const player = useMainPlayer();

    if (!channel) {
      replyEmbed
        .setColor('#FF0000')
        .setDescription('You need to join a voice channel first!');
      interaction.reply({ embeds: [replyEmbed], ephemeral: true });
      return;
    }
    if (!channel.joinable) {
      replyEmbed
        .setColor('#FF0000')
        .setDescription(
          'Savvy does not have permissions to join your voice channels!'
        );
      interaction.reply({ embeds: [replyEmbed], ephemeral: true });
      return;
    }

    try {
      await interaction.deferReply({
        ephemeral: false,
      });
      replyEmbed.setColor('#FFA500').setDescription('Searching for song...');
      await interaction.editReply({ embeds: [replyEmbed] });

      const searchResult = await player.search(query, {
        requestedBy: interaction.user,
      });
      if (!searchResult.hasTracks()) {
        replyEmbed
          .setColor('#FF0000')
          .setDescription(`We found no tracks for ${query}!`);
        interaction.editReply({ embeds: [replyEmbed] });
        return;
      }
      console.log(`[MusicPlayer] Playing track ${searchResult.tracks[0]}`);
      try {
        await player.play(channel, searchResult.tracks[0], {
          nodeOptions: {
            noEmitInsert: false,
            leaveOnStop: false,
            leaveOnEmpty: false,
            leaveOnEmptyCooldown: 60000,
            leaveOnEnd: false,
            leaveOnEndCooldown: 60000,
            pauseOnEmpty: true,
          },
          requestedBy: interaction.user,
          connectionOptions: {
            deaf: true,
          },
        });
      } catch (e) {
        replyEmbed.setColor('#FF0000').setDescription(`Error occurred: ${e}`);
        await interaction.editReply({ embeds: [replyEmbed] });
      }

      const track = searchResult.tracks[0];
      await PresenceTable.create({
        guildId: interaction.guild!.id,
        userId: interaction.user.id,
        timeStamp: new Date(),
        name: 'SavvyPlayer',
        type: 1337,
        url: track.url,
        details: track.title,
        state: track.author,
        largeText: track.requestedBy?.username,
        smallText: track.duration,
      }).catch((e) => {
        console.error(`[PlayerLoggingError]: ${e}`);
      });

      replyEmbed
        .setColor(track ? '#00FF00' : '#FF0000')
        .setDescription(
          `${track ? 'Now playing' : 'Unable to play'} **${
            track ? track.title : query
          }** in voice channel **${channel?.name}**`
        )
        .addFields(
          {
            name: `${track.url.includes('spotify.com') ? 'Artist' : 'Channel'}`,
            value: `${track.author}`,
            inline: true,
          },
          {
            name: 'Views',
            value: `${track.url.includes('spotify.com') ? 'N/A' : track.views}`,
            inline: true,
          },
          {
            name: 'Duration',
            value: `${track.duration}`,
            inline: true,
          },
          {
            name: 'URL',
            value: track.url,
            inline: true,
          }
        )
        .setImage(track.thumbnail);
      await interaction.editReply({
        embeds: [replyEmbed],
      });
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
  async execute({ interaction }: ExecuteParams): Promise<void> {
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
  async execute({ interaction }: ExecuteParams): Promise<void> {
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
  async execute({ interaction }: ExecuteParams): Promise<void> {
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
  async execute({ interaction }: ExecuteParams): Promise<void> {
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
  async execute({ interaction }: ExecuteParams): Promise<void> {
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
