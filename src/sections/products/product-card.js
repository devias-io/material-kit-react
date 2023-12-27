import PropTypes from 'prop-types';
import { Button, Card, CardActions, CardContent, CardMedia, SvgIcon, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import moment from 'moment';
import SettingsIcon from '@mui/icons-material/Settings';
export const ProductCard = ({ product }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    // Convert buffer data to a data URL
    const bufferToDataURL = (buffer) => {
      const uint8Array = new Uint8Array(buffer?.data);
      const blob = new Blob([uint8Array], { type: 'image/jpeg' });
      const dataURL = URL.createObjectURL(blob);
      return dataURL;
    };

    if (product.image && product.image.type === 'Buffer') {
      const dataURL = bufferToDataURL(product?.image);
      setImageSrc(dataURL);
    }

    setLastUpdate(moment(product.updatedAt).fromNow());

  }, []);

  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardMedia
        sx={{ height: 140 }}
        image={imageSrc}
        title="green iguana"
      />
      <CardContent>
        <Typography gutterBottom variant="h4" component="div">
          {product.titleEN}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {product.descriptionEN}
        </Typography>
        <Typography variant="subtitle1" color="text.danger">{product.price}</Typography>
      </CardContent>
      <CardActions>
        <Button
          startIcon={(
            <SvgIcon fontSize="small">
              <SettingsIcon />
            </SvgIcon>
          )}

        >
          Settings
        </Button>

        </CardActions>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired
};
