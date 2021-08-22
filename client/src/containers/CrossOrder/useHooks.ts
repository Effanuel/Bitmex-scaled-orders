import {useEffect} from 'react';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {AppState} from 'redux/modules/state';
import {orderCrossedOnce} from 'redux/modules/cross/crossModule';
import {hasCrossedOnceSelector, hasCrossedSecondTimeSelector, websocketCrossPriceSelector} from 'redux/selectors';
import {useAppContext} from 'general/hooks';
import {Exchange} from 'redux/modules/settings/types';

export function useHooks(exchange: Exchange) {
  const {api} = useAppContext();
  const {hasCrossedOnce, hasCrossedSecondTime, wsCrossPrice, connected, crossOrderPrice, hasPriceCrossedOnce} =
    useSelector((state: AppState) => {
      const {websocket, cross} = state;
      return {
        hasCrossedOnce: hasCrossedOnceSelector(state, exchange),
        hasCrossedSecondTime: hasCrossedSecondTimeSelector(state, exchange),
        wsCrossPrice: websocketCrossPriceSelector(state, exchange),
        connected: websocket[exchange].connected,
        crossOrderPrice: cross.crossOrderPrice,
        hasPriceCrossedOnce: cross.hasPriceCrossedOnce,
      };
    }, shallowEqual);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!hasPriceCrossedOnce && hasCrossedOnce) {
      //TODO RENAME
      dispatch(orderCrossedOnce());
    }
  }, [dispatch, hasPriceCrossedOnce, hasCrossedOnce]);

  useEffect(() => {
    if (hasCrossedSecondTime) {
      //@ts-expect-error
      api.postMarketCrossOrder();
    }
  }, [api, hasCrossedSecondTime]);

  return {
    wsCrossPrice,
    connected,
    crossOrderPrice,
  };
}
