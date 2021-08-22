import {createReducer} from '@reduxjs/toolkit';
import {createAction, createApiThunk} from 'redux/helpers/actionHelpers';
import {SIDE, SYMBOL} from 'redux/api/bitmex/types';
import * as types from './types';

export const defaultState: types.TrailingState = {
  trailOrderId: '',
  trailOrderPrice: 0,
  trailOrderStatus: 'Order not placed.',
  trailOrderSide: SIDE.SELL,
  trailOrderSymbol: SYMBOL.XBTUSD,
  trailLoading: false,
};

export const __clearTrailingOrder = createAction(types.__CLEAR_TRAILING_ORDER);

export const changeTrailingOrderSymbol = createAction<SYMBOL>(types.CHANGE_TRAILING_ORDER_SYMBOL);

export const postTrailingOrder = createApiThunk({
  actionName: types.POST_TRAILING_ORDER,
  apiMethod: 'limitOrder',
  parseResponse: (data) => ({orderID: data.orderID, price: data.price, text: data.text}),
  payloadToReturn: 'side',
});

export const ammendTrailingOrder = createApiThunk({
  actionName: types.PUT_TRAILING_ORDER,
  apiMethod: 'orderAmend',
  parseResponse: (data) => ({price: data.price}),
});

export const cancelTrailingOrder = createApiThunk({
  actionName: types.DELETE_TRAILING_ORDER,
  apiMethod: 'orderCancel',
  adaptPayload: (_, getState) => ({orderID: getState().trailing.trailOrderId}),
  parseResponse: (data) => ({orderID: data.map(({orderID}) => orderID)}),
});

const postTrailingOrderReducer = (state = defaultState, action: Action): types.TrailingState => {
  const {text, orderID, price} = action.payload.data;
  const {statusCode, side} = action.payload;

  const isSuccess = statusCode === 200 && text === 'best_order';

  const response = isSuccess
    ? {trailOrderId: orderID, trailOrderStatus: 'Order placed.', trailOrderPrice: price}
    : {trailrderId: '', trailOrderStatus: 'Order cancelled.'};

  return {...state, ...response, trailLoading: false, trailOrderSide: side};
};

export const trailingReducer = createReducer(defaultState, (builder) =>
  builder
    .addCase(postTrailingOrder.fulfilled, postTrailingOrderReducer)
    .addCase(postTrailingOrder.rejected, (state) => {
      state.trailLoading = false;
      state.trailOrderStatus = 'Order posting error.';
    })
    .addCase(postTrailingOrder.pending, (state) => {
      state.trailLoading = true;
    })
    .addCase(ammendTrailingOrder.fulfilled, (state, {payload}) => {
      return {...state, trailLoading: false, trailOrderPrice: payload.data.price};
    })
    .addCase(ammendTrailingOrder.rejected, (state) => {
      return {...state, trailLoading: false, trailOrderStatus: 'Order ammending error'};
    })
    .addCase(cancelTrailingOrder.fulfilled, () => defaultState)
    .addCase(cancelTrailingOrder.rejected, () => defaultState)
    .addCase(__clearTrailingOrder, () => defaultState)
    .addCase(changeTrailingOrderSymbol, (state, {payload}) => {
      state.trailOrderSymbol = payload;
    }),
);
