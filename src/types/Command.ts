import { CacheType, Interaction, SlashCommandBuilder } from 'discord.js';
import { ModelCtor, Model } from 'sequelize/types';
import { CustomClient } from './CustomClient';

interface ExecuteParams {
  client: CustomClient;
  interaction?: Interaction<CacheType>;
  Tags?: ModelCtor<Model<any, any>>;
  PresenceTable?: ModelCtor<Model<any, any>>;
  ClientMessageLogs?: ModelCtor<Model<any, any>>;
  PreferenceTable?: ModelCtor<Model<any, any>>;
}

type ICommand = {
  data: SlashCommandBuilder | Record<string, any>;
  execute: (params: ExecuteParams) => Promise<void>;
};

export default ICommand;
