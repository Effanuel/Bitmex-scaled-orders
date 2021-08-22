import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import flatCache from 'flat-cache';
import {logger} from './util/logger';
import {SettingsRouter} from './routes/settingsRouter';
import {BitmexRouter} from './routes/bitmexRouter';

export const cache = flatCache.create('apiKeyCache', path.resolve('./cache'));

export function expressApp() {
  const app: express.Application = express();

  const port = process.env.PORT || 3003;

  app
    .set('port', port)
    .use(helmet())
    .use(cors())
    .disable('etag')
    .disable('x-powered-by')
    .use(express.urlencoded({extended: true}))
    .use(express.json())
    .use('/bitmex', BitmexRouter())
    .use('/settings', SettingsRouter());

  if (process.env.NODE_ENV != 'development') {
    console.log(`Server is running at http://localhost:${app.get('port')} in ${app.get('env')} mode`);
    console.log('Press CTRL-C to stop\n');
    // Serve any static files
    app.use(express.static(path.join(__dirname, '../../client/build')));
    // Handle React routing, return all requests to React app
    app.get('/*', function (req: express.Request, res: express.Response) {
      res.sendFile(path.join(__dirname, '../../', 'client/build/index.html'));
    });
  }

  const morganFormat = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
  app.use(morgan(morganFormat, {skip: (req, res) => res.statusCode < 400, stream: process.stderr}));
  app.use(morgan(morganFormat, {skip: (req, res) => res.statusCode >= 400, stream: process.stdout}));

  app.get('/', function (req, res) {
    logger.debug('Debug statement');
    logger.info('Info statement');
    res.send(req.method + ' ' + req.originalUrl);
  });

  app.get('/error', (req, res) => {
    throw new Error('Problem Here!');
  });

  // // All errors are sent back as JSON
  app.use((err: any, req: any, res: any, next: any) => {
    // Fallback to default node handler
    if (res.headersSent) {
      next(err);
      return;
    }

    logger.error(err.message, {url: req.originalUrl});

    res.status(500);
    res.json({error: err.message});
  });

  return app;
}
