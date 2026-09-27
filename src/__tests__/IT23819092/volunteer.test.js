// src/__tests__/IT23819092/volunteer.test.js
import * as volunteerService from '../../services/volunteerService';
import client from '../../api/client';

jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: (props) => React.createElement('Ionicons', props),
    MaterialCommunityIcons: (props) => React.createElement('MaterialCommunityIcons', props),
    FontAwesome5: (props) => React.createElement('FontAwesome5', props),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'vol-1', firstName: 'Sarah', role: 'volunteer', address: { city: 'Colombo' } },
  }),
}));



describe('IT23819092: Volunteer Mobile Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Volunteer Availability Offers CRUD', () => {
    it('fetches logged-in volunteer offers via getMyOffers()', async () => {
      const mockOffers = [
        { _id: 'off-1', services: ['Grocery Pickup'], date: '2026-09-20', slotsLeft: 2 },
      ];
      client.get.mockResolvedValueOnce({ data: { success: true, data: mockOffers } });

      const result = await volunteerService.getMyOffers();
      expect(client.get).toHaveBeenCalledWith('/volunteer-offers/my-offers');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].services).toContain('Grocery Pickup');
    });

    it('creates an offer via createOffer()', async () => {
      const payload = {
        services: ['Pharmacy Run'],
        date: '2026-09-22',
        startTime: '02:00 PM',
        endTime: '04:00 PM',
        serviceArea: 'Colombo 03',
        capacity: 3,
      };
      client.post.mockResolvedValueOnce({ data: { success: true, message: 'Offer posted' } });

      const result = await volunteerService.createOffer(payload);
      expect(client.post).toHaveBeenCalledWith('/volunteer-offers', payload);
      expect(result.success).toBe(true);
    });

    it('updates an existing offer via updateOffer()', async () => {
      const updateData = { capacity: 4, radius: 'Within 10 km' };
      client.put.mockResolvedValueOnce({ data: { success: true, message: 'Offer updated' } });

      const result = await volunteerService.updateOffer('off-123', updateData);
      expect(client.put).toHaveBeenCalledWith('/volunteer-offers/off-123', updateData);
      expect(result.success).toBe(true);
    });

    it('deletes an offer via deleteOffer()', async () => {
      client.delete.mockResolvedValueOnce({ data: { success: true, message: 'Offer deleted' } });

      const result = await volunteerService.deleteOffer('off-123');
      expect(client.delete).toHaveBeenCalledWith('/volunteer-offers/off-123');
      expect(result.success).toBe(true);
    });
  });

  describe('Community Tasks & Bidding / Accepting Workflow', () => {
    it('fetches available requests with category filter', async () => {
      client.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: [{ id: 'req-1', type: 'Grocery Assistance', elderName: 'Mrs. Perera' }],
        },
      });

      const result = await volunteerService.getAvailableRequests('Grocery');
      expect(client.get).toHaveBeenCalledWith('/volunteer-offers/available-requests', {
        params: { category: 'Grocery' },
      });
      expect(result.data[0].elderName).toBe('Mrs. Perera');
    });

    it('accepts a community request via acceptRequest()', async () => {
      client.post.mockResolvedValueOnce({
        data: { success: true, message: 'Request accepted successfully!' },
      });

      const result = await volunteerService.acceptRequest('req-999');
      expect(client.post).toHaveBeenCalledWith('/volunteer-offers/requests/req-999/accept');
      expect(result.success).toBe(true);
    });
  });

  describe('Volunteer Schedule & Status Updates', () => {
    it('fetches volunteer schedule via getMySchedule()', async () => {
      const mockSchedule = [
        { id: 'sch-1', serviceType: 'Grocery Assistance', status: 'confirmed' },
      ];
      client.get.mockResolvedValueOnce({ data: { success: true, data: mockSchedule } });

      const result = await volunteerService.getMySchedule();
      expect(client.get).toHaveBeenCalledWith('/volunteer-offers/my-schedule');
      expect(result.data).toHaveLength(1);
    });

    it('updates task status to arrived and completed via updateTaskStatus()', async () => {
      client.put.mockResolvedValueOnce({ data: { success: true, message: 'Task status updated to arrived' } });

      const arrivedRes = await volunteerService.updateTaskStatus('task-100', 'arrived');
      expect(client.put).toHaveBeenCalledWith('/volunteer-offers/tasks/task-100/status', {
        status: 'arrived',
      });
      expect(arrivedRes.success).toBe(true);

      client.put.mockResolvedValueOnce({ data: { success: true, message: 'Task status updated to completed' } });
      const completedRes = await volunteerService.updateTaskStatus('task-100', 'completed');
      expect(client.put).toHaveBeenCalledWith('/volunteer-offers/tasks/task-100/status', {
        status: 'completed',
      });
      expect(completedRes.success).toBe(true);
    });
  });

  describe('Volunteer History & Impact Statistics', () => {
    it('fetches completed history via getMyHistory()', async () => {
      client.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: [{ id: 'hist-1', service: 'Grocery Run', rating: 5 }],
        },
      });

      const result = await volunteerService.getMyHistory();
      expect(client.get).toHaveBeenCalledWith('/volunteer-offers/my-history');
      expect(result.data[0].rating).toBe(5);
    });

    it('fetches live impact stats via getMyStats()', async () => {
      const mockStats = {
        hoursThisMonth: 12,
        peopleHelped: 4,
        averageRating: 4.9,
      };
      client.get.mockResolvedValueOnce({ data: { success: true, data: mockStats } });

      const result = await volunteerService.getMyStats();
      expect(client.get).toHaveBeenCalledWith('/volunteer-offers/my-stats');
      expect(result.data.hoursThisMonth).toBe(12);
      expect(result.data.peopleHelped).toBe(4);
    });
  });

  describe('Volunteer UI Screens Integrity', () => {
    it('exports all volunteer screens properly as valid components', () => {
      const VolunteerHomeScreen = require('../../screens/volunteer/VolunteerHomeScreen').default;
      const VolunteerDashboardHome = require('../../screens/volunteer/VolunteerDashboardHome').default;
      const VolunteerRequestsScreen = require('../../screens/volunteer/VolunteerRequestsScreen').default;
      const VolunteerScheduleScreen = require('../../screens/volunteer/VolunteerScheduleScreen').default;
      const VolunteerHistoryScreen = require('../../screens/volunteer/VolunteerHistoryScreen').default;

      expect(typeof VolunteerHomeScreen).toBe('function');
      expect(typeof VolunteerDashboardHome).toBe('function');
      expect(typeof VolunteerRequestsScreen).toBe('function');
      expect(typeof VolunteerScheduleScreen).toBe('function');
      expect(typeof VolunteerHistoryScreen).toBe('function');
    });
  });
});
