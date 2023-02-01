import { v4 as uuid } from 'uuid';

export const products = [
  {
    id: uuid(),
    createdAt: '27/03/2019',
    description: 'Perform the IT-Scan to check for security vulnerabilities.',
    media: '/static/images/products/product_1.png',
    title: 'IT-Scan',
    totalDownloads: '594'
  },
  {
    id: uuid(),
    createdAt: '31/03/2019',
    description: 'Try our SMB Package for insights into your company, and save money!',
    media: '/static/images/products/product_2.png',
    title: 'SMB',
    totalDownloads: '625'
  },
  {
    id: uuid(),
    createdAt: '03/04/2019',
    description: 'SMB not enough? Our Enterprise package is tailored to your needs!',
    media: '/static/images/products/product_3.png',
    title: 'Enterprise',
    totalDownloads: '857'
  },
];
