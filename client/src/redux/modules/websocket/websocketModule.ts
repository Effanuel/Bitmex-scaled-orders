import {WebsocketResponse, WebsocketState, RESPONSE_ACTIONS, FETCH_ORDERS, Tables, TableData} from './types';
import {
  connect,
  disconnect,
  send,
  WEBSOCKET_BROKEN,
  WEBSOCKET_CLOSED,
  WEBSOCKET_CONNECT,
  WEBSOCKET_MESSAGE,
  WEBSOCKET_OPEN,
  WEBSOCKET_SEND,
  WEBSOCKET_ERROR,
} from '@giantmachines/redux-websocket';
import {Thunk} from '../state';
import {Reducer} from 'redux';
import {authKeyExpires} from 'utils/auth';
import {SUBSCRIPTION_TOPICS, SYMBOL} from 'redux/api/bitmex/types';
import {websocketBaseUrl, instrumentTopics} from './constants';
import {Instrument, Order} from '../../api/bitmex/types';
import {Exchange} from '../settings/types';

const websocketSlice = {
  __keys: {},
  instrument: [],
  order: [],
  connected: false,
  wsLoading: false,
  message: 'Websocket is offline.',
  error: '',
};

export const defaultState: WebsocketState = {
  [Exchange.BitMeX]: websocketSlice,
  [Exchange.BitMeXTEST]: websocketSlice,
};

export const websocketReducer: Reducer<WebsocketState, any> = (state = defaultState, action): WebsocketState => {
  const [exchange, type] = action.type.split('::') as [Exchange, string];
  const exchangeSlice = state[exchange];

  switch (type) {
    case FETCH_ORDERS: {
      const slice = {...exchangeSlice, order: {...exchangeSlice.order, ...action.payload}};
      return {...state, [exchange]: slice};
    }
    case WEBSOCKET_CONNECT: {
      const slice = {...exchangeSlice, wsLoading: true, message: 'Connecting...'};
      return {...state, [exchange]: slice};
    }
    case WEBSOCKET_OPEN: {
      const slice = {...exchangeSlice, wsLoading: false, message: 'Websocket opened.', connected: true};
      return {...state, [exchange]: slice};
    }
    case WEBSOCKET_BROKEN:
    case WEBSOCKET_CLOSED: {
      const slice = {...defaultState, message: 'Websocket closed.'};
      return {...state, [exchange]: slice};
    }
    case WEBSOCKET_ERROR: {
      const slice = {...defaultState, message: 'Error. Too many reloads?'};
      return {...state, [exchange]: slice};
    }
    case WEBSOCKET_MESSAGE:
      return reduxWeboscketMessage(state, action, exchange);
    case WEBSOCKET_SEND:
    default:
      return state;
  }
};

const reduxWeboscketMessage = (state = defaultState, action: any, exchange: Exchange): WebsocketState => {
  const response: WebsocketResponse = JSON.parse(action.payload.message);
  const {table, data, action: ws_action, subscribe, status} = response;
  const exchangeSlice = state[exchange];

  if (subscribe) {
    const message = response['success'] ? 'Successful subscription.' : 'Error while subscribing...';
    return {...state, [exchange]: {...exchangeSlice, message}};
  } else if (!!status) {
    const message = `Websocket. Status: ${response.status || 'Error'}`;
    return {...state, [exchange]: {...exchangeSlice, message}};
  } else if (ws_action) {
    switch (ws_action) {
      case RESPONSE_ACTIONS.PARTIAL: {
        const updatedTable = [...exchangeSlice[table], ...data];
        const updatedKeys = {...exchangeSlice.__keys, [table]: response.keys};
        const slice = {...exchangeSlice, [table]: updatedTable, __keys: updatedKeys};

        return {...state, [exchange]: slice};
      }
      case RESPONSE_ACTIONS.INSERT: {
        const updatedTable = [...exchangeSlice[table], ...data];
        const slice = {...exchangeSlice, [table]: updatedTable};

        return {...state, [exchange]: slice};
      }
      case RESPONSE_ACTIONS.UPDATE: {
        let updatedTable: Instrument[] | Order[] = exchangeSlice[table];
        for (const key_val of data) {
          const indexUpdate = findItemByKeys(exchangeSlice.__keys[table] as any, updatedTable, key_val as any);
          if (indexUpdate === -1) continue;
          const updatedValue: Instrument | Order = {...exchangeSlice[table][indexUpdate], ...key_val};

          updatedTable = [
            ...exchangeSlice[table].slice(0, indexUpdate),
            updatedValue,
            ...exchangeSlice[table].slice(indexUpdate + 1),
          ] as Instrument[] | Order[];

          if (table === 'order') {
            const leavesQty = (updatedValue as Order)?.leavesQty;
            if (typeof leavesQty === 'number' && leavesQty <= 0) {
              updatedTable = exchangeSlice[table].filter((_, i) => i !== indexUpdate);
            }
          }
        }

        const slice = {...exchangeSlice, [table]: updatedTable};
        return {...state, [exchange]: slice};
      }
    }
  } else if (!!response?.unsubscribe) {
    const {[response.unsubscribe]: _deleted, ...rest} = exchangeSlice.__keys;
    // eslint-disable-next-line no-console
    console.warn('UNSUBSCRIBED: ', rest, response.unsubscribe);

    const slice = {...exchangeSlice, __keys: rest};
    return {...state, [exchange]: slice};
  }
  return state;
};

export const wsConnect =
  (exchange: Exchange): Thunk =>
  async (dispatch) => {
    try {
      const url = websocketBaseUrl(exchange);
      const subscribe = instrumentTopics(SYMBOL.XBTUSD, SYMBOL.ETHUSD, SYMBOL.XRPUSD);
      dispatch(connect(`${url}${subscribe}`, [exchange]));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err.response.data, 'wsConnect Error');
    }
  };

export const wsDisconnect =
  (exchange: Exchange): Thunk =>
  async (dispatch) => {
    try {
      dispatch(disconnect(exchange));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err.response.data, 'wsDisconnect Error');
    }
  };

export const wsAuthenticate = (): Thunk => async (dispatch) => {
  try {
    dispatch(send(authKeyExpires('/realtime', 'GET')));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err.response.data, 'wsAuthenticate error');
  }
};

export const wsSubscribeTo =
  (payload: SUBSCRIPTION_TOPICS): Thunk =>
  async (dispatch) => {
    try {
      dispatch(send({op: 'subscribe', args: [payload]}));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err.response.data, 'wsSubscribe Error');
    }
  };

// export const wsUnsubscribeFrom = (payload: SUBSCRIPTION_TOPICS): Thunk => async (dispatch) => {
//   try {
//     dispatch(send({op: 'unsubscribe', args: [payload]}));
//   } catch (err) {
//     // eslint-disable-next-line no-console
//     console.log(err.response.data, 'wsUnsubscribe Error');
//   }
// };

function findItemByKeys(keys: keyof Tables, table: ValueOf<Tables>, matchData: TableData): number {
  for (let index = 0; index < table.length; index++) {
    let matched = true;
    for (const key of keys) {
      if (table[index][key as keyof TableData] !== matchData[key as keyof TableData]) {
        matched = false;
      }
    }
    if (matched) return index;
  }
  return -1;
}
