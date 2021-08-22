import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Badge, Box, Divider, Heading, Text} from '@chakra-ui/react';
import {Button} from 'components';
import {AppState} from 'redux/modules/state';
import {Exchange} from 'redux/modules/settings/types';
import {useModal} from 'general/hooks';
import {deleteAllApiKeys, deleteApiKey, getAllApiKeys} from 'redux/modules/settings/settingsModule';
import {ExchangePresenter} from 'presenters/general-presenters';
import {SETTINGS} from 'data-test-ids';

interface ItemProps {
  title: string;
  isActive: boolean;
  exchange: Exchange;
  onClick: (isActive: boolean, exchange: Exchange) => void;
}

const ApiKeySettingRow = React.memo(({title, isActive, exchange, onClick}: ItemProps) => {
  const color = isActive ? '#4caf50' : 'grey';
  return (
    <Box
      data-testid={SETTINGS.API_KEY_ROW}
      display="flex"
      bg="#1e1e1e"
      width="100%"
      alignItems="center"
      justifyContent="space-between"
      padding={2}
      marginBottom={2}
      borderColor={color}
      borderBottomWidth={1}
      borderRightWidth={1}
      _hover={{cursor: 'pointer', boxShadow: `2px 2px ${color}`}}
      borderRadius={3}
      onClick={() => onClick(isActive, exchange)}
    >
      <Box display="flex" flexDirection="column">
        <Text color="white" fontWeight="bold">
          {title}
        </Text>
        <Text color="white">Add api keys for authenticated requests</Text>
      </Box>
      <Box data-testid={SETTINGS.API_KEY_ROW_STATUS}>
        {isActive ? <Badge colorScheme="green">Active</Badge> : <Badge>Empty</Badge>}
      </Box>
    </Box>
  );
});

export default function Settings() {
  const dispatch = useDispatch();
  const {modals} = useModal();

  const activeApiKeys = useSelector((state: AppState) => state.settings.activeApiKeys);

  React.useEffect(() => {
    dispatch(getAllApiKeys());
  }, [dispatch]);

  const confirmDeleteAllApiKeys = React.useCallback(() => {
    modals.showGeneralModal({
      title: 'Clear all API Keys',
      subtitle: 'This will clear all api keys and remove the folder saving them',
      onConfirm: () => dispatch(deleteAllApiKeys()),
    });
  }, [dispatch, modals]);

  const configureApiKey = React.useCallback(
    (isActive: boolean, exchange: Exchange) => {
      isActive
        ? modals.showGeneralModal({
            title: `Clear ${ExchangePresenter[exchange]} API Key`,
            subtitle: `This will clear api key entry of ${ExchangePresenter[exchange]} exchange`,
            onConfirm: () => dispatch(deleteApiKey(exchange)),
          })
        : modals.showAddApiKeys({exchange});
    },
    [modals, dispatch],
  );

  return (
    <Box display="flex" alignItems="center" justifyContent="center" marginTop="25px" flexDirection="column">
      <Box display="flex" maxWidth="720px" width="720px" flexDirection="column">
        <Heading color="white">Settings</Heading>
        <Divider orientation="horizontal" marginBottom={4} marginTop={4} />
        {Object.entries(activeApiKeys).map(([exchange, isActive]) => (
          <ApiKeySettingRow
            key={exchange}
            title={ExchangePresenter[exchange as Exchange]}
            exchange={exchange as Exchange}
            isActive={isActive}
            onClick={configureApiKey}
          />
        ))}
      </Box>
      <Button variant="outline" label="Clear all API Keys" onClick={confirmDeleteAllApiKeys} />
    </Box>
  );
}
