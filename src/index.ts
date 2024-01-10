import {
  GatewayIntentBits,
  InteractionType,
  ChannelType,
  Partials,
  ActivityType,
  EmbedBuilder,
  CacheType,
  Interaction,
  SelectMenuInteraction,
  ChatInputCommandInteraction,
  Guild,
  Message,
  PartialMessage,
  VoiceState,
  GuildMember,
  Role,
  UserResolvable,
  Events,
  GuildBasedChannel,
  PartialGuildMember,
  Presence,
  AutocompleteInteraction,
} from 'discord.js';
import { Sequelize } from 'sequelize';
import schemaColumns from './database/models/schema';
import presenceSchema from './database/models/presenceSchema';
import clientMessageSchema from './database/models/clientMessageSchema';
import { CustomClient } from './types/CustomClient';
import { Player } from 'discord-player';
import { sendMessageToUser, formatUserName } from './helpers/utils';
import {
  token,
  devAdminId,
  clientActivityTitle,
  devGuildId,
  environment,
} from './config.json';
import ClientCommands from './commands/index';

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildMessageTyping,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildEmojisAndStickers,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildWebhooks,
  GatewayIntentBits.GuildIntegrations,
  GatewayIntentBits.GuildBans,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.DirectMessageReactions,
];

console.log('[-----------------------STARTING-----------------------]');

const client = new CustomClient({
  intents,
  allowedMentions: { parse: ['users', 'roles'] },
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.ThreadMember,
    Partials.User,
    Partials.Reaction,
  ],
});

const player = Player.singleton(client);
player.extractors.loadDefault();
client.player = player;

ClientCommands.map((command) => client.commands.set(command.data, command));

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as unknown as number,
    dialect: 'postgres',
    logging: false,
  }
);

const Tags = sequelize.define('defaultschemas', schemaColumns, {
  tableName: 'defaultschemas',
});
const PresenceTable = sequelize.define('presence_table', presenceSchema, {
  freezeTableName: true,
});
const ClientMessageLogs = sequelize.define(
  'client_message_logs',
  clientMessageSchema,
  {
    freezeTableName: true,
  }
);

Tags.hasMany(PresenceTable, { foreignKey: 'guildId' });
Tags.hasMany(ClientMessageLogs, { foreignKey: 'guildId' });
PresenceTable.belongsTo(Tags, { foreignKey: 'guildId' });
ClientMessageLogs.belongsTo(Tags, { foreignKey: 'guildId' });

client.once(Events.ClientReady, async () => {
  const Guilds = client.guilds.cache.map(
    (guild) => `${guild.id}: ${guild.name}`
  );
  console.log('Serving in Guilds: ');
  console.log(Guilds);
  await Tags.sync();
  await PresenceTable.sync();
  await ClientMessageLogs.sync();

  client.user!.setStatus('online');
  setInterval(() => {
    client.user!.setPresence({
      activities: [
        {
          name: clientActivityTitle,
          type: ActivityType.Listening,
        },
      ],
      status: 'online',
    });
  }, 300000);
  console.log('[-----------------------READY-----------------------]');
});

// Handle guild joins
client.on(Events.GuildCreate, async (guild: Guild) => {
  console.log(`Savvy has joined server ${guild.name}`);
  await Tags.create({
    guildId: guild.id,
    self_assign_roles: [],
    voice_subscribers_list: [],
    message_reply_phrases: [],
    message_reply_keywords: [],
    displayLeaveMessages: true,
    user_message_logs: [],
    user_joined_logs: [],
    user_left_logs: [],
    deleted_user_message_logs: [],
  });
});

// Handle guild leave/kick
client.on(Events.GuildDelete, (guild: Guild) => {
  console.log(`Savvy removed from guild ${guild.name}`);
});

