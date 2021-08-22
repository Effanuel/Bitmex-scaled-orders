import React from 'react';
import {WarningTwoIcon} from '@chakra-ui/icons';
import {SYMBOL, SIDE} from 'redux/api/bitmex/types';
import {MARKET_CONTAINER} from 'data-test-ids';
import {SelectDropdown, InputField, Button, Row, MainContainer} from 'components';
import {useAppContext} from 'general/hooks';
import {useSelector} from 'react-redux';
import {AppState} from 'redux/modules/state';

const icons = [{element: WarningTwoIcon, color: 'red', onHoverMessage: 'Minimum lotsize for XBT is 100'}];

export default React.memo(function MarketOrderContainer() {
  const {api} = useAppContext();

  const [symbol, setSymbol] = React.useState<SYMBOL>(SYMBOL.XBTUSD);
  const [quantity, setQuantity] = React.useState<string>('');

  const loading = useSelector((state: AppState) => state.preview.previewLoading);

  const submitMarketOrder = React.useCallback(
    (id: SIDE) => {
      if (quantity) {
        api.postMarketOrder({symbol, orderQty: +quantity, side: id});
      }
      setQuantity('');
    },
    [symbol, quantity, api],
  );

  return (
    <MainContainer
      label="Market Order"
      description="Place a market order that will be filled immediately"
      icons={symbol === SYMBOL.XBTUSD ? icons : undefined}
    >
      <Row>
        <SelectDropdown id="symbol" onChange={setSymbol} label="Instrument" />
        <InputField testID={MARKET_CONTAINER.INPUT} label="Quantity" onChange={setQuantity} value={quantity} />
        <Button
          testID={MARKET_CONTAINER.BUY_BUTTON}
          id={SIDE.BUY}
          label="MARKET Buy"
          onClick={submitMarketOrder}
          isLoading={loading}
          variant={SIDE.BUY}
          disabled={!quantity || +quantity > 20e6}
        />
        <Button
          testID={MARKET_CONTAINER.SELL_BUTTON}
          id={SIDE.SELL}
          label="MARKET Sell"
          onClick={submitMarketOrder}
          isLoading={loading}
          variant={SIDE.SELL}
          disabled={!quantity || +quantity > 20e6}
        />
      </Row>
    </MainContainer>
  );
});
