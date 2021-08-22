import React from 'react';
import {WarningIcon} from '@chakra-ui/icons';
import {Box} from '@chakra-ui/react';
import {Link} from 'react-router-dom';
import {useExchange} from 'general/hooks';
import {ExchangePresenter} from 'presenters/general-presenters';

export function Banner() {
  const exchange = useExchange();
  return (
    <Box
      display="flex"
      alignItems="center"
      color="white"
      borderWidth={1}
      borderColor="#ffa726"
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={3}
      borderLeftColor="#c77800"
      borderLeftWidth={5}
      borderRadius={2}
    >
      <WarningIcon color="#c77800" marginRight={3} />
      <span>
        There is no API key for {ExchangePresenter[exchange]} exchange. Add it{' '}
        <Link to="/settings" style={{color: 'lightblue'}}>
          here
        </Link>
      </span>
    </Box>
  );
}
