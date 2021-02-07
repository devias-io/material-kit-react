const initialData = {
  me: {},
};

const SET_SESION = 'SET_SESION';

/// REDUCER

export default function reducer(state = initialData, action) {
  switch (action.type) {
    case SET_SESION:
      return { ...state, me: action.payload };
    default:
      return state;
  }
}

/// ACTIONS

export const SetSesion = (user) => (dispatch) => {
  dispatch({
    type: SET_SESION,
    payload: user,
  });
};
