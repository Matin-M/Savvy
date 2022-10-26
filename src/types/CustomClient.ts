import { Client, ClientOptions, Collection } from 'discord.js';

export class CustomClient extends Client {
  commands: Collection<unknown, any> = new Collection();
  player: any;
  constructor(clientOptions: ClientOptions) {
    super(clientOptions);
  }
}
