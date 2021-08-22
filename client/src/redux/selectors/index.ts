/* eslint-disable @typescript-eslint/no-unused-vars */
import {createSelector, OutputParametricSelector} from '@reduxjs/toolkit';
import {SYMBOL, SIDE, Order} from '../../redux/api/bitmex/types';
import {AppState} from 'redux/modules/state';
import {INSTRUMENT_PARAMS, RegularOrder, StopLoss} from 'utils';
import {parseNumber} from 'general/formatting';
import {Exchange} from 'redux/modules/settings/types';

function createWebsocketSelector<K extends keyof AppState['websocket']['bitmex']>(key: K) {
  return createSelector(
    (state: AppState) => state.websocket,
    (_: AppState, exchange: Exchange) => exchange, // this is the parameter we need
    (ws, exchange) => ws[exchange][key],
  );
}

export interface SymbolPrices {
  symbol: SYMBOL;
  askPrice: number;
  bidPrice: number;
}

interface CurrentPrice {
  askPrice: number;
  bidPrice: number;
}

export const getShowPreview = ({preview: {showPreview}}: AppState) => showPreview;
export const getOrders = ({preview: {orders}}: AppState) => orders;
const getOrderLoading = ({preview: {previewLoading}}: AppState) => previewLoading;
const getOrderError = ({preview: {error}}: AppState) => error;
export const getBalance = ({preview: {balance}}: AppState) => balance;

export const table_instrument = createWebsocketSelector('instrument');

const table_order = createWebsocketSelector('order');

const getTrailingOrderStatus = ({trailing: {trailOrderStatus}}: AppState) => trailOrderStatus;
const getTrailingOrderId = ({trailing: {trailOrderId}}: AppState) => trailOrderId;
const getTrailingOrderSide = ({trailing: {trailOrderSide}}: AppState) => trailOrderSide;
export const getTrailingOrderSymbol = ({trailing: {trailOrderSymbol}}: AppState) => trailOrderSymbol;

const getCrossOrderSide = ({cross: {crossOrderSide}}: AppState) => crossOrderSide;
const getHasPriceCrossedOnce = ({cross: {hasPriceCrossedOnce}}: AppState) => hasPriceCrossedOnce;
const getCrossOrderPrice = ({cross: {crossOrderPrice}}: AppState) => crossOrderPrice;

const getOpenOrders = ({orders: {openOrders}}: AppState) => openOrders;
const getProfitOrders = ({orders: {profitOrders}}: AppState) => profitOrders;

export const trailingOrderStatusSelector = createSelector(
  [table_order, getTrailingOrderId],
  (open_orders, trailingOrderId) => {
    for (let i = 0; i < open_orders.length; i++) {
      if (open_orders[i].orderID === trailingOrderId) {
        return open_orders[i].ordStatus || '';
      }
    }
    return 'Order not placed.';
  },
);

export const websocketBidAskPrices = createSelector(
  [table_instrument, getTrailingOrderSymbol],
  (data, symbol): CurrentPrice | undefined => {
    for (const dataRow of data) {
      if (dataRow.symbol === symbol && dataRow.askPrice && dataRow.bidPrice) {
        return {
          askPrice: dataRow.askPrice,
          bidPrice: dataRow.bidPrice,
        };
      }
    }
    return undefined;
  },
);

export const allWebsocketBidAskPrices = createSelector([table_instrument], (data): SymbolPrices[] | undefined =>
  data.map(({symbol, askPrice, bidPrice}) => ({
    symbol: symbol as SYMBOL,
    askPrice: askPrice as number,
    bidPrice: bidPrice as number,
  })),
);

export const websocketCurrentPrice = createSelector(
  [websocketBidAskPrices, getTrailingOrderSide],
  (bidAskPrices, side): number | undefined => (side === SIDE.SELL ? bidAskPrices?.askPrice : bidAskPrices?.bidPrice),
);

export const websocketTrailingPriceSelector = createSelector(
  [websocketBidAskPrices, getTrailingOrderSide, getTrailingOrderSymbol],
  (bidAskPrices, side, symbol): number | undefined => {
    if (bidAskPrices?.bidPrice && bidAskPrices.askPrice) {
      const {decimal_rounding, ticksize} = INSTRUMENT_PARAMS[symbol];
      const tick = 1 / ticksize;
      return side === SIDE.SELL
        ? parseNumber(bidAskPrices.bidPrice + tick, decimal_rounding)
        : parseNumber(bidAskPrices.askPrice - tick, decimal_rounding);
    }
    return undefined;
  },
);

