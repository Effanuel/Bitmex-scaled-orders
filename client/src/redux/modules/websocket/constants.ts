import {SYMBOL} from 'redux/api/bitmex/types';
import {Exchange} from '../settings/types';

const baseUrls: {[key in Exchange]: string} = {
  [Exchange.BitMeX]: `wss://www.bitmex.com/realtime?subscribe=`,
  [Exchange.BitMeXTEST]: `wss://testnet.bitmex.com/realtime?subscribe=`,
};

export function websocketBaseUrl(exchange: Exchange) {
  return baseUrls[exchange];
}

export const instrumentTopics = (...symbols: SYMBOL[]) => symbols.map((symbol) => `instrument:${symbol}`).join(',');
