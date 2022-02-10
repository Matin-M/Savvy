const fs = require('fs');
const lineByLine = require('n-readlines');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const { strictEqual } = require('assert');
const { channel } = require('diagnostics_channel');

const intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ,Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_INVITES];
const client = new Client({intents,  partials: ["CHANNEL"]});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
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
        message.reply("Why are you DMing me?");
    }else{
        const guildChannels = message.guild.channels;
        const guildVoiceChannels = message.guild.guildVoiceChannels;
    }
  });

  //Handle join/leave voice channels
  client.on('voiceStateUpdate',  async (oldState, newState) => {
    var subscribedUsers = [];
    const liner = new lineByLine('VoiceUpdateList.txt');

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
        subscribedUser.send(`${newState.member.displayName} has joined voice channel ${newState.channel.name}`);
      }
      //channel.send(`${newState.member.displayName} has joined voice channel ${newState.channel.name}`);
    }
 });

 //Handle user joins
 client.on("guildMemberAdd", async member => {
    //member.roles.add('id');
    const channel = member.guild.channels.cache.find(
        (c) => c.type === "GUILD_TEXT" && c.permissionsFor(member.guild.me).has("SEND_MESSAGES") && c.name == "general"
      );
    channel.send(`Welcome to ${member.guild.name}, ${member.user}!`);
    console.log(member.user.id + ' has Joined');
});

 //Handle user leaves
 client.on("guildMemberRemove", async member => {
    const channel = member.guild.channels.cache.find(
        (c) => c.type === "GUILD_TEXT" && c.permissionsFor(member.guild.me).has("SEND_MESSAGES") && c.name == "general"
      );
    channel.send(`${member.user} has left ${member.guild.name}`);
    console.log(member.user.id + ' has left');
});

client.on('interactionCreate', async interaction => {
    console.log('Received command');
	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);