import React from 'react';
import {useSelector} from 'react-redux';
import {Modal} from 'components';
import {AppState} from 'redux/modules/state';
import {groupedOrdersSelector, orderSelector} from 'redux/selectors';
import {useAppContext} from 'general/hooks';

interface Props {
  orderID: string;
}

export function CancelOrderModal({orderID}: Props) {
  const {api} = useAppContext();

  const order = useSelector((state: AppState) => orderSelector(state, {orderID}));
  const groupedOrders = useSelector(groupedOrdersSelector);

  const profitOrderIDs = React.useMemo(
    () => (groupedOrders?.[orderID] ?? []).map(({orderID}) => orderID),
    [groupedOrders, orderID],
  );

  const emitConfirm = React.useCallback(() => {
    if (order) {
      api.cancelOrder({orderID: [order.orderID, ...profitOrderIDs]});
    }
  }, [api, profitOrderIDs, order]);

  if (!order) {
    return null;
  }

  return (
    <Modal title="Cancel Order" onConfirm={emitConfirm}>
      {`Cancel ${order.symbol} order with price $${order.price} and quantity ${order.orderQty}`}
      {profitOrderIDs.length ? `, with ${profitOrderIDs.length} profit orders` : '.'}
    </Modal>
  );
}