// Log presence changes from guild members
client.on(
  Events.PresenceUpdate,
  async (oldPresence: Presence | null, newPresence: Presence) => {
    if (
      !newPresence ||
      newPresence.guild!.id === devGuildId ||
      environment !== 'production'
    ) {
      return;
    }
    const clientActivity = newPresence.activities[0];
    if (
      oldPresence &&
      oldPresence.activities[0]?.name === clientActivity?.name &&
      clientActivity?.name !== 'Spotify' &&
      clientActivity?.name !== 'Apple Music' &&
      clientActivity?.name !== 'YouTube Music' &&
      clientActivity?.name !== undefined
    ) {
      return;
    }
    await PresenceTable.create({
      guildId: newPresence.guild!.id,
      userId: newPresence.user!.id,
      timeStamp: new Date(),
      name: clientActivity?.name ? clientActivity.name : 'No Activity',
      type: clientActivity?.type ? clientActivity.type : 0,
      url: clientActivity?.url ? clientActivity.url : 'No URL',
      details: clientActivity?.details ? clientActivity.details : 'No Details',
      state: clientActivity?.state ? clientActivity.state : 'No State',
      largeText: clientActivity?.assets?.largeText
        ? clientActivity.assets.largeText
        : 'No Large Text',
      smallText: clientActivity?.assets?.smallText
        ? clientActivity.assets.smallText
        : 'No Small Text',
      userStatus: newPresence.status,
    }).catch(() => {
      console.log('ERROR: cannot log presence change');
    });
  }
);

// Handle messaging
client.on(Events.MessageCreate, async (message: Message<boolean>) => {
  if (message.author.bot) return;
  const replyEmbed = new EmbedBuilder().setColor('#0099ff').setTimestamp();
  if (message.channel.type === ChannelType.DM) {
    try {
      replyEmbed.setDescription(
        `Invalid command. Type /help to see available commands`
      );
      await message.reply({ embeds: [replyEmbed] });
    } catch (error) {
      console.log(`ERROR: ${error}`);
    }
    const devAdmin = await client.users.fetch(devAdminId);
    replyEmbed.setDescription(
      `Message from ${message.author.username}: ${message.content}`
    );
    devAdmin.send({ embeds: [replyEmbed] });
    console.log(`[UserDM]-FROM-${message.author.username}: ${message.content}`);
  } else if (message.channel.type === ChannelType.GuildText) {
    console.log(
      `[ChannelMessage]-FROM-${message.author.id}-IN-${message.guild!.id}: ${
        message.content
      }`
    );
    try {
      await ClientMessageLogs.create({
        guildId: message.guild ? message.guild.id : 'N/A',
        userId: message.author.id,
        messageId: message.id,
        editedAt: message.editedAt,
        contents: message.content,
        channelName: message.channel.name,
        channelId: message.channel.id,
        type: message.type,
      });
      const tag = (await Tags.findOne({
        where: { guildId: message.guild!.id },
      }))!;
      const keywords = (
        tag.get('message_reply_keywords') as string[]
      ).reverse();
      const phrases = (tag.get('message_reply_phrases') as string[]).reverse();
      for (let i = 0; i < keywords.length; i++) {
        if (message.content.includes(keywords[i])) {
          if (phrases[i] === '<DELETE>') {
            message.delete();
            try {
              const messageSender = await client.users.fetch(message.author.id);
              replyEmbed.setTitle(
                `Your message in ${
                  message.guild!.name
                } contains a forbidden word!`
              );
              await messageSender.send({ embeds: [replyEmbed] });
            } catch (error) {
              console.log(`[MessageSendError]: ${error}`);
              return;
            }
          } else if (phrases[i] === '<RESET>') {
            keywords.splice(i, 1);
            phrases.splice(i, 1);
            await Tags.update(
              {
                message_reply_keywords: keywords,
                displayLeaveMessages: phrases,
              },
              { where: { guildId: message.guild!.id } }
            );
          } else {
            message.reply(phrases[i]);
          }
          break;
        }
      }
    } catch (error) {
      console.log(`[DBError]: Guild ${message.guild!.id} not found`);
      return;
    }
  }
});

// Handle deleted messages
client.on(
  Events.MessageDelete,
  async (message: Message<boolean> | PartialMessage) => {
    const messageAuthor = message.author?.id || 'NA';
    const guildId = message.guildId || 'NA';
    console.log(
      `[MessageDelete]-FROM-${messageAuthor}-IN-${guildId}: ${message.content}`
    );
    try {
      await Tags.update(
        {
          deleted_user_message_logs: sequelize.fn(
            'array_append',
            sequelize.col('deleted_user_message_logs'),
            JSON.stringify({
              guildID: guildId,
              userID: messageAuthor,
              userMessage: message.content,
              timeStamp: Date.now(),
            })
          ),
        },
        { where: { guildId: message.guild!.id } }
      );
    } catch (error) {
      console.log(`[DBError]: Guild ${message.guild!.id} not found`);
      return;
    }
  }
);

