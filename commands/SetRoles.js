const { MessageActionRow, Modal, TextInputComponent } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

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
      interaction.user.id == "192416580557209610"
    ) {
      const modal = new Modal().setCustomId("rolemodal").setTitle("Set Roles");
      const roleInput = new TextInputComponent()
        .setCustomId("role-list")
        .setLabel("Comma separated role list (case sensitive)")
        .setPlaceholder("i.e. Role1, Role2, Role3 ...")
        .setRequired(true)
        .setStyle("PARAGRAPH");
      const firstActionRow = new MessageActionRow().addComponents(roleInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else {
      replyEmbed
        .setColor("#FF0000")
        .setDescription(`You do not have the permission to use this command!`)
        .setTimestamp();
      await interaction.reply({ embeds: [replyEmbed] });
    }
  },
};
