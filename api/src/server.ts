import path from 'path';
import dotenv from 'dotenv';
dotenv.config({path: path.join(__dirname, '../../client/.env')});

import {logger} from './util/logger';
import {expressApp} from './app';

const app = expressApp();

// eslint-disable-next-line @typescript-eslint/no-empty-function
const server = app.listen(app.get('port'), () => {});

// on kill
process
  .on('SIGTERM', () => {
    logger.log('warn', 'process.on::SIGTERM');
    server.close(() => void process.exit(0));
  })
  .on('exit', () => {
    logger.log('warn', 'process.on::exit');
    console.log('exit');
    server.close(() => void process.exit(2));
  })
  .on('uncaughtException', (error) => {
    logger.log('error', 'process.on::uncaughtException');
    logger.log('error', `Something terrible happened: ${error}`);
    server.close(() => void process.exit(1)); // exit application
  });
