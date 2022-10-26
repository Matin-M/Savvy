import { Client, ClientOptions, Collection } from 'discord.js';
import ICommand from './Command';

export class CustomClient extends Client {
  commands: Collection<unknown, ICommand> = new Collection();
  player: any;
  constructor(clientOptions: ClientOptions) {
    super(clientOptions);
  }
}
