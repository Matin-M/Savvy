import { Player } from 'discord-player';
import { Client, ClientOptions, Collection } from 'discord.js';
import ICommand from './Command';
import OpenAI from 'openai';

export class CustomClient extends Client {
  commands: Collection<unknown, ICommand> = new Collection();
  player: Player;
  openAiInstance: OpenAI;

  constructor(clientOptions: ClientOptions) {
    super(clientOptions);
  }
}
