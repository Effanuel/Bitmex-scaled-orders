import React from 'react';
import {Box, Container} from '@chakra-ui/react';
import OrdersTable from './orders-table';
import DetailsTable from './details-table';
import styles from './OrdersPreviewTable.module.scss';
import {SCALED_CONTAINER} from 'data-test-ids';
import {SYMBOL} from 'redux/api/bitmex/types';
import {useSelector} from 'react-redux';
import {AppState} from 'redux/modules/state';

export default function OrdersPreviewTable() {
  const orders = useSelector((state: AppState) => state.preview.orders);

  return (
    <Container
      data-testid={SCALED_CONTAINER.PREVIEW_TABLE}
      padding={0}
      display="flex"
      flexDirection="row"
      maxW="720px"
      w="100%"
    >
      <Box className={styles.container} p={0} w={7 / 10} marginRight={2}>
        <OrdersTable orders={orders} />
      </Box>
      <Box className={styles.container} p={0} w={3 / 10}>
        <DetailsTable symbol={orders?.[0]?.symbol ?? SYMBOL.XBTUSD} />
      </Box>
    </Container>
  );
}
