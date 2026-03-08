// Mock for @expo/vector-icons
const React = require('react');

const createIconMock = (name) => {
  const IconMock = (props) => React.createElement('Icon', { name, ...props });
  IconMock.displayName = `Icon(${name})`;
  return IconMock;
};

const mockIcons = {
  Ionicons: {
    home: createIconMock('home'),
    person: createIconMock('person'),
    settings: createIconMock('settings'),
    heart: createIconMock('heart'),
    medical: createIconMock('medical'),
    stats: createIconMock('stats'),
    calendar: createIconMock('calendar'),
    message: createIconMock('message'),
    bell: createIconMock('bell'),
    search: createIconMock('search'),
    add: createIconMock('add'),
    checkmark: createIconMock('checkmark'),
    close: createIconMock('close'),
    alert: createIconMock('alert'),
    information: createIconMock('information'),
    crown: createIconMock('crown'),
    people: createIconMock('people'),
    // Add more icons as needed
  },
  MaterialIcons: {
    home: createIconMock('home'),
    person: createIconMock('person'),
    settings: createIconMock('settings'),
    // Add more icons as needed
  },
  // Add other icon sets as needed
};

module.exports = mockIcons;
