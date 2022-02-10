const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('accountinfo')
		.setDescription('replies with information about your discord account'),
	async execute(interaction) {
        var accDate = new Date(interaction.user.createdTimestamp).toLocaleDateString("en-US")
		var reply = `${interaction.user}, here are the details of your account:\nAccount created: **${accDate}**\nDiscord Tag: **${interaction.user.tag}**\nJoined ${interaction.guild} on: **${new Date(interaction.guild.joinedTimestamp).toLocaleDateString("en-US")}**\nAvatar: ${interaction.user.displayAvatarURL()}`;
		await interaction.reply(reply);
	},
};