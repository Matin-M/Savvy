import { Player } from 'discord-player';
import { Client, ClientOptions, Collection } from 'discord.js';
import ICommand from './Command';

export class CustomClient extends Client {
  commands: Collection<unknown, ICommand> = new Collection();
  player: Player;

  constructor(clientOptions: ClientOptions) {
    super(clientOptions);
  }
}
