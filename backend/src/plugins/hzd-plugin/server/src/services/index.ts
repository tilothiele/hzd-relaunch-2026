import service from './service';
import dog from '../../services/dog';
import litter from '../../services/litter';
import breeder from '../../services/breeder';
import geolocation from '../../services/geolocation';
import geolocationSync from './geolocation-sync';
export default {
  service,
  dog,
  breeder,
  litter,
  geolocation,
  'geolocation-sync': geolocationSync,
} as any;
