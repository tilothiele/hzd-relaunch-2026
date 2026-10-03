import controller from './controller';
import dog from './dog';
import breeder from './breeder';
import litter from './litter';
import geolocationController from './geolocation';
import geolocationSync from './geolocation-sync';
import userImport from './user-import';
import litterReminder from './litter-reminder';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const controllers: Record<string, any> = {
  controller,
  dog,
  breeder,
  litter,
  geolocation: geolocationController,
  'geolocation-sync': geolocationSync,
  'user-import': userImport,
  'litter-reminder': litterReminder,
}

export default controllers
