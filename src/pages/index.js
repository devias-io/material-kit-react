import NavBar from '../components/NavBar';
import HeroSection from '../components/HeroSection';
import footer from '../components/footer';

import React from 'react';

const HomePage = () => {
  return (
    <div>
      <NavBar />
      <HeroSection />
      <footer />
    </div>
  );
};

HomePage.getLayout = (page) => (
  <div>
    {page}
  </div>
);

export default HomePage;