// Handle guild members joining/leaving voice channels
client.on(
  Events.VoiceStateUpdate,
  async (oldState: VoiceState, newState: VoiceState) => {
    if (
      newState.channelId != oldState.channelId &&
      newState.channelId != null &&
      newState.member!.id != client.user!.id
    ) {
      const tag = (await Tags.findOne({
        where: { guildId: newState.member!.guild.id },
      }))!;
      const subscribedUsers = [
        ...new Set(tag.get('voice_subscribers_list') as string[]),
      ];
      for (const userID of subscribedUsers) {
        const subscribedUser = newState.guild.members.cache.find(
          (member) => member.id === userID
        )!;
        if (
          subscribedUser.id === newState.member!.id ||
          subscribedUser.presence!.status === 'dnd' ||
          newState.member!.id === client.user!.id
        ) {
          break;
        }
        const replyEmbed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(
            `${newState.member!.displayName} has joined voice channel ${
              newState.channel!.name
            } in ${newState.guild.name}`
          )
          .setTimestamp();
        try {
          console.log(
            `[VoiceUpdate]-FROM-${newState.member!.id}-IN-${
              newState.member!.guild.id
            }: ${newState.channel!.id}`
          );
          await subscribedUser.send({ embeds: [replyEmbed] });
        } catch (error) {
          console.log(`[ERROR]: ${error}`);
        }
      }
    }
  }
);

// Handle guild member join
client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
  console.log(`[NewUserJoin]-FROM-${member.user.id}-IN-${member.guild.id}`);
  const tag = (await Tags.findOne({ where: { guildId: member.guild.id } }))!;

  if (tag.get('updateChannel') != 'NA') {
    member.guild.channels.cache.find((c: GuildBasedChannel) => {
      if (
        c.type === ChannelType.GuildText &&
        c.name == tag.get('updateChannel')
      ) {
        try {
          c.send(
            `Welcome to **${member.guild.name}**, ${formatUserName(
              member,
              member.guild
            )}!`
          );
        } catch (error) {
          console.log(`[ERROR]: ${error}`);
        }
      }
      return false;
    });
  }

  if (tag.get('joinRole') == 'NA') {
    return;
  }
  try {
    await member.roles.add(
      member.guild.roles.cache.find(
        (role) => tag.get('joinRole') === role.name
      )!
    );
  } catch (error) {
    console.log(`[ERROR]: ${error}`);
  }
  await Tags.update(
    {
      user_joined_logs: sequelize.fn(
        'array_append',
        sequelize.col('user_joined_logs'),
        JSON.stringify({
          guildID: member.guild.id,
          userID: member.id,
          timeStamp: Date.now(),
        })
      ),
    },
    { where: { guildId: member.guild.id } }
  );
});

// Handle guild member leave
client.on(
  Events.GuildMemberRemove,
  async (member: GuildMember | PartialGuildMember) => {
    console.log(`[UserLeave]-FROM-${member.user.id}-IN-${member.guild.id}`);
    if (member.id === client.user!.id) {
      return;
    }
    const tag = (await Tags.findOne({ where: { guildId: member.guild.id } }))!;
    if (!tag.get('displayLeaveMessages')) return;

    if (tag.get('updateChannel') != 'NA') {
      member.guild.channels.cache.find((c: GuildBasedChannel) => {
        if (
          c.type === ChannelType.GuildText &&
          c.name == tag.get('updateChannel')
        ) {
          try {
            c.send(
              `${formatUserName(member, member.guild)} has left **${
                member.guild.name
              }**`
            );
          } catch (error) {
            console.log(`[ERROR]: ${error}`);
          }
        }
        return false;
      });
    }
    await Tags.update(
      {
        user_left_logs: sequelize.fn(
          'array_append',
          sequelize.col('user_left_logs'),
          JSON.stringify({
            guildID: member.guild.id,
            userID: member.id,
            timeStamp: Date.now(),
          })
        ),
      },
      { where: { guildId: member.guild.id } }
    );
  }
);

