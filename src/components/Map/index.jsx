import React from 'react';

// Externals
import { compose, withProps } from 'recompose';
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker
} from 'react-google-maps';

// Google API Key
const KEY = 'AIzaSyAOIOYjlo9oRjUn-dp1i7R08knUPB-Rscg';

// Map styles
import styles from './styles';

export default compose(
  withProps({
    googleMapURL: `https://maps.googleapis.com/maps/api/js?key=${KEY}&v=3.exp&libraries=geometry,drawing,places`,
    loadingElement: <div style={{ height: '100%' }} />,
    containerElement: <div style={{ height: '600px' }} />,
    mapElement: <div style={{ height: '100%' }} />
  }),
  withScriptjs,
  withGoogleMap
)(props => (
  <GoogleMap
    defaultCenter={{ lat: 41.22199, lng: -72.655945 }}
    defaultOptions={{ styles }}
    defaultZoom={8}
  >
    {props.isMarkerShown && (
      <Marker position={{ lat: 41.22199, lng: -72.655945 }} />
    )}
  </GoogleMap>
));
