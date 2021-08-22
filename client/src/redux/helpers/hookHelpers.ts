import {useSelector, shallowEqual} from 'react-redux';
import {
  ordersAverageEntrySelector,
  ordersRiskSelector,
  ordersRiskPercSelector,
  websocketCurrentPrice,
  trailingOrderStatusSelector,
  websocketBidAskPrices,
  allWebsocketBidAskPrices,
  websocketTrailingPriceSelector,
  websocketCrossPriceSelector,
  hasCrossedOnceSelector,
  hasCrossedSecondTimeSelector,
  groupedOrdersSelector,
} from 'redux/selectors';
import {AppState} from 'redux/modules/state';
import {Exchange} from 'redux/modules/settings/types';

type Selectors = ReturnType<typeof buildSelectors>;

const buildSelectors = (state: AppState, exchange: Exchange) => {
  const {trailing, preview, websocket, cross, orders, settings} = state;
  return {
    wsCurrentPrice: websocketCurrentPrice(state, exchange),
    wsTrailingPrice: websocketTrailingPriceSelector(state, exchange),
    wsCrossPrice: websocketCrossPriceSelector(state, exchange),
    wsBidAskPrices: websocketBidAskPrices(state, exchange),
    allPrices: allWebsocketBidAskPrices(state, exchange),
    averagePrice: ordersAverageEntrySelector(state),
    riskBTC: ordersRiskSelector(state),
    riskPerc: ordersRiskPercSelector(state),
    status: trailingOrderStatusSelector(state, exchange),
    hasCrossedOnce: hasCrossedOnceSelector(state, exchange),
    hasCrossedSecondTime: hasCrossedSecondTimeSelector(state, exchange),
    groupedOrders: groupedOrdersSelector(state),

    trailOrderId: trailing.trailOrderId,
    trailOrderPrice: trailing.trailOrderPrice,
    trailOrderStatus: trailing.trailOrderStatus,
    trailOrderSide: trailing.trailOrderSide,
    trailOrderSymbol: trailing.trailOrderSymbol,
    trailLoading: trailing.trailLoading,

    crossOrderSymbol: cross.crossOrderSymbol,
    crossOrderQuantity: cross.crossOrderQuantity,
    crossOrderPrice: cross.crossOrderPrice,
    crossOrderSide: cross.crossOrderSide,
    hasPriceCrossedOnce: cross.hasPriceCrossedOnce,

    orders: preview.orders,
    balance: preview.balance,
    error: preview.error,
    showPreview: preview.showPreview,
    previewLoading: preview.previewLoading,

    __keys: websocket[exchange].__keys,
    connected: websocket[exchange].connected,
    instrument: websocket[exchange].instrument,
    order: websocket[exchange].order,
    wsLoading: websocket[exchange].wsLoading,
    wsMessage: websocket[exchange].message,

    openOrders: orders.openOrders,
    ordersError: orders.ordersError,
    ordersLoading: orders.ordersLoading,
    profitOrders: orders.profitOrders,
    profitOrdersInAction: orders.profitOrdersInAction,

    activeApiKeys: settings.activeApiKeys,
    settingsError: settings.settingsError,
    settingsLoading: settings.settingsLoading,
    activeExchange: settings.activeExchange,
    getAllApiKeysLoading: settings.getAllApiKeysLoading,
  };
};

export function useReduxSelector<K extends keyof Selectors>(exchange: Exchange, ...keys: K[]): Pick<Selectors, K> {
  const selector = useSelector((state: AppState) => {
    const builtSelectors = buildSelectors(state, exchange);
    return keys.reduce(
      (availableSelectors: Pick<Selectors, K>, selectorKey: K) => (
        (availableSelectors[selectorKey] = builtSelectors[selectorKey]), availableSelectors
      ),
      {} as Selectors,
    );
  }, shallowEqual);
  return selector;
}
