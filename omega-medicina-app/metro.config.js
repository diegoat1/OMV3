const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reducir cache agresivo para desarrollo
config.resetCache = true;

module.exports = config;
