const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { Client, MessageEmbed } = require('discord.js');
const {dbConnectionString} = require('../config.json');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(dbConnectionString);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('replyonkeyword')
		.setDescription('Replies with phrase if any channel message contains keyword').addStringOption(option =>
            option.setName('keyword')
                .setDescription('keyword')
                .setRequired(true)).addStringOption(option =>
            option.setName('phrase')
                .setDescription('phrase')
                .setRequired(true)),
	async execute(client, interaction, Tags) {
        const replyEmbed = new MessageEmbed();
        const adminRoles = interaction.guild.roles.cache.find((role) => {
			if(role.permissions.toArray().includes('ADMINISTRATOR')){
				return role;
			}
		});
		const adminArray = adminRoles.members.map(m => m.id);
		if(adminArray.includes(interaction.user.id) || interaction.user.id == '192416580557209610'){
            const keyword = interaction.options.getString('keyword');
            const phrase = interaction.options.getString('phrase');

            await Tags.update({'message_reply_keywords': sequelize.fn('array_append', sequelize.col('message_reply_keywords'), `${keyword}`)}, { where: { guildId: interaction.guild.id } });
            await Tags.update({'message_reply_phrases': sequelize.fn('array_append', sequelize.col('message_reply_phrases'), `${phrase}`)}, { where: { guildId: interaction.guild.id } });

            replyEmbed.setColor('#0099ff')
            .setDescription(`${interaction.user.username}, Savvy will reply with **${phrase}** when a users' message contains **${keyword}**`)
            .setTimestamp();
        }else{
            replyEmbed.setColor('#FF0000')
            .setDescription(`You do not have the permission to use this command!`)
            .setTimestamp();
        }
        
		await interaction.reply({embeds: [replyEmbed]});
	},
};