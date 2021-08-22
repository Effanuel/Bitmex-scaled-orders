import React from 'react';
import {useDispatch} from 'react-redux';
import {SelectDropdown, InputField, Button, SideRadioButtons, Row, MainContainer} from 'components';
import {SYMBOL, SIDE} from 'redux/api/bitmex/types';
import {CROSS_ORDER_CONTAINER} from 'data-test-ids';
import buildOrderPresenter from '../../presenters/cross-label-presenter';
import {clearCrossOrder} from 'redux/modules/cross/crossModule';
import {useHooks} from './useHooks';
import {INSTRUMENT_PARAMS} from 'utils';
import {useAppContext} from 'general/hooks';
import {Exchange} from 'redux/modules/settings/types';

interface Props {
  exchange: Exchange;
}

export default React.memo(function CrossOrderContainer({exchange}: Props) {
  const {api} = useAppContext();
  const dispatch = useDispatch();

  const [symbol, setSymbol] = React.useState(SYMBOL.XBTUSD);
  const [price, setPrice] = React.useState<string>('');
  const [quantity, setQuantity] = React.useState<string>('');
  const [side, setSide] = React.useState<SIDE>(SIDE.SELL);

  const {wsCrossPrice, connected, crossOrderPrice} = useHooks(exchange);

  const createOrder = React.useCallback(() => {
    if (price && +price > 0 && quantity && +quantity > 0) {
      api.createCrossOrder({price: +price, symbol, side, orderQty: +quantity});
      setPrice('');
      setQuantity('');
    }
  }, [api, price, quantity, side, symbol]);

  const cancelCrossOrder = React.useCallback(() => void dispatch(clearCrossOrder()), [dispatch]);

  const buttonLabel = React.useMemo(
    () => buildOrderPresenter(connected, side, wsCrossPrice, crossOrderPrice, symbol),
    [connected, crossOrderPrice, side, wsCrossPrice, symbol],
  );

  const step = 1 / INSTRUMENT_PARAMS[symbol].ticksize;

  const renderFirstRow = React.useMemo(() => {
    const isSubmitButtonDisabled = !quantity || +quantity > 20e6 || !price || !wsCrossPrice || buttonLabel.disabled;
    return (
      <Row>
        <SelectDropdown id="symbol" onChange={setSymbol} label="Instrument" disabled={buttonLabel.disabled} />
        <InputField
          testID={CROSS_ORDER_CONTAINER.QUANTITY_INPUT}
          onChange={setQuantity}
          value={quantity}
          label="Quantity"
        />
        <SideRadioButtons testID={CROSS_ORDER_CONTAINER.SIDE} onChangeRadio={setSide} side={side} />
        <Button
          testID={CROSS_ORDER_CONTAINER.SUBMIT}
          label={buttonLabel.label}
          variant={side}
          style={{width: '170px'}}
          onClick={createOrder}
          disabled={isSubmitButtonDisabled}
        />
      </Row>
    );
  }, [createOrder, wsCrossPrice, buttonLabel, price, quantity, side]);

  const renderSecondRow = React.useMemo(() => {
    return (
      <Row>
        <InputField
          testID={CROSS_ORDER_CONTAINER.PRICE_INPUT}
          onChange={setPrice}
          value={price}
          label="Price"
          step={step}
        />
        <div style={{flexDirection: 'column', display: 'flex'}}>
          <span style={{color: 'white'}}>Cross order status: </span>
          <span style={{color: 'green'}}>{crossOrderPrice ? 'Order is placed' : 'Order not placed.'}</span>
        </div>
        {crossOrderPrice ? (
          <div style={{flexDirection: 'column', display: 'flex'}}>
            <div style={{color: 'white'}}>Cross order price: </div>
            <div style={{color: 'green'}}>{crossOrderPrice}</div>
          </div>
        ) : null}
        {connected && crossOrderPrice ? (
          <Button
            testID={CROSS_ORDER_CONTAINER.CANCEL_ORDER}
            variant="textSell"
            onClick={cancelCrossOrder}
            label={'Cancel Cross Order'}
          />
        ) : null}
      </Row>
    );
  }, [cancelCrossOrder, connected, crossOrderPrice, price, step]);

  return (
    <MainContainer
      connected={connected}
      label="Cross Order"
      description="Place a market order when the price crosses your set price"
    >
      {renderFirstRow}
      {renderSecondRow}
    </MainContainer>
  );
});
