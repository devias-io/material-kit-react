import * as React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const products = [
  { id: 1, name: 'Product 1', image: '/images/product1.jpg' },
  { id: 2, name: 'Product 2', image: '/images/product2.jpg' },
  { id: 3, name: 'Product 3', image: '/images/product3.jpg' },
  // Add more products as needed
];

export function ProductCarousel(): React.JSX.Element {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div style={{ marginTop: '50px' }}>
      <h2>Product Catalogue</h2>
      <Slider {...settings}>
        {products.map((product) => (
          <div key={product.id}>
            <img src={product.image} alt={product.name} style={{ width: '100%' }} />
            <h3>{product.name}</h3>
          </div>
        ))}
      </Slider>
    </div>
  );
}
