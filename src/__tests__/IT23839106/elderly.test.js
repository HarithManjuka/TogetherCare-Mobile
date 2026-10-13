jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

import { rateVisit } from '../../services/companionshipService';
import client from '../../api/client';

describe('IT23839106: Elderly Visit & Volunteer Rating Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully submit both visit and volunteer ratings with reviews', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Rating submitted successfully!',
        data: {
          _id: 'sched-123',
          visitRating: 5,
          visitReview: 'Wonderful conversation and walk in the garden.',
          volunteerRating: 5,
          volunteerReview: 'Very polite and attentive young volunteer.',
          ratedAt: new Date().toISOString(),
        },
      },
    };

    client.post.mockResolvedValueOnce(mockResponse);

    const payload = {
      visitRating: 5,
      visitReview: 'Wonderful conversation and walk in the garden.',
      volunteerRating: 5,
      volunteerReview: 'Very polite and attentive young volunteer.',
    };

    const result = await rateVisit('sched-123', payload);

    expect(client.post).toHaveBeenCalledWith('/companionship/sched-123/rate', payload);
    expect(result.success).toBe(true);
    expect(result.data.visitRating).toBe(5);
    expect(result.data.volunteerRating).toBe(5);
  });

  it('should support rating ONLY the visit and skipping volunteer rating', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Rating submitted successfully!',
        data: {
          _id: 'sched-456',
          visitRating: 4,
          visitReview: 'Good visit overall.',
          volunteerRating: null,
          volunteerReview: '',
        },
      },
    };

    client.post.mockResolvedValueOnce(mockResponse);

    const payload = {
      visitRating: 4,
      visitReview: 'Good visit overall.',
      volunteerRating: 0,
      volunteerReview: '',
    };

    const result = await rateVisit('sched-456', payload);

    expect(client.post).toHaveBeenCalledWith('/companionship/sched-456/rate', payload);
    expect(result.success).toBe(true);
    expect(result.data.visitRating).toBe(4);
    expect(result.data.volunteerRating).toBeNull();
  });

  it('should support rating ONLY the volunteer and skipping visit rating', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Rating submitted successfully!',
        data: {
          _id: 'sched-789',
          visitRating: null,
          visitReview: '',
          volunteerRating: 5,
          volunteerReview: 'Exceptional volunteer, highly recommended!',
        },
      },
    };

    client.post.mockResolvedValueOnce(mockResponse);

    const payload = {
      visitRating: 0,
      visitReview: '',
      volunteerRating: 5,
      volunteerReview: 'Exceptional volunteer, highly recommended!',
    };

    const result = await rateVisit('sched-789', payload);

    expect(client.post).toHaveBeenCalledWith('/companionship/sched-789/rate', payload);
    expect(result.success).toBe(true);
    expect(result.data.volunteerRating).toBe(5);
  });
});

