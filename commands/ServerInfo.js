const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('replies with server info'),
	async execute(interaction) {
		const replyEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`Server info for ${interaction.guild.name}`)
			.addFields(
				{ name: 'Members', value: `**${interaction.guild.memberCount}**`, inline: true },
				{ name: 'Created on', value: `**${new Date(interaction.guild.createdTimestamp).toLocaleDateString("en-US")}**`, inline: true },
				{ name: `Max VC bitrate`, value: `**${interaction.guild.maximumBitrate}**`, inline: true },
				{ name: `Max members`, value: `**${interaction.guild.maximumMembers}**`, inline: true },
				{ name: `Number of boosts:`, value: `**${interaction.guild.premiumSubscriptionCount}**`, inline: true },
			)
			.setImage(`${interaction.guild.iconURL()}`)
			.setTimestamp()
		await interaction.reply({embeds: [replyEmbed]});
	},
};