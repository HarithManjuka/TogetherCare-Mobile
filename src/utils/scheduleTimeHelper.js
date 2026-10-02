// src/utils/scheduleTimeHelper.js
/**
 * Utility helper for parsing visit time windows, validating start time frames,
 * and computing live ride/visit status (PickMe / Uber style).
 */

export const parseTimeToHoursMinutes = (tStr) => {
  if (!tStr || typeof tStr !== 'string') return null;
  const clean = tStr.trim();
  const isPM = /pm/i.test(clean);
  const isAM = /am/i.test(clean);
  const numPart = clean.replace(/[^\d:]/g, '').trim();
  const parts = numPart.split(':');
  let hours = parseInt(parts[0], 10);
  let minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  if (isNaN(hours)) return null;
  if (isNaN(minutes)) minutes = 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return { hours, minutes };
};

export const getLocalDateString = (d = new Date()) => {
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getVisitTimeWindow = (item) => {
  if (!item) {
    const now = new Date();
    return {
      startDateTime: now,
      endDateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      dateStr: getLocalDateString(now),
      startStr: 'Now',
      endStr: 'Later',
      isBefore: false,
      isWithin: true,
      isAfter: false,
    };
  }

  // 1. Resolve Year, Month Index, Day (timezone-safe)
  let year, monthIndex, day;
  const rawDateStr = typeof item.scheduledDate === 'string' ? item.scheduledDate : (typeof item.date === 'string' ? item.date : null);

  if (rawDateStr && rawDateStr.toLowerCase() === 'today') {
    const d = new Date();
    year = d.getFullYear();
    monthIndex = d.getMonth();
    day = d.getDate();
  } else if (rawDateStr && /^\d{4}-\d{2}-\d{2}/.test(rawDateStr)) {
    const parts = rawDateStr.split('T')[0].split('-').map(Number);
    year = parts[0];
    monthIndex = parts[1] - 1;
    day = parts[2];
  } else if (item.scheduledDate) {
    const d = new Date(item.scheduledDate);
    if (!isNaN(d.getTime())) {
      year = d.getFullYear();
      monthIndex = d.getMonth();
      day = d.getDate();
    }
  } else if (item.date) {
    const d = new Date(item.date);
    if (!isNaN(d.getTime())) {
      year = d.getFullYear();
      monthIndex = d.getMonth();
      day = d.getDate();
    }
  }

  if (year === undefined) {
    const d = new Date();
    year = d.getFullYear();
    monthIndex = d.getMonth();
    day = d.getDate();
  }

  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // 2. Resolve start & end time strings
  let startStr = item.startTime || '';
  let endStr = item.endTime || '';

  const rawTime = item.timeSlot || item.time || '';
  if (rawTime && (!startStr || !endStr)) {
    const timeTokens = rawTime.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\b/g);
    if (timeTokens && timeTokens.length > 0) {
      if (!startStr) startStr = timeTokens[0];
      if (!endStr && timeTokens.length > 1) endStr = timeTokens[1];
    } else if (rawTime.includes('-')) {
      const parts = rawTime.split('-');
      if (!startStr) startStr = parts[0].trim();
      if (!endStr && parts.length > 1) endStr = parts[1].trim();
    } else if (!startStr) {
      startStr = rawTime.trim();
    }
  }

  const parsedStart = parseTimeToHoursMinutes(startStr) || { hours: 9, minutes: 0 };
  const parsedEnd = parseTimeToHoursMinutes(endStr) || {
    hours: (parsedStart.hours + 2) % 24,
    minutes: parsedStart.minutes,
  };

  const startDateTime = new Date(year, monthIndex, day, parsedStart.hours, parsedStart.minutes, 0, 0);
  let endDateTime = new Date(year, monthIndex, day, parsedEnd.hours, parsedEnd.minutes, 0, 0);

  if (endDateTime <= startDateTime) {
    endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
  }

  // 5 minutes early start window
  const earlyStartDateTime = new Date(startDateTime.getTime() - 5 * 60 * 1000);

  const now = new Date();
  const isBefore = now < startDateTime;
  const isWithin = now >= startDateTime && now <= endDateTime;
  const isAfter = now > endDateTime;
  const isEarlyStartAllowed = now >= earlyStartDateTime;

  return {
    startDateTime,
    endDateTime,
    earlyStartDateTime,
    dateStr,
    startStr: startStr || '09:00 AM',
    endStr: endStr || '11:00 AM',
    isBefore,
    isWithin,
    isAfter,
    isEarlyStartAllowed,
  };
};

