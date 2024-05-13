import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { devAdminId } from '../config.json';
import { ExecuteParams } from '../types/Command';

export default {
  data: new SlashCommandBuilder()
    .setName('joinrole')
    .setDescription(
      'The role that new users will get upoun joining this server'
    )
    .addStringOption((option) =>
      option
        .setName('role')
        .setDescription('role name')
        .setRequired(true)
        .setAutocomplete(true)
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
      interaction.user.id == devAdminId
    ) {
      const role = interaction.options.getString('role');
      await Tags.update(
        { joinRole: role },
        { where: { guildId: interaction.guild!.id } }
      );

      replyEmbed
        .setColor('#0099ff')
        .setTitle(`New users will have their role set to ${role}`)
        .setTimestamp();
    } else {
      replyEmbed
        .setColor('#FF0000')
        .setTitle(`You do not have the permission to use this command!`)
        .setTimestamp();
    }

    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};
