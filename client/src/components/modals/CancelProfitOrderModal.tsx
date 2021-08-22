import React from 'react';
import {Modal} from 'components';
import {SYMBOL} from 'redux/api/bitmex/types';
import {useAppContext} from 'general/hooks';

interface Props {
  symbol: SYMBOL;
  price: number;
  quantity: number;
  orderID: string;
}

export function CancelProfitOrderModal({symbol, price, quantity, orderID}: Props) {
  const {api} = useAppContext();

  const emitConfirm = React.useCallback(() => api.cancelProfitOrder({orderID}), [api, orderID]);

  return (
    <Modal title="Cancel Profit Order" onConfirm={emitConfirm}>
      {`Cancel ${symbol} profit order with price ${price} and quantity ${quantity}`}
    </Modal>
  );
}
