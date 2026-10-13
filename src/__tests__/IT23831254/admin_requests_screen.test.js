// src/__tests__/IT23831254/admin_requests_screen.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdminRequestsScreen from '../../screens/admin/AdminRequestsScreen';
import * as adminUserService from '../../services/adminUserService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../services/adminUserService');

describe('IT23831254: Admin Verification Requests Screen Tests', () => {
  const mockPendingVolunteers = [
    {
      _id: 'vol-123',
      firstName: 'Nethmini',
      lastName: 'Madhushika',
      role: 'volunteer',
      customId: 'VOL-0004',
      email: 'heavenmirror01@gmail.com',
      verificationBadgeStatus: 'pending',
      volunteerVerification: {
        status: 'PENDING',
        credentialType: 'Student ID',
        credentialNumber: 'STU-9921',
        evidenceFiles: [{ url: 'https://example.com/id.pdf', fileType: 'pdf' }],
      },
    },
    {
      _id: 'vol-456',
      firstName: 'Amanda',
      lastName: 'Pathirana',
      role: 'volunteer',
      customId: 'VOL-0007',
      email: 'amanda@gmail.com',
      verificationBadgeStatus: 'verified',
      volunteerVerification: {
        status: 'APPROVED',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders pending volunteer requests and badges correctly', async () => {
    adminUserService.getAdminUsers.mockResolvedValueOnce({
      success: true,
      users: mockPendingVolunteers,
    });

    const { getByText, queryByText } = render(
      <AdminRequestsScreen users={mockPendingVolunteers} />
    );

    // Header elements
    expect(getByText('Verification Requests')).toBeTruthy();

    await waitFor(() => {
      // Pending volunteer should be visible
      expect(getByText('Nethmini Madhushika')).toBeTruthy();
      expect(getByText('ID: VOL-0004')).toBeTruthy();
      expect(getByText('Pending Approval')).toBeTruthy();
      expect(getByText('Student ID • STU-9921')).toBeTruthy();
      expect(getByText('1 Evidence File')).toBeTruthy();

      // Approved volunteer should NOT be shown in pending requests
      expect(queryByText('Amanda Pathirana')).toBeNull();
    });
  });

  it('displays empty state when there are no pending volunteer requests', async () => {
    adminUserService.getAdminUsers.mockResolvedValueOnce({
      success: true,
      users: [
        {
          _id: 'vol-999',
          firstName: 'Kamal',
          lastName: 'Perera',
          role: 'volunteer',
          verificationBadgeStatus: 'unverified',
        },
      ],
    });

    const { getByText } = render(
      <AdminRequestsScreen users={[]} />
    );

    await waitFor(() => {
      expect(getByText('No Pending Requests')).toBeTruthy();
      expect(getByText('Check for Updates')).toBeTruthy();
    });
  });

  it('filters pending requests based on search query', async () => {
    adminUserService.getAdminUsers.mockResolvedValueOnce({
      success: true,
      users: mockPendingVolunteers,
    });

    const { getByPlaceholderText, getByText, queryByText } = render(
      <AdminRequestsScreen users={mockPendingVolunteers} />
    );

    await waitFor(() => {
      expect(getByText('Nethmini Madhushika')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Search pending volunteers by name or ID...');
    fireEvent.changeText(searchInput, 'NonExistentVolunteer');

    expect(queryByText('Nethmini Madhushika')).toBeNull();
    expect(getByText('No Matching Requests')).toBeTruthy();
  });
});
