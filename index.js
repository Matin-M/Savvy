const fs = require('fs');
const lineByLine = require('n-readlines');
const { Client, Collection, Intents } = require('discord.js');
const { MessageEmbed } = require('discord.js');
const { token } = require('./config.json');
const { strictEqual } = require('assert');
const { channel } = require('diagnostics_channel');

const intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ,Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_INVITES, Intents.FLAGS.GUILD_PRESENCES];
const client = new Client({intents,  partials: ["CHANNEL"]});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

function getPosition(string, subString, index) {
  return string.split(subString, index).join(subString).length;
}

client.once('ready', () => {
	const Guilds = client.guilds.cache.map(guild => guild.id);
    console.log("Serving in Guilds: ");
    console.log(Guilds);
    client.user.setStatus("online");
    client.user.setActivity("you", {
        type: "WATCHING"
      });
});

//Handle messaging
client.on("messageCreate", async (message) => {
    if (message.author.bot) return false; 

    console.log(`Message from ${message.author.username}: ${message.content}`);
    const attachment = message.attachments.first()

    if (message.channel.type === 'DM') {
      const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`Sorry! Savvy does not process replies`)
          .setTimestamp();
      message.reply({ embeds: [replyEmbed] });
      const user = await client.users.fetch('192416580557209610');
      user.send(`Message from ${message.author.username}: ${message.content}`);
      //message.reply("Sorry! Savvy does not process replies");
    }else{
      const liner = new lineByLine('Data/MessageReplyList.txt');
      const guildChannels = message.guild.channels;
      const guildVoiceChannels = message.guild.guildVoiceChannels;
      let line; 
      while(line = liner.next()){
        line = line.toString('ascii');
        var keyword = line.substring(getPosition(line,"+",1) + 1, getPosition(line,"+",2));
        var phrase = line.substring(getPosition(line,"+",2) + 1, line.length);
        if(line.includes(message.guild.id) && message.content.includes(keyword)){
          message.reply(phrase);
          break;
        }
      }
    }
  });

  //Handle join/leave voice channels
  client.on('voiceStateUpdate',  async (oldState, newState) => {
    var subscribedUsers = [];
    const liner = new lineByLine('Data/VoiceUpdateList.txt');

    const channel = newState.guild.channels.cache.find(
        (c) => c.type === "GUILD_TEXT" && c.permissionsFor(newState.guild.me).has("SEND_MESSAGES") && c.name == "general"
      );

    if((newState.channelId != oldState.channelId) && newState.channelId != null){
      let line; 
      while(line = liner.next()){
        line = line.toString('ascii');
        console.log(line);
        if(line.includes(newState.guild.id)){
          userID = line.substring(19, 37);
          subscribedUsers.push(line.substring(19, 37));
        }
      }
      subscribedUsers = [...new Set(subscribedUsers)];
      for(const userID of subscribedUsers){
        const subscribedUser = await client.users.fetch(`${userID}`);
        const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`A user has joined a channel:`)
          .setDescription(`**${newState.member.displayName}** has joined voice channel **${newState.channel.name}** in server **${newState.guild.name}**`)
          .setTimestamp();
        subscribedUser.send({ embeds: [replyEmbed] });
      }
    }
 });

 //Handle user joins
 client.on("guildMemberAdd", async member => {
    const channel = member.guild.channels.cache.find(
        (c) => c.type === "GUILD_TEXT" && c.permissionsFor(member.guild.me).has("SEND_MESSAGES") && c.name == "general"
      );
    const liner = new lineByLine('Data/JoinRoleList.txt');
    while(line = liner.next()){
      line = line.toString('ascii');
      var role = line.substring(getPosition(line,"+",1) + 1, line.length);
      if(line.includes(message.guild.id) && message.content.includes(keyword)){
        member.roles.add(member.guild.roles.find(role => role.name === role));
      }
    }
    
    const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`Welcome to ${member.guild.name}, ${member.user}!`)
          .setTimestamp();
    channel.send({ embeds: [replyEmbed] });
    console.log(member.user.id + ' has Joined');
});

 //Handle user leaves
 client.on("guildMemberRemove", async member => {
    const channel = member.guild.channels.cache.find(
        (c) => c.type === "GUILD_TEXT" && c.permissionsFor(member.guild.me).has("SEND_MESSAGES") && c.name == "general"
      );
    const replyEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setDescription(`${member.user} has left ${member.guild.name}`)
          .setTimestamp();
    channel.send({ embeds: [replyEmbed] });
});

//Handle commands.
client.on('interactionCreate', async interaction => {
    console.log('Received command');
	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	try {
		await command.execute(client, interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);