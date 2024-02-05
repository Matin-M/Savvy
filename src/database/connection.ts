import { Sequelize } from 'sequelize';

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD ?? '';
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

if (!dbName || !dbUser || !dbHost || isNaN(dbPort)) {
  throw new Error(
    'One or more required environment variables for db are missing or invalid'
  );
}

const connection = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false,
});

export default connection;
