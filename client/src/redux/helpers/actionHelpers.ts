import {
  createAsyncThunk,
  AsyncThunk,
  Dispatch,
  createAction as createAction_toolkit,
  ActionCreatorWithPreparedPayload,
} from '@reduxjs/toolkit';
import {HttpResponse} from 'redux/api/bitmex';
import {ExchangeAPIFacade, AvailableMethods, BasicAPIType, basicApi} from 'redux/api/api';
import {AppState} from 'redux/modules/state';

import {ACTIONS_cross} from 'redux/modules/cross/types';
import {ACTIONS_orders} from 'redux/modules/orders/types';
import {ACTIONS_preview} from 'redux/modules/preview/types';
import {ACTIONS_trailing} from 'redux/modules/trailing/types';
import {ACTIONS_settings} from 'redux/modules/settings/types';

export const createAction = <P = void>(actionName: string) =>
  createAction_toolkit(actionName, (payload: P) => ({payload}));

export type CreateAction = {
  success: ActionCreatorWithPreparedPayload<[any], unknown, string, never, never>;
  error: ActionCreatorWithPreparedPayload<[string], string, string, never, never>;
};

const reducerActions = [
  ...ACTIONS_preview,
  ...ACTIONS_trailing,
  ...ACTIONS_cross,
  ...ACTIONS_orders,
  ...ACTIONS_settings,
];

type ThunkActionNames = typeof reducerActions[number];

export interface ThunkApiConfig {
  rejected: string;
  extra: ExchangeAPIFacade;
  dispatch: Dispatch;
  rejectValue: string;
  state: AppState;
}

type BitmexMethods = AvailableMethods;

type Raw<P extends Promise<HttpResponse<any, unknown>>> = P extends Promise<HttpResponse<infer U, unknown>> ? U : never;

type ParseResponse<K extends keyof BitmexMethods, D> = (data: Raw<ReturnType<BitmexMethods[K]>>) => D;

interface AAA<P, K extends keyof BitmexMethods, R> {
  actionName: ThunkActionNames;
  apiMethod: K;
  parseResponse: ParseResponse<K, R>;
  adaptPayload?: (payload: P, getState: () => AppState) => P;
  payloadToReturn?: keyof P;
}

export function createApiThunk<K extends keyof BitmexMethods, P extends Parameters<BitmexMethods[K]>[number], R>({
  actionName,
  apiMethod,
  parseResponse,
  adaptPayload,
  payloadToReturn,
}: AAA<P, K, R>): AsyncThunk<
  {data: any},
  Parameters<BitmexMethods[K]>[number] extends never ? void : P,
  ThunkApiConfig
> {
  //@ts-expect-error
  return createAsyncThunk(
    actionName,
    async (payload: P, {extra: API, rejectWithValue, getState}) => {
      try {
        const {activeExchange} = getState().settings;
        const adaptedPayload = adaptPayload?.(payload, getState) ?? payload;
        // TODO: add a proper type, there may not fix a fix for this tho
        //@ts-expect-error
        const {data} = await API.getQuery(activeExchange)(apiMethod)(adaptedPayload);
        //@ts-expect-error
        const responseData = {data: parseResponse(JSON.parse(data.data)), statusCode: data.statusCode};
        const extraData = payloadToReturn ? {[payloadToReturn]: payload[payloadToReturn]} : {};
        return {...responseData, ...extraData};
      } catch (err) {
        console.log(err, 'errr');
        return rejectWithValue(formatErrorMessage(err));
      }
    },
    {
      condition: (_, {getState}) => {
        const {activeExchange, activeApiKeys} = getState().settings;
        return Boolean(activeExchange && (activeApiKeys?.[activeExchange] ?? false));
      },
      dispatchConditionRejection: true,
    },
  );
}

interface BasicThunkConfig<K extends keyof BasicAPIType> {
  actionName: ThunkActionNames;
  method: K;
}

export function createBasicThunk<K extends keyof BasicAPIType, P extends Parameters<BasicAPIType[K]>[number]>({
  actionName,
  method,
}: BasicThunkConfig<K>): AsyncThunk<
  RawType<ReturnType<BasicAPIType[K]>>['data']['data'],
  Parameters<BasicAPIType[K]>[number] extends never ? void : P,
  ThunkApiConfig
> {
  //@ts-ignore
  return createAsyncThunk(actionName, async (payload: P, {rejectWithValue}) => {
    try {
      //@ts-ignore
      const response = await basicApi[method](payload);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(formatErrorMessage(err));
    }
  });
}

function formatErrorMessage(err: any): string {
  return err?.message?.includes('500') ? 'Server is offline' : err?.response?.data?.error || 'error';
}