client.on('warn', (info) => console.log(`[WARN]: ${info}`));

// Handle slash commands
client.on(
  Events.InteractionCreate,
  async (
    interaction:
      | Interaction<CacheType>
      | ChatInputCommandInteraction<CacheType>
      | SelectMenuInteraction<CacheType>
      | AutocompleteInteraction<CacheType>
  ) => {
    if (interaction.isAutocomplete() && interaction.commandName === 'play') {
      return;
    }
    if (!interaction.guild) {
      if (interaction.isCommand()) {
        await interaction.reply({
          content: `This command can only be used in servers!`,
          ephemeral: false,
        });
        return;
      }
    }
    if (interaction.guild!.id === devGuildId && environment === 'production') {
      return;
    }
    if (interaction.isCommand()) {
      console.log(
        `[InteractionCreate]-FROM-${interaction.user.id}-IN-${
          interaction.guild ? interaction.guild.name : 'UserDM'
        }: ${interaction.type}`
      );
      const commandName = interaction.commandName;
      const command = client.commands.find(
        (int) => int.data.name === commandName
      );
      if (!command) return;
      try {
        await command.execute(client, interaction, Tags, PresenceTable);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: `Error! ${error}`,
          ephemeral: true,
        });
        console.log(`Command execution error: ${error}`);
      }
    } else if (interaction.type === InteractionType.ModalSubmit) {
      const replyEmbed = new EmbedBuilder();
      if (interaction.customId == 'role-modal') {
        await interaction.deferReply({ ephemeral: false });
        const roles = interaction.fields
          .getTextInputValue('role-list')
          .replace(/\s/g, '')
          .split(',');
        if (!roles || roles.length == 0 || roles[0] == '') {
          replyEmbed
            .setColor('#ffcc00')
            .setTitle(`You have not set any roles`)
            .setTimestamp();
          await Tags.update(
            { self_assign_roles: [] },
            { where: { guildId: interaction.guild!.id } }
          );
          interaction.followUp({ embeds: [replyEmbed] });
          return;
        }
        await Tags.update(
          { self_assign_roles: roles },
          { where: { guildId: interaction.guild!.id } }
        );
        sendMessageToUser(
          `Users in server ${
            interaction.guild?.name
          } can select the following role(s) using the /addrole command: ${roles
            .map((role) => `\n:arrow_right: *${role}*`)
            .join('')}`,
          client,
          interaction.user.id
        );
      }
    } else if (interaction.isStringSelectMenu()) {
      const replyEmbed = new EmbedBuilder();
      const menuInteraction = interaction;
      const selectedRole = menuInteraction.values[0];
      if (menuInteraction.customId === 'role-selector') {
        try {
          const member = await menuInteraction.guild!.members.fetch({
            user: menuInteraction.user as UserResolvable,
          });
          const role = menuInteraction.guild!.roles.cache.find(
            (r) => r.name === selectedRole
          ) as Role;
          member.roles.add(role);
        } catch (error) {
          console.log('There was an error! Role does not exist');
          replyEmbed
            .setColor('#FF0000')
            .setTitle(
              `Role does not exist. Please contact the admin of this discord server`
            )
            .setTimestamp();
          console.log(`[ERROR]: ${error}`);
          await menuInteraction.update({
            embeds: [replyEmbed],
            components: [],
          });
          return;
        }
        replyEmbed
          .setColor('#0099ff')
          .setTitle(
            `Role ${selectedRole} assigned to ${interaction.user.username}`
          )
          .setDescription(
            `Currently ${
              interaction.guild!.roles.cache.find(
                (role) => role.name === selectedRole
              )?.members.size
            } users with this role`
          )
          .setTimestamp();
        console.log(
          `/addrole used, ${menuInteraction.values[0]} assigned to ${interaction.user.username}`
        );
        await menuInteraction.update({
          embeds: [replyEmbed],
          components: [],
        });
      }
    }
  }
);

client.login(token);
