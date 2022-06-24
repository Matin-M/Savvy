const { MessageActionRow, Modal, TextInputComponent } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { devAdminId } = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setroles")
    .setDescription("Set the roles that users can assign to themselves"),
  async execute(client, interaction, Tags) {
    const replyEmbed = new MessageEmbed();
    const adminRoles = interaction.guild.roles.cache.find((role) => {
      if (role.permissions.toArray().includes("ADMINISTRATOR")) {
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
      const modal = new Modal()
        .setCustomId("role-modal")
        .setTitle("Set the roles users can select");
      const roleInput = new TextInputComponent()
        .setCustomId("role-list")
        .setLabel("Comma separated role list (case sensitive)")
        .setPlaceholder(userRoles)
        .setRequired(false)
        .setStyle("PARAGRAPH");
      const firstActionRow = new MessageActionRow().addComponents(roleInput);
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
