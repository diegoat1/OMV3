// Build Banner - Shows build info at top of screen for dev verification

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

// Build timestamp - auto-generated at bundle time
const BUILD_DATE = new Date().toISOString().slice(0, 16).replace('T', ' ');
const BUILD_ID = 'OMV3-v3';

export function BuildBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        OMV3 Build: {BUILD_DATE} • {BUILD_ID}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  text: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
