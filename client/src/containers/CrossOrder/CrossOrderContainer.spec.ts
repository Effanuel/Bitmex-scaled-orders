import {CROSS_ORDER_CONTAINER} from 'data-test-ids';
import {SIDE, SYMBOL} from 'redux/api/bitmex/types';
import {partialInstrument, updateInstrument} from 'tests/websocketData/instrument';
import CrossOrderContainer from './CrossOrderContainer';
import {createMainRenderer} from 'tests/influnt';
import {getState, openWebsocket, sendWebsocketMessage, storeActions} from 'tests/helpers';
import {textOf, isDisabled, respond} from 'influnt';
import {forgeMarketOrder} from 'tests/responses';
import {Exchange} from 'redux/modules/settings/types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const forceRerender = () => {};

const render = createMainRenderer(CrossOrderContainer, {passProps: {exchange: Exchange.BitMeX}});

describe('CrossOrderContainer', () => {
  it('should render submit button as disabled when not subscribed to ws', async () => {
    const result = await render().inspect({
      submitButtonLabel: textOf(CROSS_ORDER_CONTAINER.SUBMIT),
      isDisabled: isDisabled(CROSS_ORDER_CONTAINER.SUBMIT),
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
        submitButtonLabel: textOf(CROSS_ORDER_CONTAINER.SUBMIT),
        isDisabled: isDisabled(CROSS_ORDER_CONTAINER.SUBMIT),
        actions: storeActions(),
      });

    expect(result).toEqual({
      actions: ['bitmex::OPEN', 'bitmex::MESSAGE'],
      isDisabled: true,
      submitButtonLabel: 'Place a crossunder-market sell order',
    });
  });

  it('should create an order without placing if price has only crossed cross price once', async () => {
    const currentOrderBook = partialInstrument({askPrice: 10322, bidPrice: 10321.5, symbol: SYMBOL.XBTUSD});

    const result = await render()
      .execute(openWebsocket())
      .execute(sendWebsocketMessage(currentOrderBook))
      .inputText(CROSS_ORDER_CONTAINER.QUANTITY_INPUT, 200)
      .inputText(CROSS_ORDER_CONTAINER.PRICE_INPUT, 10000)
      .toggle(CROSS_ORDER_CONTAINER.SIDE, SIDE.SELL)
      .press(CROSS_ORDER_CONTAINER.SUBMIT)
      .execute(forceRerender)
      .inspect({actions: storeActions(), cross: getState('cross')});

    expect(result).toEqual({
      actions: ['bitmex::OPEN', 'bitmex::MESSAGE', 'cross/CREATE_CROSS_ORDER', 'cross/ORDER_CROSSED_ONCE'],
      cross: {
        crossOrderPrice: 10000,
        crossOrderQuantity: 200,
        crossOrderSide: 'Sell',
        crossOrderSymbol: 'XBTUSD',
        hasPriceCrossedOnce: true,
      },
    });
  });

  it('should submit an order if price has crossed the cross price twice', async () => {
    const mock = respond('marketOrder', [{symbol: SYMBOL.XBTUSD, side: SIDE.SELL, orderQty: 200}]).with(
      forgeMarketOrder({orderQty: 200}),
    );

    const currentOrderBook = partialInstrument({askPrice: 10322, bidPrice: 10321.5, symbol: SYMBOL.XBTUSD});
    const updatedOrderBook = updateInstrument({askPrice: 9500, bidPrice: 9000, symbol: SYMBOL.XBTUSD});

    const result = await render()
      .execute(openWebsocket())
      .execute(sendWebsocketMessage(currentOrderBook))
      .inputText(CROSS_ORDER_CONTAINER.QUANTITY_INPUT, '200')
      .inputText(CROSS_ORDER_CONTAINER.PRICE_INPUT, '10000')
      .press(CROSS_ORDER_CONTAINER.SUBMIT)
      .execute(sendWebsocketMessage(updatedOrderBook))
      .resolve(mock)
      .inspect({actions: storeActions(), cross: getState('cross')});

    expect(result).toEqual({
      actions: [
        'bitmex::OPEN',
        'bitmex::MESSAGE',
        'cross/CREATE_CROSS_ORDER',
        'bitmex::MESSAGE',
        'cross/ORDER_CROSSED_ONCE',
        'cross/CROSS_POST_MARKET_ORDER/pending',
        'cross/CROSS_POST_MARKET_ORDER/fulfilled',
      ],
      network: [{marketOrder: [{orderQty: 200, side: 'Sell', symbol: 'XBTUSD'}]}],
      cross: {
        crossOrderPrice: 0,
        crossOrderQuantity: 0,
        crossOrderSide: 'Sell',
        crossOrderSymbol: 'XBTUSD',
        hasPriceCrossedOnce: false,
      },
      toast: [{message: 'Submitted Market Order', toastPreset: 'success'}],
    });
  });

  it('should cancel the cross order', async () => {
    const currentOrderBook = partialInstrument({askPrice: 10322, bidPrice: 10321.5, symbol: SYMBOL.XBTUSD});

    const result = await render()
      .execute(openWebsocket(), sendWebsocketMessage(currentOrderBook))
      .inputText(CROSS_ORDER_CONTAINER.QUANTITY_INPUT, '200')
      .inputText(CROSS_ORDER_CONTAINER.PRICE_INPUT, '10000')
      .press(CROSS_ORDER_CONTAINER.SUBMIT)
      .press(CROSS_ORDER_CONTAINER.CANCEL_ORDER)
      .inspect({actions: storeActions(), cross: getState('cross')});

    expect(result).toEqual({
      actions: [
        'bitmex::OPEN',
        'bitmex::MESSAGE',
        'cross/CREATE_CROSS_ORDER',
        'cross/ORDER_CROSSED_ONCE',
        'cross/CLEAR_CROSS_ORDER',
      ],
      cross: {
        crossOrderPrice: 0,
        crossOrderQuantity: 0,
        crossOrderSide: 'Sell',
        crossOrderSymbol: 'XBTUSD',
        hasPriceCrossedOnce: false,
      },
    });
  });

  // @TODO rename suite
  it('should submit cross order after it crossed up', async () => {
    const mock = respond('marketOrder', [{symbol: SYMBOL.XBTUSD, side: SIDE.SELL, orderQty: 200}]).with(
      forgeMarketOrder({orderQty: 200}),
    );

    const currentOrderBook = partialInstrument({askPrice: 9000, bidPrice: 8900, symbol: SYMBOL.XBTUSD});

    const priceAboveCrossOrder = updateInstrument({askPrice: 11000, bidPrice: 10500, symbol: SYMBOL.XBTUSD});
    const priceBelowCrossOrder = updateInstrument({askPrice: 8000, bidPrice: 7900, symbol: SYMBOL.XBTUSD});

    const result = await render()
      .execute(openWebsocket())
      .execute(sendWebsocketMessage(currentOrderBook))
      .inputText(CROSS_ORDER_CONTAINER.QUANTITY_INPUT, 200)
      .inputText(CROSS_ORDER_CONTAINER.PRICE_INPUT, 10000)
      .press(CROSS_ORDER_CONTAINER.SUBMIT)
      .inspect({cross1: getState('cross', 'hasPriceCrossedOnce')})
      .execute(sendWebsocketMessage(priceAboveCrossOrder))
      .inspect({cross2: getState('cross', 'hasPriceCrossedOnce')})
      .execute(sendWebsocketMessage(priceBelowCrossOrder))
      .resolve(mock)
      .inspect({cross3: getState('cross'), actions: storeActions()});

    expect(result).toEqual({
      actions: [
        'bitmex::OPEN',
        'bitmex::MESSAGE',
        'cross/CREATE_CROSS_ORDER',
        'bitmex::MESSAGE',
        'cross/ORDER_CROSSED_ONCE',
        'bitmex::MESSAGE',
        'cross/CROSS_POST_MARKET_ORDER/pending',
        'cross/CROSS_POST_MARKET_ORDER/fulfilled',
      ],
      network: [{marketOrder: [{orderQty: 200, side: 'Sell', symbol: 'XBTUSD'}]}],
      cross1: false,
      cross2: true,
      cross3: {
        crossOrderPrice: 0,
        crossOrderQuantity: 0,
        crossOrderSide: 'Sell',
        crossOrderSymbol: 'XBTUSD',
        hasPriceCrossedOnce: false,
      },
      toast: [{message: 'Submitted Market Order', toastPreset: 'success'}],
    });
  });
});
