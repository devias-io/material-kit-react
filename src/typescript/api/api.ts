import axios from 'axios';
import baseURL from '../../typescript/baseUrl';

const api = axios.create({
  baseURL: `${baseURL}/api`, // This is the base URL for all your API endpoints
});

// define the getTopContributors function endpoint
export const getTopContributors = async (
  startDate: Date = new Date(2022, 8, 5),
  endDate: Date = new Date(2022, 11, 20),
  count: number = 5
) => {
  const response = await api.get('/topContributors', {
    params: {
      startDate,
      endDate,
      count,
    },
  });
  return response.data;
};