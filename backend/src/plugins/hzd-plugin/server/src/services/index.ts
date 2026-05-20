import service from './service';
import dog from '../../services/dog';
import litter from '../../services/litter';
import breeder from '../../services/breeder';
import geolocation from '../../services/geolocation';
import geolocationSync from './geolocation-sync';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const services: Record<string, any> = {
  service,
  dog,
  breeder,
  litter,
  geolocation,
  'geolocation-sync': geolocationSync,
}

export default services
