import React from 'react';
import {Heading, Text} from '@chakra-ui/react';
import {Link} from 'react-router-dom';
import {RoutePath} from './paths';

export default function NotFound() {
  return (
    <>
      <Heading display="flex" color="white" justifyContent="center" marginTop={5}>
        404 Not Found
      </Heading>
      <Text display="flex" color="white" justifyContent="center" marginTop={5}>
        <Link to={RoutePath.Home}>Go back to Home</Link>
      </Text>
    </>
  );
}
