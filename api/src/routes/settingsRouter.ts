import {Router} from 'express';
import {cache} from '../app';
import {logger} from '../util/logger';

export function SettingsRouter(): Router {
  return Router()
    .post('/apiKey', async function saveApiKey({body}, res) {
      try {
        cache.setKey(body.exchange, {key: body.key, secret: body.secret});
        cache.save(true);
        console.log('GET API KEY', body);
        logger.info('Successfully saved api key');
        return res.send({data: {exchange: body.exchange}, statusCode: res.statusCode});
      } catch (error) {
        return res.status(400).send({error: error});
      }
    })
    .get('/apiKey', async function getApiKey({query}, res) {
      try {
        const exchange = query.exchange as string;
        const data = cache.getKey(exchange);
        return res.send({data: {exchange, key: data.key ?? '', secret: data.secret ?? ''}, statusCode: res.statusCode});
      } catch (error) {
        return res.status(400).send({error: error});
      }
    })
    .get('/apiKeys', async function getAllApiKeys(req, res) {
      try {
        const data = cache.keys();
        return res.send({data: {exchanges: data}, statusCode: res.statusCode});
      } catch (error) {
        return res.status(400).send({error: error});
      }
    })
    .delete('/apiKey', async function deleteApiKey({body: {data}}, res) {
      try {
        cache.removeKey(data.exchange);
        cache.save(true);
        logger.info('Successfully deleted api key');
        return res.send({data: {exchange: data.exchange}, statusCode: res.statusCode});
      } catch (error) {
        return res.status(400).send({error: error});
      }
    })
    .delete('/apiKeys', async function deleteAllApiKeys(req, res) {
      try {
        cache.destroy();
        logger.info('Successfully deleted all api keys');
        return res.send({statusCode: res.statusCode});
      } catch (error) {
        return res.status(400).send({error: error});
      }
    });
}
