import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { ExecuteParams } from '../types/Command';
import { devAdminId } from '../config.json';

export default {
  data: new SlashCommandBuilder()
    .setName('setpref')
    .setDescription('Set preference manually')
    .addStringOption((option) =>
      option.setName('key').setDescription('Preference key').setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('value')
        .setDescription('Preference value')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('classid').setDescription('Class ID').setRequired(false)
    ),
  async execute({
    interaction,
    PreferenceTable,
  }: ExecuteParams): Promise<void> {
    const replyEmbed = new EmbedBuilder();
    const key = interaction.options.getString('key');
    const value = interaction.options.getString('value');
    const classId = interaction.options.getString('classid');

    if (interaction.user.id !== devAdminId) {
      replyEmbed
        .setColor([255, 0, 0])
        .setTitle('Permission denied, reserved for bot owner');
      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
      return;
    }

    await PreferenceTable.upsert({
      guildId: interaction.guild!.id,
      key: key || null,
      value: value || null,
      classId: classId || null,
    });

    replyEmbed.setTitle('Set values successfully').addFields(
      {
        name: 'Key',
        value: key || 'N/A',
        inline: true,
      },
      {
        name: 'Value',
        value: value !== null ? value.toString() : 'N/A',
        inline: true,
      },
      {
        name: 'ClassID',
        value: classId || 'N/A',
        inline: true,
      }
    );

    await interaction.reply({ embeds: [replyEmbed] });
  },
};
