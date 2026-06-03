export const parseTime = (timeStr: string) => {
  const clean = timeStr.trim();
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const ampm = match12[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  }
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return { hours, minutes };
  }
  return { hours: 0, minutes: 0 };
};

export const isCardLive = (card?: { startTime?: string; liveDuration?: number }) => {
  if (!card || !card.startTime) return false;
  try {
    const nowTime = new Date();
    const { hours, minutes } = parseTime(card.startTime);
    const targetTime = new Date(nowTime);
    targetTime.setHours(hours, minutes, 0, 0);
    const diff = targetTime.getTime() - nowTime.getTime();
    if (diff <= 0) {
      const durationMs = (card.liveDuration || 60) * 60 * 1000;
      return Math.abs(diff) < durationMs;
    }
  } catch (e) {
    console.error("Error parsing card status", e);
  }
  return false;
};

export const isMatchLive = (match: any) => {
  if (match.status !== 'live') return false;
  const hasStartTimes = (match.team1?.startTime) || (match.team2?.startTime) || (match.team3?.startTime);
  if (!hasStartTimes) return true;
  return isCardLive(match.team1) || isCardLive(match.team2) || isCardLive(match.team3);
};
