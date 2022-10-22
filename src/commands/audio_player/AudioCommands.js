const { SlashCommandBuilder } = require("@discordjs/builders");
// const { RepeatMode } = require("discord-music-player");
const { EmbedBuilder } = require("discord.js");

const Play = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription(`Stream music from YouTube`)
    .addStringOption((option) =>
      option
        .setName("video")
        .setDescription("Enter a YouTube link or search query")
        .setRequired(true)
    ),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder().setColor("#0099ff").setTimestamp();
    const videoLink = interaction.options.getString("video");
    let member = await interaction.guild.members.fetch();
    member = member.find((m) => m.id === interaction.user.id);
    console.log(`[MusicPlayer]: ${interaction.guild.id}`);
    try {
      const guildQueue = client.player.getQueue(interaction.guild.id);
      const queue = client.player.createQueue(interaction.guild.id);
      await queue.join(member.voice.channel);
      replyEmbed.setDescription("Fetching video...");
      await interaction.reply({
        embeds: [replyEmbed],
        ephemeral: false,
        fetchReply: true,
      });

      const video = await queue.play(videoLink).catch((err) => {
        replyEmbed.setColor("#FF0000").setDescription(`Invalid search query!`);
        if (!guildQueue) queue.stop();
      });
      replyEmbed
        .setColor(video ? "#0099ff" : "#FF0000")
        .setDescription(
          `${video ? "now playing" : "unable to play"} **${
            video ? video : videoLink
          }** in voice channel **${queue.connection.channel.name}**`
        );
      await interaction.editReply({ embeds: [replyEmbed], ephemeral: false });
    } catch (e) {
      replyEmbed.setColor("#FF0000").setDescription(`${e}`);
      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
    }
  },
};

const Pause = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription(`Pause the current video`),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder().setColor("#FF0000").setTimestamp();
    try {
      const queue = client.player.getQueue(interaction.guild.id);
      await queue.setPaused(true);
      replyEmbed.setColor("#ffcc00").setDescription(`Pausing playback...`);
    } catch (e) {
      replyEmbed
        .setColor("#FF0000")
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

const Resume = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription(`Resuming the current video`),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder().setColor("#FF0000").setTimestamp();
    try {
      const queue = client.player.getQueue(interaction.guild.id);
      await queue.setPaused(false);
      replyEmbed.setColor("#ffcc00").setDescription(`Resuming playback...`);
    } catch (e) {
      replyEmbed
        .setColor("#FF0000")
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

const Stop = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription(
      `Stop the current video and disconnect from the voice channel`
    ),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder().setColor("#FF0000").setTimestamp();
    try {
      const queue = client.player.getQueue(interaction.guild.id);
      await queue.stop();
      replyEmbed
        .setColor("#ffcc00")
        .setDescription(`Stopping playback and leaving voice channel`);
    } catch (e) {
      replyEmbed
        .setColor("#FF0000")
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

const Skip = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription(`Skip the current video`),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder().setColor("#FF0000").setTimestamp();
    try {
      const queue = client.player.getQueue(interaction.guild.id);
      await queue.skip();
      replyEmbed.setColor("#ffcc00").setDescription(`Skipping current video`);
    } catch (e) {
      replyEmbed
        .setColor("#FF0000")
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

const ClearQueue = {
  data: new SlashCommandBuilder()
    .setName("clearqueue")
    .setDescription(`Clear the queue`),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder().setColor("#FF0000");
    try {
      const queue = client.player.getQueue(interaction.guild.id);
      await queue.skip();
      replyEmbed.setColor("#ffcc00").setDescription(`Clearing the queue`);
    } catch (e) {
      replyEmbed
        .setColor("#FF0000")
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

const VideoProgress = {
  data: new SlashCommandBuilder()
    .setName("videoprogress")
    .setDescription(`Show video progress`),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder().setColor("#FF0000");
    try {
      const queue = client.player.getQueue(interaction.guild.id);
      const ProgressBar = queue.createProgressBar();
      replyEmbed.setColor("#ffcc00").setDescription(ProgressBar.prettier);
    } catch (e) {
      replyEmbed
        .setColor("#FF0000")
        .setDescription(`No video is currently playing!`);
    }
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

exports.Play = Play;
exports.Stop = Stop;
exports.Skip = Skip;
exports.ClearQueue = ClearQueue;
exports.VideoProgress = VideoProgress;
exports.Pause = Pause;
exports.Resume = Resume;
