const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { Client, MessageEmbed } = require('discord.js');
const {dbConnectionString} = require('../config.json');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(dbConnectionString);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('voiceupdates')
		.setDescription('Savvy will ping you when a user connects to any voice channel in this server'),
	async execute(client, interaction, Tags) {
		Tags.update({'voice_subscribers_list': sequelize.fn('array_append', sequelize.col('voice_subscribers_list'), `${interaction.user.id}`)}, { where: { guildId: interaction.guild.id } });

		const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`**${interaction.user.username}**, you will now receive status updates for voice channels in this server.`)
          .setTimestamp();
		await interaction.reply({embeds: [replyEmbed]});
	},
};