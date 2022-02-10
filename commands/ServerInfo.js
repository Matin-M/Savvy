const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('replies with server info'),
	async execute(interaction) {
		await interaction.reply(`Number of members: **${interaction.guild.memberCount}**\nCreated on: **${new Date(interaction.guild.createdTimestamp).toLocaleDateString("en-US")}**\nMax VC bitrate: **${interaction.guild.maximumBitrate}**`);
	},
};