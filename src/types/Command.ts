import { CacheType, Interaction, SlashCommandBuilder } from 'discord.js';
import { ModelCtor, Model } from 'sequelize/types';
import { CustomClient } from './CustomClient';

type ICommand = {
  data: SlashCommandBuilder;
  execute: (
    client: CustomClient,
    interaction?: Interaction<CacheType>,
    Tags?: ModelCtor<Model<any, any>>,
    PresenceTable?: ModelCtor<Model<any, any>>,
    ClientMessageLogs?: ModelCtor<Model<any, any>>
  ) => Promise<void>;
};

export default ICommand;
