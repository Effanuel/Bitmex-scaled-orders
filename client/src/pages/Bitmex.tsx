import 'scss/root.module.scss';
import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Box} from '@chakra-ui/react';
import {
  ScaledOrders,
  MarketOrderContainer,
  TrailingLimitOrder,
  TickerPricesContainer,
  //   CrossOrderContainer,
  OpenOrdersContainer,
} from 'containers';
import {Spinner, ToastContainer} from 'components';
import {useReduxSelector} from 'redux/helpers/hookHelpers';
import {wsConnect, wsDisconnect, wsSubscribeTo, wsAuthenticate} from 'redux/modules/websocket/websocketModule';
import {useAppContext} from 'general/hooks';
import {Banner} from 'components/Banner/Banner';
import {Exchange} from 'redux/modules/settings/types';
import {activeApiKeySelector} from 'redux/selectors';

const exchange = Exchange.BitMeX;

const BitmexExchange = React.memo(() => {
  const {api} = useAppContext();
  const isApiKeyActive = useSelector(activeApiKeySelector);
  const dispatch = useDispatch();
  const {previewLoading, trailLoading, wsLoading, connected} = useReduxSelector(
    exchange,
    'previewLoading',
    'trailLoading',
    'wsLoading',
    'connected',
  );

  React.useEffect(() => {
    dispatch(wsConnect(exchange));

    return () => {
      dispatch(wsDisconnect(exchange));
    };
  }, [dispatch]);

  React.useEffect(() => {
    if (connected && isApiKeyActive) {
      api.getBalance();
      dispatch(wsAuthenticate());
      dispatch(wsSubscribeTo('order'));
    }
  }, [dispatch, api, connected, isApiKeyActive]);

  return (
    <Box marginTop="25px">
      {!isApiKeyActive && <Banner />}
      <ToastContainer />
      <Spinner loading={previewLoading || trailLoading || wsLoading} />
      <TickerPricesContainer />
      <OpenOrdersContainer />
      {/* <CrossOrderContainer exchange={exchange} /> TODO: disabling for now */}
      <MarketOrderContainer />
      <TrailingLimitOrder exchange={exchange} />
      <ScaledOrders />
    </Box>
  );
});

export default BitmexExchange;
