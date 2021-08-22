import {useEffect} from 'react';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {AppState} from 'redux/modules/state';
import {
  trailingOrderStatusSelector,
  websocketBidAskPrices,
  websocketCurrentPrice,
  websocketTrailingPriceSelector,
} from 'redux/selectors';
import {__clearTrailingOrder} from 'redux/modules/trailing/trailingModule';
import {useAppContext} from 'general/hooks';
import {Exchange} from 'redux/modules/settings/types';

export function useHooks(exchange: Exchange) {
  const {api} = useAppContext();
  const {
    wsTrailingPrice,
    wsCurrentPrice,
    wsBidAskPrices,
    trailOrderId,
    trailOrderStatus,
    trailOrderPrice,
    trailOrderSide,
    status,
    connected,
  } = useSelector((state: AppState) => {
    const {websocket, trailing} = state;
    return {
      wsCurrentPrice: websocketCurrentPrice(state, exchange),
      wsTrailingPrice: websocketTrailingPriceSelector(state, exchange),
      wsBidAskPrices: websocketBidAskPrices(state, exchange),
      status: trailingOrderStatusSelector(state, exchange),
      connected: websocket[exchange].connected,
      trailOrderId: trailing.trailOrderId,
      trailOrderPrice: trailing.trailOrderPrice,
      trailOrderStatus: trailing.trailOrderStatus,
      trailOrderSide: trailing.trailOrderSide,
    };
  }, shallowEqual);

  const dispatch = useDispatch();

  useEffect(() => {
    const statuses = ['Filled', 'Canceled', 'Order not placed.'];
    if (wsTrailingPrice && trailOrderPrice && !statuses.includes(status)) {
      const toAmmend = wsTrailingPrice !== trailOrderPrice;
      if (toAmmend) {
        api.ammendTrailingOrder({orderID: trailOrderId, price: wsTrailingPrice});
      }
    }
  }, [api, trailOrderPrice, trailOrderId, trailOrderSide, status, wsTrailingPrice]);

  useEffect(() => {
    const statuses = ['Filled', 'Canceled', 'Order not placed.'];
    if (statuses.includes(status) && trailOrderStatus !== 'Order not placed.') {
      dispatch(__clearTrailingOrder());
    }
    // TODO: handle ammending error in some way
    // Trailing order ammending error trailing order status change is ignored because of a missing dep,
    // but right now it wont matter, cause nothing depends on that error
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, status]);

  return {
    wsCurrentPrice,
    wsBidAskPrices,
    trailOrderId,
    trailOrderStatus,
    trailOrderPrice,
    status,
    connected,
  };
}
