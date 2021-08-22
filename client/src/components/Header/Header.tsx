import React from 'react';
import {Flex, Heading, Box} from '@chakra-ui/react';
import {SettingsIcon} from '@chakra-ui/icons';
import {NavLink} from 'react-router-dom';
import {RoutePath} from 'pages/paths';

const MenuItem = ({children, to}: any) => (
  <Heading marginRight={3} marginLeft={3}>
    <NavLink
      exact
      to={to}
      activeStyle={{color: '#4caf50'}}
      style={{textDecoration: 'none', color: 'white', textShadow: '2px 2px 3px black'}}
    >
      {children}
    </NavLink>
  </Heading>
);

export function Header() {
  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding="1.5rem"
      bg="#1e1e1e"
      color="white"
      borderBottomColor="green"
      borderBottomWidth={2}
    >
      <Box display="flex" width="auto" alignItems="center">
        <MenuItem to={RoutePath.Home}>Home</MenuItem>
        <MenuItem to={RoutePath.BitMex}>BitMeX</MenuItem>
        <MenuItem to={RoutePath.BitmexTest}>BitMex Testnet</MenuItem>
      </Box>

      <Box display="flex">
        <NavLink
          to={RoutePath.Settings}
          activeStyle={{color: '#4caf50'}}
          style={{textDecoration: 'none', color: 'white'}}
        >
          <SettingsIcon width={25} height={25} _hover={{cursor: 'pointer', color: 'green'}} />
        </NavLink>
      </Box>
    </Flex>
  );
}
