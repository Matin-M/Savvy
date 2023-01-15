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
} from 'discord.js';
import { Sequelize } from 'sequelize';
import schemaColumns from './database/schema';
import { CustomClient } from './types/CustomClient';
import { Player } from 'discord-music-player';
import {
  token,
  dbConnectionString,
  dbName,
  devAdminId,
  clientActivityTitle,
  devGuildId,
} from './config.json';
import ClientCommands from '../src/commands/index';

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

const player = new Player(client, {
  leaveOnEmpty: false,
});
client.player = player;

ClientCommands.map((command) => client.commands.set(command.data, command));

const sequelize = new Sequelize(dbConnectionString, {
  dialect: 'postgres',
  logging: false,
});
const queryInterface = sequelize.getQueryInterface();
const Tags = sequelize.define(dbName.slice(0, -1), schemaColumns);

async function addColumn(col: string) {
  await queryInterface.describeTable(dbName).then((tableDefinition) => {
    if (tableDefinition[col]) {
      console.log(`Column ${col} exists`);
      return Promise.resolve();
    }
    console.log(`Adding column ${col}`);
    return queryInterface.addColumn(dbName, col, {
      type: schemaColumns[col as keyof typeof schemaColumns].type,
    });
  });
}

client.once(Events.ClientReady, () => {
  const Guilds = client.guilds.cache.map(
    (guild) => `${guild.id}: ${guild.name}`
  );
  console.log('Serving in Guilds: ');
  console.log(Guilds);
  Tags.sync();
  console.log('Checking for database schema updates...');
  for (const col in schemaColumns) {
    addColumn(col);
  }
  client.user!.setStatus('online');
  setInterval(() => {
    console.log('Setting user activity');
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
  console.log('-----------------------READY-----------------------');
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
client.on(Events.GuildDelete, async (guild: Guild) => {
  await Tags.destroy({ where: { guildId: guild.id } });
  console.log(`Savvy removed from guild ${guild.name}`);
});

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
      await Tags.update(
        {
          user_message_logs: sequelize.fn(
            'array_append',
            sequelize.col('user_message_logs'),
            JSON.stringify({
              guildIdent: message.guild!.id,
              userID: message.author.id,
              userMessage: message.content,
              timeStamp: Date.now(),
            })
          ),
        },
        { where: { guildId: message.guild!.id } }
      );
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
      newState.channelId != null
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
          c.send(`Welcome to **${member.guild.name}**, <@${member.id}>!`);
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
            c.send(`<@${member.id}> has left **${member.guild.name}**`);
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
  ) => {
    if (interaction.isAutocomplete()) return;
    if (!interaction.guild) {
      await interaction.reply({
        content: `This command can only be used in servers!`,
        ephemeral: false,
      });
      return;
    }
    if (interaction.guild.id === devGuildId && process.env.PRODUCTION) return;
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
        await command.execute(client, interaction, Tags);
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
          .setColor('#0099ff')
          .setTitle(
            `Users can select the following role(s) using the /addrole command: ${roles
              .map((role) => `\n:arrow_right: *${role}*`)
              .join('')}`
          )
          .setTimestamp();
        interaction.followUp({ embeds: [replyEmbed] });
      }
    } else {
      const replyEmbed = new EmbedBuilder();
      const menuInteraction = interaction as SelectMenuInteraction<CacheType>;
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
              interaction.guild.roles.cache.find(
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
