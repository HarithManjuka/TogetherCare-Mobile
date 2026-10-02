// src/__tests__/IT23831254/admin_dashboard_home.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AdminDashboardHome from '../../screens/admin/AdminDashboardHome';

describe('IT23831254: Admin Dashboard Home Visual Charts Tests', () => {
  const mockUsers = [
    { _id: '1', role: 'volunteer', gender: 'male', isEmailVerified: true },
    { _id: '2', role: 'volunteer', gender: 'female', isEmailVerified: false },
    { _id: '3', role: 'elderly', gender: 'male', isEmailVerified: true },
    { _id: '4', role: 'caregiver', gender: 'female', isEmailVerified: true },
    { _id: '5', role: 'volunteer', gender: 'female', isEmailVerified: true },
  ];

  const mockNavigate = jest.fn();
  const mockRefresh = jest.fn();

  it('renders all system metric cards correctly', () => {
    const { getByText } = render(
      <AdminDashboardHome
        user={{ firstName: 'Harith' }}
        users={mockUsers}
        totalUsers={5}
        volunteerCount={3}
        elderlyCount={1}
        caregiverCount={1}
        onNavigateTab={mockNavigate}
        onRefresh={mockRefresh}
      />
    );

    expect(getByText('Admin Command Center')).toBeTruthy();
    expect(getByText('Total Users')).toBeTruthy();
    expect(getByText('Volunteers')).toBeTruthy();
    expect(getByText('Elderly Profiles')).toBeTruthy();
    expect(getByText('Caregivers')).toBeTruthy();
  });

  it('renders Number of Users monthly trend bar chart and handles selection', () => {
    const { getByText, getAllByText } = render(
      <AdminDashboardHome
        user={{ firstName: 'Harith' }}
        users={mockUsers}
        totalUsers={5}
        volunteerCount={3}
        elderlyCount={1}
        caregiverCount={1}
        onNavigateTab={mockNavigate}
        onRefresh={mockRefresh}
      />
    );

    expect(getByText('Number of Users')).toBeTruthy();
    expect(getByText('Monthly User Count Trend')).toBeTruthy();

    // Check month labels
    const octLabels = getAllByText('Oct');
    expect(octLabels.length).toBeGreaterThan(0);
    fireEvent.press(octLabels[0]);
  });

  it('renders Users Structure with male and female percentages', () => {
    const { getByText } = render(
      <AdminDashboardHome
        user={{ firstName: 'Harith' }}
        users={mockUsers}
        onNavigateTab={mockNavigate}
        onRefresh={mockRefresh}
      />
    );

    expect(getByText('Users Structure')).toBeTruthy();
    expect(getByText('Male')).toBeTruthy();
    expect(getByText('Female')).toBeTruthy();

    // 2 males out of 5 total => 40%, 3 females => 60%
    expect(getByText('40%')).toBeTruthy();
    expect(getByText('60%')).toBeTruthy();
  });

  it('renders Email Verification Status pie chart correctly', () => {
    const { getByText } = render(
      <AdminDashboardHome
        user={{ firstName: 'Harith' }}
        users={mockUsers}
        onNavigateTab={mockNavigate}
        onRefresh={mockRefresh}
      />
    );

    expect(getByText('Email Verification Status')).toBeTruthy();
    expect(getByText('Verified')).toBeTruthy();
    expect(getByText('Not Verified')).toBeTruthy();

    // 4 verified out of 5 total => 80%, 1 not verified => 20%
    expect(getByText('80%')).toBeTruthy();
    expect(getByText('20%')).toBeTruthy();
  });

  it('handles quick management action card taps', () => {
    const { getByText } = render(
      <AdminDashboardHome
        user={{ firstName: 'Harith' }}
        users={mockUsers}
        onNavigateTab={mockNavigate}
        onRefresh={mockRefresh}
      />
    );

    fireEvent.press(getByText('Manage User Accounts'));
    expect(mockNavigate).toHaveBeenCalledWith('users');

    fireEvent.press(getByText('Safety & SOS Alerts Log'));
    expect(mockNavigate).toHaveBeenCalledWith('alerts');
  });

  it('renders real system data for 27 total users and dynamic 2-month registration trend', () => {
    // 27 users matching system registration dates (Aug, Sep, Oct 2026)
    const realAppUsers = [
      ...Array(15).fill({ _id: 'a', role: 'elderly', gender: 'male', isEmailVerified: true, createdAt: '2026-08-25T10:00:00.000Z' }),
      ...Array(11).fill({ _id: 's', role: 'volunteer', gender: 'male', isEmailVerified: false, createdAt: '2026-09-15T10:00:00.000Z' }),
      { _id: 'o', role: 'caregiver', gender: 'female', isEmailVerified: true, createdAt: '2026-10-02T10:00:00.000Z' },
    ];

    const { getByText, getAllByText } = render(
      <AdminDashboardHome
        user={{ firstName: 'Harith' }}
        users={realAppUsers}
        totalUsers={27}
        onNavigateTab={mockNavigate}
        onRefresh={mockRefresh}
      />
    );

    // Total Users metric and chart donut hole should show 27
    const totalLabels = getAllByText('27');
    expect(totalLabels.length).toBeGreaterThanOrEqual(1);

    // Check monthly registration timeline
    expect(getByText('Aug')).toBeTruthy();
    expect(getByText('Sep')).toBeTruthy();
    expect(getByText('Oct')).toBeTruthy();
  });
});
