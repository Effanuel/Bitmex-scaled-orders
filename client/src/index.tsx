import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import {ChakraProvider, extendTheme} from '@chakra-ui/react';
import {createStore} from 'redux/store';
import App from './App';
import {ModalProvider} from 'context/modal-context';
import {AppProvider} from 'context/app-context';
import * as serviceWorker from './serviceWorker';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        fontFamily: 'Helvetica',
      },
    },
  },
  textStyles: {
    bold: {
      fontWeight: '900',
      fontSize: '16px',
      lineHeight: 1,
    },
    red: {
      color: 'rgb(245, 157, 172)',
      _hover: {color: '#cf6679', cursor: 'pointer'},
      _disabled: {color: 'rgba(255, 255, 255, 0.6)'},
    },
    regular: {
      color: '#4caf50',
      _hover: {color: '#41e87a', cursor: 'pointer'},
      _disabled: {color: 'rgba(255, 255, 255, 0.6)', cursor: 'default'},
    },
    hover: {
      _hover: {cursor: 'pointer'},
    },
    'hover:red:border': {
      _hover: {
        boxShadow: 'inset 0px 0px 0px 1px red',
        cursor: 'pointer',
      },
    },
    'hover:red:color': {
      _hover: {
        color: '#f00',
        cursor: 'pointer',
      },
    },
    'hover:green:color': {
      _hover: {
        color: 'green',
        cursor: 'pointer',
      },
    },
  },
  colors: {
    white: '#e0f2f1',
    red: '#cf6679',
    green: {
      100: '#4caf50',
    },
    brand: {
      100: '#121212',
    },
  },
  components: {
    Radio: {
      baseStyle: {
        label: {
          color: 'white',
        },
      },
    },
    Table: {
      variants: {
        striped: {
          th: {
            fontSize: 10,
            color: 'white',
          },
          td: {
            color: 'white',
            fontWeight: 500,
          },
        },
      },
      defaultProps: {
        colorScheme: 'brand',
        size: 'sm',
        variant: 'striped',
      },
    },
    //@ts-ignore
    Popover: {
      baseStyle: {
        content: {
          _focus: {
            boxShadow: 'none',
          },
        },
      },
    },
  },
});

ReactDOM.render(
  <Provider store={createStore()}>
    <BrowserRouter>
      <AppProvider>
        <ChakraProvider theme={theme}>
          <ModalProvider>
            <App />
          </ModalProvider>
        </ChakraProvider>
      </AppProvider>
    </BrowserRouter>
  </Provider>,
  document.getElementById('root') as HTMLElement,
);

serviceWorker.unregister();
