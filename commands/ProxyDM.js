const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('proxydm')
		.setDescription('Use Savvy to direct message any user in this server').addStringOption(option =>
            option.setName('userid')
                .setDescription('unique user UUID')
                .setRequired(true))
			.addStringOption(option =>
            option.setName('message')
                .setDescription('message to send')
                .setRequired(true)),
	async execute(client, interaction, Tags) {
        const userID = interaction.options.getString('userid');
		const message = interaction.options.getString('message');
		const user = await client.users.fetch(userID);
		var replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTimestamp();
		try{
			await user.send(`Proxy message from **${interaction.user.username}**: ${message}`);
			replyEmbed.setDescription(`Sent **${message}** to userID **${userID}**`)
		}catch(error){
			replyEmbed.setColor('#ff0000');
			replyEmbed.setTitle(`Error while sending message! Error code: ${error.code}`)
		}
		
		await interaction.reply({embeds: [replyEmbed]});
	},
};