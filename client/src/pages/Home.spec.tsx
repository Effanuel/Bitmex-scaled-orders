import {HOME} from 'data-test-ids';
import {Exchange} from 'redux/modules/settings/types';
import {respondBasic, history} from 'tests/helpers';
import {createMainRenderer} from 'tests/influnt';
import {RoutePath} from './paths';
import Home from './Home';
import {createMockedStore} from 'tests/mockStore';
import {createMemoryHistory} from 'history';

const forgeResult = <R,>(data: R) => ({data: {data: data, statusCode: 200}});

const render = createMainRenderer(Home, {
  extraArgs: () => ({store: createMockedStore(), history: createMemoryHistory()}),
});

describe('Home page', () => {
  it('should navigate to exchange on row press even if the api key is not active', async () => {
    const mock = respondBasic('getAllApiKeys', [undefined]).with(forgeResult({exchanges: []}));

    const result = await render({mocks: [mock]})
      .press(HOME.ROW, {index: 0})
      .inspect({history: history()});

    expect(result).toEqual({
      history: RoutePath.BitMex,
      network: [{getAllApiKeys: [undefined]}],
    });
  });

  it('should navigate to exchange if api key is active and pressed on icon', async () => {
    const mock = respondBasic('getAllApiKeys', [undefined]).with(forgeResult({exchanges: [Exchange.BitMeX]}));

    const result = await render({mocks: [mock]})
      .press(HOME.ICON, {index: 0})
      .inspect({history: history()});

    expect(result).toEqual({
      history: RoutePath.BitMex,
      network: [{getAllApiKeys: [undefined]}],
    });
  });

  it('should navigate to settings if api key is not active and pressed on icon', async () => {
    const mock = respondBasic('getAllApiKeys', [undefined]).with(forgeResult({exchanges: []}));

    const result = await render({mocks: [mock]})
      .press(HOME.ICON, {index: 0})
      .inspect({history: history()});

    expect(result).toEqual({
      history: RoutePath.Settings,
      network: [{getAllApiKeys: [undefined]}],
    });
  });
});
