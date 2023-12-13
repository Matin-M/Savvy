const { Sequelize, QueryTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
);

async function backfillClientMessageLogs() {
  try {
    const defaultSchemasRecords = await sequelize.query(
      'SELECT "guildId", "user_message_logs" FROM "defaultschemas"',
      { type: QueryTypes.SELECT }
    );

    for (const record of defaultSchemasRecords) {
      const userMessageLogs = record.user_message_logs.map((log) => {
        console.log(log);
        return {
          guildIdent: record.guildId,
          userID: log.userID,
          userMessage: log.userMessage,
          timeStamp: log.timeStamp,
        };
      });

      console.log(
        'Backfilling guild',
        record.guildId,
        'with',
        userMessageLogs.length,
        'records'
      );

      for (const log of userMessageLogs) {
        await sequelize.query(
          `INSERT INTO "client_message_logs" 
            ("guildId", "userId", "messageId", "contents", "editedAt", 
             "channelName", "channelId", "type", "createdAt", "updatedAt")
            VALUES 
            (:guildId, :userId, :messageId, :contents, NULL, 
             NULL, NULL, NULL, to_timestamp(:timeStamp / 1000), NOW())`,
          {
            replacements: {
              guildId: log.guildIdent,
              userId: log.userID,
              messageId: 'N/A',
              contents: log.userMessage,
              timeStamp: log.timeStamp,
            },
            type: QueryTypes.INSERT,
          }
        );
      }
    }

    console.log('Backfill completed successfully');
  } catch (error) {
    console.error('Error during backfill:', error);
  } finally {
    await sequelize.close();
  }
}

backfillClientMessageLogs();
