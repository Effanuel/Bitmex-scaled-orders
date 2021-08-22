import {ADD_API_KEYS_MODAL, GLOBAL, SETTINGS} from 'data-test-ids';
import {createMemoryHistory} from 'history';
import {textOfAll} from 'influnt';
import {Exchange} from 'redux/modules/settings/types';
import {respondBasic} from 'tests/helpers';
import {createMainRenderer} from 'tests/influnt';
import {createMockedStore} from 'tests/mockStore';
import Settings from './Settings';

const forgeResult = <R>(data: R) => ({data: {data: data, statusCode: 200}});

const render = createMainRenderer(Settings, {
  extraArgs: () => ({store: createMockedStore(), history: createMemoryHistory()}),
});

describe('Settings page', () => {
  it('should display all api keys as inactive', async () => {
    const mock = respondBasic('getAllApiKeys', [undefined]).with(forgeResult({exchanges: []}));

    const result = await render({mocks: [mock]}).inspect({itemStatuses: textOfAll(SETTINGS.API_KEY_ROW_STATUS)});

    expect(result).toEqual({
      itemStatuses: ['Empty', 'Empty'],
      network: [{getAllApiKeys: [undefined]}],
    });
  });

  it('should display one api keys as active', async () => {
    const mock = respondBasic('getAllApiKeys', [undefined]).with(forgeResult({exchanges: [Exchange.BitMeX]}));

    const result = await render({mocks: [mock]}).inspect({itemStatuses: textOfAll(SETTINGS.API_KEY_ROW_STATUS)});

    expect(result).toEqual({
      itemStatuses: ['Active', 'Empty'],
      network: [{getAllApiKeys: [undefined]}],
    });
  });

  it('should show modal for clearing the api key if pressed on the active one', async () => {
    const mock = respondBasic('getAllApiKeys', [undefined]).with(forgeResult({exchanges: [Exchange.BitMeX]}));

    const result = await render({mocks: [mock]}).press(SETTINGS.API_KEY_ROW, {index: 0});

    expect(result).toEqual({
      network: [{getAllApiKeys: [undefined]}],
      modal: [{showGeneralModal: ['Clear BITMEX API Key', 'This will clear api key entry of BITMEX exchange']}],
    });
  });

  it('should show modal for adding the api key if pressed on the empty one', async () => {
    const mock = respondBasic('getAllApiKeys', [undefined]).with(forgeResult({exchanges: [Exchange.BitMeX]}));

    const result = await render({mocks: [mock]}).press(SETTINGS.API_KEY_ROW, {index: 1});

    expect(result).toEqual({
      network: [{getAllApiKeys: [undefined]}],
      modal: [{showAddApiKeys: {exchange: Exchange.BitMeXTEST}}],
    });
  });

  it('should add api key', async () => {
    const key = '12312314141414144414';
    const secret = '12312314141414144414';
    const [getAllApiKeysResponse, saveApiKeyResponse] = [
      respondBasic('getAllApiKeys', [undefined]).with(forgeResult({exchanges: []})),
      //@ts-expect-error
      respondBasic('saveApiKey', [{key, secret}]).with(forgeResult({exchange: Exchange.BitMeX})),
    ];

    const result = await render({mocks: [getAllApiKeysResponse]})
      .inspect({itemStatuses: textOfAll(SETTINGS.API_KEY_ROW_STATUS)})
      .press(SETTINGS.API_KEY_ROW, {index: 0})
      .inputText(ADD_API_KEYS_MODAL.API_KEY, key)
      .inputText(ADD_API_KEYS_MODAL.API_SECRET, secret)
      .press(GLOBAL.MODAL_CONFIRM)
      .resolve(saveApiKeyResponse)
      .inspect({itemStatusesAfter: textOfAll(SETTINGS.API_KEY_ROW_STATUS)});

    expect(result).toEqual({
      itemStatuses: ['Empty', 'Empty'],
      itemStatusesAfter: ['Active', 'Empty'],
      modal: [{showAddApiKeys: {exchange: Exchange.BitMeX}}],
      network: [{getAllApiKeys: [undefined]}, {saveApiKey: [{key, secret}]}],
    });
  });

  it('should remove api key', async () => {
    const [getAllApiKeysResponse, deleteApiKeyResponse] = [
      respondBasic('getAllApiKeys', [undefined]).with(forgeResult({exchanges: [Exchange.BitMeX]})),
      respondBasic('deleteApiKey', [Exchange.BitMeX]).with(forgeResult(Exchange.BitMeX)),
    ];

    const result = await render({mocks: [getAllApiKeysResponse]})
      .inspect({itemStatuses: textOfAll(SETTINGS.API_KEY_ROW_STATUS)})
      .press(SETTINGS.API_KEY_ROW, {index: 0})
      .press(GLOBAL.MODAL_CONFIRM)
      .resolve(deleteApiKeyResponse)
      .inspect({itemStatusesAfter: textOfAll(SETTINGS.API_KEY_ROW_STATUS)});

    expect(result).toEqual({
      itemStatuses: ['Active', 'Empty'],
      itemStatusesAfter: ['Empty', 'Empty'],
      modal: [{showGeneralModal: ['Clear BITMEX API Key', 'This will clear api key entry of BITMEX exchange']}],
      network: [{getAllApiKeys: [undefined]}, {deleteApiKey: [Exchange.BitMeX]}],
    });
  });
});
