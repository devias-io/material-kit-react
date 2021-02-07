import {
  createStore, combineReducers, applyMiddleware
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import Cookies from 'js-cookie';
import Sesion, { SetSesion } from './me';

import { GetMeUser } from '../../api/users';

const rootReducer = combineReducers({
  Sesion
});

export default function generateStore() {
  const store = createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(thunk))
  );

  const token = Cookies.get('access-token');

  if (token) {
    GetMeUser(token).then((response) => {
      store.dispatch(SetSesion(response.data.me));
    }).catch((error) => console.log(error.message));
  }

  return store;
}
