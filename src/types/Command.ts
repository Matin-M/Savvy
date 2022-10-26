import { CacheType, Interaction, SlashCommandBuilder } from 'discord.js';
import { CustomClient } from './CustomClient';

type ICommand = {
  data: SlashCommandBuilder;
  execute: (
    client: CustomClient,
    interaction: Interaction<CacheType>,
    Tags: any
  ) => Promise<void>;
};

export default ICommand;
