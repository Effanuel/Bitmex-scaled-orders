import * as registerModals from '../context/registerModals';
import {configureInflunt, spyModule} from 'influnt';
import {toast} from 'react-toastify';
import {componentContext, withStore} from './drivers';
import {networkProxy} from './proxy';
import {ComponentSettings} from 'influnt/dist/types';
import {createMockedStore} from './mockStore';
import {createMemoryHistory} from 'history';
import {Exchange} from 'redux/modules/settings/types';

export type InfluntExtraArgs = Parameters<typeof withStore>[number];

const toastSpy = spyModule('toast', {
  module: toast,
  parseArgs: (value: any[]) => value[0]?.props,
});

const showRegisteredModal = jest.requireActual('../context/registerModals').showRegisteredModal;
const modalSpy = spyModule('modal', {
  factory: (logger) => {
    jest.spyOn(registerModals, 'showRegisteredModal').mockImplementation((...args) => {
      const [type, props] = args;
      //@ts-ignore
      const params = type === 'showGeneralModal' ? [props.title, props.subtitle] : props;
      logger({[type]: params});
      return showRegisteredModal(...args);
    });
  },
});

export const createRenderer = configureInflunt({
  providerHoc: withStore,
  spyModules: [toastSpy, modalSpy],
  networkProxy,
});

export const createComponentRenderer = configureInflunt({
  providerHoc: componentContext,
});

export const createMainRenderer = <C extends React.ComponentType<InferProps<C>>>(
  component: C,
  componentSettings: ComponentSettings<InferProps<C>, Parameters<typeof withStore>[number]> = {},
) => {
  const mainExtraArgs = () => ({
    store: createMockedStore({
      settings: {
        activeExchange: Exchange.BitMeX,
        activeApiKeys: {bitmex: true, bitmexTEST: false},
        settingsLoading: false,
        settingsError: '',
        getAllApiKeysLoading: false,
      },
    }),
    history: createMemoryHistory(),
  });
  return createRenderer(component, {extraArgs: mainExtraArgs, ...componentSettings});
};
