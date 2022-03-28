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
	async execute(client, interaction) {
        const role = interaction.options.getString('role');
		fs.appendFile('Data/JoinRoleList.txt', `${interaction.guild.id}+${role}\n`, err => {
			if (err) {
			  console.error(err);
			  return
			}
		})
		const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`New uses will have their role set to ${role}`)
          .setTimestamp();
		await interaction.reply({embeds: [replyEmbed]});
	},
};