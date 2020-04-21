import React from 'react';
import ReactDOM from 'react-dom';

import * as serviceWorker from './serviceWorker';
import App from './App';

import axios from 'axios'

axios.get('https://minhastarefas-api.herokuapp.com/tarefas', {
  headers: { 'x-ten' }
})

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.unregister();
