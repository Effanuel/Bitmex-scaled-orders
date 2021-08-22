import {createReducer} from '@reduxjs/toolkit';
import {createScaledOrders, DistributionProps, DISTRIBUTION} from 'utils';
import {createAction, createApiThunk} from 'redux/helpers/actionHelpers';
import {
  SHOW_PREVIEW,
  TOGGLE_PREVIEW,
  PreviewState,
  PREVIEW_POST_ORDER,
  GET_BALANCE,
  PreviewActions as actionTypes,
  PREVIEW_POST_MARKET_ORDER,
} from './types';

export const postMarketOrder = createApiThunk({
  actionName: PREVIEW_POST_MARKET_ORDER,
  apiMethod: 'marketOrder',
  parseResponse: (data) => data,
});

export const postOrderBulk = createApiThunk({
  actionName: PREVIEW_POST_ORDER,
  apiMethod: 'orderBulk',
  parseResponse: (data) => data,
});

export const getBalance = createApiThunk({
  actionName: GET_BALANCE,
  apiMethod: 'getBalance',
  parseResponse: (data) => ({walletBalance: data.walletBalance}),
});

export const previewToggle = createAction(TOGGLE_PREVIEW);

const previewShow = createAction<actionTypes.SHOW_PREVIEW>(SHOW_PREVIEW);

export const previewOrders = (ordersProps: DistributionProps, distribution: DISTRIBUTION): Action =>
  previewShow(createScaledOrders({ordersProps, distribution}));

export const defaultState: PreviewState = {
  orders: [],
  balance: 0,
  showPreview: false,
  previewLoading: false,
  error: '',
};

export const previewReducer = createReducer<PreviewState>(defaultState, (builder) =>
  builder
    .addCase(postOrderBulk.pending, (state) => {
      return {...state, previewLoading: true, showPreview: false, error: ''};
    })
    .addCase(postOrderBulk.fulfilled, (state) => {
      return {
        ...state,
        orders: [],
        showPreview: false,
        previewLoading: false,
        error: '',
      };
    })
    .addCase(postOrderBulk.rejected, (state, {payload}) => {
      return {
        ...state,
        orders: [],
        showPreview: false,
        previewLoading: false,
        error: payload ?? '',
      };
    })
    .addCase(postMarketOrder.pending, (state) => {
      return {...state, previewLoading: true, error: ''};
    })
    .addCase(postMarketOrder.fulfilled, (state) => {
      return {...state, previewLoading: false, error: ''};
    })
    .addCase(postMarketOrder.rejected, (state) => {
      return {...state, previewLoading: false, error: ''};
    })
    .addCase(getBalance.fulfilled, (state, {payload}) => {
      return {...state, balance: payload.data.walletBalance};
    })
    .addCase(getBalance.rejected, (state, {payload}) => {
      return {...state, orders: [], showPreview: false, previewLoading: false, error: payload ?? ''};
    })
    .addCase(previewShow, (state, {payload}) => {
      return {...state, orders: payload, showPreview: true, error: ''};
    })
    .addCase(previewToggle, (state) => {
      return {...state, showPreview: !state.showPreview, error: ''};
    }),
);
