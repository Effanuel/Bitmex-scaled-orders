import {Heading} from '@chakra-ui/react';
import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Route} from 'react-router-dom';
import {activateExchange, getAllApiKeys} from 'redux/modules/settings/settingsModule';
import {Exchange} from 'redux/modules/settings/types';
import {AppState} from 'redux/modules/state';

interface Props {
  path: string;
  exact?: boolean;
  exchange: Exchange;
  component: React.ComponentType;
}

export function ExchangeRoute({path, exact, exchange, component}: Props) {
  const dispatch = useDispatch();

  const currentExchange = useSelector((state: AppState) => state.settings.activeExchange);
  const loading = useSelector((state: AppState) => state.settings.getAllApiKeysLoading);

  React.useEffect(() => {
    dispatch(activateExchange(exchange));
    dispatch(getAllApiKeys());
  }, [dispatch, exchange]);

  return (
    <Route path={path} exact={exact}>
      {loading ? (
        <Heading color="white">Loading...</Heading>
      ) : currentExchange === exchange ? (
        React.createElement(component)
      ) : null}
    </Route>
  );
}
