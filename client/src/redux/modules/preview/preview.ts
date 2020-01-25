import {
  ORDER_SUCCESS,
  ORDER_ERROR,
  ORDER_LOADING,
  SHOW_PREVIEW,
  SWITCH_PREVIEW,
  PreviewActionTypes,
  PreviewState
} from "./types";

import axios from "axios";
import { orderBulk } from "../../../util";
import { Thunk } from "../../models/state";

const initialState = {
  orders: {},
  error: "",
  showPreview: false,
  loading: false
};
// Reducer
export const previewReducer = (
  state: PreviewState = initialState,
  action: PreviewActionTypes
): PreviewState => {
  switch (action.type) {
    case ORDER_LOADING:
      return { ...state, error: "", loading: true };
    case ORDER_SUCCESS:
      return {
        ...state,
        ...action.payload,
        showPreview: false,
        error: "",
        orders: [],
        loading: false
      };
    case ORDER_ERROR:
      return {
        ...state,
        showPreview: false,
        orders: [],
        error: action.payload,
        loading: false
      };
    case SHOW_PREVIEW:
      return {
        ...state,
        orders: action.payload,
        showPreview: true,
        error: ""
      };
    case SWITCH_PREVIEW:
      return {
        ...state,
        showPreview: !state.showPreview,
        error: ""
      };
    default:
      return state;
  }
};

// Actions
// ==============================

/**
 * [Order bulk] action creator
 * @param {Object} payload order details
 * @returns {Object} success response(dispatch action)
 */
export const postOrder = (payload: any): Thunk => async dispatch => {
  try {
    dispatch(postOrderLoading());
    let orders = orderBulk(payload);
    orders.orders.push(orders.stop);
    console.log("order");

    const response = await axios.post("/bitmex/postOrder", orders);

    dispatch(postOrderSuccess(response));
  } catch (err) {
    console.log(err.response.data.error);
    dispatch(postOrderError(err.response.data.error));
  }
};

const postOrderLoading = (): PreviewActionTypes => ({
  type: ORDER_LOADING
});

/**
 * SUCCESS [Order bulk] action creator
 * @param {number} succcess response of a request
 * @returns {Object} SUCCESS action to reducer
 */
export const postOrderSuccess = (payload: any): PreviewActionTypes => ({
  type: ORDER_SUCCESS,
  payload: payload.success
});

export const postOrderError = (payload: any): PreviewActionTypes => ({
  type: ORDER_ERROR,
  payload
});

/**
 * SUCCESS [Current price of symbol] action creator
 * @param {number} currentPrice of a symbol
 * @returns {Object} SUCCESS action to reducer
 */
export const previewOrders = (payload: any): PreviewActionTypes => {
  const orders = orderBulk(payload);
  return {
    type: SHOW_PREVIEW,
    payload: orders
  };
};

export const previewClose = (): PreviewActionTypes => ({
  type: SWITCH_PREVIEW
});
