const fs = require("fs");
const { Client, Collection, Intents } = require("discord.js");
const { MessageEmbed } = require("discord.js");
const { Sequelize } = require("sequelize");
const {
  token,
  dbConnectionString,
  dbName,
  devAdminId,
  clientActivityTitle,
  clientActivityType,
} = require("../config.json");

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

// Postgres DB schema
const schemaColumns = {
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
    allowNull: false,
  },
  message_reply_phrases: {
    type: Sequelize.ARRAY(Sequelize.DataTypes.STRING),
    allowNull: false,
  },
  message_reply_keywords: {
    type: Sequelize.ARRAY(Sequelize.DataTypes.STRING),
    allowNull: false,
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

async function addColumn(col) {
  await queryInterface.describeTable(dbName).then((tableDefinition) => {
    if (tableDefinition[col]) {
      console.log(col + " exists");
      return Promise.resolve();
    }
    console.log("adding col " + col);
    return queryInterface.addColumn(dbName, col, {
      type: schemaColumns[col]["type"],
    });
  });
}

client.once("ready", () => {
  const Guilds = client.guilds.cache.map((guild) => guild.id);
  console.log("Serving in Guilds: ");
  console.log(Guilds);
  Tags.sync();
  console.log("Updating db schema...");
  for (const col in schemaColumns) {
    addColumn(col);
  }
  client.user.setStatus("online");
  setInterval(() => {
    console.log("Setting user activity");
    client.user.setActivity(clientActivityTitle, {
      type: clientActivityType,
    });
  }, 5100000);
});

// Handle guild joins
client.on("guildCreate", async (guild) => {
  console.log("Savvy has joined server " + guild.name);
  await Tags.create({
    guildId: guild.id,
    self_assign_roles: [],
    voice_subscribers_list: [],
    message_reply_phrases: [],
    message_reply_keywords: [],
  });
});

// Handle guild leave/kick
client.on("guildDelete", async (guild) => {
  await Tags.destroy({ where: { guildId: guild.id } });
  console.log("Savvy removed from guild " + guild.name);
});

// Handle messaging
client.on("messageCreate", async (message) => {
  if (message.author.bot) return false;
  if (message.channel.type === "DM") {
    const replyEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setDescription(`Invalid command. Type /help to see available commands`)
      .setTimestamp();
    try {
      await message.reply({ embeds: [replyEmbed] });
    } catch (error) {
      console.log(error);
    }
    const user = await client.users.fetch(devAdminId);
    user.send(`Message from ${message.author.username}: ${message.content}`);
  } else {
    console.log(
      `[ChannelMessage]-FROM-${message.author.username}-IN-${message.guild.name}: ${message.content}`
    );
    const tag = await Tags.findOne({ where: { guildId: message.guild.id } });
    const keywords = tag.get("message_reply_keywords");
    const phrases = tag.get("message_reply_phrases");
    for (let i = 0; i < keywords.length; i++) {
      if (message.content.includes(keywords[i])) {
        if (phrases[i] === "<DELETE>") {
          message.delete();
        } else {
          message.reply(phrases[i]);
        }
        break;
      }
    }
  }
});

// Handle guild members joining/leaving voice channels
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
        .setTitle(
          `${newState.member.displayName} has joined voice channel ${newState.channel.name} in ${newState.guild.name}`
        )
        .setTimestamp();
      try {
        console.log(
          `[VoiceUpdate]-FROM-${newState.member.displayName}-IN-${newState.member.guild.id}: ${newState.channel.name}`
        );
        await subscribedUser.send({ embeds: [replyEmbed] });
      } catch (error) {
        console.log(error);
      }
    }
  }
});

// Handle guild member join
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
      .setColor("#4ca14e")
      .setTitle(
        `Welcome to **${member.guild.name}**, **${member.user.username}#${member.user.discriminator}**!`
      )
      .setTimestamp();
    updateChannel.send({ embeds: [replyEmbed] });
  } catch (error) {
    console.log("Error sending message! " + error);
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
  console.log(
    `[NewUserJoin]-FROM-${member.user.username}-IN-${member.guild.name}: ${member.id}`
  );
});

// Handle guild member leave
client.on("guildMemberRemove", async (member) => {
  if (member.id == client.id) {
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
    .setTitle(`**${member.user.username}** has left **${member.guild.name}**`)
    .setTimestamp();
  try {
    updateChannel.send({ embeds: [replyEmbed] });
  } catch (error) {
    console.log("Invalid channel for leave!");
  }
  console.log(
    `[UserLeave]-FROM-${member.user.username}-IN-${member.guild.name}: ${member.id}`
  );
});

// Handle slash commands
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    console.log(
      `[InteractionCreate]-FROM-${interaction.user.username}-IN-${interaction.guild.name}: ${interaction.type}`
    );
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(client, interaction, Tags);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Error! " + error,
        ephemeral: true,
      });
      console.log("Command execution error: " + error);
    }
  } else if (interaction.isModalSubmit()) {
    const replyEmbed = new MessageEmbed();
    if (interaction.customId == "role-modal") {
      await interaction.deferReply({ ephemeral: false });
      const roles = interaction.fields
        .getTextInputValue("role-list")
        .replace(/\s/g, "")
        .split(",");
      if (!roles || roles.length == 0 || roles[0] == "") {
        replyEmbed
          .setColor("#ffcc00")
          .setTitle(`You have not set any roles`)
          .setTimestamp();
        await Tags.update(
          { self_assign_roles: [] },
          { where: { guildId: interaction.guild.id } }
        );
        interaction.followUp({ embeds: [replyEmbed] });
        return;
      }
      await Tags.update(
        { self_assign_roles: roles },
        { where: { guildId: interaction.guild.id } }
      );
      replyEmbed
        .setColor("#0099ff")
        .setTitle(
          `Users can select the following role(s) using the /addrole command: ${roles
            .map((role) => `\n\n:arrow_right: *${role}*`)
            .join("")}`
        )
        .setTimestamp();
      interaction.followUp({ embeds: [replyEmbed] });
    }
  } else if (interaction.isSelectMenu()) {
    const replyEmbed = new MessageEmbed();
    if (interaction.customId == "role-selector") {
      try {
        await interaction.member.roles.add(
          interaction.guild.roles.cache.find((role) => {
            if (interaction.values[0] === role.name) {
              return true;
            }
          })
        );
      } catch (error) {
        console.log("There was an error! Role does not exist");
        replyEmbed
          .setColor("#FF0000")
          .setTitle(
            `Role does not exist. Please contact the admin of this discord server`
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
        .setTitle(
          `**${interaction.values[0]}** assigned to **${interaction.user.username}**`
        )
        .setDescription(
          `Currently ${
            interaction.guild.roles.cache.find(
              (role) => role.name == interaction.values[0]
            ).members.size
          } users with this role`
        )
        .setTimestamp();
      console.log(
        `/addrole used, ${interaction.values[0]} assigned to ${interaction.user.username}`
      );
      await interaction.update({
        embeds: [replyEmbed],
        components: [],
        ephemeral: false,
      });
    }
  }
});

client.login(token);
