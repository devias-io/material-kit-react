import React from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import * as serviceWorker from './serviceWorker';
import generateStore from './lib/redux';
import { TokenContextProvider } from './lib/context/contextToken';
import App from './App';

ReactDOM.render((
  <Provider store={generateStore()}>
    <TokenContextProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TokenContextProvider>
  </Provider>
), document.getElementById('root'));

serviceWorker.unregister();
