import controller from './controller';
import dog from './dog';
import breeder from './breeder';
import litter from './litter';
import geolocationController from './geolocation';
import geolocationSync from './geolocation-sync';

export default {
  controller,
  dog,
  breeder,
  litter,
  geolocation: geolocationController,
  'geolocation-sync': geolocationSync,
} as any;
