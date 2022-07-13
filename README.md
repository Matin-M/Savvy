# Savvy

Savvy is a discord moderation bot written using the Discord.JS framework.

## Features

Keyword blacklisting, voice channel status pings, new user greetings, auto/self-select role assignments, proxy messaging, account/server info, auto keyword replies, shell command executor.

## Setup and deployment

Savvy uses PM2 for production process management, PostgreSQL as its database, and NodeJS v17^ for runtime. Once cloned, install Savvy's dependencies: run `npm ci` if you are running in a dev environment, or `npm install --only=production` if you are setting up Savvy for deployment (i.e. EC2, Azure, GCP). Run `pm2 start ecosystem.config.js` once your PosgreSQL server's auth has been configured and its connection URL has been passed into `config.json`.

## Making contributions

Currently accepting PRs!
