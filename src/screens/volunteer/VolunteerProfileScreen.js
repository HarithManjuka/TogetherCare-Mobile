// src/screens/volunteer/VolunteerProfileScreen.js
import React from 'react';
import ProfileScreen from '../auth/ProfileScreen';

/**
 * Volunteer Profile Tab Screen
 * Reuses default ProfileScreen enriched with volunteer specific controls:
 * Availability Status, Alert & Notification Settings, Guidelines & Helpline Support.
 */
export default function VolunteerProfileScreen(props) {
  return <ProfileScreen {...props} />;
}