export const websocketCrossPriceSelector = createSelector(
  [websocketBidAskPrices, getCrossOrderSide, getHasPriceCrossedOnce],
  (bidAskPrices, side, hasPriceCrossedOnce): number | undefined => {
    if (!hasPriceCrossedOnce) {
      return side === SIDE.SELL ? bidAskPrices?.bidPrice : bidAskPrices?.askPrice;
    } else {
      return side === SIDE.SELL ? bidAskPrices?.askPrice : bidAskPrices?.bidPrice;
    }
  },
);

export const hasCrossedOnceSelector = createSelector(
  [getCrossOrderPrice, getCrossOrderSide, websocketCrossPriceSelector],
  (orderPrice, side, currentPrice): boolean => {
    if (currentPrice && !!orderPrice) {
      return side === SIDE.BUY ? currentPrice < orderPrice : currentPrice > orderPrice;
    }
    return false;
  },
);

export const hasCrossedSecondTimeSelector = createSelector(
  [getHasPriceCrossedOnce, getCrossOrderSide, getCrossOrderPrice, websocketCrossPriceSelector],
  (hasPriceCrossedOnce, crossOrderSide, orderPrice, currentPrice): boolean =>
    hasPriceCrossedOnce &&
    !!currentPrice &&
    (crossOrderSide === SIDE.BUY ? currentPrice >= orderPrice : currentPrice <= orderPrice),
);

export const ordersAverageEntrySelector = createSelector(
  [getOrders, getShowPreview],
  (orders, previewTable): number | void => {
    if (previewTable && orders?.length) {
      const regularOrders = orders.filter((order) => !('stopPx' in order)) as RegularOrder[];
      const total_quantity = regularOrders.reduce((total, n) => total + n.orderQty, 0);

      const contract_value = regularOrders.reduce((total, n) => total + n.orderQty / n.price, 0);

      return Math.round((total_quantity / contract_value) * 10_000) / 10_000;
    }
  },
);

export const ordersRiskSelector = createSelector(
  [getOrders, ordersAverageEntrySelector, getShowPreview],
  (orderObject = [], averageEntry, previewTable): number | undefined => {
    const stopOrder = orderObject.find((order) => 'stopPx' in order) as StopLoss;
    if (previewTable && averageEntry > 0 && averageEntry && stopOrder && Object.keys(stopOrder).length) {
      let {orderQty} = stopOrder;
      // 1 contract of ETH is for 0.001 mXBT which is 1e-6 XBT
      if (stopOrder.symbol === SYMBOL.ETHUSD) orderQty *= 1e-6 * averageEntry ** 2;
      // 1 contract of XRPUSD is for 0.0002 XBT which is 2e-4 XBT
      if (stopOrder.symbol === SYMBOL.XRPUSD) orderQty *= 2e-4 * averageEntry ** 2;
      const entryValue = orderQty / averageEntry;
      const exitValue = orderQty / stopOrder.stopPx; // || 1
      return Math.abs(+(entryValue - exitValue).toFixed(5));
    }
    return undefined;
  },
);

export const balanceSelector = createSelector([getBalance], (balance): number | null =>
  balance ? Math.round((balance / 1e8) * 10000) / 10000 : null,
);

export const ordersRiskPercSelector = createSelector(
  [balanceSelector, ordersRiskSelector],
  (balance: number | null, risk: number | undefined): number =>
    balance !== 0 && balance !== null && risk !== undefined ? +((risk / balance) * 100).toFixed(2) : 0,
);

export const orderSelector = createSelector(
  [getOpenOrders, (state: AppState, props: {orderID: string}) => props.orderID],
  (orders, orderID): Order | undefined => orders.find((order) => order.orderID === orderID),
);

export const groupedOrdersSelector = createSelector([getProfitOrders], (orders): Record<string, Order[]> => {
  const groupedOrders: Record<string, Order[]> = {};
  // TODO Refactor to use .reduce
  orders.forEach((order) => {
    const openOrderId = order.text.split('.')[1];
    if (!(openOrderId in groupedOrders)) groupedOrders[openOrderId] = [order];
    else groupedOrders[openOrderId].push(order);
  });
  return groupedOrders;
});

export const activeApiKeySelector = createSelector(
  [(state: AppState) => state.settings.activeApiKeys, (state: AppState) => state.settings.activeExchange],
  (activeApiKeys, activeExchange) => Boolean(activeExchange && (activeApiKeys?.[activeExchange] ?? false)),
);
