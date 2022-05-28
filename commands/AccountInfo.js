const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('accountinfo')
		.setDescription('Replies with information about your discord account'),
	async execute(client, interaction) {
        var accDate = new Date(interaction.user.createdTimestamp).toLocaleDateString("en-US");
		var joinDate = interaction.user.joinedAt;
		const replyEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`Account info for ${interaction.user.username}`)
			.addFields(
				{ name: 'Account created:', value: `**${accDate}**`, inline: true },
				{ name: 'Discord tag', value: `\t**${interaction.user.tag}**`, inline: true },
				{ name: `Joined ${interaction.guild} on`, value: `\t**${joinDate}`, inline: true },
			)
			.setImage(`${interaction.user.displayAvatarURL()}`)
			.setTimestamp()
		await interaction.reply({embeds: [replyEmbed]});
	},
};