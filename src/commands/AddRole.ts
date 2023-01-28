import {
  SlashCommandBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
} from '@discordjs/builders';
import {
  APIActionRowComponent,
  APIMessageActionRowComponent,
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Model, ModelCtor } from 'sequelize/types';
import { CustomClient } from '../types/CustomClient';

export default {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Give yourself a role'),
  async execute(
    client: CustomClient,
    interaction: ChatInputCommandInteraction<CacheType>,
    Tags: ModelCtor<Model<any, any>>
  ) {
    const replyEmbed = new EmbedBuilder();
    const tag = await Tags.findOne({
      where: { guildId: interaction.guild!.id },
    });
    const userRoles = tag!.get('self_assign_roles') as string[];
    if (!userRoles || userRoles.length == 0 || userRoles[0] == '') {
      replyEmbed
        .setColor('#ffcc00')
        .setTitle(`No roles available at this time`)
        .setTimestamp();
      interaction.reply({ embeds: [replyEmbed], ephemeral: true });
      return;
    }
    const userRoleList = userRoles.map((role) => {
      return {
        label: role,
        description: 'Click to select role',
        value: role,
      };
    });
    console.log(userRoleList);
    const row = new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId('role-selector')
        .setPlaceholder('...')
        .addOptions(userRoleList)
    );
    replyEmbed.setColor('#0099ff').setDescription(`Please select a role`);
    await interaction.reply({
      embeds: [replyEmbed],
      components: [
        row as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
      ],
      ephemeral: true,
    });
  },
};
