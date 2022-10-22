const { SlashCommandBuilder } = require("@discordjs/builders");
// const { RepeatMode } = require("discord-music-player");
const { EmbedBuilder } = require("discord.js");

const Play = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription(`Play a youtube video`)
    .addStringOption((option) =>
      option.setName("link").setDescription("Video link").setRequired(true)
    ),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder().setColor("#0099ff");
    const videoLink = interaction.options.getString("link");
    let member = await interaction.guild.members.fetch();
    member = member.find((m) => m.id === interaction.user.id);
    console.log(`[MusicPlayer]: ${interaction.guild.id}`);
    const guildQueue = client.player.getQueue(interaction.guild.id);
    const queue = client.player.createQueue(interaction.guild.id);
    await queue.join(member.voice.channel);
    await queue.play(videoLink).catch((err) => {
      console.log(err);
      if (!guildQueue) queue.stop();
    });
    replyEmbed
      .setColor("#0099ff")
      .setDescription(
        `Now playing ${videoLink} in **${queue.connection.channel.name}**`
      )
      .setTimestamp();
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
    const replyEmbed = new EmbedBuilder().setColor("#FF0000");
    client.player.getQueue(interaction.guild.id).stop();
    replyEmbed
      .setColor("#0099ff")
      .setDescription(`Stoping playback and disconnecting`)
      .setTimestamp();
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

const Skip = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription(`Skip the current song`),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder().setColor("#FF0000");
    client.player.getQueue(interaction.guild.id).skip();
    replyEmbed
      .setColor("#0099ff")
      .setDescription(`Skipping current video`)
      .setTimestamp();
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

const ClearQueue = {
  data: new SlashCommandBuilder()
    .setName("clearqueue")
    .setDescription(`Clear the queue`),
  async execute(client, interaction, Tags) {
    const replyEmbed = new EmbedBuilder().setColor("#FF0000");
    client.player.getQueue(interaction.guild.id).clearQueue();
    replyEmbed
      .setColor("#0099ff")
      .setDescription(`Clearing the queue`)
      .setTimestamp();
    await interaction.reply({ embeds: [replyEmbed] });
  },
};

exports.Play = Play;
exports.Stop = Stop;
exports.Skip = Skip;
exports.ClearQueue = ClearQueue;
