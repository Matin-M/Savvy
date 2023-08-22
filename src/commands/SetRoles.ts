import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import { devAdminId } from '../config.json';
import { CustomClient } from '../types/CustomClient';

export default {
  data: new SlashCommandBuilder()
    .setName('setroles')
    .setDescription('Set the roles that users can assign to themselves'),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
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
      const tag = (await Tags.findOne({
        where: { guildId: interaction.guild!.id },
      }))!;
      const userRoles = tag.get('self_assign_roles') as [string];
      const roleString =
        !userRoles || userRoles[0] == ''
          ? 'i.e. Role1, Role2, Role3 ...'
          : userRoles.toString();
      const modal = new ModalBuilder()
        .setCustomId('role-modal')
        .setTitle('Set the roles users can select');
      const roleInput = new TextInputBuilder()
        .setCustomId('role-list')
        .setLabel('Comma separated role list (case sensitive)')
        .setPlaceholder(roleString)
        .setRequired(false)
        .setStyle(TextInputStyle.Paragraph);
      const firstActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(roleInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else {
      replyEmbed
        .setColor('#FF0000')
        .setTitle(`You do not have the permission to use this command!`)
        .setTimestamp();
      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
    }
  },
};
