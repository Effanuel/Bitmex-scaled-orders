import TrailingLimitOrderContainer from './TrailingLimitOrderContainer';
import {TRAILING_LIMIT_CONTAINER} from 'data-test-ids';
import {mockWebsocketState} from 'tests/mockData/orders';
import {SIDE, SYMBOL} from 'redux/api/bitmex/types';
import {partialInstrument, updateInstrument} from 'tests/websocketData/instrument';
import {partialOrder} from 'tests/websocketData/order';
import {forgeAmendOrder, forgeLimitOrder} from 'tests/responses';
import {getState, openWebsocket, sendWebsocketMessage, storeActions} from 'tests/helpers';
import {createMainRenderer} from 'tests/influnt';
import {textOf, isDisabled, respond} from 'influnt';
import {createMockedStore} from 'tests/mockStore';
import {createMemoryHistory} from 'history';
import {Exchange} from 'redux/modules/settings/types';

const orderID = 'OrderId';

const render = createMainRenderer(TrailingLimitOrderContainer, {passProps: {exchange: Exchange.BitMeX}});

describe('TrailingLimitContainer', () => {
  const commonOrder = ({orderQty, price}: {orderQty: number; price: number}) => ({
    symbol: SYMBOL.XBTUSD,
    side: SIDE.SELL,
    orderQty,
    price,
    text: 'best_order',
  });

  it('should render submit button as disabled when not subscribed to ws', async () => {
    const result = await render().inspect({
      submitButtonLabel: textOf(TRAILING_LIMIT_CONTAINER.SUBMIT_TRAILING_ORDER),
      isDisabled: isDisabled(TRAILING_LIMIT_CONTAINER.SUBMIT_TRAILING_ORDER),
    });

    expect(result).toEqual({
      submitButtonLabel: 'Not subscribed to order',
      isDisabled: true,
    });
  });

  it('should render submit button as disabled when inputs are empty', async () => {
    const currentOrderBook = partialInstrument({askPrice: 10322, bidPrice: 10321.5, symbol: SYMBOL.XBTUSD});

    const result = await render()
      .execute(openWebsocket())
      .execute(sendWebsocketMessage(currentOrderBook))
      .inspect({
        submitButtonLabel: textOf(TRAILING_LIMIT_CONTAINER.SUBMIT_TRAILING_ORDER),
        isDisabled: isDisabled(TRAILING_LIMIT_CONTAINER.SUBMIT_TRAILING_ORDER),
        actions: storeActions(),
      });

    expect(result).toEqual({
      actions: ['bitmex::OPEN', 'bitmex::MESSAGE'],
      isDisabled: true,
      submitButtonLabel: 'Submit order at 10,322.0',
    });
  });

  it('should submit a trailing order without filling it', async () => {
    const mock = respond('limitOrder', [commonOrder({orderQty: 200, price: 501})]).with(
      forgeLimitOrder({orderID, text: 'best_order', price: 501}),
    );

    const websocket = mockWebsocketState({
      connected: true,
      instrument: [{symbol: SYMBOL.XBTUSD, askPrice: 501, bidPrice: 500.5}],
    });

    const result = await render({
      extraArgs: {
        store: createMockedStore({
          websocket,
          settings: {
            activeExchange: Exchange.BitMeX,
            activeApiKeys: {bitmex: true, bitmexTEST: false},
            settingsLoading: false,
            settingsError: '',
            getAllApiKeysLoading: false,
          },
        }),
        history: createMemoryHistory(),
      },
    })
      .inputText(TRAILING_LIMIT_CONTAINER.QUANTITY_INPUT, '200')
      .press(TRAILING_LIMIT_CONTAINER.SUBMIT_TRAILING_ORDER)
      .resolve(mock)
      .execute(sendWebsocketMessage(partialOrder({orderID, symbol: SYMBOL.XBTUSD, price: 501, ordStatus: 'New'})))
      .inspect({actions: storeActions(), trailing: getState('trailing')});

    expect(result).toEqual({
      actions: ['trailing/POST_TRAILING_ORDER/pending', 'trailing/POST_TRAILING_ORDER/fulfilled', 'bitmex::MESSAGE'],
      network: [{limitOrder: [{orderQty: 200, price: 501, side: 'Sell', symbol: 'XBTUSD', text: 'best_order'}]}],
      toast: [{message: 'Trailing Order placed at 501', toastPreset: 'success'}],
      trailing: {
        trailLoading: false,
        trailOrderId: orderID,
        trailOrderPrice: 501,
        trailOrderSide: 'Sell',
        trailOrderStatus: 'Order placed.',
        trailOrderSymbol: 'XBTUSD',
      },
    });
  });

  it('should place and fill a trailing sell order', async () => {
    const mock = respond('limitOrder', [commonOrder({orderQty: 200, price: 10322})]).with(
      forgeLimitOrder({orderID, text: 'best_order', price: 10322}),
    );

    const currentOrderBook = partialInstrument({askPrice: 10322, bidPrice: 10321.5, symbol: SYMBOL.XBTUSD});
    const result = await render()
      .execute(openWebsocket())
      .execute(sendWebsocketMessage(currentOrderBook))
      .inputText(TRAILING_LIMIT_CONTAINER.QUANTITY_INPUT, 200)
      .press(TRAILING_LIMIT_CONTAINER.SUBMIT_TRAILING_ORDER)
      .resolve(mock)
      .execute(sendWebsocketMessage(partialOrder({orderID, symbol: SYMBOL.XBTUSD, price: 9000, ordStatus: 'Filled'})))
      .inspect({actions: storeActions(), trailing: getState('trailing')});

    expect(result).toEqual({
      actions: [
        'bitmex::OPEN',
        'bitmex::MESSAGE',
        'trailing/POST_TRAILING_ORDER/pending',
        'trailing/POST_TRAILING_ORDER/fulfilled',
        'bitmex::MESSAGE',
        'trailing/__CLEAR_TRAILING_ORDER',
      ],
      network: [{limitOrder: [{orderQty: 200, price: 10322, side: 'Sell', symbol: 'XBTUSD', text: 'best_order'}]}],
      toast: [{message: 'Trailing Order placed at 10322', toastPreset: 'success'}],
      trailing: {
        trailLoading: false,
        trailOrderId: '',
        trailOrderPrice: 0,
        trailOrderSide: 'Sell',
        trailOrderStatus: 'Order not placed.',
        trailOrderSymbol: 'XBTUSD',
      },
    });
  });

  it('should place and trail the order', async () => {
    const limitOrder = commonOrder({orderQty: 200, price: 10322});
    const [limitOrderPromise, amendOrderPromise] = [
      respond('limitOrder', [limitOrder]).with(forgeLimitOrder({...limitOrder, orderID})),
      respond('orderAmend', [{orderID, price: 10321}]).with(forgeAmendOrder({orderID, price: 10321})),
    ];

    const currentOrderBook = partialInstrument({askPrice: 10322, bidPrice: 10321.5, symbol: SYMBOL.XBTUSD});
    const newOrderBook = updateInstrument({askPrice: 10321, bidPrice: 10320.5, symbol: SYMBOL.XBTUSD});
    const result = await render()
      .execute(openWebsocket())
      .execute(sendWebsocketMessage(currentOrderBook))
      .inputText(TRAILING_LIMIT_CONTAINER.QUANTITY_INPUT, 200)
      .press(TRAILING_LIMIT_CONTAINER.SUBMIT_TRAILING_ORDER)
      .resolve(limitOrderPromise)
      .execute(sendWebsocketMessage(partialOrder({orderID, symbol: SYMBOL.XBTUSD, price: 10322, ordStatus: 'New'})))
      .execute(sendWebsocketMessage(newOrderBook))
      .resolve(amendOrderPromise)
      .inspect({actions: storeActions(), trailing: getState('trailing')});

    expect(result).toEqual({
      actions: [
        'bitmex::OPEN',
        'bitmex::MESSAGE',
        'trailing/POST_TRAILING_ORDER/pending',
        'trailing/POST_TRAILING_ORDER/fulfilled',
        'bitmex::MESSAGE',
        'bitmex::MESSAGE',
        'trailing/PUT_TRAILING_ORDER/pending',
        'trailing/PUT_TRAILING_ORDER/fulfilled',
      ],
      network: [
        {limitOrder: [{orderQty: 200, price: 10322, side: 'Sell', symbol: 'XBTUSD', text: 'best_order'}]},
        {orderAmend: [{orderID: 'OrderId', price: 10321}]},
      ],
      toast: [
        {message: 'Trailing Order placed at 10322', toastPreset: 'success'},
        {message: 'Trailing Order Ammended to 10321', toastPreset: 'success'},
      ],
      trailing: {
        trailLoading: false,
        trailOrderId: 'OrderId',
        trailOrderPrice: 10321,
        trailOrderSide: 'Sell',
        trailOrderStatus: 'Order placed.',
        trailOrderSymbol: 'XBTUSD',
      },
    });
  });
});
