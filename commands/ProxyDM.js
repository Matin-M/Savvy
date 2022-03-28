const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('proxydm')
		.setDescription('direct message any user via savvy').addStringOption(option =>
            option.setName('userid')
                .setDescription('unique user UUID')
                .setRequired(true))
			.addStringOption(option =>
            option.setName('message')
                .setDescription('message to send')
                .setRequired(true)),
	async execute(client, interaction) {
        const userID = interaction.options.getString('userid');
		const message = interaction.options.getString('message');
		const user = await client.users.fetch(userID);
		var replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTimestamp();
		
		  try{
			await user.send(message);
			replyEmbed.setTitle(`Sent ${message} to userID ${userID}`)
		}catch(error){
			replyEmbed.setTitle(`Error while sending message! Error code: ${error.code}`)
		}
		
		await interaction.reply({embeds: [replyEmbed]});
	},
};