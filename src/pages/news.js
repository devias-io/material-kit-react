import News from '../components/NewsList';
import NavBar from '../components/NavBar';

import React from 'react';

const NewsPage = () => {
  return (
    <div>
        <NavBar />
        <News/>
    </div>
  );
};

NewsPage.getLayout = (page) => (
  <div>
    {page}
  </div>
);

export default NewsPage;
