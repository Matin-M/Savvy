import { createLogger, transports, format } from 'winston';

const customLogger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.Console(),
    new transports.Http({
      host: '10.11.236.21',
      port: 5044,
      path: '/',
    }),
  ],
});

export default customLogger;
