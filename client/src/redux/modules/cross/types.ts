import {SIDE, SYMBOLS} from 'util/BitMEX-types';

export const CHANGE_CROSS_ORDER_SYMBOL = 'cross/CHANGE_CROSS_ORDER_SYMBOL';
export const CREATE_CROSS_ORDER = 'cross/CREATE_CROSS_ORDER';
export const CLEAR_CROSS_ORDER = 'cross/CLEAR_CROSS_ORDER';
export const ORDER_CROSSED_ONCE = 'cross/ORDER_CROSSED_ONCE';

export const CROSS_POST_MARKET_ORDER = 'cross/CROSS_POST_MARKET_ORDER';

export interface CrossState {
  crossOrderSymbol: SYMBOLS;
  crossOrderSide: SIDE;
  crossOrderPrice: number;
  crossOrderQuantity: number;
  hasPriceCrossedOnce: boolean;
}

export const ACTIONS_cross = [CROSS_POST_MARKET_ORDER] as const;
