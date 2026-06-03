import { parseTime, isCardLive, isMatchLive } from './timeUtils.js';

const m1 = {
  "map": "Bermuda",
  "participantIds": [
    "USER123",
    "USER123",
    "pN59VjfHQiVWlHeb8FA4mXyFXBH3",
    "pN59VjfHQiVWlHeb8FA4mXyFXBH3",
    "pN59VjfHQiVWlHeb8FA4mXyFXBH3"
  ],
  "totalPlayersCount": "48 Players",
  "prizePool": 400,
  "name": "Full Map Match",
  "joinedUsers": [],
  "status": "live",
  "score": "12 - 8",
  "liveStartedAt": 1780504889805,
  "time": "14:20",
  "id": "m1",
  "team1": {
    "startTime": "20:00",
    "liveDuration": 10,
    "entryFee": 10,
    "winPrize": 500,
    "entryType": "Solo",
    "name": "Red Dragons",
  },
  "team2": {
    "startTime": "22:10",
    "entryFee": 20,
    "winPrize": 1000,
    "entryType": "Duo",
    "name": "Shadow Ninjas",
    "liveDuration": 20
  },
  "team3": {
    "startTime": "10:42",
    "entryFee": 40,
    "winPrize": 2000,
    "entryType": "Squad",
    "name": "Thunder Bolts",
    "liveDuration": 5,
  },
  "currentParticipants": 5,
  "category": "full_map",
  "totalBidsCount": "5 Players joined",
  "countdownMinutes": 600,
  "scheduledStart": "14:20",
  "version": "Solo",
  "timeline": [],
  "createdAt": "2026-05-01",
};

const nowTime = new Date();
console.log("Current time:", nowTime.toString());
console.log("parseTime('20:00'):", parseTime('20:00'));
console.log("parseTime('10:42'):", parseTime('10:42'));

console.log("isCardLive(m1.team1):", isCardLive(m1.team1));
console.log("isCardLive(m1.team2):", isCardLive(m1.team2));
console.log("isCardLive(m1.team3):", isCardLive(m1.team3));
console.log("isMatchLive(m1):", isMatchLive(m1));
