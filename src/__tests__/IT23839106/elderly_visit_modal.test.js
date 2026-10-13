import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'elder1', firstName: 'Kamal', lastName: 'Perera', role: 'elderly' },
    token: 'fake-token',
  }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    uiScale: 1.0,
    cycleUiScale: jest.fn(),
    scale: 1.0,
    isLarge: false,
  }),
}));

const mockUpcomingVisits = [
  {
    _id: 'visit-101',
    activityType: 'Grocery Pickup',
    scheduledDate: '2026-10-15T08:00:00.000Z',
    timeSlot: '08:00 AM - 04:00 PM',
    status: 'accepted',
    companionName: 'malith udara',
    volunteer: {
      firstName: 'malith',
      lastName: 'udara',
      phone: '0771234567',
    },
  },
];

jest.mock('../../hooks/useElderlyHome', () => {
  const React = require('react');
  return {
    useElderlyHome: () => {
      const [selectedVisit, setSelectedVisit] = React.useState(null);
      return {
        user: { firstName: 'Kamal' },
        firstName: 'Kamal',
        greeting: 'Good Morning',
        upcomingVisits: [
          {
            _id: 'visit-101',
            activityType: 'Grocery Pickup',
            scheduledDate: '2026-10-15T08:00:00.000Z',
            timeSlot: '08:00 AM - 04:00 PM',
            status: 'accepted',
            companionName: 'malith udara',
            volunteer: {
              firstName: 'malith',
              lastName: 'udara',
              phone: '0771234567',
            },
          },
        ],
        isLoading: false,
        refreshing: false,
        fetchError: null,
        onRefresh: jest.fn(),
        selectedVisit,
        setSelectedVisit,
        formatScheduleDate: (d, t) => ({ date: 'Oct 15', time: t }),
        renderActivityIcon: () => null,
        handleActionPress: jest.fn(),
      };
    },
  };
});

jest.mock('../../services/emergencyService', () => ({
  getCareCircle: jest.fn().mockResolvedValue({ success: true, data: [] }),
  getActiveSOS: jest.fn().mockResolvedValue({ success: true, data: null }),
}));

jest.mock('../../services/dependentService', () => ({
  getPendingRequests: jest.fn().mockResolvedValue({ success: true, data: [] }),
}));

import ElderlyDashboardHome from '../../screens/elderly/ElderlyDashboardHome';

describe('ElderlyDashboardHome: Upcoming Visit Details Modal Visibility Tests', () => {
  it('opens Visit Details modal on upcoming visit press with styled details and dismisses properly', () => {
    const { getByText, queryByText } = render(
      <ElderlyDashboardHome
        onNavigateTab={jest.fn()}
        onRequestHelp={jest.fn()}
      />
    );

    // Initial state: Visit card is visible
    expect(getByText('Grocery Pickup')).toBeTruthy();
    expect(getByText('with malith udara')).toBeTruthy();

    // Tap on the upcoming visit card
    fireEvent.press(getByText('Grocery Pickup'));

    // Modal details sheet should now be visible with styled labels and content
    expect(getByText('Visit Details')).toBeTruthy();
    expect(getByText('Scheduled Care Visit')).toBeTruthy();
    expect(getByText('Activity')).toBeTruthy();
    expect(getByText('Date & Time')).toBeTruthy();
    expect(getByText('Oct 15 at 08:00 AM - 04:00 PM')).toBeTruthy();
    expect(getByText('Status')).toBeTruthy();
    expect(getByText('accepted')).toBeTruthy();
    expect(getByText('Volunteer Contact')).toBeTruthy();
    expect(getByText('0771234567')).toBeTruthy();

    // Close button should be present
    const closeBtn = getByText('Close');
    expect(closeBtn).toBeTruthy();

    // Press close
    fireEvent.press(closeBtn);

    // Modal should now be closed
    expect(queryByText('Scheduled Care Visit')).toBeNull();
  });
});
