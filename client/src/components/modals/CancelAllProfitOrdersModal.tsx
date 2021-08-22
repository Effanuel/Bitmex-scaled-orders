import React from 'react';
import {Modal} from 'components';
import {useAppContext} from 'general/hooks';

interface Props {
  totalOrders: number;
  profitOrderIds: string[];
}

export function CancelAllProfitOrdersModal({totalOrders, profitOrderIds}: Props) {
  const {api} = useAppContext();

  const emitConfirm = React.useCallback(
    () => api.cancelAllProfitOrders({orderID: profitOrderIds}),
    [api, profitOrderIds],
  );

  return (
    <Modal title="Cancel All Profit Orders" onConfirm={emitConfirm}>
      {`This will cancel ${totalOrders} profit order${totalOrders > 1 ? 's' : ''}`}
    </Modal>
  );
}
