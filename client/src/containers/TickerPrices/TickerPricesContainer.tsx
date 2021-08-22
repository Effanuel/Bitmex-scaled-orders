import React from 'react';
import {Stat, StatHelpText, StatLabel, Text, StatNumber} from '@chakra-ui/react';
import {useSelector} from 'react-redux';
import isEqual from 'lodash/fp/isEqual';
import {SYMBOL} from 'redux/api/bitmex/types';
import {allWebsocketBidAskPrices, SymbolPrices} from 'redux/selectors';
import {MainContainer, Row} from 'components';
import styles from './TickerPricesContainer.module.scss';
import {AppState} from 'redux/modules/state';
import {formatPrice} from 'general/formatting';
import {useExchange} from 'general/hooks';

const none = '---' as unknown as number;

const defaultData: SymbolPrices[] = [
  {askPrice: none, bidPrice: none, symbol: SYMBOL.XBTUSD},
  {askPrice: none, bidPrice: none, symbol: SYMBOL.ETHUSD},
  {askPrice: none, bidPrice: none, symbol: SYMBOL.XRPUSD},
];

export default React.memo(function TickerPricesContainer() {
  const exchange = useExchange();
  const wsMessage = useSelector((state: AppState) => state.websocket[exchange].message);
  const allPrices = useSelector((state: AppState) => allWebsocketBidAskPrices(state, exchange), isEqual);

  const data = allPrices?.length ? allPrices : defaultData;

  const copyPriceToClipboard = React.useCallback((event) => navigator.clipboard.writeText(event.target.innerText), []);

  return (
    <MainContainer label="TickerPrices" description="Displays current ask prices of subscribed tickers">
      <Row>
        <div className={styles.container}>
          <Text color="white" textStyle="bold">
            {wsMessage}
          </Text>
          <div className={styles.allPricesContainer}>
            {data.map(({askPrice, symbol}) => {
              return (
                <Stat key={symbol} margin={15} marginBottom={5} color="white">
                  <StatLabel>{symbol}</StatLabel>
                  <StatNumber onClick={copyPriceToClipboard} _hover={{cursor: 'copy'}}>
                    {askPrice === none ? none : formatPrice(askPrice, symbol)}
                  </StatNumber>
                  <StatHelpText>BitMEX</StatHelpText>
                </Stat>
              );
            })}
          </div>
        </div>
      </Row>
    </MainContainer>
  );
});
