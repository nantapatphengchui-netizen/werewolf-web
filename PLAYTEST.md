# Werewolf — Playtest Checklist

Use this guide to verify the full game loop with 8–12 players before a production release.
Each section lists what to check and the expected outcome.

---

## Setup

- Minimum **8 players** required (max 12)
- Open the game in **8+ separate browser tabs or devices** (incognito windows work)
- One tab is the **host**, the rest are players
- Start the backend (`npm run dev:server`) and frontend (`npm run dev:client`)

---

## 1. Lobby

| Check | Expected |
|-------|----------|
| Host creates room | Room code shown, host lands on lobby page |
| Players join with unique names | Player cards appear for all |
| Duplicate name rejected | Error: "That name is already taken" |
| Name too short / too long | Error: "Name must be 1–20 characters" |
| Wrong room code | Error: "Room not found" |
| Player count displayed | Header shows `N/12` correctly |
| Ready button for non-host | Turns green when clicked; count updates for everyone |
| Start Game disabled until all ready + ≥8 players | Button greyed out / shows "need N more" |
| Start Game enabled when all ready | Host can click; game begins |

### Host Admin Controls (host only)

| Check | Expected |
|-------|----------|
| Lock Room | New join attempts blocked: "Room is locked" error; lock icon appears in title |
| Unlock Room | Joins allowed again; lock icon removed |
| Reset Ready | All ready states cleared; everyone must re-ready |
| Kick player | Confirmation dialog appears; on confirm, player is removed and redirected to `/` |
| Kick self not allowed | Server rejects |

---

## 2. Game Start

| Check | Expected |
|-------|----------|
| All players receive a role | Role card appears in right panel |
| 2 werewolves (8–10 players) | Confirmed in test by checking revealed roles at game end |
| Wolves see each other | Wolf players see teammate list in Role panel |
| Non-wolves see empty teammate list | No wolf names shown |
| Phase banner shows "Night · Round 1" | Correct phase and round number |
| Night timer starts counting down | Timer bar visible, counts from ~45s |

---

## 3. Night Phase

| Check | Expected |
|-------|----------|
| Werewolf sees target list | Only non-wolf alive players listed |
| Seer sees target list | All alive players except themselves |
| Doctor sees target list | All alive players (can protect self) |
| Villager sees "Night falls" message | No action controls shown |
| Dead player sees "You have perished" | No action controls regardless of role |
| Submit action | Panel shows "submitted — awaiting all night actions" |
| Player card shows green checkmark | After submitting, badge appears on own card in grid |
| Once all night roles act | Phase auto-advances to Day (no timer needed) |
| Timer expiry forces resolution | Night resolves after 45s even without all actions |

### Night outcomes to verify

| Scenario | Expected |
|----------|----------|
| Wolf kills unprotected player | Player marked dead; announcement at dawn |
| Doctor protects wolf's target | Victim survives; "quiet night" announcement |
| Doctor self-protects and is targeted | Survives |
| Seer inspects wolf | Receives private "WEREWOLF" result in inspection log |
| Seer inspects villager | Receives correct role in inspection log |
| Seer log persists through all phases | Log still visible during day, voting, next night |

---

## 4. Day Phase

| Check | Expected |
|-------|----------|
| Announcement banner shows night result | Dead player named or "quiet night" |
| Dead player's card shows red X, greyscale | Visual dead state applied |
| Day timer counts down from ~120s | Timer bar visible |
| Discussion panel shows for all players | "Discuss with the village" message |
| Host sees "Call to Vote" button | Non-hosts see "Waiting for host to call a vote..." |
| Call to Vote advances to Voting | Timer switches to voting timer |

---

## 5. Voting Phase

| Check | Expected |
|-------|----------|
| Vote targets list shown (alive only, not self) | Cannot vote for self or dead |
| Dead players see spectator message | No vote UI |
| Casting vote shows progress | "N / M voted" count updates live |
| Votes reflected in vote tally on player cards | Public vote counts visible |
| Once all alive players voted | Phase auto-resolves |
| Timer expiry forces resolution | Voting ends after 60s |
| Tied vote | Random player among tied candidates is exiled |
| Exiled player's role is revealed | Role shown on player card |
| Game continues if no win | Round increments, night begins again |

