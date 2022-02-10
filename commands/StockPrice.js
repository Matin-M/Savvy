const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stock')
		.setDescription('Replies with user supplied string').addStringOption(option =>
            option.setName('input')
                .setDescription('The input to echo back')
                .setRequired(true)),
	async execute(interaction) {
		const clientName = interaction.user.username;
        const inputParam = interaction.options.getString('input');
		await interaction.reply(clientName + ", you just said: " + inputParam);
	},
};