const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { Client, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('voiceupdates')
		.setDescription('dms you when any user joins a specific voice channel'),
	async execute(client, interaction) {
		fs.appendFile('Data/VoiceUpdateList.txt', `${interaction.guild.id}+${interaction.user.id}\n`, err => {
			if (err) {
			  console.error(err);
			  return
			}
		})
		const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`${interaction.user.username}, you will now receive status updates for voice channels in this server.`)
          .setTimestamp();
		await interaction.reply({embeds: [replyEmbed]});
	},
};