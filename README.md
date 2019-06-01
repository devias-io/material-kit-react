## [Brainalytica Dashboard with Firebase Auth, ReactContextApi and Session Mgmt built in!!](https://react-firebase-brainalytica.firebaseapp.com) 

- Based off Devias React Material Template "Brainalytica" found [here](https://github.com/devias-io/react-material-dashboard)
- Lots of Firebase Auth help from "rwieruch" [here](https://www.robinwieruch.de/complete-firebase-authentication-react-tutorial/)

![React Material Dashboard](https://s3.eu-west-2.amazonaws.com/devias/products/react-material-dashboard/react-material-free.png)

## Table of Contents

- [Demo](#demo)
- [Quick Start](#quick-start)
- [Design Files](#design-files)
- [Resources](#resources)
- [Reporting Issues](#reporting-issues)
- [Contact Us](#contact-us)

## Demo

- [Firebase Auth Demo](https://react-firebase-brainalytica.firebaseapp.com/)

## Quick start

- [Download from Github](https://github.com/dnbr2002/react-material-dashboard/archive/master.zip) or clone the repo: `git clone https://github.com/dnbr2002/react-material-dashboard`

- [Create firebase project](https://firebase.google.com/)

  - In your project go to Authentication/Sign-in Method.  Enable Email, Google and Facebook.  Follow instructions in Firebase for setting up Social logins with providers.  **Optional** Under Advanced, if you allow multiple accounts per email address this will resolve issues with Facebook, Google and Email duplicate overlaps.  
  - In the root of your project create a .env file.  Grab the values from firebase and place them in this file.  It should look something like this.  
  ```
  REACT_APP_API_KEY=aREALLLY_bigFJKFJDKAFJugly_KEY
  REACT_APP_AUTH_DOMAIN=your-project-name.firebaseapp.com
  REACT_APP_DATABASE_URL=https://your-project-name.firebaseio.com
  REACT_APP_PROJECT_ID=your-project-name
  REACT_APP_STORAGE_BUCKET=your-project-name.appspot.com
  REACT_APP_MESSAGING_SENDER_ID=999120432754      <-----will look something like this
  ```

- Install dependencies: `npm install` or `yarn`

- Start the server: `npm run start` or `yarn start`

- Views are on: `localhost:3000`

## Resources

- React Material Template - [Devias](https://devias.io/)
- Firebase Auth Example - [RWieruch](https://www.robinwieruch.de/complete-firebase-authentication-react-tutorial/)
- Firebase Auth - [Official Docs](https://firebase.google.com/docs/auth/web/start)

## Reporting Issues:

- [Github Issues Page](https://github.com/dnbr2002/react-material-dashboard/issues)

## Contact Us

- Email : dnbr2002@yahoo.com

