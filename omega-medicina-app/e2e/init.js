const detox = require('detox');
const config = require('../.detoxrc.js');

beforeAll(async () => {
  await detox.init(config);
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await detox.cleanup();
});
