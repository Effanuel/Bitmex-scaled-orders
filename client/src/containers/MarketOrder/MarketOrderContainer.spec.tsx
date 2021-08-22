import MarketOrderContainer from './MarketOrderContainer';
import {COMPONENTS, MARKET_CONTAINER} from 'data-test-ids';
import {forgeMarketOrder} from 'tests/responses';
import {SIDE, SYMBOL} from 'redux/api/bitmex/types';
import {createMainRenderer} from 'tests/influnt';
import {isDisabled, respond, exists} from 'influnt';
import {storeActions} from 'tests/helpers';

const render = createMainRenderer(MarketOrderContainer);

describe('MarketOrder', () => {
  it('should disable market buy and market sell buttons by default', async () => {
    const result = await render().inspect({
      isBuyButtonDisabled: isDisabled(MARKET_CONTAINER.BUY_BUTTON),
      isSellButtonDisabled: isDisabled(MARKET_CONTAINER.SELL_BUTTON),
    });

    expect(result).toEqual({isBuyButtonDisabled: true, isSellButtonDisabled: true});
  });

  it('should submit a market buy order', async () => {
    const marketOrder = {orderQty: 1113, symbol: SYMBOL.XBTUSD, side: SIDE.BUY};
    const mock = respond('marketOrder', [marketOrder]).with(forgeMarketOrder(marketOrder));

    const result = await render()
      .inputText(MARKET_CONTAINER.INPUT, 1113)
      .press(MARKET_CONTAINER.BUY_BUTTON)
      .inspect({spinnerIsVisible: exists(COMPONENTS.SPINNER)})
      .resolve(mock)
      .inspect({actions: storeActions()});

    expect(result).toEqual({
      actions: ['preview/PREVIEW_POST_MARKET_ORDER/pending', 'preview/PREVIEW_POST_MARKET_ORDER/fulfilled'],
      network: [{marketOrder: [{orderQty: 1113, symbol: SYMBOL.XBTUSD, side: SIDE.BUY}]}],
      spinnerIsVisible: true,
      toast: [{message: 'Submitted Market Buy Order', toastPreset: 'success'}],
    });
  });

  it('should submit a market sell order', async () => {
    const marketOrder = {symbol: SYMBOL.XBTUSD, side: SIDE.SELL, orderQty: 111};
    const mock = respond('marketOrder', [marketOrder]).with(forgeMarketOrder(marketOrder));

    const result = await render()
      .inputText(MARKET_CONTAINER.INPUT, 111)
      .press(MARKET_CONTAINER.SELL_BUTTON)
      .inspect({spinnerIsVisible: exists(COMPONENTS.SPINNER)})
      .resolve(mock)
      .inspect({actions: storeActions()});

    expect(result).toEqual({
      actions: ['preview/PREVIEW_POST_MARKET_ORDER/pending', 'preview/PREVIEW_POST_MARKET_ORDER/fulfilled'],
      network: [{marketOrder: [{orderQty: 111, side: 'Sell', symbol: 'XBTUSD'}]}],
      spinnerIsVisible: true,
      toast: [{message: 'Submitted Market Sell Order', toastPreset: 'success'}],
    });
  });

  it('should submit an order with a selected ticker', async () => {
    const marketOrder = {symbol: SYMBOL.ETHUSD, side: SIDE.SELL, orderQty: 111};
    const mock = respond('marketOrder', [marketOrder]).with(forgeMarketOrder(marketOrder));

    const result = await render()
      .selectOption(COMPONENTS.SELECT_DROPDOWN, SYMBOL.ETHUSD)
      .inputText(MARKET_CONTAINER.INPUT, 111)
      .press(MARKET_CONTAINER.SELL_BUTTON)
      .inspect({spinnerIsVisible: exists(COMPONENTS.SPINNER)})
      .resolve(mock)
      .inspect({actions: storeActions()});

    expect(result).toEqual({
      actions: ['preview/PREVIEW_POST_MARKET_ORDER/pending', 'preview/PREVIEW_POST_MARKET_ORDER/fulfilled'],
      spinnerIsVisible: true,
      network: [{marketOrder: [{orderQty: 111, side: 'Sell', symbol: 'ETHUSD'}]}],
      toast: [{message: 'Submitted Market Sell Order', toastPreset: 'success'}],
    });
  });
});
