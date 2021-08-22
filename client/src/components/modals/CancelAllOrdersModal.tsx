import React from 'react';
import {Modal} from 'components';
import {useAppContext} from 'general/hooks';

interface Props {
  totalOrders: number;
}

export function CancelAllOrdersModal({totalOrders}: Props) {
  const {api} = useAppContext();

  return (
    <Modal title="Cancel All Orders" onConfirm={api.cancelAllOrders}>
      {`This will cancel ${totalOrders} order${totalOrders > 1 ? 's' : ''}`}
    </Modal>
  );
}
