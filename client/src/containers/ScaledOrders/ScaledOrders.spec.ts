import ScaledContainer from './ScaledOrders';
import {COMPONENTS, SCALED_CONTAINER} from 'data-test-ids';
import {createScaledOrders, DISTRIBUTION} from 'utils';
import {SIDE, SYMBOL} from 'redux/api/bitmex/types';
import {forgeResult} from 'tests/responses';
import {createMainRenderer} from 'tests/influnt';
import {InfluntEngine, respond, isDisabled, exists, countOf} from 'influnt';
import {storeActions} from 'tests/helpers';

interface ScaledInputs {
  orderQty: number;
  n_tp: number;
  start: number;
  end: number;
  symbol?: SYMBOL;
  side?: SIDE;
  stop?: number;
}

function fillInputs({orderQty, n_tp, start, end, stop, symbol, side}: ScaledInputs) {
  return (engine: InfluntEngine<any, any>) => {
    !!symbol && engine.selectOption(COMPONENTS.SELECT_DROPDOWN, symbol);
    !!side && engine.toggle(SCALED_CONTAINER.SIDE, side);
    !!stop && engine.inputText(SCALED_CONTAINER.STOP_LOSS_INPUT, stop);
    engine.inputText(SCALED_CONTAINER.QUANTITY_INPUT, orderQty);
    engine.inputText(SCALED_CONTAINER.ORDER_COUNT_INPUT, n_tp);
    engine.inputText(SCALED_CONTAINER.RANGE_START_INPUT, start);
    engine.inputText(SCALED_CONTAINER.RANGE_END_INPUT, end);
  };
}

const render = createMainRenderer(ScaledContainer);

describe('ScaledOrders', () => {
  it('should render submit button as disabled', async () => {
    const result = await render().inspect({isDisabled: isDisabled(SCALED_CONTAINER.SUBMIT_BUTTON)});

    expect(result).toEqual({isDisabled: true});
  });

  it('should submit sell scaled orders without stoploss', async () => {
    const input = {orderQty: 1000, n_tp: 2, start: 1000, end: 2000, side: SIDE.SELL, symbol: SYMBOL.XBTUSD, stop: 0};
    const orders = createScaledOrders({ordersProps: input, distribution: DISTRIBUTION.Uniform});
    const promise = respond('orderBulk', [{orders}]).with(forgeResult(orders));

    const result = await render()
      .apply(fillInputs(input))
      .press(SCALED_CONTAINER.SUBMIT_BUTTON)
      .inspect({spinnerVisible: exists(COMPONENTS.SPINNER)})
      .resolve(promise)
      .inspect({actions: storeActions()});

    expect(result).toEqual({
      actions: ['preview/PREVIEW_POST_ORDER/pending', 'preview/PREVIEW_POST_ORDER/fulfilled'],
      network: [{orderBulk: [{orders}]}],
      spinnerVisible: true,
      toast: [{message: 'Submitted Scaled Orders', toastPreset: 'success'}],
    });
  });

  it('should submit buy scaled orders without stoploss', async () => {
    const input = {orderQty: 1000, n_tp: 2, start: 1000, end: 2000, side: SIDE.BUY, symbol: SYMBOL.XBTUSD, stop: 0};
    const orders = createScaledOrders({ordersProps: input, distribution: DISTRIBUTION.Uniform});
    const promise = respond('orderBulk', [{orders}]).with(forgeResult(orders));

    const result = await render()
      .apply(fillInputs(input))
      .press(SCALED_CONTAINER.SUBMIT_BUTTON)
      .inspect({spinnerVisible: exists(COMPONENTS.SPINNER)})
      .resolve(promise)
      .inspect({actions: storeActions()});

    expect(result).toEqual({
      actions: ['preview/PREVIEW_POST_ORDER/pending', 'preview/PREVIEW_POST_ORDER/fulfilled'],
      network: [{orderBulk: [{orders}]}],
      spinnerVisible: true,
      toast: [{message: 'Submitted Scaled Orders', toastPreset: 'success'}],
    });
  });

  it('should submit scaled orders with stoploss', async () => {
    const input = {
      orderQty: 1000,
      n_tp: 2,
      start: 1000,
      end: 20,
      side: SIDE.SELL,
      symbol: SYMBOL.XBTUSD,
      stop: 3000,
    };
    const orders = createScaledOrders({ordersProps: input, distribution: DISTRIBUTION.Uniform});
    const promise = respond('orderBulk', [{orders}]).with(forgeResult(orders));

    const result = await render()
      .apply(fillInputs({orderQty: 1000, n_tp: 2, start: 1000, end: 20, stop: 3000}))
      .press(SCALED_CONTAINER.SUBMIT_BUTTON)
      .inspect({spinnerVisible: exists(COMPONENTS.SPINNER)})
      .resolve(promise)
      .inspect({actions: storeActions()});

    expect(result).toEqual({
      actions: ['preview/PREVIEW_POST_ORDER/pending', 'preview/PREVIEW_POST_ORDER/fulfilled'],
      network: [{orderBulk: [{orders}]}],
      spinnerVisible: true,
      toast: [{message: 'Submitted Scaled Orders', toastPreset: 'success'}],
    });
  });

  it('should open preview table', async () => {
    const result = await render()
      .apply(fillInputs({symbol: SYMBOL.XBTUSD, orderQty: 1000, n_tp: 5, start: 1000, end: 2000, stop: 3000}))
      .inspect({previewTableVisibleBefore: exists(SCALED_CONTAINER.PREVIEW_TABLE)})
      .press(SCALED_CONTAINER.PREVIEW_BUTTON)
      .inspect({
        previewTableVisibleAfter: exists(SCALED_CONTAINER.PREVIEW_TABLE),
        orderRowCount: countOf(SCALED_CONTAINER.ORDER_ROW),
        actions: storeActions(),
      });

    expect(result).toEqual({
      actions: ['preview/SHOW_PREVIEW'],
      orderRowCount: 6,
      previewTableVisibleAfter: true,
      previewTableVisibleBefore: false,
    });
  });
});
