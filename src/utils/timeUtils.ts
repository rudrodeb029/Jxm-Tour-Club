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

export const getCardStatus = (
  card: { startTime?: string; liveDuration?: number } | undefined,
  matchStatus: string | undefined
): 'live' | 'upcoming' | 'finished' | 'idle' => {
  if (!card) return 'idle';
  const mStatus = matchStatus || 'upcoming';
  if (mStatus === 'finished') return 'finished';
  if (mStatus === 'upcoming') return 'upcoming';
  if (!card.startTime) return mStatus === 'live' ? 'live' : 'idle';

  try {
    const nowTime = new Date();
    const { hours, minutes, seconds } = parseTime(card.startTime);
    let targetTime = new Date(nowTime);
    targetTime.setHours(hours, minutes, seconds, 0);

    let diff = targetTime.getTime() - nowTime.getTime();

    if (mStatus === 'live') {
      if (diff > 0) return 'upcoming';
      const durationMs = (card.liveDuration || 60) * 60 * 1000;
      if (Math.abs(diff) >= durationMs) return 'finished';
      return 'live';
    }
  } catch (e) {
    console.error("Error computing card status", e);
  }

  return 'upcoming';
};

export const isCardLive = (card?: { startTime?: string; liveDuration?: number }, matchStatus?: string) => {
  if (!card || !card.startTime) return false;
  return getCardStatus(card, matchStatus || 'live') === 'live';
};

export const isMatchLive = (match: any) => {
  if (match.status !== 'live') return false;
  const hasStartTimes = (match.team1?.startTime) || (match.team2?.startTime) || (match.team3?.startTime);
  if (!hasStartTimes) return true;
  return isCardLive(match.team1, match.status) || isCardLive(match.team2, match.status) || isCardLive(match.team3, match.status);
};

