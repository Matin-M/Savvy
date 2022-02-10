const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('accountinfo')
		.setDescription('replies with information about your discord account'),
	async execute(interaction) {
        var accDate = new Date(interaction.user.createdTimestamp).toLocaleDateString("en-US")
		var reply = `${interaction.user}, here are the details of your account:\n
		**Account created: ${accDate}
		Discord Tag: ${interaction.user.tag}
		Joined ${interaction.guild} on: ${new Date(interaction.guild.joinedTimestamp).toLocaleDateString("en-US")}
		Avatar:** ${interaction.user.displayAvatarURL()}`;
		await interaction.reply(reply);
	},
};