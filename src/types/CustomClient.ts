import { Player } from 'discord-music-player';
import { Client, ClientOptions, Collection } from 'discord.js';
import ICommand from './Command';

export class CustomClient extends Client {
  commands: Collection<unknown, ICommand> = new Collection();
  player: Player<any>;

  constructor(clientOptions: ClientOptions) {
    super(clientOptions);
  }
}
