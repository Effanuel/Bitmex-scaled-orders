import {OpenOrdersContainer} from 'containers';
import {ADD_ORDER_MODAL, GLOBAL, OPEN_ORDERS_CONTAINER} from 'data-test-ids';
import {SIDE, SYMBOL} from 'redux/api/bitmex/types';
import {builderProfitOrder, buildOrder} from 'tests/builders';
import {createMainRenderer} from 'tests/influnt';
import {countOf, exists, respond} from 'influnt';
import {forgeOpenOrders, forgeOrderCancel, forgeOrderCancelAll, forgeProfitTargetOrder} from 'tests/responses';
import {createProfitTarget} from 'utils';
import {getState, storeActions} from 'tests/helpers';

const render = createMainRenderer(OpenOrdersContainer);

describe('OpenOrders', () => {
  it('should show empty cta when there are no open orders', async () => {
    const mock = respond('getOpenOrders', [undefined]).with(forgeOpenOrders([]));

    const result = await render({mocks: [mock]}).inspect({emptyCtaVisible: exists(OPEN_ORDERS_CONTAINER.EMPTY_CTA)});

    expect(result).toEqual({
      emptyCtaVisible: true,
      network: [{getOpenOrders: [undefined]}],
    });
  });

  it('should show open orders that are without profit targets', async () => {
    const mock = respond('getOpenOrders', [undefined]).with(forgeOpenOrders([buildOrder(), buildOrder()]));

    const result = await render({mocks: [mock]}).inspect({
      emptyCtaVisible: exists(OPEN_ORDERS_CONTAINER.EMPTY_CTA),
      orderRowCount: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW),
    });

    expect(result).toEqual({
      network: [{getOpenOrders: [undefined]}],
      emptyCtaVisible: false,
      orderRowCount: 2,
    });
  });

  it('should show a profit order that is in action', async () => {
    const mock = respond('getOpenOrders', [undefined]).with(
      forgeOpenOrders([buildOrder({text: 'stop price reached\nprofit-target'})]),
    );

    const result = await render({mocks: [mock]}).inspect({
      emptyCtaVisible: exists(OPEN_ORDERS_CONTAINER.EMPTY_CTA),
      orderRowCount: countOf(OPEN_ORDERS_CONTAINER.PROFIT_ORDER_IN_ACTION),
    });

    expect(result).toEqual({
      network: [{getOpenOrders: [undefined]}],
      emptyCtaVisible: false,
      orderRowCount: 1,
    });
  });

  it('should cancel an open order', async () => {
    const orderID = 'OrderID1';

    const [getOpenOrdersPromise, orderCancelPromise] = [
      respond('getOpenOrders', [undefined]).with(forgeOpenOrders([buildOrder({orderID}), buildOrder()])),
      respond('orderCancel', [{orderID: [orderID]}]).with(forgeOrderCancel([{orderID}])),
    ];

    const result = await render({mocks: [getOpenOrdersPromise]})
      .press(`${OPEN_ORDERS_CONTAINER.CANCEL}.${orderID}`)
      .press(GLOBAL.MODAL_CONFIRM)
      .inspect({orderRowCountBefore: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW)})
      .resolve(orderCancelPromise)
      .inspect({
        emptyCtaVisible: exists(OPEN_ORDERS_CONTAINER.EMPTY_CTA),
        orderRowCountAfter: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW),
        actions: storeActions(),
      });

    expect(result).toEqual({
      actions: [
        'orders/GET_OPEN_ORDERS/pending',
        'orders/GET_OPEN_ORDERS/fulfilled',
        'orders/CANCEL_ORDER/pending',
        'orders/CANCEL_ORDER/fulfilled',
      ],
      network: [{getOpenOrders: [undefined]}, {orderCancel: [{orderID: [orderID]}]}],
      modal: [{showCancelOrder: {orderID}}],
      emptyCtaVisible: false,
      orderRowCountBefore: 2,
      orderRowCountAfter: 1,
      toast: [{message: 'Order was cancelled.', toastPreset: 'success'}],
    });
  });

  it('should cancel all orders', async () => {
    const orderID1 = 'OrderID1';
    const profitOrderID1 = 'ProfitOrderID1';

    const [getOpenOrdersPromise, orderCancelAllPromise] = [
      respond('getOpenOrders', [undefined]).with(
        forgeOpenOrders([
          buildOrder({orderID: orderID1}),
          builderProfitOrder({orderID: orderID1, profitOrderID: profitOrderID1}),
        ]),
      ),
      respond('orderCancelAll', [undefined]).with(forgeOrderCancelAll({})),
    ];

    const result = await render({mocks: [getOpenOrdersPromise]})
      .inspect({orderRowCountBefore: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW)})
      .press(OPEN_ORDERS_CONTAINER.CANCEL_ALL)
      .press(GLOBAL.MODAL_CONFIRM)
      .resolve(orderCancelAllPromise)
      .inspect({
        emptyCtaVisible: exists(OPEN_ORDERS_CONTAINER.EMPTY_CTA),
        orderRowCountAfter: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW),
        actions: storeActions(),
        orders: getState('orders'),
      });

    expect(result).toEqual({
      network: [{getOpenOrders: [undefined]}, {orderCancelAll: [undefined]}],
      actions: [
        'orders/GET_OPEN_ORDERS/pending',
        'orders/GET_OPEN_ORDERS/fulfilled',
        'orders/CANCEL_ALL_ORDERS/pending',
        'orders/CANCEL_ALL_ORDERS/fulfilled',
      ],
      modal: [{showCancelAllOrders: {totalOrders: 2}}],
      emptyCtaVisible: true,
      orderRowCountBefore: 1,
      orderRowCountAfter: 0,
      orders: {openOrders: [], ordersError: '', profitOrders: [], ordersLoading: false, profitOrdersInAction: []},
    });
  });

  it('should cancel profit order of one of the open order`s', async () => {
    const orderID1 = 'OrderID1';
    const profitOrderID1 = 'ProfitOrderID1';

    const order = buildOrder({orderID: orderID1});
    const profitOrder = builderProfitOrder({orderID: orderID1, profitOrderID: profitOrderID1});

    const [getOpenOrdersPromise, orderCancelPromise] = [
      respond('getOpenOrders', [undefined]).with(forgeOpenOrders([order, profitOrder])),
      respond('orderCancel', [{orderID: profitOrderID1}]).with(forgeOrderCancel([{orderID: profitOrderID1}])),
    ];

    const result = await render({mocks: [getOpenOrdersPromise]})
      .inspect({orderRowCountBefore: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW)})
      .press(OPEN_ORDERS_CONTAINER.SHOW_PROFIT_ORDERS)
      .press(OPEN_ORDERS_CONTAINER.CANCEL_PROFIT)
      .press(GLOBAL.MODAL_CONFIRM)
      .resolve(orderCancelPromise)
      .inspect({
        emptyCtaVisible: exists(OPEN_ORDERS_CONTAINER.EMPTY_CTA),
        orderRowCountAfter: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW),
        actions: storeActions(),
        orders: getState('orders'),
      });

    expect(result).toEqual({
      actions: [
        'orders/GET_OPEN_ORDERS/pending',
        'orders/GET_OPEN_ORDERS/fulfilled',
        'orders/REMOVE_PROFIT_ORDER/pending',
        'orders/REMOVE_PROFIT_ORDER/fulfilled',
      ],
      network: [{getOpenOrders: [undefined]}, {orderCancel: [{orderID: 'ProfitOrderID1'}]}],
      emptyCtaVisible: false,
      orderRowCountAfter: 1,
      orderRowCountBefore: 1,
      modal: [
        {
          showCancelProfitOrder: {
            orderID: 'ProfitOrderID1',
            price: profitOrder.price,
            quantity: profitOrder.orderQty,
            side: profitOrder.side,
            symbol: profitOrder.symbol,
          },
        },
      ],
      orders: {
        openOrders: [order],
        ordersError: '',
        profitOrders: [],
        ordersLoading: false,
        profitOrdersInAction: [],
      },
    });
  });

  it('should cancel all profit orders of one of the open order`s', async () => {
    const orderID1 = 'OrderID1';
    const profitOrderIds = ['ProfitOrderID1', 'ProfitOrderID2', 'ProfitOrderID3'];

    const order = buildOrder({orderID: orderID1});

    const [getOpenOrdersPromise, orderCancelPromise] = [
      respond('getOpenOrders', [undefined]).with(
        forgeOpenOrders([
          order,
          builderProfitOrder({orderID: orderID1, profitOrderID: profitOrderIds[0]}),
          builderProfitOrder({orderID: orderID1, profitOrderID: profitOrderIds[1]}),
          builderProfitOrder({orderID: orderID1, profitOrderID: profitOrderIds[2]}),
        ]),
      ),
      respond('orderCancel', [{orderID: profitOrderIds}]).with(forgeOrderCancel([{orderID: profitOrderIds}])),
    ];

    const result = await render({mocks: [getOpenOrdersPromise]})
      .inspect({orderRowCountBefore: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW)})
      .press(OPEN_ORDERS_CONTAINER.SHOW_PROFIT_ORDERS)
      .press(OPEN_ORDERS_CONTAINER.CANCEL_ALL_PROFIT)
      .press(GLOBAL.MODAL_CONFIRM)
      .resolve(orderCancelPromise)
      .inspect({
        emptyCtaVisible: exists(OPEN_ORDERS_CONTAINER.EMPTY_CTA),
        orderRowCountAfter: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW),
        actions: storeActions(),
        orders: getState('orders'),
      });

    expect(result).toEqual({
      actions: [
        'orders/GET_OPEN_ORDERS/pending',
        'orders/GET_OPEN_ORDERS/fulfilled',
        'orders/CANCEL_ALL_PROFIT_ORDERS/pending',
        'orders/CANCEL_ALL_PROFIT_ORDERS/fulfilled',
      ],
      network: [{getOpenOrders: [undefined]}, {orderCancel: [{orderID: profitOrderIds}]}],
      emptyCtaVisible: false,
      orderRowCountAfter: 1,
      orderRowCountBefore: 1,
      modal: [{showCancelAllProfitOrders: {profitOrderIds, totalOrders: 3}}],
      orders: {
        openOrders: [order],
        ordersError: '',
        profitOrders: [],
        ordersLoading: false,
        profitOrdersInAction: [],
      },
    });
  });

  it('should cancel an open order with its profit targets', async () => {
    const orderID1 = 'OrderID1';
    const profitOrderID1 = 'ProfitOrderID1';

    const [getOpenOrdersPromise, orderCancelPromise] = [
      respond('getOpenOrders', [undefined]).with(
        forgeOpenOrders([
          buildOrder({orderID: orderID1}),
          builderProfitOrder({orderID: orderID1, profitOrderID: profitOrderID1}),
        ]),
      ),
      respond('orderCancel', [{orderID: [orderID1, profitOrderID1]}]).with(
        forgeOrderCancel([{orderID: orderID1}, {orderID: profitOrderID1}]),
      ),
    ];

    const result = await render({mocks: [getOpenOrdersPromise]})
      .press(`${OPEN_ORDERS_CONTAINER.CANCEL}.${orderID1}`)
      .press(GLOBAL.MODAL_CONFIRM)
      .inspect({orderRowCountBefore: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW)})
      .resolve(orderCancelPromise)
      .inspect({
        emptyCtaVisible: exists(OPEN_ORDERS_CONTAINER.EMPTY_CTA),
        orderRowCountAfter: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW),
        actions: storeActions(),
        orders: getState('orders'),
      });

    expect(result).toEqual({
      actions: [
        'orders/GET_OPEN_ORDERS/pending',
        'orders/GET_OPEN_ORDERS/fulfilled',
        'orders/CANCEL_ORDER/pending',
        'orders/CANCEL_ORDER/fulfilled',
      ],
      modal: [{showCancelOrder: {orderID: 'OrderID1'}}],
      network: [{getOpenOrders: [undefined]}, {orderCancel: [{orderID: ['OrderID1', 'ProfitOrderID1']}]}],
      emptyCtaVisible: true,
      orderRowCountAfter: 0,
      orderRowCountBefore: 1,
      orders: {openOrders: [], ordersError: '', profitOrders: [], ordersLoading: false, profitOrdersInAction: []},
      toast: [{message: 'Order was cancelled.', toastPreset: 'success'}],
    });
  });

  it('should add a profit order', async () => {
    // TODO: very confusing to test profit orders because of stopPx, stop, price, FIX THIS
    const orderID1 = 'OrderID1';

    const order = buildOrder({orderID: orderID1, price: 5000, orderQty: 500, side: SIDE.SELL, symbol: SYMBOL.XBTUSD});

    const profitOrderProps = {
      orderID: orderID1,
      side: SIDE.SELL,
      symbol: SYMBOL.XBTUSD,
      stop: 5000,
      price: 3333,
      orderQty: 500,
    };

    const [getOpenOrdersPromise, profitTargetOrderPromise] = [
      respond('getOpenOrders', [undefined]).with(forgeOpenOrders([order])),
      respond('profitTargetOrder', [profitOrderProps]).with(
        forgeProfitTargetOrder({...createProfitTarget(profitOrderProps), timestamp: '0', orderID: '2323'}),
      ),
    ];

    const result = await render({mocks: [getOpenOrdersPromise]})
      .press(OPEN_ORDERS_CONTAINER.ADD_PROFIT)
      .inputText(ADD_ORDER_MODAL.PRICE, 3333)
      .inputText(ADD_ORDER_MODAL.QUANTITY, 500)
      .press(GLOBAL.MODAL_CONFIRM)
      .inspect({orderRowCountBefore: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW)})
      .resolve(profitTargetOrderPromise)
      .inspect({
        emptyCtaVisible: exists(OPEN_ORDERS_CONTAINER.EMPTY_CTA),
        orderRowCountAfter: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW),
        actions: storeActions(),
        orders: getState('orders'),
      });

    expect(result).toEqual({
      actions: [
        'orders/GET_OPEN_ORDERS/pending',
        'orders/GET_OPEN_ORDERS/fulfilled',
        'orders/ADD_PROFIT_ORDER/pending',
        'orders/ADD_PROFIT_ORDER/fulfilled',
      ],
      network: [
        {getOpenOrders: [undefined]},
        {
          profitTargetOrder: [
            {orderID: 'OrderID1', orderQty: 500, price: 3333, side: 'Sell', stop: 5000, symbol: 'XBTUSD'},
          ],
        },
      ],
      modal: [{showAddProfitTarget: {orderID: 'OrderID1'}}],
      emptyCtaVisible: false,
      orderRowCountAfter: 1,
      orderRowCountBefore: 1,
      orders: {
        openOrders: [order],
        ordersError: '',
        ordersLoading: false,
        profitOrdersInAction: [],
        profitOrders: [
          {
            ordType: 'StopLimit',
            orderID: '2323',
            orderQty: 500,
            price: 3333,
            side: 'Buy',
            stopPx: 5000,
            symbol: 'XBTUSD',
            text: 'profit-target.OrderID1',
            timestamp: '0',
          },
        ],
      },
      toast: [{message: 'Profit target at price 3333 was placed', toastPreset: 'success'}],
    });
  });

  it('should add a profit order through profit targets popup', async () => {
    const orderID1 = 'OrderID1';
    const profitOrderID1 = 'ProfitOrderID1';
    const profitOrder = builderProfitOrder({orderID: orderID1, profitOrderID: profitOrderID1});
    const order = buildOrder({orderID: orderID1, price: 5000, orderQty: 500, side: SIDE.SELL, symbol: SYMBOL.XBTUSD});

    const profitOrderProps = {
      orderID: orderID1,
      side: SIDE.SELL,
      symbol: SYMBOL.XBTUSD,
      stop: 5000,
      price: 3333,
      orderQty: 500,
    };

    const [getOpenOrdersPromise, profitTargetOrderPromise] = [
      respond('getOpenOrders', [undefined]).with(forgeOpenOrders([order, profitOrder])),
      respond('profitTargetOrder', [profitOrderProps]).with(
        forgeProfitTargetOrder({...createProfitTarget(profitOrderProps), timestamp: '0', orderID: '2323'}),
      ),
    ];

    const result = await render({mocks: [getOpenOrdersPromise]})
      .inspect({orderRowCountBefore: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW)})
      .press(OPEN_ORDERS_CONTAINER.SHOW_PROFIT_ORDERS)
      .press(OPEN_ORDERS_CONTAINER.ADD_PROFIT)
      .inputText(ADD_ORDER_MODAL.PRICE, 3333)
      .inputText(ADD_ORDER_MODAL.QUANTITY, 500)
      .press(GLOBAL.MODAL_CONFIRM)
      .resolve(profitTargetOrderPromise)
      .inspect({
        emptyCtaVisible: exists(OPEN_ORDERS_CONTAINER.EMPTY_CTA),
        orderRowCountAfter: countOf(OPEN_ORDERS_CONTAINER.ORDER_ROW),
        actions: storeActions(),
        orders: getState('orders'),
      });

    expect(result).toEqual({
      actions: [
        'orders/GET_OPEN_ORDERS/pending',
        'orders/GET_OPEN_ORDERS/fulfilled',
        'orders/ADD_PROFIT_ORDER/pending',
        'orders/ADD_PROFIT_ORDER/fulfilled',
      ],
      network: [
        {getOpenOrders: [undefined]},
        {
          profitTargetOrder: [
            {orderID: 'OrderID1', orderQty: 500, price: 3333, side: 'Sell', stop: 5000, symbol: 'XBTUSD'},
          ],
        },
      ],
      modal: [{showAddProfitTarget: {orderID: 'OrderID1'}}],
      emptyCtaVisible: false,
      orderRowCountAfter: 1,
      orderRowCountBefore: 1,
      orders: {
        openOrders: [order],
        ordersError: '',
        ordersLoading: false,
        profitOrdersInAction: [],
        profitOrders: [
          profitOrder,
          {
            ordType: 'StopLimit',
            orderID: '2323',
            orderQty: 500,
            price: 3333,
            side: 'Buy',
            stopPx: 5000,
            symbol: 'XBTUSD',
            text: 'profit-target.OrderID1',
            timestamp: '0',
          },
        ],
      },
      toast: [{message: 'Profit target at price 3333 was placed', toastPreset: 'success'}],
    });
  });
});
