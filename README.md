## Features

Soundcloud/youtube/spotify streaming, keyword blacklisting, voice channel status pings, new user greetings, auto/self-select role assignments, proxy messaging, account/server statistics, auto keyword replies, and continuous guild member presence logging. 

## Setup and deployment

docker compose up -d --build

### Required config.json parameters

```
{
  "clientId": "<The client ID of your bot>",
  "guildId": "<The disord server you are using to test the bot>",
  "devAdminId": "<Your personal discord id>",
  "clientActivityTitle": "<A presence title>",
  "clientActivityType": "<A presence activity>",
  "token": "<Your discord Auth token>",
}
```

---

The parameter `clientActivityType` must be a string set to either `Watching`, `Playing`, or `Streaming`.

`devAdminID` is the Admin's personal discord id, and can be used to override any permission settings of guilds that Savvy is a member of.
