import React from 'react';
import {Tbody, Th, Thead, Tr, Table, Box} from '@chakra-ui/react';
import {RepeatIcon} from '@chakra-ui/icons';
import {formatPrice} from 'general/formatting';
import {Order, ORD_TYPE} from 'redux/api/bitmex/types';
import {MainContainer} from 'components';
import {useAppContext, useModal} from 'general/hooks';
import {OPEN_ORDERS_CONTAINER} from 'data-test-ids';
import OpenOrderRow from './OpenOrderRow';
import ProfitOrderInActionRow from './ProfitOrderInActionRow';
import {useSelector} from 'react-redux';
import {AppState} from 'redux/modules/state';
import {groupedOrdersSelector} from 'redux/selectors';

function Text({children}: {children: React.ReactNode}) {
  return (
    <Box
      data-testid={OPEN_ORDERS_CONTAINER.EMPTY_CTA}
      display="flex"
      w="100%"
      color="white"
      alignItems="center"
      justifyContent="center"
    >
      {children}
    </Box>
  );
}

export const presentOrderPrice = (order: Order) => {
  switch (order.ordType) {
    case ORD_TYPE.Limit:
      return formatPrice(order.price, order.symbol);
    case ORD_TYPE.LimitIfTouched:
    case ORD_TYPE.StopLimit:
      return (
        <>
          <Box fontSize={12}>WHEN {formatPrice(order.stopPx, order.symbol)}</Box>
          <Box fontSize={12}>WHAT {formatPrice(order.price, order.symbol)}</Box>
        </>
      );
    case ORD_TYPE.Stop:
    case ORD_TYPE.MarketIfTouched:
      return formatPrice(order.stopPx, order.symbol);
    default:
      return null;
  }
};

export default React.memo(function OpenOrdersContainer() {
  const {api} = useAppContext();
  const {modals} = useModal();

  const openOrders = useSelector((state: AppState) => state.orders.openOrders);
  const profitOrders = useSelector((state: AppState) => state.orders.profitOrders);
  const profitOrdersInAction = useSelector((state: AppState) => state.orders.profitOrdersInAction);
  const ordersLoading = useSelector((state: AppState) => state.orders.ordersLoading);
  const ordersError = useSelector((state: AppState) => state.orders.ordersError);
  const groupedOrders = useSelector(groupedOrdersSelector);

  React.useEffect(() => {
    api.getOpenOrders();
  }, [api]);

  const showCancelAllOrdersModal = React.useCallback(() => {
    const totalOrders = openOrders.length + profitOrders.length + profitOrdersInAction.length;
    modals.showCancelAllOrders({totalOrders});
  }, [modals, openOrders.length, profitOrders.length, profitOrdersInAction.length]);

  const secondaryState = React.useMemo(() => {
    const text =
      ordersError !== ''
        ? `Failed to fetch open orders: ${ordersError}`
        : ordersLoading && openOrders.length === 0
        ? 'Loading...'
        : openOrders.length === 0 && profitOrdersInAction.length === 0
        ? 'No Open Orders'
        : undefined;

    return text ? <Text>{text}</Text> : undefined;
  }, [ordersError, ordersLoading, openOrders, profitOrdersInAction]);

  const icons = React.useMemo(
    () => [{element: RepeatIcon, onClick: !ordersLoading ? api.getOpenOrders : undefined, color: 'green'}],
    [api, ordersLoading],
  );

  return (
    <MainContainer
      label="Open orders"
      description="Shows current open orders that are not yet filled"
      secondaryState={secondaryState}
      icons={icons}
    >
      <Table>
        <Thead>
          <Tr>
            <Th>Symbol</Th>
            <Th>Type</Th>
            <Th isNumeric>Quantity</Th>
            <Th isNumeric>Price</Th>
            <Th>Date</Th>
            <Th w={1 / 2}>Profit Target</Th>
            <Th
              data-testid={OPEN_ORDERS_CONTAINER.CANCEL_ALL}
              bg="#424242"
              textStyle="hover:red:border"
              onClick={showCancelAllOrdersModal}
            >
              Cancel All
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {openOrders.map((order) => (
            <OpenOrderRow key={order.orderID} order={order} profitOrders={groupedOrders?.[order.orderID] ?? []} />
          ))}
          {profitOrdersInAction.map((order) => (
            <ProfitOrderInActionRow key={order.orderID} order={order} />
          ))}
        </Tbody>
      </Table>
    </MainContainer>
  );
});
