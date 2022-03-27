const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('replies with server info'),
	async execute(client, interaction) {
		const replyEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`Server info for ${interaction.guild.name}`)
			.addFields(
				{ name: 'Members', value: `\t**${interaction.guild.memberCount}**`, inline: true },
				{ name: '\tCreated on', value: `**${new Date(interaction.guild.createdTimestamp).toLocaleDateString("en-US")}**`, inline: true },
				{ name: `\tMax VC bitrate`, value: `\t**${interaction.guild.maximumBitrate} bits/s**`, inline: true },
				{ name: `Max members`, value: `**${interaction.guild.maximumMembers}**`, inline: true },
				{ name: `\tNumber of boosts`, value: `\t**${interaction.guild.premiumSubscriptionCount}**`, inline: true },
				{ name: `Server description`, value: `**${interaction.guild.description}**`, inline: true },
			)
			.setImage(`${interaction.guild.iconURL()}`)
			.setTimestamp()
		await interaction.reply({embeds: [replyEmbed]});
	},
};