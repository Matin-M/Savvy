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
import connection from './database/connection';
import schemaColumns from './database/models/schema';
import presenceSchema from './database/models/presenceSchema';
import clientMessageSchema from './database/models/clientMessageSchema';
import preferenceSchema from './database/models/preferenceSchema';
import { CustomClient } from './types/CustomClient';
import { Player } from 'discord-player';
import { sendMessageToUser, formatUserName } from './helpers/utils';
import {
  token,
  devAdminId,
  clientActivityTitle,
  devGuildId,
  environment,
  openAI_api_key,
  openAI_project_id,
} from './config.json';
import ClientCommands from './commands/index';
import OpenAI from 'openai';

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

client.player = new Player(client, {
  skipFFmpeg: false,
});
client.player.extractors.loadDefault((ext) => ext !== 'YouTubeExtractor');

const openAi = new OpenAI({
  project: openAI_project_id,
  apiKey: openAI_api_key,
});
client.openai = openAi;

ClientCommands.map((command) => client.commands.set(command.data, command));

const Tags = connection.define('defaultschemas', schemaColumns, {
  tableName: 'defaultschemas',
});
const PresenceTable = connection.define('presence_table', presenceSchema, {
  freezeTableName: true,
});
const ClientMessageLogs = connection.define(
  'client_message_logs',
  clientMessageSchema,
  {
    freezeTableName: true,
  }
);
const PreferenceTable = connection.define(
  'guild_preferences',
  preferenceSchema,
  {
    freezeTableName: true,
  }
);

Tags.hasMany(PresenceTable, { foreignKey: 'guildId' });
Tags.hasMany(ClientMessageLogs, { foreignKey: 'guildId' });
Tags.hasMany(PreferenceTable, { foreignKey: 'guildId' });
PresenceTable.belongsTo(Tags, { foreignKey: 'guildId' });
ClientMessageLogs.belongsTo(Tags, { foreignKey: 'guildId' });
PreferenceTable.belongsTo(Tags, { foreignKey: 'guildId' });

const keywordPhraseMap = new Map<string, string>();

const generateKeywordMap = async () => {
  try {
    const keywordPrefs = await PreferenceTable.findAll({
      where: { key: 'keywordReply' },
      attributes: ['value', 'guildId', 'classId'],
      order: [['createdAt', 'ASC']],
    });

    keywordPhraseMap.clear();
    keywordPrefs.forEach((keyword) => {
      const mapKey = `${keyword.get('value')}-${keyword.get('guildId')}`;
      const classId = keyword.get('classId') as string;
      keywordPhraseMap.set(mapKey, classId);
    });

    console.log(`Generated Keyword Map with ${keywordPrefs.length} entries`);
  } catch (error) {
    console.error('Failed to generate keyword map:', error);
  }
};

