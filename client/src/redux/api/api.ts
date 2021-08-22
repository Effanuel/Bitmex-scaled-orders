import axios, {Method} from 'axios';
import {Exchange} from 'redux/modules/settings/types';
import {BitmexBlock} from './bitmex/bitmex-block';

export type ExchangeAPIFacadeType = ClassMethods<typeof ExchangeAPIFacade>;
export type AvailableMethods = BitmexBlock;
type GetQuery = (exchange: Exchange) => <K extends keyof BitmexBlock>(method: K) => BitmexBlock[K];

export class ExchangeAPIFacade implements ExchangeAPIFacadeType {
  private BitmexBlock: BitmexBlock = new BitmexBlock();

  getQuery: GetQuery = (exchange) => {
    return (method) => {
      switch (exchange) {
        case Exchange.BitMeX:
          return this.BitmexBlock[method];
        case Exchange.BitMeXTEST:
          return this.BitmexBlock[method];
        default:
          return this.BitmexBlock[method];
      }
    };
  };
}

export type BasicAPIType = ClassMethods<typeof BasicAPI>;

export class BasicAPI implements BasicAPIType {
  private async request<R>(url: string, method: Method, data?: unknown) {
    return axios({url, method, data: data, params: data}) as Promise<{data: {data: R}}>;
  }

  async saveApiKey(params: {exchange: Exchange; key: string; secret: string}) {
    return this.request<{exchange: Exchange}>('/settings/apiKey', 'POST', params);
  }

  async getApiKey(params: {exchange: Exchange; key: string; secret: string}) {
    return this.request<{exchange: Exchange; key: string; secret: string}>('/settings/apiKey', 'GET', params);
  }

  async getAllApiKeys() {
    return this.request<{exchanges: Exchange[]}>('/settings/apiKeys', 'GET');
  }

  async deleteApiKey(exchange: Exchange) {
    return this.request<Exchange>('/settings/apiKey', 'DELETE', exchange);
  }

  async deleteAllApiKeys() {
    return this.request<unknown>('/settings/apiKeys', 'DELETE');
  }
}

export const basicApi = new BasicAPI();
