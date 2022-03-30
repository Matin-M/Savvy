const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('savvystatus')
		.setDescription('returns savvys ping'),
	async execute(client, interaction) {
		const replyEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`Savvy's current status:`)
			.addFields(
				{ name: 'Uptime', value: `\t**${new Date(client.uptime).getHours()}**`, inline: true },
				{ name: '\tLast READY state', value: `**${client.readyAt.toLocaleDateString("en-US")}**`, inline: true },
				{ name: `\tCreated on`, value: `\t**${client.application.createdAt.toLocaleDateString("en-US")}**`, inline: true },
				{ name: `Created by`, value: `**${"Matin M"}**`, inline: true },
				{ name: `\tNumber of channels`, value: `\t**${client.channels.cache.size}**`, inline: true },
				{ name: `Number of guilds`, value: `**${client.guilds.cache.size}**`, inline: true },
			)
			.setTimestamp()
		await interaction.reply({embeds: [replyEmbed]});
	},
};