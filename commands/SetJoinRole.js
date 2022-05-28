const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { Client, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('joinrole')
		.setDescription('set the role for a new user upon join').addStringOption(option =>
            option.setName('role')
                .setDescription('role name')
                .setRequired(true)),
	async execute(client, interaction, Tags) {
        const role = interaction.options.getString('role');
		const affectedRows = await Tags.update({ joinRole: role }, { where: { guildId: interaction.guild.id } });

		const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`New users will have their role set to **${role}**`)
          .setTimestamp();
		await interaction.reply({embeds: [replyEmbed]});
	},
};