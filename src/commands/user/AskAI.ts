import ICommand from '../../types/Command';
import { ExecuteParams } from '../../types/Command';
import { assistant_id } from '../../config.json';

export default {
  data: {
    name: 'askai',
    description: 'Ask AI a question',
    options: [
      {
        name: 'question',
        type: 3,
        description: 'The question you want to ask AI',
        required: true,
      },
    ],
    integration_types: [1],
    contexts: [0, 1, 2],
  },
  async execute({ interaction, client }: ExecuteParams): Promise<void> {
    const question = interaction.options.getString('question')!;

    await interaction.deferReply();

    try {
      const thread = await client.openai.beta.threads.create({
        messages: [
          {
            role: 'user',
            content: question,
          },
        ],
      });

      let response = '';

      const run = client.openai.beta.threads.runs
        .stream(thread.id, {
          assistant_id: assistant_id,
        })
        .on('textCreated', (text) => {
          response += '\n***assistant*** > ';
          interaction.editReply(response).catch(console.error);
        })
        .on('textDelta', (textDelta, snapshot) => {
          response += textDelta.value;
          interaction.editReply(response).catch(console.error);
        })
        .on('toolCallCreated', (toolCall) => {
          response += `\nassistant > ${toolCall.type}\n\n`;
          interaction.editReply(response).catch(console.error);
        })
        .on('toolCallDelta', (toolCallDelta, snapshot) => {
          if (toolCallDelta.type === 'code_interpreter') {
            if (toolCallDelta.code_interpreter?.input) {
              response += toolCallDelta.code_interpreter.input;
            }
            if (toolCallDelta.code_interpreter?.outputs) {
              response += '\noutput >\n';
              toolCallDelta.code_interpreter.outputs.forEach((output) => {
                if (output.type === 'logs') {
                  response += `\n${output.logs}\n`;
                }
              });
            }
            interaction.editReply(response).catch(console.error);
          }
        });

      await run.finalRun();

      if (!response) {
        await interaction.editReply('Failed to get a response from the AI.');
      }
    } catch (error) {
      console.error('Error while processing AI request:', error);
      await interaction.editReply(
        'There was an error processing your request.'
      );
    }
  },
} as ICommand;
