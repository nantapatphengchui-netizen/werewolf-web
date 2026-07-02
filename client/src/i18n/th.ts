export const th: Record<string, string> = {
  // ── Landing / lobby form ───────────────────────────────────────────────────
  'landing.online':          'ออนไลน์',
  'landing.tagline':         'เกมแห่งการหลอกลวง',
  'landing.connecting':      'กำลังเชื่อมต่อเซิร์ฟเวอร์…',
  'landing.createRoom':      'สร้างห้อง',
  'landing.joinRoom':        'เข้าร่วมห้อง',
  'landing.yourName':        'ชื่อของคุณ',
  'landing.namePlaceholder': 'กรอกชื่อของคุณ…',
  'landing.roomCode':        'รหัสห้อง',
  'landing.back':            '← กลับ',
  'landing.playersRequired': 'ต้องมีผู้เล่น 5–12 คนจึงจะเริ่มได้',
  'landing.creating':        'กำลังสร้าง…',
  'landing.joining':         'กำลังเข้าร่วม…',
  'landing.waitConnect':     'กำลังเชื่อมต่อ…',

  // ── Skill names ────────────────────────────────────────────────────────────
  'skill.werewolf':  'จู่โจมกลางคืน',
  'skill.seer':      'หยั่งรู้',
  'skill.doctor':    'รักษา',
  'skill.bodyguard': 'คุ้มกัน',
  'skill.hunter':    'ยิงสวน',
  'skill.witch':     'ปรุงยา',
  'skill.villager':  'สืบสวน',

  // ── Chat ───────────────────────────────────────────────────────────────────
  'chat.title':            'แชทหมู่บ้าน',
  'chat.wolfTitle':        'แชทหมาป่า',
  'chat.you':              'คุณ',
  'chat.send':             'ส่ง',
  'chat.empty':            'ยังไม่มีข้อความ',
  'chat.placeholder':      'พิมพ์ข้อความ…',
  'chat.placeholderWolf':  'คุยกับหมาป่าด้วยกัน…',
  'chat.disabledNight':    'หมู่บ้านหลับอยู่ — เฉพาะหมาป่าคุยกันได้ตอนกลางคืน',
  'chat.disabledDead':     'ผู้ที่ตายแล้วไม่สามารถพูดได้',
  'chat.disabledDefault':  'ยังพิมพ์ข้อความไม่ได้ตอนนี้',

  // ── Turn prompt / night atmosphere ─────────────────────────────────────────
  'turn.yourTurn':     'ตาของคุณ',
  'turn.voteProgress': 'ลงคะแนนแล้ว {{voted}} / {{total}} คน',
  'turn.tallyLive':    'กำลังนับคะแนน…',
  'night.flavor.0':    'หมาป่ากำลังออกล่าในความมืด…',
  'night.flavor.1':    'ผู้หยั่งรู้เพ่งผ่านดวงตาที่สาม…',
  'night.flavor.2':    'หมู่บ้านหลับใหลอย่างไม่รู้ตัว…',
  'night.flavor.3':    'เงามืดเคลื่อนไหวอย่างเงียบงัน…',

  // ── Seer reveal ────────────────────────────────────────────────────────────
  'seerReveal.title':        'นิมิตของผู้หยั่งรู้',
  'seerReveal.subtitle':     'ดวงตาที่สามเผยความจริง',
  'seerReveal.isWerewolf':   'คือหมาป่า!',
  'seerReveal.isSafe':       'ไม่ใช่หมาป่า — ฝ่ายหมู่บ้าน',
  'seerReveal.roleLabel':    'บทบาทที่แท้จริง',
  'seerReveal.dismiss':      'รับทราบ',

  // ── Action toasts ──────────────────────────────────────────────────────────
  'toast.actionSubmitted': 'บันทึกการกระทำแล้ว',
  'toast.voteCast':        'ลงคะแนนแล้ว',
  'toast.witchSaved':      'ใช้ยาช่วยชีวิตแล้ว',
  'toast.witchPoisoned':   'ใช้ยาพิษแล้ว',
  'toast.witchPassed':     'เลือกไม่ทำอะไร',
  'toast.shotFired':       'ยิงนัดสุดท้ายแล้ว',
  'toast.shotSkipped':     'ข้ามการยิง',

  // ── Connection / reconnect ─────────────────────────────────────────────────
  'conn.reconnecting':     'กำลังเชื่อมต่อใหม่…',
  'conn.reconnectingDesc': 'รอสักครู่ — กำลังกู้เกมของคุณกลับมา',
  'conn.loading':          'กำลังโหลด…',
  'conn.leaveHome':        'กลับหน้าแรก',

  // ── How to play ────────────────────────────────────────────────────────────
  'howto.button':         'วิธีเล่น',
  'howto.title':          'วิธีเล่น',
  'howto.objectiveTitle': 'เป้าหมาย',
  'howto.villageGoal':    'ฝ่ายหมู่บ้านชนะเมื่อค้นหาและกำจัดหมาป่าได้ครบทุกตัว',
  'howto.wolfGoal':       'ฝ่ายหมาป่าชนะเมื่อจำนวนหมาป่าเท่าหรือมากกว่าชาวบ้านที่เหลือ',
  'howto.flowTitle':      'ลำดับการเล่นแต่ละรอบ',
  'howto.nightDesc':      'บทบาทพิเศษทำหน้าที่อย่างลับๆ — หมาป่าเลือกเหยื่อ ผู้หยั่งรู้ตรวจสอบ ฝ่ายป้องกันคุ้มกัน',
  'howto.dayDesc':        'ทุกคนตื่นขึ้น รู้ว่าใครเสียชีวิต แล้วถกกันว่าใครคือหมาป่า',
  'howto.votingDesc':     'หมู่บ้านโหวตเนรเทศผู้ต้องสงสัยหนึ่งคน หากคะแนนเสมอจะไม่มีใครถูกเนรเทศ',
  'howto.rolesTitle':     'บทบาท',
  'howto.tip':            'เคล็ดลับ: สังเกตพฤติกรรม จับพิรุธ และอย่าเชื่อใครง่ายๆ',
  'howto.close':          'เข้าใจแล้ว',

  // ── Phases ─────────────────────────────────────────────────────────────────
  'phase.lobby':  'ห้องรอ',
  'phase.night':  'กลางคืน',
  'phase.day':    'กลางวัน',
  'phase.voting': 'โหวต',
  'phase.ended':  'จบเกม',

  // ── Role names ─────────────────────────────────────────────────────────────
  'role.werewolf.name':   'หมาป่า',
  'role.villager.name':   'ชาวบ้าน',
  'role.seer.name':       'ผู้หยั่งรู้',
  'role.doctor.name':     'หมอ',
  'role.hunter.name':     'นักล่า',
  'role.witch.name':      'แม่มด',
  'role.bodyguard.name':  'ผู้คุ้มกัน',

  // ── Role descriptions ──────────────────────────────────────────────────────
  'role.werewolf.description':  'คุณคือหมาป่า ฆ่าชาวบ้านในแต่ละคืนและอย่าให้ใครจับได้ในเวลากลางวัน',
  'role.villager.description':  'คุณคือชาวบ้าน ใช้เหตุผลและไหวพริบค้นหาหมาป่าออกมา',
  'role.seer.description':      'คุณคือผู้หยั่งรู้ ทุกคืนสามารถสืบค้นตัวตนที่แท้จริงของผู้เล่นคนหนึ่งได้',
  'role.doctor.description':    'คุณคือหมอ ทุกคืนสามารถปกป้องผู้เล่นคนหนึ่งจากหมาป่าได้',
  'role.hunter.description':    'คุณคือนักล่า หากโดนกำจัด — ไม่ว่าจากโหวตหรือกลางคืน — คุณสามารถพาผู้เล่นคนหนึ่งลงไปด้วย',
  'role.witch.description':     'คุณคือแม่มด มียาช่วยชีวิตและยาพิษอย่างละหนึ่งขวด ใช้ได้ขวดละครั้งตลอดเกม',
  'role.bodyguard.description': 'คุณคือผู้คุ้มกัน ทุกคืนคุ้มกันผู้เล่นคนหนึ่งได้ แต่คุ้มกันคนเดิมสองคืนติดต่อกันไม่ได้',

  // ── Role night actions ─────────────────────────────────────────────────────
  'role.werewolf.nightAction':  'เลือกชาวบ้านที่จะกำจัดในคืนนี้',
  'role.seer.nightAction':      'สืบค้นผู้เล่นเพื่อเปิดเผยตัวตนที่แท้จริง',
  'role.doctor.nightAction':    'เลือกผู้เล่นที่จะปกป้องจากหมาป่าคืนนี้',
  'role.witch.nightAction':     'รอให้หมาป่าโจมตีก่อน แล้วจึงตัดสินใจว่าจะทำอะไร',
  'role.bodyguard.nightAction': 'เลือกผู้เล่นที่จะคุ้มกันคืนนี้',

  // ── Alignment ──────────────────────────────────────────────────────────────
  'alignment.village':   'ฝ่ายหมู่บ้าน',
  'alignment.werewolf':  'ฝ่ายหมาป่า',

  // ── Action labels (confirm buttons) ───────────────────────────────────────
  'action.kill':     'จู่โจม',
  'action.inspect':  'สืบ',
  'action.protect':  'ปกป้อง',
  'action.guard':    'คุ้มกัน',
  'action.shoot':    'ยิง',
  'action.vote':     'โหวต',
  'action.confirm':  'ยืนยัน',
  'action.cancel':   'ยกเลิก',
  'action.skip':     'ข้าม',
  'action.doNothing':'ผ่าน',
  'action.save':     'ช่วยชีวิต',
  'action.poison':   'วางยา',

  // ── Action bar — night ─────────────────────────────────────────────────────
  'bar.night.submitted': 'ส่งคำสั่งแล้ว — รอผู้อื่น…',
  'bar.night.perished':  'คุณสิ้นชีวิตแล้ว ดูต่อจากเงามืด',
  'bar.night.sleep':     'กลางคืนมาถึง คุณหลับตารอรุ่งเช้า',
  'bar.night.select':    'เลือกการ์ดผู้เล่นด้านบน…',
  'bar.night.confirmHint': 'ยืนยันที่การ์ด ↑',

  // ── Action bar — day ──────────────────────────────────────────────────────
  'bar.day.discuss':    'พูดคุยกันในหมู่บ้าน',
  'bar.day.callVote':   'เริ่มโหวต',
  'bar.day.waitHost':   'รอโฮสต์…',
  'bar.day.perished':   'คุณสิ้นชีวิตแล้ว',

  // ── Action bar — voting ───────────────────────────────────────────────────
  'bar.voting.submitted': 'โหวตแล้ว · {{voted}} / {{total}} คน',
  'bar.voting.perished':  'คุณถูกกำจัดแล้ว ดูการโหวต',
  'bar.voting.select':    'เลือกผู้เล่นที่จะเนรเทศ…',
  'bar.voting.confirmHint': 'ยืนยันที่การ์ด ↑',

  // ── Instruction text ───────────────────────────────────────────────────────
  'instr.night.werewolf':  'คลิกการ์ดผู้เล่นเพื่อกำจัดในคืนนี้',
  'instr.night.seer':      'คลิกการ์ดผู้เล่นเพื่อสืบค้นตัวตน',
  'instr.night.doctor':    'คลิกการ์ดผู้เล่นเพื่อปกป้องในคืนนี้',
  'instr.night.bodyguard': 'คลิกการ์ดผู้เล่นเพื่อคุ้มกันในคืนนี้',
  'instr.night.witch':     'รอให้หมาป่าโจมตีก่อน — คุณจะตัดสินใจทีหลัง',
  'instr.night.villager':  'กลางคืนมาถึง หมู่บ้านนอนหลับ',
  'instr.night.perished':  'คุณสิ้นชีวิตแล้ว ดูต่อจากเงามืด',
  'instr.night.submitted': 'ส่งคำสั่งแล้ว — รอคำสั่งกลางคืนอื่น…',
  'instr.day.discuss':     'พูดคุยและค้นหาหมาป่าในหมู่คุณ',
  'instr.voting.select':   'คลิกการ์ดผู้เล่นเพื่อโหวตเนรเทศ',
  'instr.voting.perished': 'คุณถูกกำจัดแล้ว ดูการโหวต',
  'instr.voting.submitted':'โหวตแล้ว — รออยู่…',

  // ── Witch panel ────────────────────────────────────────────────────────────
  'witch.title':      'ตัวเลือกของแม่มด',
  'witch.attacked':   'เป้าหมายคืนนี้: {{name}}',
  'witch.noAttack':   'ไม่มีใครถูกโจมตีคืนนี้',
  'witch.saveName':   'ช่วย {{name}}',
  'witch.poisonBtn':  'วางยาใครบางคน',
  'witch.doNothing':  'ผ่าน',
  'witch.poisonMode': 'เลือกผู้เล่นที่จะวางยา…',
  'witch.cancel':     'ยกเลิก',

  // ── Hunter ─────────────────────────────────────────────────────────────────
  'hunter.myShot':      'ยิงสุดท้ายของนักล่า — เลือกเป้าหมายหรือข้าม',
  'hunter.otherPending':'นักล่ากำลังเลือกเป้าหมายสุดท้าย…',
  'hunter.selectTarget': 'เลือกเป้าหมายสุดท้าย…',
  'hunter.shoot':        'ยิง',
  'hunter.skipShot':     'ข้ามการยิง',
  'hunter.skip':         'ข้าม',

  // ── Game over ──────────────────────────────────────────────────────────────
  'gameover.villageWins':   'หมู่บ้านชนะ',
  'gameover.wolvesWin':     'หมาป่าชนะ',
  'gameover.villageDesc':   'ชาวบ้านกำจัดความชั่วร้ายได้สำเร็จ',
  'gameover.wolvesDesc':    'หมาป่าเข้าครอบครองหมู่บ้าน',
  'gameover.truthRevealed': 'เปิดเผยความจริง',
  'gameover.unknown':       'ไม่ทราบ',
  'gameover.playAgain':     'เล่นอีกรอบ',
  'gameover.toLobby':       'กลับห้องรอ',
  'gameover.leave':         'ออกจากห้อง',

  // ── Lobby ──────────────────────────────────────────────────────────────────
  'lobby.room':         'ห้อง',
  'lobby.readyToStart': 'พร้อมเริ่มเกม',
  'lobby.needMore':     'ต้องการอีก {{n}} คน',
  'lobby.connected':    'เชื่อมต่อแล้ว',
  'lobby.offline':      'ออฟไลน์',
  'lobby.leave':        'ออก',
  'lobby.ready':        '✓ พร้อม',
  'lobby.notReady':     'พร้อม',
  'lobby.startGame':    'เริ่มเกม',
  'lobby.needPlayers':  'ต้องการอีก {{n}} คน ({{cur}}/{{min}})',
  'lobby.allReady':     'ทุกคนพร้อมแล้ว — โฮสต์เริ่มได้!',
  'lobby.readyCount':   '{{ready}} / {{total}} พร้อม',
  'lobby.waitHost':     'รอโฮสต์',

  // ── Host controls ──────────────────────────────────────────────────────────
  'host.timer':         'ตัวจับเวลา',
  'host.pauseTimer':    '⏸ หยุดชั่วคราว',
  'host.resumeTimer':   '▶ เล่นต่อ',
  'host.endPhase':      'จบ{{phase}}ก่อนเวลา',
  'host.game':          'เกม',
  'host.toLobby':       'กลับห้องรอ',
  'host.restart':       'เริ่มเกมใหม่',

  // ── Role panel ─────────────────────────────────────────────────────────────
  'rolepanel.yourRole':     'บทบาทของคุณ',
  'rolepanel.roleTab':      'บทบาท',
  'rolepanel.infoTab':      'ข้อมูล',
  'rolepanel.wolfPack':     'ฝ่ายหมาป่า',
  'rolepanel.soloWolf':     'คุณล่าคนเดียว',
  'rolepanel.allies':       'พันธมิตร',
  'rolepanel.alliesDesc':   'ฝ่ายหมู่บ้าน — แต่คุณไม่รู้ว่าใครเป็นใคร',
  'rolepanel.nightAction':  'การกระทำกลางคืน',
  'rolepanel.noNightAction':'ไม่มีการกระทำกลางคืน นอนหลับได้',
  'rolepanel.noRole':       'ยังไม่ได้รับบทบาท — กำลังเชื่อมต่อใหม่…',
  'rolepanel.inspectionLog':'บันทึกการตรวจสอบ',

  // ── Role reveal overlay ────────────────────────────────────────────────────
  'reveal.destiny':    '✦ โชคชะตาถูกกำหนดแล้ว ✦',
  'reveal.decided':    'บทบาทของคุณถูกกำหนดแล้ว',
  'reveal.youAre':     'คุณคือ',
  'reveal.enterGame':  'เข้าสู่เกม ✦',

  // ── HUD ────────────────────────────────────────────────────────────────────
  'hud.gameOver': 'จบเกม',
  'hud.round':    'รอบ {{n}}',
  'hud.leave':    'ออก',
  'hud.yourRole': 'บทบาทของคุณ',

  // ── Confirm dialogs ────────────────────────────────────────────────────────
  'confirm.restart.title':  'เริ่มเกมใหม่',
  'confirm.restart.desc':   'ผู้เล่นทั้งหมดจะคงที่นั่งแต่ได้บทบาทใหม่ สถานะปัจจุบันจะหายไป',
  'confirm.restart.btn':    'เริ่มใหม่',
  'confirm.lobby.title':    'กลับห้องรอ',
  'confirm.lobby.desc':     'เกมจะจบทันทีและทุกคนจะกลับห้องรอ ความคืบหน้าจะหายไป',
  'confirm.lobby.btn':      'กลับ',
  'confirm.endPhase.title': 'จบ{{phase}}ก่อนเวลา',
  'confirm.endPhase.desc':  'จบช่วง{{phase}}ทันทีและแก้ไขอัตโนมัติ',
  'confirm.endPhase.btn':   'จบเลย',
  'confirm.yes':   'ยืนยัน',
  'confirm.cancel':'ยกเลิก',

  // ── HUD extras ────────────────────────────────────────────────────────────
  'hud.hostControls':  'ควบคุมโฮสต์',
  'hud.eventLog':      'บันทึกเหตุการณ์',

  // ── Card ──────────────────────────────────────────────────────────────────
  'card.eliminated':  'ถูกกำจัด',
  'card.away':        'ไม่อยู่',

  // ── Event log (server-generated) ───────────────────────────────────────────
  'evt.gameBegun':        'เกมเริ่มขึ้นแล้ว บทบาทถูกแจกเรียบร้อย',
  'evt.nightFalls':       'ราตรีปกคลุมหมู่บ้าน ทุกคนหลับตาลง',
  'evt.nightFallsAgain':  'ราตรีปกคลุมอีกครั้ง ทุกคนหลับตาลง',
  'evt.newGame':          'เกมใหม่เริ่มขึ้นแล้ว บทบาทถูกแจกใหม่',
  'evt.hunterShotHit':    'นัดสุดท้ายของนักล่า: {{name}} ล้มลง',
  'evt.hunterShotSkip':   'นักล่าเลือกที่จะไม่ยิงนัดสุดท้าย',
  'evt.hunterShotExpired':'นักล่าไม่ได้ยิง (หมดเวลา)',
  'evt.hunterReadies':    'นักล่าเล็งนัดสุดท้ายก่อนล้มลง',
  'evt.villageWon':       'หมู่บ้านได้รับชัยชนะ หมาป่าถูกกำจัดหมดแล้ว',
  'evt.wolvesWon':        'หมาป่าเข้ายึดครองหมู่บ้าน',
  'evt.foundDead':        '{{names}} ถูกพบเป็นศพยามรุ่งสาง',
  'evt.quietNight':       'คืนอันเงียบสงบผ่านไป ไม่มีใครได้รับอันตราย',
  'evt.dawnDiscuss':      'รุ่งสางมาถึง หมู่บ้านตื่นขึ้นมาถกเถียง',
  'evt.gatherVotes':      'หมู่บ้านมารวมตัวเพื่อลงคะแนน',
  'evt.exiled':           '{{name}} ถูกเนรเทศ ({{role}})',
  'evt.voteTied':         'คะแนนเสมอกัน ไม่มีใครถูกเนรเทศ',
  'evt.playerKicked':     '{{name}} ถูกโฮสต์นำออกจากห้อง',
  'evt.roomLocked':       'โฮสต์ล็อกห้องแล้ว ผู้เล่นใหม่เข้าไม่ได้',
  'evt.roomUnlocked':     'โฮสต์ปลดล็อกห้องแล้ว',
  'evt.timerPaused':      'โฮสต์หยุดเวลาชั่วคราว',
  'evt.timerResumed':     'โฮสต์เดินเวลาต่อแล้ว',
  'evt.timerExtended':    'โฮสต์ต่อเวลาอีก {{seconds}} วินาที',
  'evt.hostEndedNight':   'โฮสต์จบช่วงกลางคืนก่อนเวลา',
  'evt.hostCalledVote':   'โฮสต์เรียกโหวตก่อนเวลา',
  'evt.hostClosedVote':   'โฮสต์ปิดโหวตก่อนเวลา',

  // ── Announcements (banner) ─────────────────────────────────────────────────
  'ann.dawnSurvived':      'รุ่งสางมาถึง มีคนรอดจากคืนนี้มาได้อย่างหวุดหวิด ไม่มีใครถูกกำจัด',
  'ann.dawnNoDeath':       'รุ่งสางมาถึง ไม่มีใครได้รับอันตราย',
  'ann.dawnOneDead':       'รุ่งสางมาถึง {{name}} ถูกพบเป็นศพ ยังไม่ทราบบทบาท',
  'ann.dawnManyDead':      'รุ่งสางมาถึง {{names}} ถูกพบเป็นศพ ยังไม่ทราบบทบาท',
  'ann.dawnOneDeadHunter': 'รุ่งสางมาถึง {{name}} ถูกพบเป็นศพ ยังไม่ทราบบทบาท ดวงตานักล่ายังลุกโชน — นัดสุดท้ายกำลังจะมา',
  'ann.dawnManyDeadHunter':'รุ่งสางมาถึง {{names}} ถูกพบเป็นศพ ยังไม่ทราบบทบาท ดวงตานักล่ายังลุกโชน — นัดสุดท้ายกำลังจะมา',
  'ann.exiledWin':         'หมู่บ้านได้ตัดสินแล้ว {{name}} ถูกเนรเทศ — เขาคือ{{role}}',
  'ann.noAgreement':       'ลงคะแนนเสร็จสิ้น หมู่บ้านตกลงกันไม่ได้',
  'ann.exiledHunter':      '{{name}} ถูกเนรเทศ ({{role}}) ดวงตายังลุกโชน — นัดของนักล่ายังไม่ถูกใช้',
  'ann.exiledNight':       '{{name}} ถูกเนรเทศ ({{role}}) ราตรีปกคลุมอีกครั้ง',
  'ann.tieNight':          'คะแนนเสมอกัน ไม่มีใครถูกเนรเทศ ราตรีปกคลุม',
};
