import {AnyAction, Dispatch, Middleware} from '@reduxjs/toolkit';
import {AppState} from 'redux/modules/state';
import {AsyncThunk} from '@reduxjs/toolkit';
import {showToast, ToastPreset} from 'components';
import {getBalance, postMarketOrder, postOrderBulk} from 'redux/modules/preview/previewModule';
import {cancelTrailingOrder, ammendTrailingOrder, postTrailingOrder} from 'redux/modules/trailing/trailingModule';
import {postMarketCrossOrder as crossPostMarketOrder} from 'redux/modules/cross/crossModule';
import {addProfitTarget, cancelOrder} from 'redux/modules/orders/ordersModule';
import {SIDE} from 'redux/api/bitmex/types';

const middleware: Middleware<JsObj, AppState, Dispatch<AnyAction>> = (store) => (next) => (action: AnyAction) => {
  // if condition is true, request is unauthenticated because of async thunk condition
  const payload = action?.meta?.condition ? 'Unauthenticated' : action.payload;
  registeredToasts[action.type]?.({...action, payload});
  next(action);
};
type RequestFunction = (action: Action) => void;
type ThunkToasts = {[key: string]: RequestFunction};

interface RequestTypes {
  REQUEST?: RequestFunction;
  SUCCESS?: RequestFunction;
  FAILURE?: RequestFunction;
}

function buildThunkToasts<R, T, C>(thunk: AsyncThunk<R, T, C>, requestTypes: RequestTypes): ThunkToasts {
  const {REQUEST, SUCCESS, FAILURE} = requestTypes;

  const request = REQUEST ? {[thunk.pending.type]: REQUEST} : {};
  const success = SUCCESS ? {[thunk.fulfilled.type]: SUCCESS} : {};
  const failure = FAILURE ? {[thunk.rejected.type]: FAILURE} : {};

  return {...request, ...success, ...failure};
}

const PostTrailingOrderSuccess = (action: Action) => {
  const {statusCode, data} = action.payload;
  const {text, price} = data;

  const isOrderSubmitted = statusCode === 200;
  const isOrderPlaced = text === 'best_order';

  const toastDisplay: {message: string; preset: ToastPreset} =
    isOrderSubmitted && isOrderPlaced
      ? {message: `Trailing Order placed at ${price}`, preset: 'success'}
      : {message: `Trailing order: Post only - order cancelled.`, preset: 'warning'};

  showToast(toastDisplay.message, toastDisplay.preset);
};

const registeredToasts: ThunkToasts = {
  ...buildThunkToasts(crossPostMarketOrder, {
    SUCCESS: () => showToast('Submitted Market Order'),
    FAILURE: (action) => showToast(`Market order: ${action.payload}`, 'error'),
  }),
  ...buildThunkToasts(crossPostMarketOrder, {
    SUCCESS: () => showToast('Submitted Market Order'),
    FAILURE: (action) => showToast(`Market order: ${action.payload}`, 'error'),
  }),
  ...buildThunkToasts(postOrderBulk, {
    SUCCESS: () => showToast('Submitted Scaled Orders'),
    FAILURE: (action) => showToast(`Scaled orders: ${action.payload}`, 'error'),
  }),
  ...buildThunkToasts(getBalance, {
    FAILURE: (action) => showToast(`Balance: ${action.payload}`, 'error'),
  }),
  ...buildThunkToasts(postTrailingOrder, {
    SUCCESS: PostTrailingOrderSuccess,
    FAILURE: (action) => showToast(`Trailing order: ${action.payload}`, 'error'),
  }),
  ...buildThunkToasts(cancelTrailingOrder, {
    SUCCESS: () => showToast('Trailing Order Canceled', 'success'),
    FAILURE: () => showToast('Failed to Cancel Trailing Order', 'error'),
  }),
  ...buildThunkToasts(postMarketOrder, {
    SUCCESS: (action) => showToast(`Submitted Market ${action.payload.data.side === SIDE.SELL ? 'Sell' : 'Buy'} Order`),
    FAILURE: (action) => showToast(`Market order: ${action.payload}`, 'error'),
  }),
  ...buildThunkToasts(ammendTrailingOrder, {
    SUCCESS: (action) => showToast(`Trailing Order Ammended to ${action.payload.data.price}`, 'success'),
    FAILURE: () => showToast('Order ammending error.', 'error'),
  }),
  ...buildThunkToasts(cancelOrder, {
    SUCCESS: () => showToast('Order was cancelled.'),
    FAILURE: (action) => showToast(`Cancel Order: ${action.payload}`, 'warning'),
  }),
  ...buildThunkToasts(addProfitTarget, {
    SUCCESS: (action) => showToast(`Profit target at price ${action.payload.data.price} was placed`),
    FAILURE: () => showToast(`Failed to add profit target order.`, 'warning'),
  }),
};

export default middleware;
