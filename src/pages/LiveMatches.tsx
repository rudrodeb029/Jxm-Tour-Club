import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useAdmin } from '../context/AdminContext';
import { parseTime, formatTime, getTargetDateTime } from '../utils/timeUtils';
import { useLanguage } from '../context/LanguageContext';

const getTimeInfo = (startTimeStr: string | undefined, durationMins: number | undefined, now: number, matchStatus?: string, t?: any, language?: string) => {
  const liveDurationMins = durationMins || 60;
  const liveDurationMs = liveDurationMins * 60 * 1000;
  const nowTime = new Date(now);

  if (!startTimeStr) {
    return {
      isLive: false,
      statusText: t ? t('idle') : 'IDLE',
      displayTime: 'N/A',
      elapsedStr: '',
      remainingStr: '',
      endTimeStr: '',
      isOver: false,
      isIdle: true
    };
  }

  const targetTime = getTargetDateTime(startTimeStr, nowTime);

  let diff = targetTime.getTime() - nowTime.getTime();

  const end = new Date(targetTime.getTime() + liveDurationMs);
  const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  if (diff > 0) {
    // Upcoming
    const diffMins = Math.floor(diff / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    
    let startsInStr = '';
    if (diffHrs > 0) {
      startsInStr = language === 'bn' ? `শুরু হবে: ${diffHrs}ঘণ্টা ${remainingMins}মিনিট` : `Starts in: ${diffHrs}h ${remainingMins}m`;
    } else {
      startsInStr = language === 'bn' ? `শুরু হবে: ${diffMins}মিনিট` : `Starts in: ${diffMins}m`;
    }

    return {
      isLive: false,
      statusText: t ? t('upcoming') : 'UPCOMING',
      displayTime: language === 'bn' ? `শুরু হবে: ${formatTime(startTimeStr)}` : `Starts at: ${formatTime(startTimeStr)}`,
      elapsedStr: startsInStr,
      remainingStr: startsInStr,
      endTimeStr: language === 'bn' ? `শেষ হবে: ${endTimeStr}` : `Ends at: ${endTimeStr}`,
      isOver: false
    };
  } else {
    // Scheduled time has passed (diff <= 0)
    if (Math.abs(diff) < liveDurationMs) {
      // Admin started or automated time makes it live
      const elapsedMs = Math.abs(diff);
      const remainingMs = liveDurationMs - elapsedMs;

      const elapsedMins = Math.floor(elapsedMs / 60000);
      const elapsedSecs = Math.floor((elapsedMs % 60000) / 1000);
      const remainingMins = Math.floor(remainingMs / 60000);
      const remainingSecs = Math.floor((remainingMs % 60000) / 1000);

      const elapsedStr = language === 'bn' 
        ? `${elapsedMins}:${elapsedSecs.toString().padStart(2, '0')} অতিবাহিত`
        : `${elapsedMins}:${elapsedSecs.toString().padStart(2, '0')} Elapsed`;
      const remainingStr = language === 'bn'
        ? `${remainingMins}:${remainingSecs.toString().padStart(2, '0')} বাকি`
        : `${remainingMins}:${remainingSecs.toString().padStart(2, '0')} Remaining`;

      return {
        isLive: true,
        statusText: t ? t('live') : 'LIVE',
        displayTime: language === 'bn' ? `শুরু হবে: ${formatTime(startTimeStr)}` : `Starts at: ${formatTime(startTimeStr)}`,
        elapsedStr,
        remainingStr,
        endTimeStr: language === 'bn' ? `শেষ হবে: ${endTimeStr}` : `Ends at: ${endTimeStr}`,
        isOver: false
      };
    } else {
      // Live duration has passed, so it has ended
      return {
        isLive: false,
        statusText: t ? t('completed') : 'ENDED',
        displayTime: language === 'bn' ? `শুরু হয়েছিল: ${formatTime(startTimeStr)}` : `Started: ${formatTime(startTimeStr)}`,
        elapsedStr: language === 'bn' ? 'ম্যাচ সমাপ্ত' : 'Match Ended',
        remainingStr: language === 'bn' ? 'ম্যাচ সমাপ্ত' : 'Match Ended',
        endTimeStr: language === 'bn' ? `শেষ হয়েছে: ${endTimeStr}` : `Ended at: ${endTimeStr}`,
        isOver: true
      };
    }
  }
};

const LiveMatches = () => {
  const navigate = useNavigate();
  const { adminMatches } = useAdminDashboard();
  const { isAdminMode } = useAdmin();
  const [now, setNow] = useState(Date.now());
  const { t, language } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const liveTeams = adminMatches
    .filter(m => m.status !== 'finished')
    .flatMap((match) => {
      const teams: any[] = [];
      const baseInfo = {
        matchId: match.id,
        matchName: match.name,
        liveStartedAt: match.liveStartedAt,
        score: match.score,
        time: match.time,
        currentParticipants: match.participantIds ? match.participantIds.length : (match.currentParticipants || 0),
        maxParticipants: match.maxParticipants
      };

      const innerCards = match.innerSections || [];
      if (innerCards.length > 0) {
        innerCards.forEach((card: any) => {
          // Stricter filtering:
          // 1. Must not be deleted or concluded
          // 2. Must have a start time
          // 3. Must be for TODAY or in the FUTURE (filter out yesterday's ghosts)
          const isTodayOrFuture = !card.startDate || card.startDate >= todayStr;

          if (!card.isDeleted && !card.isConcluded && card.startTime && isTodayOrFuture) {
            teams.push({
              ...card,
              ...baseInfo,
              startTime: card.startTime,
              liveDuration: card.liveDuration || 60,
              participantCount: card.participantIds ? card.participantIds.length : 0,
              status: match.status
            });
          }
        });
      } else {
        const checkLegacyTeam = (team: any) => {
          if (!team || !team.startTime || team.isDeleted || team.isConcluded) return;
          const isTodayOrFuture = !team.startDate || team.startDate >= todayStr;
          if (isTodayOrFuture) {
            teams.push({
              ...team,
              ...baseInfo,
              startTime: team.startTime,
              liveDuration: team.liveDuration || 60,
              participantCount: team.participantIds ? team.participantIds.length : 0,
              status: match.status
            });
          }
        };
        checkLegacyTeam(match.team1);
        checkLegacyTeam(match.team2);
        checkLegacyTeam(match.team3);
      }
      return teams;
    })
    .filter(team => {
      const timeInfo = getTimeInfo(team.startTime, team.liveDuration, now, team.status, t, language);
      const isEnded = timeInfo.statusText === 'ENDED' || timeInfo.statusText === t('completed');
      const isIdle = timeInfo.statusText === 'IDLE' || timeInfo.statusText === t('idle');
      return !isEnded && !isIdle;
    });

  return (
    <div className="page-container" style={{ padding: '20px', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981', animation: 'pulse 1.5s infinite' }} />
            {t('liveMatches').split(' ')[0]} <span style={{ color: 'var(--accent-orange)' }}>{t('liveMatches').split(' ')[1] || ''}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 600 }}>{t('currentlyActiveArenas')}</p>
        </div>
      </div>

      {/* Matches List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {liveTeams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--glass-bg)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 600 }}>{t('noLiveMatches')}</p>
          </div>
        ) : (
          liveTeams.map((team, index) => {
            const timeInfo = getTimeInfo(team.startTime, team.liveDuration, now, team.status, t, language);
            const isMatchLive = timeInfo.statusText === t('live') || timeInfo.statusText === 'LIVE';
            const isMatchUpcoming = timeInfo.statusText === t('upcoming') || timeInfo.statusText === 'UPCOMING';

            return (
              <div 
                key={`${team.matchId}-${team.id}`} 
                className="animate-slide-up"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                  animationFillMode: 'forwards',
                  background: 'linear-gradient(145deg, var(--glass-bg), rgba(30, 41, 59, 0.4))', 
                  padding: '24px', 
                  borderRadius: '24px', 
                  border: '1px solid var(--glass-border)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  position: 'relative',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                {isAdminMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/admin/dashboard'); }}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-orange)', border: 'none', borderRadius: '8px', padding: '4px 8px', color: 'white', fontSize: '10px', fontWeight: 800, cursor: 'pointer', zIndex: 10 }}
                  >EDIT IN ADMIN</button>
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{team.entryType || 'Solo'} {language === 'bn' ? 'ম্যাচ' : 'MATCH'}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', textShadow: '0 2px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.matchName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', padding: '5px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.9rem' }}>👥</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{team.participantCount || team.currentParticipants}/{team.maxParticipants} {t('joinedCount')}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                  <div 
                    className={isMatchLive ? "live-badge-glow" : ""} 
                    style={{ 
                      background: isMatchLive 
                        ? 'linear-gradient(135deg, #10B981, #059669)' 
                        : isMatchUpcoming 
                          ? 'linear-gradient(135deg, #F59E0B, #D97706)' 
                          : 'rgba(255,255,255,0.1)', 
                      padding: '5px 14px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: 900, 
                      color: 'white', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      boxShadow: isMatchLive ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none' 
                    }}
                  >
                    {isMatchLive ? (
                      <>
                        <div style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                        LIVE ({timeInfo.remainingStr.replace(' Remaining', '')})
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.85rem' }}>🕒</span>
                        {timeInfo.statusText}
                      </>
                    )}
                  </div>
                  
                  {isMatchLive ? (
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{team.score || '0 - 0'}</div>
                  ) : (
                    <div style={{ height: '8px' }} />
                  )}

                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: isMatchLive ? '#10B981' : isMatchUpcoming ? '#F59E0B' : 'var(--text-secondary)', 
                    fontWeight: 800, 
                    background: isMatchLive 
                      ? 'rgba(16, 185, 129, 0.12)' 
                      : isMatchUpcoming 
                        ? 'rgba(245, 158, 11, 0.12)' 
                        : 'rgba(255, 255, 255, 0.05)', 
                    border: isMatchLive 
                      ? '1px solid rgba(16, 185, 129, 0.25)' 
                      : isMatchUpcoming 
                        ? '1px solid rgba(245, 158, 11, 0.25)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '6px 12px', 
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '2px',
                    textAlign: 'right'
                  }}>
                    {isMatchLive ? (
                      <>
                        <div>{timeInfo.elapsedStr}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{timeInfo.endTimeStr}</div>
                      </>
                    ) : (
                      <>
                        <div>{timeInfo.displayTime}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{timeInfo.elapsedStr}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveMatches;
