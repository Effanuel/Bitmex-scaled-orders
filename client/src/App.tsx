import React from 'react';
import {Box} from '@chakra-ui/react';
import {Route, Switch} from 'react-router-dom';
import {ExchangeRoute, Header} from 'components';
import {Exchange} from 'redux/modules/settings/types';
import Home from 'pages/Home';
import Settings from 'pages/Settings';
import NotFound from 'pages/NotFound';
import BitmexExchange from 'pages/Bitmex';
import {RoutePath} from 'pages/paths';

import 'scss/root.module.scss';

export default React.memo(function App() {
  return (
    <>
      <Header />
      <Box maxWidth="720px" margin="auto" minWidth="720px">
        <Switch>
          <Route path={RoutePath.Home} exact component={Home} />
          <ExchangeRoute path={RoutePath.BitMex} exchange={Exchange.BitMeX} component={BitmexExchange} />
          <ExchangeRoute path={RoutePath.BitmexTest} exchange={Exchange.BitMeXTEST} component={BitmexExchange} />
          <Route path={RoutePath.Settings} component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Box>
    </>
  );
});
