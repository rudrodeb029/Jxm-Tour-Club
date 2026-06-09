export const parseTime = (timeStr: string) => {
  const clean = timeStr.trim();
  
  // 1. Matches 12-hour format with or without seconds, e.g. "09:42:13 PM", "9:42 PM", "09:42:13PM", "9:42:13 AM"
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const seconds = match12[3] ? parseInt(match12[3], 10) : 0;
    const ampm = match12[4].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return { hours, minutes, seconds };
  }
  
  // 2. Matches 24-hour format with or without seconds, e.g. "21:42:13", "20:00", "09:42:00"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    const seconds = match24[3] ? parseInt(match24[3], 10) : 0;
    return { hours, minutes, seconds };
  }
  
  return { hours: 0, minutes: 0, seconds: 0 };
};

export const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return '';
  const { hours, minutes, seconds } = parseTime(timeStr);
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
};

export const to24hTime = (timeStr: string | undefined) => {
  if (!timeStr) return '';
  const { hours, minutes, seconds } = parseTime(timeStr);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const getTargetDateTime = (startTimeStr: string, now = new Date()): Date => {
  const { hours, minutes, seconds } = parseTime(startTimeStr);
  
  // Try today
  const todayTarget = new Date(now);
  todayTarget.setHours(hours, minutes, seconds, 0);
  
  // Try yesterday
  const yesterdayTarget = new Date(todayTarget);
  yesterdayTarget.setDate(yesterdayTarget.getDate() - 1);
  
  // Try tomorrow
  const tomorrowTarget = new Date(todayTarget);
  tomorrowTarget.setDate(tomorrowTarget.getDate() + 1);
  
  const diffToday = todayTarget.getTime() - now.getTime();
  
  if (diffToday <= 0) {
    // Today's target has passed. If elapsed time is less than 12 hours, assume it was today's match.
    // Otherwise, it represents tomorrow's upcoming match.
    if (Math.abs(diffToday) < 12 * 60 * 60 * 1000) {
      return todayTarget;
    } else {
      return tomorrowTarget;
    }
  } else {
    // Today's target is in the future. If it starts in less than 18 hours, assume it is today's match.
    // Otherwise, assume it was yesterday's match.
    if (diffToday < 18 * 60 * 60 * 1000) {
      return todayTarget;
    } else {
      return yesterdayTarget;
    }
  }
};

export const getCardStatus = (
  card: { startTime?: string; liveDuration?: number } | undefined,
  matchStatus: string | undefined
): 'live' | 'upcoming' | 'finished' | 'idle' => {
  if (!card) return 'idle';
  const mStatus = matchStatus || 'upcoming';
  if (mStatus === 'finished') return 'finished';
  if (!card.startTime) return mStatus === 'live' ? 'live' : 'idle';

  try {
    const nowTime = new Date();
    const targetTime = getTargetDateTime(card.startTime, nowTime);
    const diff = targetTime.getTime() - nowTime.getTime();

    if (diff <= 0) {
      const durationMs = (Number(card.liveDuration) || 60) * 60 * 1000;
      if (Math.abs(diff) >= durationMs) return 'finished';
      return 'live';
    } else {
      return 'upcoming';
    }
  } catch (e) {
    console.error("Error computing card status", e);
  }

  return 'upcoming';
};

export const getEffectiveMatchStatus = (match: any): 'live' | 'upcoming' | 'finished' => {
  if (!match) return 'upcoming';
  if (match.status === 'finished') return 'finished';

  const cards = match.innerSections || [];
  if (cards.length > 0) {
    const cardStatuses = cards.map((c: any) => getCardStatus(c, match.status));
    if (cardStatuses.includes('live')) return 'live';
    if (cardStatuses.every((s: any) => s === 'finished')) return 'finished';
    if (cardStatuses.includes('upcoming')) return 'upcoming';
  } else {
    const teams = [match.team1, match.team2, match.team3].filter(Boolean);
    if (teams.length > 0) {
      const cardStatuses = teams.map((c: any) => getCardStatus(c, match.status));
      if (cardStatuses.includes('live')) return 'live';
      if (cardStatuses.every((s: any) => s === 'finished')) return 'finished';
      if (cardStatuses.includes('upcoming')) return 'upcoming';
    }
  }

  const matchTimeStr = match.time;
  if (!matchTimeStr) return match.status || 'upcoming';

  try {
    const nowTime = new Date();
    const targetTime = getTargetDateTime(matchTimeStr, nowTime);
    const diff = targetTime.getTime() - nowTime.getTime();

    if (diff <= 0) {
      if (match.status !== 'live') {
        return 'finished';
      } else {
        const d1 = Number(match.team1?.liveDuration) || 60;
        const d2 = Number(match.team2?.liveDuration) || 60;
        const d3 = Number(match.team3?.liveDuration) || 60;
        const maxDurationMins = Math.max(d1, d2, d3);
        const durationMs = maxDurationMins * 60 * 1000;
        if (Math.abs(diff) >= durationMs) return 'finished';
        return 'live';
      }
    } else {
      return 'upcoming';
    }
  } catch (e) {
    console.error("Error computing effective match status", e);
  }

  return match.status || 'upcoming';
};

export const isCardLive = (card?: { startTime?: string; liveDuration?: number }, matchStatus?: string) => {
  if (!card || !card.startTime) return false;
  return getCardStatus(card, matchStatus || 'live') === 'live';
};

export const isMatchLive = (match: any) => {
  return getEffectiveMatchStatus(match) === 'live';
};


