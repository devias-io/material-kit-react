import { FETCH_EVENTS } from '../types'

const INITIAL = []

const events = (state = INITIAL, action) => {
  switch (action.type) {
    case FETCH_EVENTS:
      return action.payload
    default:
      return state
  }
}

export default events
