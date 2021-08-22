import React from 'react';
import {Link} from 'react-router-dom';
import {CheckIcon, WarningIcon} from '@chakra-ui/icons';
import {Box, Divider, Heading, Text, Tooltip} from '@chakra-ui/react';
import {ExchangePresenter} from 'presenters/general-presenters';
import {Exchange} from 'redux/modules/settings/types';
import {useDispatch, useSelector} from 'react-redux';
import {AppState} from 'redux/modules/state';
import {getAllApiKeys} from 'redux/modules/settings/settingsModule';
import {HOME} from 'data-test-ids';

interface ExchangeRowProps {
  exchange: Exchange;
  isActive: boolean;
}

function ExchangeRow({exchange, isActive}: ExchangeRowProps) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      borderColor="grey"
      _hover={{boxShadow: '2px 2px 2px white', cursor: 'pointer'}}
      borderWidth={1}
      padding={2}
      borderRadius={2}
      marginBottom={2}
    >
      <Box display="flex" flex={1}>
        <Link
          data-testid={HOME.ROW}
          to={`/${exchange}`}
          style={{display: 'flex', flex: 1, textDecoration: 'none', color: 'white'}}
        >
          <Text color="white" fontWeight="bold" fontSize="2xl">
            {ExchangePresenter[exchange]}
          </Text>
        </Link>
      </Box>

      <Box display="flex">
        <Link data-testid={HOME.ICON} to={`/${isActive ? exchange : 'settings'}`}>
          {isActive ? (
            <Tooltip hasArrow label="API Key is active" bg="gray.300" color="black">
              <CheckIcon color="green" />
            </Tooltip>
          ) : (
            <Tooltip hasArrow label="Set up API key here" bg="gray.300" color="black">
              <WarningIcon color="red" />
            </Tooltip>
          )}
        </Link>
      </Box>
    </Box>
  );
}

const Home = React.memo(() => {
  const dispatch = useDispatch();
  const activeApiKeys = useSelector((state: AppState) => state.settings.activeApiKeys);

  React.useEffect(() => {
    dispatch(getAllApiKeys());
  }, [dispatch]);

  return (
    <Box marginTop="25px" display="flex" justifyContent="center">
      <Box display="flex" flexDirection="column" minWidth="720px">
        <Heading color="white">Available Exchanges</Heading>
        <Divider display="flex" orientation="horizontal" marginBottom={4} marginTop={4} />
        {Object.entries(activeApiKeys).map(([exchange, isActive]) => (
          <ExchangeRow key={exchange} exchange={exchange as Exchange} isActive={isActive} />
        ))}
      </Box>
    </Box>
  );
});

export default Home;
