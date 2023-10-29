const axios = require('axios');
const BASE_URL = 'https://api.bing.microsoft.com/v7.0/news';
const API_KEY = '1c71bf13502240199821423b3c4bc4c3';

export const getLatestNews = async (queryParams = 'Business') => {
  const headers = {
    'Ocp-Apim-Subscription-Key': API_KEY,
    'Accept-Language': 'en-US', // language
  };
  const category = 'Business'; // category
  const market = 'en-CA'; // location
  const freshness = 'Day'; // how fresh data is
  const count = '3'; // number of news display

  try {
    const response = await axios.get(`${BASE_URL}?q=${queryParams}&category=${category}&mkt=${market}&freshness=${freshness}&count=${count}`, {
      headers: headers
    });
    if (response.status === 200) {
      const data = response.data;
      console.log('Response:', data);
      return data;
    } else {
      console.error('Request failed with status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};