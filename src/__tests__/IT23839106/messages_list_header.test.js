import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'user123', firstName: 'John', lastName: 'Doe', role: 'elderly' },
    token: 'fake-token',
  }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    uiScale: 1.0,
    cycleUiScale: jest.fn(),
    scale: 1.0,
  }),
}));

jest.mock('../../services/messageService', () => ({
  getConversations: jest.fn().mockResolvedValue({ success: true, data: [] }),
  getContacts: jest.fn().mockResolvedValue({ success: true, data: [] }),
  searchUserByPhone: jest.fn().mockResolvedValue({ success: true, data: null }),
  addContact: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../services/socketService', () => ({
  connect: jest.fn(),
  onReceiveMessage: jest.fn().mockReturnValue(jest.fn()),
  onStatusChanged: jest.fn().mockReturnValue(jest.fn()),
}));

import MessagesListScreen from '../../screens/common/MessagesListScreen';

describe('MessagesListScreen Top App Bar Integration', () => {
  it('renders AppHeader when showAppHeader is true (Elderly Msg tab)', () => {
    const { getByText } = render(
      <MessagesListScreen
        showAppHeader={true}
        onBack={jest.fn()}
        onNavigateTab={jest.fn()}
        onOpenProfile={jest.fn()}
        onOpenNotifications={jest.fn()}
        hasUnreadNotifications={true}
        unreadNotificationCount={3}
      />
    );

    // Verify AppHeader branding is displayed
    expect(getByText('TogetherCare')).toBeTruthy();

    // Verify Messages subheader is displayed
    expect(getByText('Messages')).toBeTruthy();
    expect(getByText('Real-time coordination & chat')).toBeTruthy();
  });

  it('does NOT render AppHeader when showAppHeader is false (Volunteer/Caregiver backwards compatibility)', () => {
    const { queryByText, getByText } = render(
      <MessagesListScreen
        showAppHeader={false}
        onBack={jest.fn()}
      />
    );

    // AppHeader should NOT be rendered
    expect(queryByText('TogetherCare')).toBeNull();

    // Messages subheader should still be rendered
    expect(getByText('Messages')).toBeTruthy();
    expect(getByText('Real-time coordination & chat')).toBeTruthy();
  });
});
