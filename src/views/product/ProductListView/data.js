import { v4 as uuid } from 'uuid';

export default [
  {
    id: uuid(),
    createdAt: '27/03/2019',
    description: 'Nelson District Parents Centre offers childbirth education (antenatal) courses for expectant parents and their support people to prepare for the arrival of a new baby and becoming parents. Our highly regarded classes are run by qualified, trained childbirth educators in a relaxed and nurturing setting.',
    media: '/static/images/products/baby_and_you.jpg',
    title: 'Baby & You course (Nelson)',
    totalDownloads: '12'
  },
  {
    id: uuid(),
    createdAt: '31/03/2019',
    description: 'Nelson District Parents Centre offers childbirth education (antenatal) courses for expectant parents and their support people to prepare for the arrival of a new baby and becoming parents. Our highly regarded classes are run by qualified, trained childbirth educators in a relaxed and nurturing setting.',
    media: '/static/images/products/motueka.jpg',
    title: 'Childbirth education Antenatal course (Motueka)',
    totalDownloads: '18'
  },
  {
    id: uuid(),
    createdAt: '03/04/2019',
    description: 'Nelson District Parents Centre offers childbirth education (antenatal) courses for expectant parents and their support people to prepare for the arrival of a new baby and becoming parents. Our highly regarded classes are run by qualified, trained childbirth educators in a relaxed and nurturing setting.',
    media: '/static/images/products/nelson.jpg',
    title: 'Childbirth education Antenatal course (Nelson)',
    totalDownloads: '16'
  }
];
