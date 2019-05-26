import React from 'react';
import ReactDOM from 'react-dom';

// Service worker
import * as serviceWorker from './common/serviceWorker';

// App
import App from './App';
import Firebase, {FirebaseContext} from './firebase';

ReactDOM.render(
  <FirebaseContext.Provider value={new Firebase()}>
    <App />
  </FirebaseContext.Provider>, 
  document.getElementById('root'));

serviceWorker.unregister();
