const API_KEY = 'pub_31927c5971f9e3d3186f62fcfaaf208441579';
const BASE_URL = 'https://newsdata.io/api/1';

export const getLatestNews = async (queryParams = 'pizza') => {
  try {
    const response = await fetch(`${BASE_URL}/news?apikey=${API_KEY}&q=${queryParams}&language=fr,zh`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching news:', error);
    return null;
  }
};
