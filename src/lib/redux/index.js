import {
  createStore, combineReducers, applyMiddleware
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import Sesion from './me';

const rootReducer = combineReducers({
  Sesion
});

export default function generateStore() {
  const store = createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(thunk))
  );

  return store;
}
