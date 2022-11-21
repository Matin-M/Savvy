# Savvy

Savvy is a discord moderation bot written using the Discord.JS framework.

## Features

Keyword blacklisting, voice channel status pings, new user greetings, auto/self-select role assignments, proxy messaging, account/server info, auto keyword replies, AWS shell command executor.

## Setup and deployment

Savvy uses PM2 for production process management, PostgreSQL as its database, and NodeJS v17^ for runtime. Once cloned, install Savvy's dependencies: run `npm ci` if you are running in a dev environment, or `npm install --only=production` if you are setting up Savvy for deployment (i.e. EC2, Azure, GCP, or some other host system). A dedicated PostgreSQL server needs to be running concurrently alongside Savvy, preferrably hosted on the same system with password authentication to minimize query latency. Run `pm2 start ecosystem.config.js` from the root of the repository once your PosgreSQL server's auth has been configured and its connection URL has been passed into `config.json`.

### config.json parameters

```{
  "clientId": "<The client ID of your bot>",
  "guildId": "<The disord server you are using to test the bot>",
  "dbName": "<Name of your DB table>",
  "devAdminId": "<Your personal discord id>",
  "clientActivityTitle": "<A presence title>",
  "clientActivityType": "<A presence activity>",
  "token": "<Your discord Auth token>",
  "dbConnectionString": "<DB connection URL>" }
```

---

The parameter `clientActivityType` must be a string set to either `Watching`, `Playing`, or `Streaming`.

`devAdminID` is your personal discord id, and can be used to override any permission settings of guilds that Savvy is a member of.

## Making contributions

Currently accepting PRs!
