import React from 'react';
import {useAppDispatch} from 'redux/store';
import {Exchange} from 'redux/modules/settings/types';
import * as ordersModule from 'redux/modules/orders/ordersModule';
import * as previewModule from 'redux/modules/preview/previewModule';
import * as trailingModule from 'redux/modules/trailing/trailingModule';
import * as crossModule from 'redux/modules/cross/crossModule';

const modules = {...ordersModule, ...previewModule, ...trailingModule, ...crossModule};

type ReduxModules = typeof modules;

type ApiActions = {
  [key in keyof ReduxModules]: (
    params: ReduxModules[key] extends (...args: any) => any
      ? Omit<Parameters<ReduxModules[key]>[number], 'exchange'> extends {exchange?: Exchange}
        ? void
        : Omit<Parameters<ReduxModules[key]>[number], 'exchange'>
      : void,
  ) => void;
};

export interface AppContext {
  api: ApiActions;
}

const initialContext = {
  api: undefined,
} as unknown as AppContext;

export const AppContext = React.createContext<AppContext>(initialContext);

export const AppProvider = React.memo(({children}: {children: React.ReactNode}) => {
  const dispatch = useAppDispatch();

  const context: AppContext = React.useMemo(
    () => ({
      api: new Proxy(modules, {
        get(target: ReduxModules, key: keyof ReduxModules) {
          if (typeof target[key] === 'function') {
            return (params: any) => {
              //@ts-ignore
              dispatch(target[key](params));
            };
          }
          return undefined;
        },
      }) as unknown as ApiActions,
    }),
    [dispatch],
  );

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
});
