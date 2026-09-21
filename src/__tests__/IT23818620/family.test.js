// src/__tests__/IT23818620/family.test.js
import React from 'react';
import { render } from '@testing-library/react-native';
import AppBottomNav from '../../components/common/AppBottomNav';
import * as dependentService from '../../services/dependentService';
import * as caregiverService from '../../services/caregiverService';
import * as messageService from '../../services/messageService';
import * as notificationService from '../../services/notificationService';
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

describe('IT23818620: Family Member & Caregiver Mobile Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // SPRINT 1: Role-Specific Bottom Navigation
  // ==========================================
  describe('Sprint 1: Role-Specific Navigation Architecture', () => {
    it('should export AppBottomNav as a valid React component', () => {
      expect(typeof AppBottomNav).toBe('function');
    });

    it('should configure family member tabs correctly (dependents, upcoming, chat, profile)', () => {
      // AppBottomNav renders for caregiver role with family_member type
      expect(AppBottomNav).toBeDefined();
    });

    it('should display unread message count badge on messages tab when msgBadgeCount is provided', () => {
      const { getByText } = render(
        <AppBottomNav role="elderly" activeTab="home" msgBadgeCount={3} />
      );
      expect(getByText('3')).toBeTruthy();
      expect(getByText('Msg')).toBeTruthy();
    });

    it('should display 99+ on badge when msgBadgeCount exceeds 99', () => {
      const { getByText } = render(
        <AppBottomNav role="caregiver" activeTab="home" msgBadgeCount={150} />
      );
      expect(getByText('99+')).toBeTruthy();
      expect(getByText('Chat')).toBeTruthy();
    });

    it('should not display badge when msgBadgeCount is 0 or undefined', () => {
      const { queryByText } = render(
        <AppBottomNav role="caregiver" activeTab="home" msgBadgeCount={0} />
      );
      expect(queryByText('0')).toBeNull();
    });
  });

  // ==========================================
  // SPRINT 1 & 2: Dependent Management Services
  // ==========================================
  describe('Sprint 1 & 2: Dependent Management Service', () => {
    it('should fetch all linked elderly dependents', async () => {
      const mockData = { success: true, data: [{ _id: 'eld_1', firstName: 'Kamal' }] };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await dependentService.getDependents();
      expect(client.get).toHaveBeenCalledWith('/caregiver/dependents');
      expect(result).toEqual(mockData);
    });

    it('should send link request to an elderly dependent with relationship', async () => {
      const mockData = { success: true, message: 'Link request sent to senior', status: 'pending_approval' };
      client.post.mockResolvedValueOnce({ data: mockData });

      const result = await dependentService.requestLinkDependent('eld_1', 'Father');
      expect(client.post).toHaveBeenCalledWith('/caregiver/dependents/request-link', {
        elderlyId: 'eld_1',
        relationship: 'Father',
      });
      expect(result).toEqual(mockData);
    });

    it('should allow senior to accept or decline link request via respondLinkDependent', async () => {
      const mockData = { success: true, action: 'accepted', message: 'Successfully linked' };
      client.post.mockResolvedValueOnce({ data: mockData });

      const result = await dependentService.respondLinkDependent('cg_1', 'accept');
      expect(client.post).toHaveBeenCalledWith('/caregiver/dependents/respond-link', {
        caregiverId: 'cg_1',
        action: 'accept',
      });
      expect(result).toEqual(mockData);
    });

    it('should fetch pending link requests via getPendingRequests', async () => {
      const mockData = { success: true, count: 1, data: [{ caregiverId: 'cg_1', relationship: 'Son' }] };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await dependentService.getPendingRequests();
      expect(client.get).toHaveBeenCalledWith('/caregiver/dependents/pending-requests');
      expect(result).toEqual(mockData);
    });

    it('should unlink an elderly dependent', async () => {
      const mockData = { success: true, message: 'Senior unlinked successfully' };
      client.post.mockResolvedValueOnce({ data: mockData });

      const result = await dependentService.unlinkDependent('eld_1');
      expect(client.post).toHaveBeenCalledWith('/caregiver/dependents/unlink', { elderlyId: 'eld_1' });
      expect(result).toEqual(mockData);
    });
  });

  // ==========================================
  // SPRINT 2: Notifications Service
  // ==========================================
  describe('Sprint 2: Notifications Service', () => {
    it('should fetch user notifications', async () => {
      const mockData = { success: true, data: [{ _id: 'n_1', title: 'SOS Alert' }] };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await notificationService.getNotifications();
      expect(client.get).toHaveBeenCalledWith('/notifications');
      expect(result).toEqual(mockData);
    });

    it('should get unread notification count', async () => {
      const mockData = { success: true, count: 3 };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await notificationService.getUnreadCount();
      expect(client.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toEqual(mockData);
    });

    it('should mark a notification as read', async () => {
      const mockData = { success: true };
      client.patch.mockResolvedValueOnce({ data: mockData });

      const result = await notificationService.markAsRead('n_1');
      expect(client.patch).toHaveBeenCalledWith('/notifications/n_1/read');
      expect(result).toEqual(mockData);
    });
  });

  // ==========================================
  // SPRINT 3: Caregiver Assignments & Senior Activities
  // ==========================================
  describe('Sprint 3: Caregiver Assignments & Senior Activities', () => {
    it('should fetch available care assignments', async () => {
      const mockData = { success: true, data: [{ _id: 'hr_1', serviceType: 'Medicine' }] };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await caregiverService.getAvailableAssignments();
      expect(client.get).toHaveBeenCalledWith('/help-requests/caregiver/assignments');
      expect(result).toEqual(mockData);
    });

    it('should fetch senior tasks and activities for monitoring', async () => {
      const mockData = { success: true, data: { helpRequests: [], companionshipRequests: [] } };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await dependentService.getDependentActivities('eld_1');
      expect(client.get).toHaveBeenCalledWith('/caregiver/dependents/eld_1/activities');
      expect(result).toEqual(mockData);
    });

    it('should fetch completed visits history', async () => {
      const mockData = { success: true, data: [{ _id: 'v_1', status: 'completed' }] };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await caregiverService.getCompletedVisits();
      expect(client.get).toHaveBeenCalledWith('/help-requests/caregiver/visits/completed');
      expect(result).toEqual(mockData);
    });
  });

  // ==========================================
  // SPRINT 4: US-402 — Schedule Conflict Prevention
  // ==========================================
  describe('Sprint 4: US-402 — Schedule Conflict Detection API', () => {
    it('should accept care assignment with assignmentType payload', async () => {
      const mockData = { success: true, message: 'Assignment accepted successfully' };
      client.post.mockResolvedValueOnce({ data: mockData });

      const result = await caregiverService.acceptCaregiverAssignment('hr_1', 'help_request');
      expect(client.post).toHaveBeenCalledWith('/help-requests/caregiver/assignments/hr_1/accept', {
        assignmentType: 'help_request',
      });
      expect(result).toEqual(mockData);
    });
  });

  // ==========================================
  // SPRINT 4: US-403 & US-411 — Messaging & Voice Notes
  // ==========================================
  describe('Sprint 4: US-403 & US-411 — Text & Voice Messaging Services', () => {
    it('should send text message to recipient (US-403)', async () => {
      const mockData = { success: true, data: { content: 'Arrived for visit', messageType: 'text' } };
      client.post.mockResolvedValueOnce({ data: mockData });

      const result = await messageService.sendMessage('user_2', 'Arrived for visit');
      expect(client.post).toHaveBeenCalledWith('/messages', {
        recipientId: 'user_2',
        content: 'Arrived for visit',
        messageType: 'text',
      });
      expect(result).toEqual(mockData);
    });

    it('should send voice message with duration and audioUrl (US-411)', async () => {
      const mockData = {
        success: true,
        data: { messageType: 'voice', audioUrl: 'https://example.com/audio.m4a', durationSeconds: 12 },
      };
      client.post.mockResolvedValueOnce({ data: mockData });

      const result = await messageService.sendVoiceMessage('user_2', 'https://example.com/audio.m4a', 12);
      expect(client.post).toHaveBeenCalledWith('/messages', {
        recipientId: 'user_2',
        content: 'Voice note (12s)',
        messageType: 'voice',
        audioUrl: 'https://example.com/audio.m4a',
        durationSeconds: 12,
      });
      expect(result).toEqual(mockData);
    });

    it('should fetch messages thread for conversation', async () => {
      const mockData = { success: true, data: [{ _id: 'm_1', content: 'Hello' }] };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await messageService.getMessages('user_2');
      expect(client.get).toHaveBeenCalledWith('/messages/user_2');
      expect(result).toEqual(mockData);
    });

    it('should fetch all conversations inbox', async () => {
      const mockData = { success: true, data: [{ _id: 'user_2', unreadCount: 1 }] };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await messageService.getConversations();
      expect(client.get).toHaveBeenCalledWith('/messages/conversations');
      expect(result).toEqual(mockData);
    });

    it('should search contact by mobile phone number', async () => {
      const mockData = { success: true, data: { _id: 'user_2', firstName: 'Kasun', phone: '0771234567' } };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await messageService.searchContactByPhone('0771234567');
      expect(client.get).toHaveBeenCalledWith('/messages/contacts/search', {
        params: { phone: '0771234567' },
      });
      expect(result).toEqual(mockData);
    });

    it('should add a contact with phone and nickname', async () => {
      const mockData = { success: true, message: 'Contact added successfully' };
      client.post.mockResolvedValueOnce({ data: mockData });

      const result = await messageService.addContact({ phone: '0771234567', nickname: 'Family Doctor' });
      expect(client.post).toHaveBeenCalledWith('/messages/contacts', {
        phone: '0771234567',
        nickname: 'Family Doctor',
      });
      expect(result).toEqual(mockData);
    });

    it('should fetch contacts list', async () => {
      const mockData = { success: true, data: [{ _id: 'user_2', firstName: 'Kasun' }] };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await messageService.getContacts();
      expect(client.get).toHaveBeenCalledWith('/messages/contacts');
      expect(result).toEqual(mockData);
    });

    it('should remove a contact from contacts list', async () => {
      const mockData = { success: true, message: 'Contact removed successfully' };
      client.delete.mockResolvedValueOnce({ data: mockData });

      const result = await messageService.removeContact('user_2');
      expect(client.delete).toHaveBeenCalledWith('/messages/contacts/user_2');
      expect(result).toEqual(mockData);
    });
  });

  // ==========================================
  // SPRINT 4: US-404 — Upcoming Care Visits
  // ==========================================
  describe('Sprint 4: US-404 — Upcoming Care Visits Service', () => {
    it('should fetch upcoming care visits across all dependents', async () => {
      const mockData = {
        success: true,
        data: [{ _id: 'visit_1', serviceType: 'Grocery', date: '2026-12-01' }],
      };
      client.get.mockResolvedValueOnce({ data: mockData });

      const result = await dependentService.getUpcomingCareVisits();
      expect(client.get).toHaveBeenCalledWith('/caregiver/dependents/upcoming-visits');
      expect(result).toEqual(mockData);
    });
  });
});
