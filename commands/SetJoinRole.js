const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('joinrole')
		.setDescription('set the role for a new user upon join').addStringOption(option =>
            option.setName('role')
                .setDescription('role name')
                .setRequired(true)),
	async execute(interaction) {
		const clientName = interaction.user.username;
        const inputParam = interaction.options.getString('input');
		await interaction.reply(clientName + ", you just said: " + inputParam);
	},
};