client.once(Events.ClientReady, async () => {
  try {
    const servedGuilds = client.guilds.cache.map((guild) => {
      console.log(guild.name);
      return `${guild.id}`;
    });

    await Promise.all([
      Tags.sync(),
      PresenceTable.sync(),
      ClientMessageLogs.sync(),
      PreferenceTable.sync(),
    ]);

    console.log('Checking to see if all guilds are in db...');
    const existingGuilds = await Tags.findAll();
    const guildsToAdd = servedGuilds.filter(
      (id) => !existingGuilds.some((guild) => guild.get('guildId') === id)
    );

    if (guildsToAdd.length > 0) {
      guildsToAdd.forEach((id) => {
        Tags.create({
          guildId: id.trim(),
          self_assign_roles: [],
          voice_subscribers_list: [],
          message_reply_phrases: [],
          message_reply_keywords: [],
          displayLeaveMessages: true,
          user_message_logs: [],
          user_joined_logs: [],
          user_left_logs: [],
          deleted_user_message_logs: [],
        }).then(() => console.log(`Added guild ${id}`));
      });
    } else {
      console.log('All guilds are in db');
    }

    generateKeywordMap();
    client.user!.setStatus('online');
    setInterval(() => {
      client.user!.setPresence({
        activities: [
          { name: clientActivityTitle, type: ActivityType.Listening },
        ],
        status: 'online',
      });
    }, 300000);

    console.log('[-----------------------READY-----------------------]');
  } catch (error) {
    console.error(`[DBError]: ${error}`);
  }
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

const presenceUpdates: any[] = [];
const BATCH_INTERVAL = 500000;

const flushPresenceUpdates = async () => {
  if (presenceUpdates.length > 0) {
    await PresenceTable.bulkCreate(presenceUpdates)
      .catch((e) => {
        console.error(`[PlayerLoggingError]: ${e}`);
      })
      .finally(() => {
        presenceUpdates.length = 0;
      });
  }
};

setInterval(() => {
  flushPresenceUpdates().catch((e) =>
    console.error(`[FlushPresenceUpdatesError]: ${e}`)
  );
}, BATCH_INTERVAL);

client.on(
  Events.PresenceUpdate,
  (oldPresence: Presence | null, newPresence: Presence) => {
    if (!newPresence || newPresence.user?.bot) {
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

    presenceUpdates.push({
      guildId: newPresence.guild!.id,
      userId: newPresence.user!.id,
      timeStamp: new Date(),
      name: clientActivity?.name,
      type: clientActivity?.type,
      url: clientActivity?.url,
      details: clientActivity?.details,
      state: clientActivity?.state,
      largeText: clientActivity?.assets?.largeText,
      smallText: clientActivity?.assets?.smallText,
      userStatus: newPresence.status,
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
      `[ChannelMessage]-FROM-${message.author.username}-IN-${
        message.guild!.name
      }: ${message.content}`
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
      const messageWords = message.content.split(' ');
      let messageContent = '';
      for (let i = 0; i < messageWords.length; i++) {
        const phrase = keywordPhraseMap.get(
          `${messageWords[i]
            .trim()
            .toLowerCase()
            .replace(/[\W_]+$/, '')}-${message.guild!.id}`
        );
        if (phrase) {
          if (phrase === '<DELETE>') {
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
              console.error(`[MessageSendError]: ${error}`);
            }
            return;
          } else {
            messageContent += `${phrase}\n`;
            if (messageContent.length > 2000) {
              message.reply(messageContent);
              messageContent = '';
            }
          }
        }
      }
      if (messageContent !== '') {
        message.reply(messageContent);
      }
    } catch (error) {
      console.error(`[DBError]: Guild ${message.guild!.id} not found`);
      return;
    }
  }
});

// Handle deleted messages
client.on(
  Events.MessageDelete,
  async (message: Message<boolean> | PartialMessage) => {
    const messageAuthor = message.author?.username || 'NA';
    const guildId = message.guildId || 'NA';
    console.log(
      `[MessageDelete]-FROM-${messageAuthor}-IN-${message.guild?.name}: ${message.content}`
    );
    try {
      await Tags.update(
        {
          deleted_user_message_logs: connection.fn(
            'array_append',
            connection.col('deleted_user_message_logs'),
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
      console.log(`[DBError]: Guild ${message.guild!.name} not found`);
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
            `[VoiceUpdate]-FROM-${newState.member!.user.username}-IN-${
              newState.member!.guild.name
            }: ${newState.channel!.name}`
          );
          await subscribedUser.send({ embeds: [replyEmbed] });
        } catch (error) {
          console.error(`[VoiceUpdateError]: ${error}`);
        }
      }
    }
  }
);

// Handle guild member join
client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
  console.log(
    `[NewUserJoin]-FROM-${member.user.username}-IN-${member.guild.name}`
  );
  const tag = (await Tags.findOne({ where: { guildId: member.guild.id } }))!;

  if (tag.get('updateChannel') != 'NA') {
    member.guild.channels.cache.find(async (c: GuildBasedChannel) => {
      if (
        c.type === ChannelType.GuildText &&
        c.name == tag.get('updateChannel')
      ) {
        try {
          await c.send(
            `Welcome to **${member.guild.name}**, ${await formatUserName(
              member,
              member.guild
            )}!`
          );
        } catch (error) {
          console.error(`[UpdateChannelError]: ${error}`);
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
    console.error(`[UpdateChannelError]: ${error}`);
  }
  await Tags.update(
    {
      user_joined_logs: connection.fn(
        'array_append',
        connection.col('user_joined_logs'),
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
    console.log(
      `[UserLeave]-FROM-${member.user.username}-IN-${member.guild.name}`
    );
    if (member.id === client.user!.id) {
      return;
    }
    const tag = (await Tags.findOne({ where: { guildId: member.guild.id } }))!;
    if (!tag.get('displayLeaveMessages')) return;

    if (tag.get('updateChannel') != 'NA') {
      member.guild.channels.cache.find(async (c: GuildBasedChannel) => {
        if (
          c.type === ChannelType.GuildText &&
          c.name == tag.get('updateChannel')
        ) {
          try {
            await c.send(
              `${await formatUserName(member, member.guild)} has left **${
                member.guild.name
              }**`
            );
          } catch (error) {
            console.error(`[GuildMemberRemoveError]: ${error}`);
          }
        }
        return false;
      });
    }
    await Tags.update(
      {
        user_left_logs: connection.fn(
          'array_append',
          connection.col('user_left_logs'),
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

client.on('warn', (info) => console.warn(`[WARN]: ${info}`));

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
      console.log('Skipping dev guild interaction in production mode...');
      return;
    }
    if (interaction.isCommand()) {
      console.log(
        `[InteractionCreate]-FROM-${interaction.user.username}-IN-${
          interaction.guild ? interaction.guild.name : 'UserDM'
        }: ${interaction.type}`
      );
      const commandName = interaction.commandName;
      const command = client.commands.find(
        (int) => int.data.name === commandName
      );
      if (!command) return;
      const chatInteraction =
        interaction as ChatInputCommandInteraction<CacheType>;
      try {
        await command.execute({
          client,
          interaction: chatInteraction,
          Tags,
          PresenceTable,
          ClientMessageLogs,
          PreferenceTable,
        });

        if (interaction.commandName == 'replyonkeyword') {
          generateKeywordMap();
        }
      } catch (error) {
        console.error(
          `[InteractionError]-FROM-${interaction.user.username}-IN-${
            interaction.guild ? interaction.guild.name : 'UserDM'
          }: ${error}`
        );
        if (interaction.deferred) {
          await interaction.editReply({
            content: `There was an error while executing this command!`,
          });
        } else {
          await interaction.reply({
            content: `There was an error while executing this command!`,
            ephemeral: true,
          });
        }
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
          console.error(
            `[MenuInteractionError]-FROM-${interaction.user.username}-IN-${
              interaction.guild ? interaction.guild.name : 'UserDM'
            }: ${error}`
          );
          replyEmbed
            .setColor('#FF0000')
            .setTitle(
              `Role does not exist. Please contact the admin of this discord server`
            )
            .setTimestamp();
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
