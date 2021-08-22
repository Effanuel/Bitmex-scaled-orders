import {hocFacade} from 'influnt';
import {Provider} from 'react-redux';
import {Router} from 'react-router-dom';
import {ChakraProvider} from '@chakra-ui/react';
import {MemoryHistory} from 'history';
import {MockedStore} from './mockStore';
import {ModalProvider} from 'context/modal-context';
import {AppProvider} from 'context/app-context';

export const withStore = (params: {store: MockedStore; history: MemoryHistory}) =>
  hocFacade({
    providers: [
      [Provider, {props: {store: params.store}}], //
      [Router, {props: {history: params.history}}],
      AppProvider,
      ChakraProvider,
      ModalProvider,
    ],
  });

export const componentContext = () => hocFacade({providers: [ChakraProvider]});
