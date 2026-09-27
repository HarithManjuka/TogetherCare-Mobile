// src/__tests__/IT23831254/volunteer_verification_service.test.js
import client from '../../api/client';
import { submitVolunteerVerification } from '../../services/userService';
import { reviewVolunteerVerification } from '../../services/adminUserService';

jest.mock('../../api/client', () => ({
  post: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
}));

describe('IT23831254: Volunteer Verification API Client Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call /auth/volunteer-verification with multipart headers on submit', async () => {
    const mockFormData = new FormData();
    client.post.mockResolvedValueOnce({
      data: {
        status: 'success',
        data: {
          volunteerVerification: { status: 'PENDING' },
        },
      },
    });

    const res = await submitVolunteerVerification(mockFormData);

    expect(client.post).toHaveBeenCalledWith(
      '/auth/volunteer-verification',
      mockFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    expect(res.status).toBe('success');
    expect(res.data.volunteerVerification.status).toBe('PENDING');
  });

  it('should call /admin/users/:id/verify-volunteer with approve action', async () => {
    client.put.mockResolvedValueOnce({
      data: {
        status: 'success',
        message: 'Volunteer verification approved successfully.',
        data: {
          user: {
            volunteerVerification: { status: 'APPROVED' },
            isVolunteerVerified: true,
          },
        },
      },
    });

    const res = await reviewVolunteerVerification('user123', { action: 'approve' });

    expect(client.put).toHaveBeenCalledWith(
      '/admin/users/user123/verify-volunteer',
      {
        action: 'approve',
        rejectionReason: undefined,
      }
    );
    expect(res.status).toBe('success');
  });

  it('should call /admin/users/:id/verify-volunteer with reject action and reason', async () => {
    client.put.mockResolvedValueOnce({
      data: {
        status: 'success',
        message: 'Volunteer verification rejected successfully.',
        data: {
          user: {
            volunteerVerification: { status: 'REJECTED' },
            isVolunteerVerified: false,
          },
        },
      },
    });

    const res = await reviewVolunteerVerification('user456', {
      action: 'reject',
      rejectionReason: 'Blurry photo',
    });

    expect(client.put).toHaveBeenCalledWith(
      '/admin/users/user456/verify-volunteer',
      {
        action: 'reject',
        rejectionReason: 'Blurry photo',
      }
    );
    expect(res.status).toBe('success');
  });
});
