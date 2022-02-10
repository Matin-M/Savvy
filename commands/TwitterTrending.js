const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('twitter')
		.setDescription('Gets the trending topics on twitter'),
	async execute(interaction) {
		await interaction.reply("In progress");
	},
};