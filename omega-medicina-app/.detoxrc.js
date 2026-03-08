/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: './e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.simulator': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15'
      },
      build: {
        command: 'npx expo run:ios --configuration Release --no-build-cache',
        dependencies: {
          'detox': {
            version: '20.14.3'
          }
        }
      }
    },
    'android.emu.debug': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6_API_34'
      },
      build: {
        command: 'npx expo run:android --variant release --no-build-cache',
        dependencies: {
          'detox': {
            version: '20.14.3'
          }
        }
      }
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6_API_34'
      }
    }
  },
  configurations: {
    'ios.simulator': {
      device: 'simulator',
      app: 'ios.simulator'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.emu.debug'
    }
  }
};
