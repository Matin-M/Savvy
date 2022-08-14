const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
} = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { devAdminId } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setroles")
    .setDescription("Set the roles that users can assign to themselves"),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder();
    const adminRoles = interaction.guild.roles.cache.find((role) => {
      if (role.permissions.toArray().includes("Administrator")) {
        return role;
      }
    });
    const adminArray = adminRoles.members.map((m) => m.id);
    if (
      adminArray.includes(interaction.user.id) ||
      interaction.user.id == devAdminId
    ) {
      const tag = await Tags.findOne({
        where: { guildId: interaction.guild.id },
      });
      let userRoles = tag.get("self_assign_roles");
      userRoles =
        !userRoles || userRoles.length == 0 || userRoles[0] == ""
          ? "i.e. Role1, Role2, Role3 ..."
          : userRoles.toString();
      const modal = new ModalBuilder()
        .setCustomId("role-modal")
        .setTitle("Set the roles users can select");
      const roleInput = new TextInputBuilder()
        .setCustomId("role-list")
        .setLabel("Comma separated role list (case sensitive)")
        .setPlaceholder(userRoles)
        .setRequired(false)
        .setStyle("Paragraph");
      const firstActionRow = new ActionRowBuilder().addComponents(roleInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else {
      replyEmbed
        .setColor("#FF0000")
        .setTitle(`You do not have the permission to use this command!`)
        .setTimestamp();
      await interaction.reply({ embeds: [replyEmbed] });
    }
  },
};
