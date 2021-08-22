import {defaultState as websocketDefaultState} from 'redux/modules/websocket/websocketModule';
import {defaultState as previewDefaultState} from 'redux/modules/preview/previewModule';
import {defaultState as trailingDefaultState} from 'redux/modules/trailing/trailingModule';
import {defaultState as crossDefaultState} from 'redux/modules/cross/crossModule';
import {defaultState as ordersDefaultState} from 'redux/modules/orders/ordersModule';
import {defaultState as settingsDefaultState} from 'redux/modules/settings/settingsModule';
import {WebsocketState} from 'redux/modules/websocket/types';
import {PreviewState} from 'redux/modules/preview/types';
import {TrailingState} from 'redux/modules/trailing/types';
import {SYMBOL, SIDE, ORD_TYPE} from 'redux/api/bitmex/types';
import {RegularOrder, ScaledOrder} from 'utils';
import {CrossState} from 'redux/modules/cross/types';
import {Instrument} from 'redux/api/bitmex/types';
import {OrdersState} from 'redux/modules/orders/types';
import {Exchange, SettingsState} from 'redux/modules/settings/types';

export const mockWebsocketState = (overrides?: Partial<WebsocketState['bitmex']>) => ({
  ...websocketDefaultState,
  [Exchange.BitMeX]: {...websocketDefaultState['bitmex'], ...overrides},
});
export const mockPreviewState = (overrides?: Partial<PreviewState>) => ({...previewDefaultState, ...overrides});
export const mockTrailingState = (overrides?: Partial<TrailingState>) => ({...trailingDefaultState, ...overrides});
export const mockCrossState = (overrides?: Partial<CrossState>) => ({...crossDefaultState, ...overrides});
export const mockOrdersState = (overrides?: Partial<OrdersState>) => ({...ordersDefaultState, ...overrides});
export const mockSettingsState = (overrides?: Partial<SettingsState>) => ({...settingsDefaultState, ...overrides});

export const mockCreateOrder = (overrides?: Partial<RegularOrder>): RegularOrder => ({
  symbol: SYMBOL.ETHUSD,
  price: 8000,
  orderQty: 500,
  side: SIDE.SELL,
  ordType: ORD_TYPE.Limit,
  text: 'text',
  ...overrides,
});

export const mockInstrumentData: Partial<Instrument>[] = [
  {symbol: 'XBTUSD', askPrice: 8011, bidPrice: 8001},
  {symbol: 'ETHUSD', askPrice: 222, bidPrice: 111.25},
  {symbol: 'XRPUSD', askPrice: 0.2371, bidPrice: 0.1988},
];

export const mockScaledOrders: ScaledOrder[] = [
  mockCreateOrder({orderQty: 10000, price: 1000}),
  mockCreateOrder({orderQty: 10000, price: 2000}),
  mockCreateOrder({orderQty: 10000, price: 3000}),
  mockCreateOrder({orderQty: 10000, price: 4000}),
  mockCreateOrder({orderQty: 10000, price: 5000}),
  mockCreateOrder({orderQty: 10000, price: 6000}),
  {symbol: SYMBOL.XBTUSD, stopPx: 10000, orderQty: 60_000, text: 'stop'} as any,
];

const orderStop = {
  execInst: 'LastPrice,ReduceOnly',
  ordType: 'Stop',
  orderQty: 500,
  side: 'Buy',
  stopPx: 8000,
  symbol: SYMBOL.ETHUSD,
  text: 'stop',
};

export default function mockDistributionOrders(stop: Partial<typeof orderStop> | null = orderStop) {
  const orderData = (uniqueFields: Partial<RegularOrder> = {}) => {
    const execInst = 'ParticipateDoNotInitiate';
    const commonFields = {execInst, ordType: ORD_TYPE.Limit, side: SIDE.SELL, symbol: SYMBOL.ETHUSD};
    return mockCreateOrder({...commonFields, ...uniqueFields});
  };

  const stopOrder = stop ? [stop] : [];

  return {
    orders_uniform: [
      orderData({orderQty: 166, price: 7500, text: 'order_1'}),
      orderData({orderQty: 166, price: 7600, text: 'order_2'}),
      orderData({orderQty: 168, price: 7700, text: 'order_3'}),
      ...stopOrder,
    ],
    orders_normal: [
      orderData({orderQty: 53, price: 7500, text: 'order_1'}),
      orderData({orderQty: 393, price: 7600, text: 'order_2'}),
      orderData({orderQty: 54, price: 7700, text: 'order_3'}),
      ...stopOrder,
    ],
    orders_positive: [
      orderData({orderQty: 287, price: 7500, text: 'order_1'}),
      orderData({orderQty: 174, price: 7600, text: 'order_2'}),
      orderData({orderQty: 39, price: 7700, text: 'order_3'}),
      ...stopOrder,
    ],
    orders_negative: [
      orderData({orderQty: 38, price: 7500, text: 'order_1'}),
      orderData({orderQty: 174, price: 7600, text: 'order_2'}),
      orderData({orderQty: 288, price: 7700, text: 'order_3'}),
      ...stopOrder,
    ],
  };
}
