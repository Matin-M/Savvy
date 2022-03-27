const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setupdate')
		.setDescription('channel used to display user status').addStringOption(option =>
            option.setName('channel')
                .setDescription('channel name')
                .setRequired(true)),
	async execute(client, interaction) {
		await interaction.reply('In progress');
	},
};