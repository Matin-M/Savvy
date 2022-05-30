const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { Client, MessageEmbed } = require('discord.js');
const {dbConnectionString} = require('../config.json');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(dbConnectionString);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('replyonkeyword')
		.setDescription('Replies withsupplied phrase if any channel message contains supplied keyword').addStringOption(option =>
            option.setName('keyword')
                .setDescription('keyword')
                .setRequired(true)).addStringOption(option =>
            option.setName('phrase')
                .setDescription('phrase')
                .setRequired(true)),
	async execute(client, interaction, Tags) {
        const keyword = interaction.options.getString('keyword');
        const phrase = interaction.options.getString('phrase');

        Tags.update({'message_reply_keywords': sequelize.fn('array_append', sequelize.col('message_reply_keywords'), `${keyword}`)}, { where: { guildId: interaction.guild.id } });
        Tags.update({'message_reply_phrases': sequelize.fn('array_append', sequelize.col('message_reply_phrases'), `${phrase}`)}, { where: { guildId: interaction.guild.id } });

        const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`${interaction.user.username}, Savvy will reply with **${phrase}** when a users' message contains **${keyword}**`)
          .setTimestamp();
		await interaction.reply({embeds: [replyEmbed]});
	},
};