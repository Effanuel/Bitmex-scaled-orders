import React from 'react';
import {useSelector} from 'react-redux';
import {Modal, InputField} from 'components';
import {SIDE} from 'redux/api/bitmex/types';
import {AppState} from 'redux/modules/state';
import {orderSelector} from 'redux/selectors';
import {ADD_ORDER_MODAL} from 'data-test-ids';
import {INSTRUMENT_PARAMS} from 'utils';
import {useAppContext} from 'general/hooks';

interface Props {
  orderID: string;
}

export function AddProfitOrderModal({orderID}: Props) {
  const {api} = useAppContext();

  const order = useSelector((state: AppState) => orderSelector(state, {orderID}));
  const {symbol, side, price: stopPx} = order!;

  const [price, setPrice] = React.useState<string>('');
  const [quantity, setQuantity] = React.useState<any>('');

  const addTarget = React.useCallback(() => {
    api.addProfitTarget({orderID, side, symbol, stop: stopPx, price: parseInt(price), orderQty: quantity});
  }, [api, orderID, side, quantity, price, stopPx, symbol]);

  const isConfirmButtonDisabled =
    !parseInt(price) ||
    !parseInt(quantity) ||
    !(side === SIDE.SELL ? parseInt(price) < stopPx : parseInt(price) > stopPx);

  const step = 1 / INSTRUMENT_PARAMS[symbol].ticksize;

  return (
    <Modal title="Add profit target" onConfirm={addTarget} isConfirmButtonDisabled={isConfirmButtonDisabled}>
      <InputField
        testID={ADD_ORDER_MODAL.PRICE}
        label="Price of the limit order that will be placed after open order price is reached"
        value={price || ''}
        placeholder={`Limit ${side === SIDE.BUY ? 'Sell' : 'Buy'} order price`}
        onChange={setPrice}
        step={step}
      />
      <InputField
        testID={ADD_ORDER_MODAL.QUANTITY}
        label="Quantity"
        value={quantity || ''}
        placeholder={'Profit Order Quantity'}
        onChange={setQuantity}
      />
    </Modal>
  );
}
