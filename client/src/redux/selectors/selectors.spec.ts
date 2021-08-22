import {
  ordersRiskSelector,
  ordersRiskPercSelector,
  getBalance,
  ordersAverageEntrySelector,
  getShowPreview,
  getOrders,
  table_instrument,
  websocketBidAskPrices,
  websocketCurrentPrice,
  balanceSelector,
  getTrailingOrderSymbol,
  websocketTrailingPriceSelector,
} from './index';
import {ScaledOrder} from 'utils';
import {Instrument, SIDE, SYMBOL} from 'redux/api/bitmex/types';
import {
  mockInstrumentData,
  mockWebsocketState,
  mockPreviewState,
  mockScaledOrders,
  mockTrailingState,
  mockCrossState,
  mockOrdersState,
  mockSettingsState,
} from 'tests/mockData/orders';
import {AppState} from 'redux/modules/state';
import {Exchange} from 'redux/modules/settings/types';

describe('Selectors', () => {
  const exchange = Exchange.BitMeX;

  const mockState: AppState = {
    websocket: mockWebsocketState({instrument: mockInstrumentData as Instrument[]}),
    preview: mockPreviewState({orders: mockScaledOrders, balance: 12_345_678_993_321, showPreview: true}),
    trailing: mockTrailingState({trailOrderSide: SIDE.SELL, trailOrderSymbol: SYMBOL.XBTUSD}),
    cross: mockCrossState(),
    orders: mockOrdersState(),
    settings: mockSettingsState(),
  };

  let result: unknown;

  describe('websocketBidAskPrices', () => {
    it('should return askPrice of current symbol', () => {
      const instrument = table_instrument(mockState, exchange);
      const wsSymbol = getTrailingOrderSymbol(mockState);
      const result = websocketBidAskPrices.resultFunc(instrument, wsSymbol);
      expect(result!.askPrice).toEqual(8011);
      expect(result!.bidPrice).toEqual(8001);
    });

    it('returns undefined if no data for symbol was found', () => {
      const payload: AppState = {
        ...mockState,
        websocket: {...mockState.websocket},
        trailing: {...mockState.trailing, trailOrderSymbol: 'HELLO' as SYMBOL},
      };
      const instrument = table_instrument(payload, exchange);
      const wsSymbol = getTrailingOrderSymbol(payload);
      const result = websocketBidAskPrices.resultFunc(instrument, wsSymbol);
      expect(result).toEqual(undefined);
    });
  });

  describe('wsCurrentPrice', () => {
    const mockBidPrices = {askPrice: 1234, bidPrice: 4567};

    it('should return `askPrice` if side is `Sell`', () => {
      const price = websocketCurrentPrice.resultFunc(mockBidPrices, SIDE.SELL);
      expect(price!).toEqual(mockBidPrices.askPrice);
    });

    it('should return `bidPrice` if side is `Buy`', () => {
      const price = websocketCurrentPrice.resultFunc(mockBidPrices, SIDE.BUY);
      expect(price!).toEqual(mockBidPrices.bidPrice);
    });
  });

  describe('balanceSelector', () => {
    it('divides and rounds the balance to 4th digit', () => {
      const balance = getBalance(mockState);
      const result = balanceSelector.resultFunc(balance);
      expect(result).toEqual(123456.7899);
    });
  });

  describe('websocketTrailingPriceSelector', () => {
    function validateTrailingPrice(symbol: SYMBOL, side: SIDE) {
      const instrument = table_instrument(mockState, exchange);
      const bidAskPrices = websocketBidAskPrices.resultFunc(instrument, symbol);
      return websocketTrailingPriceSelector.resultFunc(bidAskPrices, side, symbol);
    }
    it('should calculate with sell side', () => {
      expect(validateTrailingPrice(SYMBOL.XBTUSD, SIDE.SELL)).toEqual(8001.5);
      expect(validateTrailingPrice(SYMBOL.ETHUSD, SIDE.SELL)).toEqual(111.3);
      expect(validateTrailingPrice(SYMBOL.XRPUSD, SIDE.SELL)).toEqual(0.1989);
    });

    it('should calculate with buy side', () => {
      expect(validateTrailingPrice(SYMBOL.XBTUSD, SIDE.BUY)).toEqual(8010.5);
      expect(validateTrailingPrice(SYMBOL.ETHUSD, SIDE.BUY)).toEqual(221.95);
      expect(validateTrailingPrice(SYMBOL.XRPUSD, SIDE.BUY)).toEqual(0.237);
    });
  });

  describe('ordersRiskSelector', () => {
    const findStopOrderIndex = (orders: ScaledOrder[]) => orders.findIndex((order) => 'stopPx' in order);
    it('should calculate risk based on average entry for XBTUSD', () => {
      const showPreview = getShowPreview(mockState);
      const orders = getOrders(mockState);
      orders[findStopOrderIndex(orders)]['symbol'] = SYMBOL.XBTUSD;

      const averageEntry = ordersAverageEntrySelector.resultFunc(orders, showPreview);

      result = ordersRiskSelector.resultFunc(orders, averageEntry, showPreview);
      expect(result).toEqual(18.5);
    });

    it('calculates risk based on average entry for ETHUSD', () => {
      const showPreview = getShowPreview(mockState);
      const orders = getOrders(mockState);

      orders[findStopOrderIndex(orders)]['symbol'] = SYMBOL.ETHUSD;

      const averageEntry = ordersAverageEntrySelector.resultFunc(orders, showPreview);

      result = ordersRiskSelector.resultFunc(orders, averageEntry, showPreview);
      expect(result).toEqual(110.95377);
    });

    it('calculates risk based on average entry for XRPUSD', () => {
      const showPreview = getShowPreview(mockState);
      const orders = getOrders(mockState);
      orders[findStopOrderIndex(orders)]['symbol'] = SYMBOL.XRPUSD;

      const averageEntry = ordersAverageEntrySelector.resultFunc(orders, showPreview);

      result = ordersRiskSelector.resultFunc(orders, averageEntry, showPreview);
      expect(result).toEqual(22190.7539);
    });
  });

  describe('ordersRiskPercSelector', () => {
    it('calculates risk percentage based on risk amount and balance', () => {
      const balance = getBalance(mockState);

      result = ordersRiskPercSelector.resultFunc(balance, 12_345_678_993_321);
      expect(result).toEqual(100);
      result = ordersRiskPercSelector.resultFunc(balance, 12_345_678_990_000);
      expect(result).toEqual(100);
      result = ordersRiskPercSelector.resultFunc(balance, 2_211_000_993_321);
      expect(result).toEqual(17.91);
    });

    it('returns 0 if balance is 0', () => {
      const balance = 0;
      result = ordersRiskPercSelector.resultFunc(balance, 12_345_678_993_321);
      expect(result).toEqual(0);
    });
  });

  describe('ordersAveragePriceSelectore', () => {
    it('returns average price of the orders', () => {
      const orders = getOrders(mockState);
      const showPreview = getShowPreview(mockState);

      result = ordersAverageEntrySelector.resultFunc(orders, showPreview);
      expect(result).toEqual(2448.9796);
    });

    it('returns undefined if (showPreview is false) or (orderList is undefined)', () => {
      const orders = getOrders(mockState);

      result = ordersAverageEntrySelector.resultFunc(orders, false);
      expect(result).toEqual(undefined);

      result = ordersAverageEntrySelector.resultFunc([], true);
      expect(result).toEqual(undefined);
    });
  });
});
