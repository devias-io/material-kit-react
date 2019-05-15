# Polyfill for IE11

As part of this [issue](https://github.com/devias-io/react-material-dashboard/issues/1) here are the steps to add basic support for IE11.

## Install dependencies

`yarn add react-app-polyfill core-js`

## Import polyfills

Create a file `src/polyfill.js` with the following imports

```javascript
import 'react-app-polyfill/ie11';
import 'core-js/features/array/find';
import 'core-js/features/array/includes';
import 'core-js/features/number/is-nan';
```

Import polyfill file in `src/index.js`

```javascript
import './polyfills';
```

## Update browserlist

Open `package.json` and update

```diff
"browserslist": [
-   "not ie <= 11",
+   "not ie < 10",
```
