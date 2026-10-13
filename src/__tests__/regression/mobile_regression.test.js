// src/__tests__/regression/mobile_regression.test.js
/**
 * TogetherCare Mobile Regression Test Suite
 * 
 * Purpose: Verifies that UI components, role-specific bottom navigations, 
 * audio/voice recording services, messaging services, and caregiver schedule conflict 
 * integrations continue to function properly without regressions across all app modules.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AppBottomNav, { ROLE_TABS } from '../../components/common/AppBottomNav';
import * as dependentService from '../../services/dependentService';
import * as caregiverService from '../../services/caregiverService';
import * as messageService from '../../services/messageService';
import * as notificationService from '../../services/notificationService';
import audioService from '../../services/audioService';
import client from '../../api/client';

// Mock expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock safe-area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock api client
jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

describe('TogetherCare Mobile End-to-End Regression Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==============================================================
  // REGRESSION 1: ROLE-SPECIFIC BOTTOM NAVIGATION & BADGE COMPATIBILITY
  // ==============================================================
  describe('Regression 1: Multi-Role Bottom Navigation Architecture', () => {
    it('should define distinct tab configurations for all system roles', () => {
      expect(ROLE_TABS.admin).toBeDefined();
      expect(ROLE_TABS.elderly).toBeDefined();
      expect(ROLE_TABS.volunteer).toBeDefined();
      expect(ROLE_TABS.caregiver).toBeDefined();
      expect(ROLE_TABS.family_member).toBeDefined();
    });

    it('should render volunteer bottom navigation tabs without badge distortions', () => {
      const { getByText } = render(
        <AppBottomNav role="volunteer" activeTab="home" requestBadgeCount={2} />
      );
      expect(getByText('Home')).toBeTruthy();
      expect(getByText('Schedule')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
    });

    it('should render elderly bottom navigation tabs with emergency and message tabs', () => {
      const { getByText } = render(
        <AppBottomNav role="elderly" activeTab="home" msgBadgeCount={5} />
      );
      expect(getByText('Home')).toBeTruthy();
      expect(getByText('Requests')).toBeTruthy();
      expect(getByText('Msg')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });

    it('should display 99+ for message counts exceeding 99 on caregiver navigation', () => {
      const { getByText } = render(
        <AppBottomNav role="caregiver" activeTab="messages" msgBadgeCount={120} />
      );
      expect(getByText('Chat')).toBeTruthy();
      expect(getByText('99+')).toBeTruthy();
    });

    it('should invoke tab callback when a user taps a navigation tab', () => {
      const onTabPress = jest.fn();
      const { getByText } = render(
        <AppBottomNav role="caregiver" activeTab="home" onTabPress={onTabPress} />
      );
      fireEvent.press(getByText('Chat'));
      expect(onTabPress).toHaveBeenCalledWith('messages');
    });
  });

  // ==============================================================
  // REGRESSION 2: CAREGIVER SCHEDULING & CONFLICT SERVICE INTEGRATION (US-402, US-404)
  // ==============================================================
  describe('Regression 2: Caregiver Scheduling & Conflict Prevention Services', () => {
    it('should query available assignments endpoint without payload regression', async () => {
      const mockAssignments = {
        success: true,
        data: [{ id: 'req_1', type: 'help_request', serviceType: 'Grocery Delivery' }],
      };
      client.get.mockResolvedValueOnce({ data: mockAssignments });

      const res = await caregiverService.getAvailableAssignments();
      expect(client.get).toHaveBeenCalledWith('/help-requests/caregiver/assignments');
      expect(res).toEqual(mockAssignments);
    });

    it('should send acceptAssignment payload with assignmentType for conflict detection (US-402)', async () => {
      const mockAcceptRes = {
        success: true,
        message: 'Assignment accepted successfully with no schedule conflicts.',
      };
      client.post.mockResolvedValueOnce({ data: mockAcceptRes });

      const res = await caregiverService.acceptCaregiverAssignment('req_1', 'help_request');
      expect(client.post).toHaveBeenCalledWith('/help-requests/caregiver/assignments/req_1/accept', {
        assignmentType: 'help_request',
      });
      expect(res).toEqual(mockAcceptRes);
    });

    it('should query upcoming care visits across dependents (US-404)', async () => {
      const mockVisits = {
        success: true,
        data: [{ _id: 'v_1', date: '2026-11-20', time: '10:00 AM' }],
      };
      client.get.mockResolvedValueOnce({ data: mockVisits });

      const res = await dependentService.getUpcomingCareVisits();
      expect(client.get).toHaveBeenCalledWith('/caregiver/dependents/upcoming-visits');
      expect(res).toEqual(mockVisits);
    });
  });

  // ==============================================================
  // REGRESSION 3: MESSAGING, VOICE NOTES & CONTACTS (US-403, US-411)
  // ==============================================================
  describe('Regression 3: Messaging, Voice Notes & Audio Services', () => {
    it('should send text message payload with correct role parameters (US-403)', async () => {
      const mockMsg = { success: true, data: { _id: 'm_1', content: 'On my way' } };
      client.post.mockResolvedValueOnce({ data: mockMsg });

      const res = await messageService.sendMessage('user_eld', 'On my way');
      expect(client.post).toHaveBeenCalledWith('/messages', {
        recipientId: 'user_eld',
        content: 'On my way',
        messageType: 'text',
      });
      expect(res).toEqual(mockMsg);
    });

    it('should send voice message with duration and audioUrl (US-411)', async () => {
      const mockVoiceMsg = {
        success: true,
        data: { _id: 'm_voice', messageType: 'voice', durationSeconds: 8 },
      };
      client.post.mockResolvedValueOnce({ data: mockVoiceMsg });

      const res = await messageService.sendVoiceMessage('user_eld', 'https://cdn.example.com/audio.m4a', 8);
      expect(client.post).toHaveBeenCalledWith('/messages', {
        recipientId: 'user_eld',
        content: 'Voice note (8s)',
        messageType: 'voice',
        audioUrl: 'https://cdn.example.com/audio.m4a',
        durationSeconds: 8,
      });
      expect(res).toEqual(mockVoiceMsg);
    });

    it('should search contacts with normalized phone number query param', async () => {
      const mockSearch = { success: true, data: { _id: 'user_2', firstName: 'Kamal' } };
      client.get.mockResolvedValueOnce({ data: mockSearch });

      const res = await messageService.searchContactByPhone('0711111111');
      expect(client.get).toHaveBeenCalledWith('/messages/contacts/search', {
        params: { phone: '0711111111' },
      });
      expect(res).toEqual(mockSearch);
    });

    it('should manage audio recording lifecycle in audioService', async () => {
      const startRes = await audioService.startRecording();
      expect(startRes.success).toBe(true);

      const stopRes = await audioService.stopRecording();
      expect(stopRes).toBeDefined();
      expect(typeof stopRes.duration).toBe('number');
    });
  });

  // ==============================================================
  // REGRESSION 4: DEPENDENT & NOTIFICATION SERVICES
  // ==============================================================
  describe('Regression 4: Dependent Management & Notification Services', () => {
    it('should request link with dependent senior', async () => {
      const mockLink = { success: true, status: 'pending_approval' };
      client.post.mockResolvedValueOnce({ data: mockLink });

      const res = await dependentService.requestLinkDependent('senior_1', 'Father');
      expect(client.post).toHaveBeenCalledWith('/caregiver/dependents/request-link', {
        elderlyId: 'senior_1',
        relationship: 'Father',
      });
      expect(res).toEqual(mockLink);
    });

    it('should query unread notification count without error', async () => {
      const mockCount = { success: true, count: 4 };
      client.get.mockResolvedValueOnce({ data: mockCount });

      const res = await notificationService.getUnreadCount();
      expect(client.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(res).toEqual(mockCount);
    });
  });
});
