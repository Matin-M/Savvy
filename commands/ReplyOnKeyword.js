const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { Client, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('replyonkeyword')
		.setDescription('replies to message with supplied phrase containing the supplied keyword').addStringOption(option =>
            option.setName('keyword')
                .setDescription('keyword')
                .setRequired(true)).addStringOption(option =>
            option.setName('phrase')
                .setDescription('phrase')
                .setRequired(true)),
	async execute(client, interaction) {
        const keyword = interaction.options.getString('keyword');
        const phrase = interaction.options.getString('phrase');
        fs.appendFile('MessageReplyList.txt', `${interaction.guild.id}+${keyword}+${phrase}\n`, err => {
			if (err) {
			  console.error(err);
			  return
			}
		})
        const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`${interaction.user.username}, Savvy will reply with **${phrase}** when a user mentions **${keyword}**`)
          .setTimestamp();
		await interaction.reply({embeds: [replyEmbed]});
	},
};