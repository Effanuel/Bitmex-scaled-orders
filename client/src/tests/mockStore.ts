import {applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import {
  mockWebsocketState,
  mockPreviewState,
  mockTrailingState,
  mockCrossState,
  mockOrdersState,
  mockSettingsState,
} from './mockData/orders';
import {rootReducer} from 'redux/store';
import createStore from './configStore';
import {AppState} from 'redux/modules/state';
import notificationMiddleware from '../redux/middlewares/toast-notification';
import {ExchangeAPIFacade} from 'redux/api/api';

const mockedDefaultState: AppState = {
  websocket: mockWebsocketState({}),
  preview: mockPreviewState({}),
  trailing: mockTrailingState({}),
  cross: mockCrossState({}),
  orders: mockOrdersState({}),
  settings: mockSettingsState({}),
};

export function createMockedStore(overrideState: Partial<AppState> = {}) {
  const preloadedState = {...mockedDefaultState, ...overrideState};
  const middlewares = [thunk.withExtraArgument(new ExchangeAPIFacade()), notificationMiddleware];
  const enhancer = compose(applyMiddleware(...middlewares));

  return createStore(rootReducer, preloadedState, enhancer);
}

export type MockedStore = ReturnType<typeof createMockedStore>;
