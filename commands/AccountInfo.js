const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('accountinfo')
		.setDescription('replies with information about your discord account'),
	async execute(interaction) {
        var accDate = new Date(interaction.user.createdTimestamp).toLocaleDateString("en-US");
		const replyEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`Account info for ${interaction.user.username}`)
			.addFields(
				{ name: 'Account created', value: `**${accDate}**`, inline: true },
				{ name: 'Discord tag', value: `**${interaction.user.tag}**`, inline: true },
				{ name: `Joined ${interaction.guild} on`, value: `**${new Date(interaction.guild.joinedTimestamp).toLocaleDateString("en-US")}**`, inline: true },
			)
			.setImage(`${interaction.user.displayAvatarURL()}`)
			.setTimestamp()
		//var reply = `${interaction.user}, here are the details of your account:\nAccount created: **${accDate}**\nDiscord Tag: **${interaction.user.tag}**\nJoined ${interaction.guild} on: **${new Date(interaction.guild.joinedTimestamp).toLocaleDateString("en-US")}**\nAvatar: ${interaction.user.displayAvatarURL()}`;
		await interaction.reply({embeds: [replyEmbed]});
	},
};