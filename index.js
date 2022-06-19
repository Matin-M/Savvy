const fs = require("fs");
const { Client, Collection, Intents } = require("discord.js");
const { MessageEmbed } = require("discord.js");
const { Sequelize } = require("sequelize");
const { token, dbConnectionString, dbName } = require("./config.json");

const intents = [
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  Intents.FLAGS.GUILD_MESSAGE_TYPING,
  Intents.FLAGS.DIRECT_MESSAGES,
  Intents.FLAGS.GUILD_VOICE_STATES,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
  Intents.FLAGS.GUILD_INVITES,
  Intents.FLAGS.GUILD_PRESENCES,
  Intents.FLAGS.GUILD_WEBHOOKS,
  Intents.FLAGS.GUILD_INTEGRATIONS,
  Intents.FLAGS.GUILD_BANS,
  Intents.FLAGS.GUILD_INVITES,
];
const client = new Client({ intents, partials: ["CHANNEL"] });

const sequelize = new Sequelize(dbConnectionString, {
  dialect: "postgres",
  logging: false,
});
const queryInterface = sequelize.getQueryInterface();

//Postgres DB schema
var schemaColumns = {
  guildId: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  updateChannel: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "general",
  },
  self_assign_roles: {
    type: Sequelize.ARRAY(Sequelize.DataTypes.STRING),
    allowNull: false,
  },
  joinRole: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "NA",
  },
  voice_subscribers_list: {
    type: Sequelize.ARRAY(Sequelize.DataTypes.STRING),
    allowNull: true,
  },
  message_reply_phrases: {
    type: Sequelize.ARRAY(Sequelize.DataTypes.STRING),
    allowNull: true,
  },
  message_reply_keywords: {
    type: Sequelize.ARRAY(Sequelize.DataTypes.STRING),
    allowNull: true,
  },
};
const Tags = sequelize.define("defaultschema", schemaColumns);

client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
  const Guilds = client.guilds.cache.map((guild) => guild.id);
  console.log("Serving in Guilds: ");
  console.log(Guilds);
  Tags.sync();
  console.log("Updating db schema...");
  for (var col in schemaColumns) {
    await queryInterface.describeTable(dbName).then((tableDefinition) => {
      if (tableDefinition[col]) {
        console.log("\t" + col + " exists");
        return Promise.resolve();
      }
      console.log("\t" + "adding col " + col);
      return queryInterface.addColumn(dbName, col, {
        type: schemaColumns[col]["type"],
      });
    });
  }
  console.log("Done");
  client.user.setStatus("online");
  client.user.setActivity("you", {
    type: "WATCHING",
  });
});

//Handle guild joins
client.on("guildCreate", async (guild) => {
  console.log("Savvy has joined server" + guild.name);
  await Tags.create({
    guildId: guild.id,
    self_assign_roles: [],
    voice_subscribers_list: [],
    message_reply_phrases: [],
    message_reply_keywords: [],
  });
});

//Handle guild leave/kick
client.on("guildDelete", async (guild) => {
  await Tags.destroy({ where: { guildId: guild.id } });
  console.log("Bot removed from guild");
});

//Handle messaging
client.on("messageCreate", async (message) => {
  if (message.author.bot) return false;
  console.log(`Message from ${message.author.username}: ${message.content}`);

  if (message.channel.type === "DM") {
    const replyEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setDescription(`Sorry! Savvy does not process replies`)
      .setTimestamp();
    try {
      await message.reply({ embeds: [replyEmbed] });
    } catch (error) {
      console.log(error);
    }
    const user = await client.users.fetch("192416580557209610");
    user.send(`Message from ${message.author.username}: ${message.content}`);
  } else {
    const tag = await Tags.findOne({ where: { guildId: message.guild.id } });
    let keywords = tag.get("message_reply_keywords");
    let phrases = tag.get("message_reply_phrases");
    for (let i = 0; i < keywords.length; i++) {
      if (message.content.includes(keywords[i])) {
        message.reply(phrases[i]);
        break;
      }
    }
  }
});

//Handle join/leave voice channels
client.on("voiceStateUpdate", async (oldState, newState) => {
  let subscribedUsers = [];
  if (newState.channelId != oldState.channelId && newState.channelId != null) {
    const tag = await Tags.findOne({
      where: { guildId: newState.member.guild.id },
    });
    subscribedUsers = [...new Set(tag.get("voice_subscribers_list"))];
    for (const userID of subscribedUsers) {
      const subscribedUser = await client.users.fetch(`${userID}`);
      if (subscribedUser.id == newState.member.id) {
        break;
      }
      const replyEmbed = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle(`A user has joined a channel:`)
        .setDescription(
          `**${newState.member.displayName}** has joined voice channel **${newState.channel.name}** in server **${newState.guild.name}**`
        )
        .setTimestamp();
      try {
        await subscribedUser.send({ embeds: [replyEmbed] });
      } catch (error) {
        console.log(error);
      }
    }
  }
});

