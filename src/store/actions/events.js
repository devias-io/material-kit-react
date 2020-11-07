import { FETCH_EVENTS } from '../types'
import { getEvents } from '../../api'

export const fetchEvents = () => async (dispatch) => {
  try {
    const response = await getEvents()
    dispatch({
      type: FETCH_EVENTS,
      payload: response
    })
  } catch (err) {
    console.log(err)
  }
}
