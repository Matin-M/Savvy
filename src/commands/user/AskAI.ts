import ICommand from '../../types/Command';
import { ExecuteParams } from '../../types/Command';

export default {
  data: {
    name: 'askai',
    description: 'Ask AI a question',
    integration_types: [1],
    contexts: [0, 1, 2],
  },
  async execute({ interaction }: ExecuteParams): Promise<void> {
    const content = 'hello';
    await interaction.reply(content);
  },
} as ICommand;
