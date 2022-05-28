const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, MessageEmbed } = require('discord.js');
const { exec } = require("child_process");
const { spawn } = require("child_process");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('runbash')
		.setDescription('run a bash command').addStringOption(option =>
            option.setName('command')
                .setDescription('command')
                .setRequired(true))
		.addStringOption(option =>
			option.setName('args')
				.setDescription('arguments')
				.setRequired(false)),

	async execute(client, interaction, Tags) {
        const command = interaction.options.getString('command');
		const channelId = interaction.channelId;
		const channel = client.channels.cache.get(channelId);

		var commandArgs;
		if(interaction.options.getString('args') == null){
			commandArgs = [];
		}else{
			commandArgs = interaction.options.getString('args').split(' ');
		}
		 
		var replyEmbed = new MessageEmbed()
        	.setTimestamp();
		if(interaction.user.id != '192416580557209610'){
			replyEmbed.setTitle("You do not have permission to run this command!");
		}else{
			replyEmbed.setTitle((command + commandArgs).replaceAll(',',' '));
		}

		const process = spawn(command, commandArgs);

		process.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
			replyEmbed.setColor('#0099ff');
			replyEmbed.setDescription(`${data}`)
			channel.send({embeds: [replyEmbed]});
		});

		process.stderr.on('data', (data) => {
			console.error(`stderr: ${data}`);
			replyEmbed.setColor('#ff0000');
			replyEmbed.setDescription(`error: ${data}`)
			channel.send({embeds: [replyEmbed]});
		});

		process.stdin.on("data", function (input) {
			console.log("Input!");
		});

		process.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
			replyEmbed.setColor('#ffff00');
			replyEmbed.setDescription(`child process exited with code ${code}`)
			channel.send({embeds: [replyEmbed]});
		});
		
		await interaction.reply("Executing...");
	},
};