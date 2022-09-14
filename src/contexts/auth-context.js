import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';
import { auth, ENABLE_AUTH } from '../lib/auth';

const HANDLERS = {
  INITIALIZE: 'INITIALIZE',
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT'
};

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null
};

const handlers = {
  [HANDLERS.INITIALIZE]: (state, action) => {
    return {
      ...state,
      ...(
        // if payload (user) is provided, then is authenticated
        action.payload
          ? ({
            isAuthenticated: true,
            isLoading: false,
            user: action.payload
          })
          : ({
            isLoading: false
          })
      )
    };
  },
  [HANDLERS.SIGN_IN]: (state, action) => {
    return {
      ...state,
      isAuthenticated: true,
      user: action.payload
    };
  },
  [HANDLERS.SIGN_OUT]: (state) => {
    return {
      ...state,
      isAuthenticated: false,
      user: null
    };
  }
};

const reducer = (state, action) => (
  handlers[action.type] ? handlers[action.type](state, action) : state
);

// The role of this context is to propagate authentication state through the App tree.

export const AuthContext = createContext({ undefined });

export const AuthProvider = (props) => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);

  const initialize = async () => {
    // Prevent from calling twice in development mode with React.StrictMode enabled
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    // Check if authentication with Zalter is enabled
    // If not, then set user as authenticated
    if (!ENABLE_AUTH) {
      dispatch({
        type: HANDLERS.INITIALIZE,
        payload: {}
      });
      return;
    }

    try {
      // Check if user is authenticated
      const isAuthenticated = await auth.isAuthenticated();

      let user;

      if (isAuthenticated) {
        // Get user from your database
        user = {};
      }

      dispatch({
        type: HANDLERS.INITIALIZE,
        payload: user
      });
    } catch (err) {
      console.error(err);
      dispatch({
        type: HANDLERS.INITIALIZE
      });
    }
  };

  useEffect(() => {
    initialize().catch(console.error);
  }, []);

  const signIn = (user) => {
    dispatch({
      type: HANDLERS.SIGN_IN,
      payload: user
    });
  };

  const signOut = () => {
    dispatch({
      type: HANDLERS.SIGN_OUT
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node
};

export const AuthConsumer = AuthContext.Consumer;

export const useAuthContext = () => useContext(AuthContext);
