import {Exchange} from 'redux/modules/settings/types';

export const ExchangePresenter: Record<Exchange, string> = {
  [Exchange.BitMeX]: 'BITMEX',
  [Exchange.BitMeXTEST]: 'BITMEX Testnet',
};
