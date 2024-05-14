import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { devAdminId } from '../config.json';
import { ExecuteParams } from '../types/Command';

export default {
  data: new SlashCommandBuilder()
    .setName('setupdate')
    .setDescription('The text channel that Savvy will send updates to')
    .addStringOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel name')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('userleave')
        .setDescription('Disable or enable user leave messages')
        .setRequired(false)
    ),
  async execute({ interaction, Tags }: ExecuteParams): Promise<void> {
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
      interaction.user.id === devAdminId
    ) {
      const newChannel = interaction.options.getString('channel');
      const showLeaves = interaction.options.getBoolean('userleave');
      await Tags.update(
        {
          updateChannel: newChannel,
          displayLeaveMessages: showLeaves ? true : false,
        },
        { where: { guildId: interaction.guild!.id } }
      );

      replyEmbed
        .setColor('#0099ff')
        .setTitle(
          `Savvy will now send server updates to text channel ${newChannel}`
        )
        .setTimestamp();
    } else {
      replyEmbed
        .setColor('#FF0000')
        .setTitle(`You do not have the permission to use this command!`)
        .setTimestamp();
    }

    await interaction.reply({ ephemeral: true, embeds: [replyEmbed] });
  },
};