---

## 6. Win Conditions

| Check | Expected |
|-------|----------|
| All wolves dead | Game Over screen — "VILLAGE WINS" |
| Wolves equal or outnumber villagers | Game Over screen — "WOLVES WIN" |
| Win can trigger at end of night | After kill, if wolves win without day, game ends immediately |
| Game Over screen shows all roles | All players listed with revealed roles and alive/dead status |
| Last announcement shown | Summary of final event |
| Host sees Play Again + Return to Lobby | Non-host only sees Leave |

---

## 7. Post-Game

| Check | Expected |
|-------|----------|
| Play Again (host only) | New game starts with new roles; all players stay |
| Return to Lobby (host only) | Lobby shown; roles hidden; ready states cleared |
| Leave Room | Player removed; redirected to `/` |
| Non-host leaves | Host still controls room |

---

## 8. Host Game Controls (during active game, host only)

| Check | Expected |
|-------|----------|
| Pause Timer | Timer bar freezes; "Paused" badge in top bar; ⏸ shown in timer |
| Resume Timer | Timer restarts from remaining time |
| +30s / +60s / +120s | Timer extends by that amount |
| Extend while paused | Remaining time increases |
| End Night Early | Night resolves immediately with available votes |
| End Day Early | Jumps to voting phase |
| End Vote Early | Voting resolves with current tallies |
| All three confirm dialogs appear | Requires confirmation for destructive actions |
| Return to Lobby (mid-game) | Requires confirmation; all players return to lobby |
| Restart Game (mid-game) | Requires confirmation; new roles assigned immediately |

---

## 9. Reconnect

| Check | Expected |
|-------|----------|
| Refresh page during lobby | Rejoins same room; ready state restored |
| Refresh page during night | Rejoins room; role and phase restored |
| Refresh while dead | Correctly shown as dead |
| Refresh as seer with prior results | Seer log repopulates (via `seer_result` on reconnect) |
| Close tab and reopen within ~30s | Reconnects; host transfer not triggered |
| Host closes tab for >30s | Host transferred to another connected player |
| Reconnected host gets controls back | If old host reconnects after transfer, no extra controls |

---

## 10. Multi-round Game

| Check | Expected |
|-------|----------|
| Round counter increments each night | "Night · Round 2", "Round 3", etc. |
| Dead players excluded from all target lists | Cannot target dead players night or day |
| Dead players cannot vote | Spectator message during voting |
| Seer log entries sorted newest first | Most recent inspection at top |
| Event log stays readable | Old entries dim; newest entries bright |
| Game resolves correctly over multiple rounds | Win condition triggers at right moment |

---

## 11. Edge Cases

| Check | Expected |
|-------|----------|
| 8-player game (minimum) | 2 wolves, 1 seer, 1 doctor, 4 villagers |
| 11–12-player game | 3 wolves |
| Player leaves during lobby | Removed; game can still start if count ≥ 8 |
| Player leaves during active game | Timer continues; remaining players unaffected |
| All wolves leave mid-game | Village wins at next night resolution |
| Host leaves lobby | Host transferred; new host can start game |
| Room full (12 players) | 13th join rejected: "Room is full" |
| Locked room join | Rejected: "Room is locked" |

---

## 12. Production Checklist

Before deploying to production:

- [ ] `NEXT_PUBLIC_SERVER_URL` set in Vercel env vars (no trailing slash)
- [ ] `CLIENT_ORIGIN` set in backend env vars (matches exact Vercel URL)
- [ ] `NODE_ENV=production` set on backend
- [ ] `/health` endpoint returns `{"status":"ok","env":"production",...}`
- [ ] WebSocket connections visible in browser DevTools → Network → WS tab
- [ ] Playtest at least one full game (lobby → night → day → voting → win) on production URL
- [ ] Test reconnect across two different devices on different networks
- [ ] Confirm no CORS errors in browser console
