const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { devAdminId } = require("../config.json");
const { spawn } = require("child_process");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("runbash")
    .setDescription(`Runs a shell command on Savvy's host system`)
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("command")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("args")
        .setDescription("arguments")
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async execute(client, interaction, Tags) {
    const command = interaction.options.getString("command");
    const channelId = interaction.channelId;
    const channel = client.channels.cache.get(channelId);

    let commandArgs = [];
    if (interaction.options.getString("args") != null) {
      commandArgs = interaction.options.getString("args").split(" ");
    }

    const replyEmbed = new MessageEmbed().setTimestamp();
    if (interaction.user.id != devAdminId) {
      replyEmbed.setTitle(
        "This command is reserved for Savvy developers only!"
      );
      replyEmbed.setColor("#ff0000");
      interaction.reply({ embeds: [replyEmbed] });
      return;
    } else {
      replyEmbed.setTitle((command + commandArgs).replaceAll(",", " "));
    }

    const process = spawn(command, commandArgs);

    process.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
      replyEmbed.setColor("#0099ff");
      replyEmbed.setDescription(`${data}`);
      channel.send({ embeds: [replyEmbed] });
    });

    process.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
      replyEmbed.setColor("#ff0000");
      replyEmbed.setDescription(`error: ${data}`);
      channel.send({ embeds: [replyEmbed] });
    });

    process.stdin.on("data", (input) => {
      console.log(`stdin: ${input}`);
    });

    process.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      replyEmbed.setColor("#ffff00");
      replyEmbed.setDescription(`child process exited with code ${code}`);
      channel.send({ embeds: [replyEmbed] });
    });

    await interaction.reply("Executing...");
  },
};
