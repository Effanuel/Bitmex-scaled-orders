import {Request, Response, Router} from 'express';
import {fetchBitmexExchange} from '../util/auth';
import {logger} from '../util/logger';

export function BitmexRouter(): Router {
  return Router().post('/*', async ({originalUrl, baseUrl, body: {data, method}, query}: Request, res: Response) => {
    try {
      const path = originalUrl.replace(`${baseUrl}/`, '');
      const body =
        method === 'GET' ? (query ? {filter: JSON.parse((query.filter as string) || '{}')} : undefined) : data;

      const response = await fetchBitmexExchange(path, method, body);
      logger.info(`Successful ${method} request (${originalUrl})`);

      return res.send({data: response, statusCode: res.statusCode});
    } catch (error) {
      return res.status(400).send({error: error});
    }
  });
}
