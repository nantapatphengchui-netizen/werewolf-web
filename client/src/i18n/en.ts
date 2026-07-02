export const en: Record<string, string> = {
  // ── Landing / lobby form ───────────────────────────────────────────────────
  'landing.online':          'Online',
  'landing.tagline':         'A Game of Deception',
  'landing.connecting':      'Connecting to server…',
  'landing.createRoom':      'Create Room',
  'landing.joinRoom':        'Join Room',
  'landing.yourName':        'Your Name',
  'landing.namePlaceholder': 'Enter your name…',
  'landing.roomCode':        'Room Code',
  'landing.back':            '← Back',
  'landing.playersRequired': '5–12 players required to start',
  'landing.creating':        'Creating…',
  'landing.joining':         'Joining…',
  'landing.waitConnect':     'Connecting…',

  // ── Phases ─────────────────────────────────────────────────────────────────
  'phase.lobby':  'Lobby',
  'phase.night':  'Night',
  'phase.day':    'Day',
  'phase.voting': 'Vote',
  'phase.ended':  'Ended',

  // ── Role names ─────────────────────────────────────────────────────────────
  'role.werewolf.name':   'Werewolf',
  'role.villager.name':   'Villager',
  'role.seer.name':       'Seer',
  'role.doctor.name':     'Doctor',
  'role.hunter.name':     'Hunter',
  'role.witch.name':      'Witch',
  'role.bodyguard.name':  'Bodyguard',

  // ── Role descriptions ──────────────────────────────────────────────────────
  'role.werewolf.description':  'You are a Werewolf. Eliminate villagers each night and avoid being caught during the day.',
  'role.villager.description':  'You are a Villager. Use logic and intuition to find the werewolves.',
  'role.seer.description':      'You are the Seer. Each night you may reveal the true identity of one player.',
  'role.doctor.description':    'You are the Doctor. Each night you may protect one player from the wolves.',
  'role.hunter.description':    'You are the Hunter. If eliminated — by vote or wolves — you may take one player down with you.',
  'role.witch.description':     "You are the Witch. You hold a save potion and a poison potion, each usable once per game.",
  'role.bodyguard.description': 'You are the Bodyguard. Each night you guard one player, but you cannot protect the same person on consecutive nights.',

  // ── Role night actions ─────────────────────────────────────────────────────
  'role.werewolf.nightAction':  'Choose a villager to eliminate tonight.',
  'role.seer.nightAction':      'Inspect a player to reveal their true identity.',
  'role.doctor.nightAction':    'Choose a player to protect from the wolves tonight.',
  'role.witch.nightAction':     'Wait for the wolves to strike, then decide what to do.',
  'role.bodyguard.nightAction': 'Choose a player to guard tonight.',

  // ── Alignment ──────────────────────────────────────────────────────────────
  'alignment.village':   'Village',
  'alignment.werewolf':  'Werewolf',

  // ── Action labels (confirm buttons) ───────────────────────────────────────
  'action.kill':      'Kill',
  'action.inspect':   'Inspect',
  'action.protect':   'Protect',
  'action.guard':     'Guard',
  'action.shoot':     'Shoot',
  'action.vote':      'Vote',
  'action.confirm':   'Confirm',
  'action.cancel':    'Cancel',
  'action.skip':      'Skip',
  'action.doNothing': 'Do Nothing',
  'action.save':      'Save',
  'action.poison':    'Poison',

  // ── Social actions (card buttons) ─────────────────────────────────────────
  'social.suspect':  'Suspect',
  'social.trust':    'Trust',
  'social.ask':      'Ask',

  // ── Action bar — night ─────────────────────────────────────────────────────
  'bar.night.submitted': 'Action submitted — awaiting others…',
  'bar.night.perished':  'You have perished. Watch the night from the shadows.',
  'bar.night.sleep':     'Night falls. You close your eyes and wait for dawn.',
  'bar.night.select':    'Select a player card above…',
  'bar.night.confirmHint': 'Confirm on card ↑',

  // ── Action bar — day ──────────────────────────────────────────────────────
  'bar.day.discuss':  'Discuss with the village. Use card buttons to Suspect or Ask players.',
  'bar.day.callVote': 'Call to Vote →',
  'bar.day.waitHost': 'Waiting for host…',
  'bar.day.perished': 'You have perished.',

  // ── Action bar — voting ───────────────────────────────────────────────────
  'bar.voting.submitted':  'Vote cast · {{voted}} / {{total}} voted',
  'bar.voting.perished':   'You are eliminated. Watch the vote unfold.',
  'bar.voting.select':     'Select a player to exile…',
  'bar.voting.confirmHint':'Confirm on card ↑',

  // ── Instruction text ───────────────────────────────────────────────────────
  'instr.night.werewolf':  'Click a player card to eliminate tonight.',
  'instr.night.seer':      'Click a player card to reveal their identity.',
  'instr.night.doctor':    'Click a player card to protect tonight.',
  'instr.night.bodyguard': 'Click a player card to guard tonight.',
  'instr.night.witch':     'Wait for the wolves to strike — your choice comes after.',
  'instr.night.villager':  'Night falls. The village sleeps.',
  'instr.night.perished':  'You have perished. Watch the night from the shadows.',
  'instr.night.submitted': 'Action submitted — awaiting other night actions…',
  'instr.day.discuss':     'Discuss and find the wolves among you.',
  'instr.voting.select':   'Click a player card to cast your vote for exile.',
  'instr.voting.perished': 'You are eliminated. Watch the vote.',
  'instr.voting.submitted':'Vote cast — awaiting…',

  // ── Witch panel ────────────────────────────────────────────────────────────
  'witch.title':      "Witch's Choice",
  'witch.attacked':   "Tonight's target: {{name}}",
  'witch.noAttack':   'No one was attacked tonight.',
  'witch.saveName':   'Save {{name}}',
  'witch.poisonBtn':  'Poison Someone',
  'witch.doNothing':  'Do Nothing',
  'witch.poisonMode': 'Choose a player to poison…',
  'witch.cancel':     'Cancel',

  // ── Hunter ─────────────────────────────────────────────────────────────────
  'hunter.myShot':       "The Hunter's Final Shot — choose a target to take down with you, or skip.",
  'hunter.otherPending': 'The Hunter is choosing their final shot…',
  'hunter.selectTarget': 'Select your final target…',
  'hunter.shoot':        'Shoot',
  'hunter.skipShot':     'Skip Shot',
  'hunter.skip':         'Skip',

  // ── Hot seat ───────────────────────────────────────────────────────────────
  'hotSeat.banner': 'Hot Seat: {{names}} — let them speak before the vote.',

  // ── Reactions / day ────────────────────────────────────────────────────────
  'reaction.askToSpeak': '{{from}} asks {{to}} to speak',

  // ── Game over ──────────────────────────────────────────────────────────────
  'gameover.villageWins':   'VILLAGE WINS',
  'gameover.wolvesWin':     'WOLVES WIN',
  'gameover.villageDesc':   'The villagers have driven out the evil.',
  'gameover.wolvesDesc':    'The werewolves have claimed the village.',
  'gameover.truthRevealed': 'The truth revealed',
  'gameover.unknown':       'Unknown',
  'gameover.playAgain':     'Play Again',
  'gameover.toLobby':       'Return to Lobby',
  'gameover.leave':         'Leave Room',

  // ── Lobby ──────────────────────────────────────────────────────────────────
  'lobby.room':         'Room',
  'lobby.readyToStart': 'Ready to start',
  'lobby.needMore':     'Need {{n}} more',
  'lobby.connected':    'Connected',
  'lobby.offline':      'Offline',
  'lobby.leave':        'Leave',
  'lobby.ready':        '✓ Ready',
  'lobby.notReady':     'Ready',
  'lobby.startGame':    'Start Game',
  'lobby.needPlayers':  'Need {{n}} more player{{s}} ({{cur}}/{{min}})',
  'lobby.allReady':     'All ready — host can start!',
  'lobby.readyCount':   '{{ready}} / {{total}} ready',
  'lobby.waitHost':     'Waiting for host',

  // ── Host controls ──────────────────────────────────────────────────────────
  'host.timer':         'Phase Timer',
  'host.pauseTimer':    '⏸ Pause Timer',
  'host.resumeTimer':   '▶ Resume Timer',
  'host.endPhase':      'End {{phase}} Early',
  'host.guidedDayOn':   '◆ Guided Day: ON',
  'host.guidedDayOff':  '◇ Guided Day: OFF',
  'host.guidedDayDesc': 'Shows Hot Seat banner for top suspects and structures the day discussion.',
  'host.dayMode':       'Day Mode',
  'host.game':          'Game',
  'host.toLobby':       'Return to Lobby',
  'host.restart':       'Restart Game',

  // ── Role panel ─────────────────────────────────────────────────────────────
  'rolepanel.yourRole':     'Your Role',
  'rolepanel.roleTab':      'Role',
  'rolepanel.infoTab':      'Info',
  'rolepanel.wolfPack':     'Wolf Pack',
  'rolepanel.soloWolf':     'You hunt alone.',
  'rolepanel.allies':       'Allies',
  'rolepanel.alliesDesc':   "Village — but you don't know who is who.",
  'rolepanel.nightAction':  'Night Action',
  'rolepanel.noNightAction':'No night action. Sleep soundly — or try to.',
  'rolepanel.noRole':       'Role not loaded — reconnecting…',
  'rolepanel.inspectionLog':'Inspection Log',

  // ── Role reveal overlay ────────────────────────────────────────────────────
  'reveal.destiny':    '✦ Destiny is Written ✦',
  'reveal.decided':    'Your Role Has Been Decided',
  'reveal.youAre':     'You Are',
  'reveal.enterGame':  'Enter the Game ✦',

  // ── HUD ────────────────────────────────────────────────────────────────────
  'hud.gameOver':      'Game Over',
  'hud.leave':         'Leave',
  'hud.yourRole':      'Your Role',
  'hud.hostControls':  'Host Controls',
  'hud.eventLog':      'Event Log',

  // ── Card ───────────────────────────────────────────────────────────────────
  'card.youBanner':   '◆ YOU ◆',
  'card.eliminated':  'Eliminated',
  'card.away':        'Away',
  'card.youRole':     'You · {{role}}',

  // ── Confirm dialogs ────────────────────────────────────────────────────────
  'confirm.restart.title':  'Restart Game',
  'confirm.restart.desc':   'All players will keep their spots but get new roles. The current game state will be lost.',
  'confirm.restart.btn':    'Restart',
  'confirm.lobby.title':    'Return to Lobby',
  'confirm.lobby.desc':     'The game will end immediately and everyone will return to the lobby. Progress will be lost.',
  'confirm.lobby.btn':      'Return',
  'confirm.endPhase.title': 'End {{phase}} Early',
  'confirm.endPhase.desc':  'End the {{phase}} phase immediately and auto-resolve it.',
  'confirm.endPhase.btn':   'End Phase',
  'confirm.yes':   'Confirm',
  'confirm.cancel':'Cancel',
};
