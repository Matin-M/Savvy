const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setupdate')
		.setDescription('The text channel that Savvy will send updates to').addStringOption(option =>
            option.setName('channel')
                .setDescription('channel name')
                .setRequired(true)),
	async execute(client, interaction, Tags) {
		let newChannel = interaction.options.getString("channel");
		const affectedRows = await Tags.update({ updateChannel: newChannel }, { where: { guildId: interaction.guild.id } });

		const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`Savvy will now send server updates to text channel **${newChannel}**`)
          .setTimestamp();
		await interaction.reply({embeds: [replyEmbed]});
	},
};