const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setupdate')
		.setDescription('The text channel that Savvy will send updates to').addStringOption(option =>
            option.setName('channel')
                .setDescription('channel name')
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
			let newChannel = interaction.options.getString("channel");
			await Tags.update({ updateChannel: newChannel }, { where: { guildId: interaction.guild.id } });

			replyEmbed.setColor('#0099ff')
				.setDescription(`Savvy will now send server updates to text channel **${newChannel}**`)
				.setTimestamp();			
		}else{
			replyEmbed.setColor('#FF0000')
				.setDescription(`You do not have the permission to use this command!`)
				.setTimestamp();	
		}
		
		await interaction.reply({embeds: [replyEmbed]});
	},
};