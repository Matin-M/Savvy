import {
  ChannelType,
  Guild,
  GuildBasedChannel,
  GuildMember,
  PartialGuildMember,
} from 'discord.js';
import { ServerResponse } from '../types/APIInterfaces';
import axios from 'axios';
import { removeStopwords } from 'stopword';
import { CustomClient } from '../types/CustomClient';
import { fortnite_api_key } from '../config.json';

export const msToTime = (ms: number) => {
  const seconds = ms / 1000;
  const minutes = ms / (1000 * 60);
  const hours = ms / (1000 * 60 * 60);
  const days = ms / (1000 * 60 * 60 * 24);
  if (seconds < 60) return `${seconds} Sec`;
  else if (minutes < 60) return `${minutes.toFixed(1)} Min`;
  else if (hours < 24) return `${hours.toFixed(1)} Hrs`;
  else return `${days.toFixed(1)} Days`;
};

export const wordFreq = (strings: [string]) => {
  const freqMap: Record<string, number> = {};
  strings.forEach((string) => {
    const words = removeStopwords(string.replace(/[.]/g, '').split(/\s/));
    words.forEach((w) => {
      if (w.includes('https://') || w === '' || !w) return;
      if (!freqMap[w]) {
        freqMap[w] = 0;
      }
      freqMap[w] += 1;
    });
  });
  return freqMap;
};

export const keywordFreq = (
  freqMap: Record<string, number>,
  keyword: string,
  splitOnSpace: boolean
) => {
  if (splitOnSpace) {
    const words = keyword.replace(/[.]/g, '').split(/\s/);
    words.forEach((w) => {
      if (w.includes('https://') || w === '' || !w) return;
      if (!freqMap[w]) {
        freqMap[w] = 0;
      }
      freqMap[w] += 1;
    });
  } else {
    if (!freqMap[keyword]) {
      freqMap[keyword] = 0;
    }
    freqMap[keyword] += 1;
  }
  return freqMap;
};

export const keywordSort = (
  arr: Record<string, number>,
  formatter: (item: string) => any
) => {
  let freqTable = '';
  Object.keys(arr)
    .sort((a, b) => {
      return arr[b] - arr[a];
    })
    .forEach((item, index) => {
      index < 10
        ? (freqTable += `${formatter(item)} → ${arr[item]}\n`)
        : undefined;
    });
  return freqTable;
};

export const sendMessageToChannel = (
  message: string,
  guild: Guild,
  channelId: string
) => {
  guild.channels.cache.find((c: GuildBasedChannel) => {
    if (c.type === ChannelType.GuildText && c.id === channelId) {
      try {
        c.send(message);
      } catch (error) {
        console.log(`[ERROR]: ${error}`);
      }
    }
    return false;
  });
};

export const sendMessageToUser = (
  message: string,
  client: CustomClient,
  userId: string
) => {
  client.users
    .fetch(userId)
    .then((user) => {
      user.send(message);
    })
    .catch((error) => {
      console.log(`[ERROR]: ${error}`);
    });
};

export const formatUserName = async (
  user: (GuildMember | PartialGuildMember) | string,
  guild: Guild,
  client?: CustomClient
) => {
  if (!user) return 'Unknown User';
  if (typeof user === 'string') {
    const member = await client!.users.fetch(user);
    if (member) {
      return guild.members.cache.get(user)
        ? `<@${user}>`
        : `${member.username}#${member.discriminator}`;
    } else {
      return 'Unknown User';
    }
  } else if (user.guild?.id !== guild.id) {
    return `${user.user.username}#${user.user.discriminator}`;
  }
  return `<@${user.id}>`;
};

export const makeFortniteAPIRequest = async (
  username: string,
  timespan: boolean
): Promise<ServerResponse | null> => {
  try {
    const res = await axios.get<ServerResponse>(
      `https://fortnite-api.com/v2/stats/br/v2?name=${username}&accountType=epic&timeWindow=${
        timespan ? 'lifespan' : 'season'
      }&image=all`,
      {
        headers: { Authorization: fortnite_api_key },
      }
    );
    if (res && res.data) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
};
