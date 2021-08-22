import React from 'react';
import {useDispatch} from 'react-redux';
import {Modal, InputField} from 'components';
import {saveApiKey} from 'redux/modules/settings/settingsModule';
import {Exchange} from 'redux/modules/settings/types';
import {ExchangePresenter} from 'presenters/general-presenters';
import {ADD_API_KEYS_MODAL} from 'data-test-ids';

interface Props {
  exchange: Exchange;
}

export function AddApiKeysModal({exchange}: Props) {
  const dispatch = useDispatch();

  const [key, setKey] = React.useState<string>('');
  const [secret, setSecret] = React.useState<string>('');

  const addTarget = React.useCallback(() => {
    dispatch(saveApiKey({exchange, key, secret}));
  }, [dispatch, exchange, key, secret]);

  const isConfirmButtonDisabled = key.length < 15 || secret.length < 15;

  return (
    <Modal
      title={`Add Api Keys for ${ExchangePresenter[exchange]}`}
      onConfirm={addTarget}
      isConfirmButtonDisabled={isConfirmButtonDisabled}
    >
      <InputField testID={ADD_API_KEYS_MODAL.API_KEY} label="API Key" value={key || ''} onChange={setKey} type="text" />
      <InputField
        testID={ADD_API_KEYS_MODAL.API_SECRET}
        label="API Secret"
        value={secret || ''}
        onChange={setSecret}
        type="text"
      />
    </Modal>
  );
}
