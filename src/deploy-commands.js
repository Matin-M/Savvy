const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

const commands = [];
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

const regCommands = require('./commands/index');
commands.push(
  ...Object.keys(regCommands).map((command) =>
    regCommands[command].data.toJSON()
  )
);

const audioCommands = require('./commands/audio_player/AudioCommands');
commands.push(
  ...Object.keys(audioCommands).map((command) =>
    audioCommands[command].data.toJSON()
  )
);

const rest = new REST({ version: '9' }).setToken(token);

readline.question(
  'Deploy commands globally or locally? Enter either global or local: ',
  (response) => {
    if (response === 'global') {
      rest
        .put(Routes.applicationCommands(clientId), { body: commands })
        .then(() =>
          console.log('Successfully registered application commands globally.')
        )
        .catch(console.error);
    } else if (response === 'local') {
      rest
        .put(Routes.applicationGuildCommands(clientId, guildId), {
          body: commands,
        })
        .then(() =>
          console.log('Successfully registered application commands locally.')
        )
        .catch(console.error);
    } else {
      console.log('Invalid response! Try again');
    }
    readline.close();
  }
);
