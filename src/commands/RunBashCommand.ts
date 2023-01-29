import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { ModelCtor, Model } from 'sequelize';
import { CustomClient } from '../types/CustomClient';
import * as child from 'child_process';
import { sendMessageToChannel } from '../helpers/utils';
import { devAdminId } from '../config.json';

export default {
  data: new SlashCommandBuilder()
    .setName('runbash')
    .setDescription(`Runs a shell command on Savvy's host system`)
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('command')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('args')
        .setDescription('arguments')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const command = interaction.options.getString('command')!;
    const guild = interaction.guild!;
    const channel = interaction.channelId;

    let commandArgs: string[] = [];
    if (interaction.options.getString('args') != null) {
      commandArgs = interaction.options.getString('args')!.split(' ');
    }

    const replyEmbed = new EmbedBuilder().setTimestamp();
    if (interaction.user.id != devAdminId) {
      replyEmbed.setTitle(
        'This command is reserved for Savvy developers only!'
      );
      replyEmbed.setColor('#ff0000');
      interaction.reply({ embeds: [replyEmbed] });
      return;
    } else {
      replyEmbed.setTitle(command);
    }

    const process: child.ChildProcess = child.spawn(command, commandArgs);

    process.stdout!.on('data', (data: string) => {
      console.log(`stdout: ${data}`);
      sendMessageToChannel(`**stdout:** \n${data}`, guild, channel);
    });

    process.stderr!.on('data', (data: string) => {
      console.log(`stderr: ${data}`);
      sendMessageToChannel(`**stderr:** \n${data}`, guild, channel);
    });

    process.stdin!.on('data', (input) => {
      console.log(`stdin: ${input}`);
      // sendMessageToChannel(data, interaction);
    });

    process.on('close', (code: string) => {
      console.log(`child process exited with code ${code}`);
      sendMessageToChannel(
        `**Child process exited with code:** ${code}`,
        guild,
        channel
      );
    });

    await interaction.reply('Executing...');
  },
};