/**
 * Calculates live PickMe / Uber style status considering both stored database status
 * and exact schedule time window:
 * - Before exact start time (now < startDateTime): 'upcoming' (unless manually started).
 * - Exact start time (now >= startDateTime && now < endDateTime): automatically starts to 'ongoing'.
 * - Exact end time (now >= endDateTime): automatically completes to 'completed'.
 */
export const getVisitLiveStatus = (item) => {
  if (!item) return 'pending';
  const rawStatus = (item.status || 'pending').toLowerCase();

  if (rawStatus === 'cancelled') return 'cancelled';
  if (rawStatus === 'completed') return 'completed';

  const { isWithin, isAfter, dateStr } = getVisitTimeWindow(item);
  const todayStr = getLocalDateString(new Date());
  const isPastDay = dateStr < todayStr;

  // If request is still unaccepted (pending / searching):
  // Only mark expired if the date is strictly in the past
  if (rawStatus === 'pending' || rawStatus === 'searching') {
    if (isPastDay && isAfter) {
      return 'expired';
    }
    return 'pending';
  }

  // 1. If visit was explicitly started / ongoing / arrived:
  if (['ongoing', 'arrived', 'in_progress'].includes(rawStatus)) {
    if (isPastDay && isAfter) {
      return 'completed';
    }
    return rawStatus === 'arrived' ? 'arrived' : 'ongoing';
  }

  // 2. If visit is accepted / scheduled / confirmed:
  if (['accepted', 'scheduled', 'confirmed'].includes(rawStatus)) {
    if (isPastDay && isAfter) {
      return 'completed';
    }
    if (isWithin || isAfter) {
      // For today, if it reached start time, move to ongoing
      return 'ongoing';
    }
    // Before start time -> upcoming
    return 'upcoming';
  }

  return rawStatus;
};

/**
 * Validates if the visit can be started manually right now (allowed from 5 mins before start time).
 */
export const validateStartVisit = (item) => {
  const windowInfo = getVisitTimeWindow(item);
  const now = new Date();

  if (now < windowInfo.earlyStartDateTime) {
    return {
      allowed: false,
      reason: `This visit is scheduled for ${windowInfo.dateStr} at ${windowInfo.startStr}. You can start this visit up to 5 minutes before the scheduled start time.`,
      windowInfo,
    };
  }

  return {
    allowed: true,
    windowInfo,
  };
};

/**
 * Checks client-side if a candidate schedule overlaps with any active schedule in a list.
 * @param {Object} candidate - { scheduledDate / date, startTime, endTime, timeSlot }
 * @param {Array} activeList - List of existing schedule/request objects
 * @param {string} [excludeId] - ID of schedule being updated
 * @returns {{ hasConflict: boolean, conflictingSchedule?: Object, message?: string }}
 */
export const checkClientScheduleOverlap = (candidate, activeList = [], excludeId = null) => {
  if (!candidate || !Array.isArray(activeList) || activeList.length === 0) {
    return { hasConflict: false };
  }

  const candidateWindow = getVisitTimeWindow(candidate);
  const now = new Date();
  const excludeIdStr = excludeId ? String(excludeId) : null;

  for (const existing of activeList) {
    if (!existing) continue;

    if (excludeIdStr && existing._id && String(existing._id) === excludeIdStr) {
      continue;
    }

    const liveStatus = getVisitLiveStatus(existing);
    if (['cancelled', 'completed', 'expired', 'outdated', 'rejected'].includes(liveStatus)) {
      continue;
    }

    const existingWindow = getVisitTimeWindow(existing);

    // If existing request is unaccepted and in the past, skip
    if (['pending', 'searching'].includes(liveStatus) && now >= existingWindow.endDateTime) {
      continue;
    }

    // Compare date strings
    if (candidateWindow.dateStr === existingWindow.dateStr) {
      const startA = candidateWindow.startDateTime.getTime();
      const endA = candidateWindow.endDateTime.getTime();
      const startB = existingWindow.startDateTime.getTime();
      const endB = existingWindow.endDateTime.getTime();

      // Check overlap: (startA < endB && startB < endA)
      if (startA < endB && startB < endA) {
        const activityTitle = existing.activityType || existing.serviceType || 'Visit';
        const existingTime = existing.timeSlot || `${existingWindow.startStr} - ${existingWindow.endStr}`;
        const existingStatusLabel = liveStatus === 'pending' ? 'pending request' : 'scheduled visit';

        return {
          hasConflict: true,
          conflictingSchedule: existing,
          message: `Schedule conflict: You already have a ${existingStatusLabel} for "${activityTitle}" on ${candidateWindow.dateStr} at ${existingTime} that overlaps with this time.`,
        };
      }
    }
  }

  return { hasConflict: false };
};