//Handle user joins
client.on("guildMemberAdd", async (member) => {
  const tag = await Tags.findOne({ where: { guildId: member.guild.id } });

  let updateChannel;
  if (tag.get("updateChannel") == "NA") {
    updateChannel = member.guild.channels.cache.find(
      (c) =>
        c.type === "GUILD_TEXT" &&
        c.permissionsFor(member.guild.me).has("SEND_MESSAGES")
    );
  } else {
    updateChannel = member.guild.channels.cache.find(
      (c) =>
        c.type === "GUILD_TEXT" &&
        c.permissionsFor(member.guild.me).has("SEND_MESSAGES") &&
        c.name == tag.get("updateChannel")
    );
  }

  try {
    const replyEmbed = new MessageEmbed()
      .setColor("#00FF00")
      .setDescription(
        `Welcome to **${member.guild.name}**, **${member.user.username}**!`
      )
      .setTimestamp();
    updateChannel.send({ embeds: [replyEmbed] });
  } catch (error) {
    console.log("Update channel does not exist!");
  }

  if (tag.get("joinRole") == "NA") {
    return;
  }
  try {
    await member.roles.add(
      member.guild.roles.cache.find((role) => tag.get("joinRole") === role.name)
    );
  } catch (error) {
    console.log("Role does not exist!");
  }
  console.log(member.user.username + " has joined server " + member.guild.id);
});

//Handle user leaves
client.on("guildMemberRemove", async (member) => {
  if (member.id == "936480332591534090") {
    return;
  }
  const tag = await Tags.findOne({ where: { guildId: member.guild.id } });
  let updateChannel;
  if (tag.get("updateChannel") == "NA") {
    updateChannel = member.guild.channels.cache.find(
      (c) =>
        c.type === "GUILD_TEXT" &&
        c.permissionsFor(member.guild.me).has("SEND_MESSAGES")
    );
  } else {
    updateChannel = member.guild.channels.cache.find(
      (c) =>
        c.type === "GUILD_TEXT" &&
        c.permissionsFor(member.guild.me).has("SEND_MESSAGES") &&
        c.name == tag.get("updateChannel")
    );
  }

  const replyEmbed = new MessageEmbed()
    .setColor("#FF0000")
    .setDescription(
      `**${member.user.username}** has left **${member.guild.name}**`
    )
    .setTimestamp();
  try {
    updateChannel.send({ embeds: [replyEmbed] });
  } catch (error) {
    console.log("Invalid channel for leave!");
  }
  console.log(member.user.username + " has left server " + member.guild.id);
});

//Handle commands.
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(client, interaction, Tags);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "There was an error while executing this command! Error msg: " +
          error,
        ephemeral: true,
      });
      console.log("Command execution error: " + error);
    }
  } else if (interaction.isModalSubmit()) {
    const replyEmbed = new MessageEmbed();
    await interaction.deferReply({ ephemeral: false });
    const roles = interaction.fields
      .getTextInputValue("role-list")
      .replace(/\s/g, "")
      .split(",");
    await Tags.update(
      { self_assign_roles: roles },
      { where: { guildId: interaction.guild.id } }
    );
    replyEmbed
      .setColor("#0099ff")
      .setDescription(
        `Success! Users can now select the following role(s) ${roles} using the /addrole command.`
      )
      .setTimestamp();
    interaction.followUp({ embeds: [replyEmbed] });
  } else if (interaction.isSelectMenu()) {
    const replyEmbed = new MessageEmbed();
    try {
      await interaction.member.roles.add(
        interaction.guild.roles.cache.find(
          (role) => interaction.values[0] === role.name
        )
      );
    } catch (error) {
      console.log("There was an error! Role does not exist.");
      replyEmbed
        .setColor("#FF0000")
        .setDescription(
          `Role does not exist. Please contact the admin of this discord server.`
        )
        .setTimestamp();
      await interaction.update({
        embeds: [replyEmbed],
        components: [],
      });
      return;
    }
    replyEmbed
      .setColor("#0099ff")
      .setDescription(`Role ${interaction.values[0]} assigned to you`)
      .setTimestamp();
    await interaction.update({
      embeds: [replyEmbed],
      components: [],
    });
  }
});

client.login(token);
