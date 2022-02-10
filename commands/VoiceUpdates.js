const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('voiceupdates')
		.setDescription('dms you when any user joins a specific voice channel'),
	async execute(interaction) {
		fs.appendFile('VoiceUpdateList.txt', `${interaction.guild.id}+${interaction.user.id}\n`, err => {
			if (err) {
			  console.error(err);
			  return
			}
		})
		await interaction.reply(`${interaction.user}, you will now receive status updates for voice channels in this server.`);
	},
};