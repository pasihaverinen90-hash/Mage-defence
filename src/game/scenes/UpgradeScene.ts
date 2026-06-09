import Phaser from 'phaser'
import { gameState } from '../../state/GameState'
import { UpgradeSystem } from '../../systems/UpgradeSystem'
import { RecruitSystem } from '../../systems/RecruitSystem'
import { UPGRADES, UPGRADE_SECTIONS } from '../../data/upgrades'
import { RECRUITS, RECRUIT_ORDER } from '../../data/recruits'

type TabKey = 'castle' | 'fireMage' | 'recruits' | 'loadout'
interface TabEntry { key: TabKey; x: number; w: number; gfx: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text }

// Dark-fantasy / arcane palette (graphics use numbers, text uses strings).
const COL = {
  panelFill: 0x141228, panelBorder: 0x33304d,
  rowFill: 0x1a1733, rowBorder: 0x2e2a52,
  ownedBorder: 0x4c3a86,
  accent: '#a78bfa', heading: '#c4b5fd', body: '#cbd5e1', bright: '#f5f3ff',
  muted: '#8b86b3', mana: '#7dd3fc', green: '#34d399',
  btnOn: '#5b21b6', btnOnText: '#ddd6fe', btnOff: '#27263a', btnOffText: '#6b7280',
}

export class UpgradeScene extends Phaser.Scene {
  private activeTab: TabKey = 'castle'
  private tabs: TabEntry[] = []
  private content: Phaser.GameObjects.GameObject[] = []
  // Content-scoped (rebuilt per tab):
  private upgradeButtons: Map<string, Phaser.GameObjects.Text> = new Map()
  private upgradeLevels: Map<string, Phaser.GameObjects.Text> = new Map()
  // Always-visible (updated in refreshUI):
  private statTexts: Map<string, Phaser.GameObjects.Text> = new Map()
  private summaryTexts: Map<string, Phaser.GameObjects.Text> = new Map()
  private manaValue!: Phaser.GameObjects.Text
  private bestWaveValue!: Phaser.GameObjects.Text
  private totalRunsValue!: Phaser.GameObjects.Text
  private progressText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'UpgradeScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a14')
    this.tabs = []
    this.content = []
    this.upgradeButtons.clear()
    this.upgradeLevels.clear()
    this.statTexts.clear()
    this.summaryTexts.clear()

    this.buildHeader()
    this.buildTabs()
    this.buildStatsColumn()
    this.panel(232, 94, 548, 398) // main content frame (always visible)
    this.buildBottom()

    this.selectTab(this.activeTab)
  }

  // ── Header: title + Blue Mana / Best Wave / Total Runs cards ──
  private buildHeader() {
    this.add.text(20, 28, '🔮 Mage Arena', {
      fontSize: '24px', color: COL.heading, fontFamily: 'monospace',
    }).setOrigin(0, 0.5)
    this.manaValue = this.headerCard(413, '💧', 'BLUE MANA')
    this.bestWaveValue = this.headerCard(533, '🏆', 'BEST WAVE')
    this.totalRunsValue = this.headerCard(653, '📜', 'TOTAL RUNS')
    this.add.text(782, 28, '⚙️', { fontSize: '18px' }).setOrigin(1, 0.5).setAlpha(0.55)
  }

  private headerCard(x: number, icon: string, label: string): Phaser.GameObjects.Text {
    this.panel(x, 8, 112, 42, COL.panelFill, COL.panelBorder, 8)
    this.add.text(x + 10, 17, `${icon} ${label}`, { fontSize: '9px', color: COL.muted, fontFamily: 'monospace' })
    return this.add.text(x + 10, 31, '', { fontSize: '15px', color: COL.bright, fontFamily: 'monospace' })
  }

  // ── Horizontal tab row ──────────────────────────────────────
  private buildTabs() {
    const defs: { key: TabKey; label: string }[] = [
      { key: 'castle', label: '🏰 Castle' },
      { key: 'fireMage', label: '🔥 Fire Mage' },
      { key: 'recruits', label: '👥 Recruits' },
      { key: 'loadout', label: '⚔ Loadout' },
    ]
    const tabW = 185
    defs.forEach((d, i) => {
      const x = 20 + i * (tabW + 6)
      const gfx = this.add.graphics()
      const text = this.add.text(x + tabW / 2, 71, d.label, {
        fontSize: '14px', fontFamily: 'monospace',
      }).setOrigin(0.5)
      const entry: TabEntry = { key: d.key, x, w: tabW, gfx, text }
      const hit = this.add.rectangle(x + tabW / 2, 71, tabW, 30, 0x000000, 0).setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => this.selectTab(d.key))
      this.tabs.push(entry)
    })
  }

  private drawTab(t: TabEntry, active: boolean) {
    t.gfx.clear()
    t.gfx.fillStyle(active ? 0x3b1d7a : COL.panelFill, 1)
    t.gfx.fillRoundedRect(t.x, 56, t.w, 30, 8)
    t.gfx.lineStyle(active ? 2 : 1, active ? 0xa78bfa : 0x33304d, 1)
    t.gfx.strokeRoundedRect(t.x, 56, t.w, 30, 8)
    if (active) { // outer purple glow
      t.gfx.lineStyle(1, 0x7c3aed, 0.45)
      t.gfx.strokeRoundedRect(t.x - 2, 54, t.w + 4, 34, 10)
    }
    t.text.setColor(active ? COL.bright : '#9b96c4')
  }

  private selectTab(key: TabKey) {
    this.activeTab = key
    for (const t of this.tabs) this.drawTab(t, t.key === key)
    this.rebuild()
  }

  // ── Left stats column (always visible) ──────────────────────
  private buildStatsColumn() {
    this.panel(20, 94, 200, 398)
    this.add.text(32, 106, 'CASTLE STATS', { fontSize: '12px', color: COL.accent, fontFamily: 'monospace' })
    this.statRow(130, 'hp', '❤️', 'HP')
    this.statRow(157, 'armor', '🧱', 'Armor')
    this.statRow(184, 'shield', '🛡️', 'Shield')
    this.statRow(211, 'regen', '💚', 'Regen')
    this.statRow(238, 'spikes', '⛏️', 'Spikes')
    this.add.text(32, 274, 'FIRE MAGE STATS', { fontSize: '12px', color: COL.accent, fontFamily: 'monospace' })
    this.statRow(298, 'fmDmg', '🔥', 'Damage')
    this.statRow(325, 'fmCast', '⚡', 'Cast Speed')
    this.statRow(352, 'fmMp', '🔷', 'Max MP')
    this.statRow(379, 'fmRegen', '🌀', 'MP Regen')
  }

  private statRow(y: number, key: string, icon: string, label: string) {
    this.add.text(32, y, icon, { fontSize: '13px' }).setOrigin(0, 0.5)
    this.add.text(56, y, label, { fontSize: '11px', color: COL.body, fontFamily: 'monospace' }).setOrigin(0, 0.5)
    this.statTexts.set(key, this.add.text(208, y, '', {
      fontSize: '12px', color: COL.bright, fontFamily: 'monospace',
    }).setOrigin(1, 0.5))
  }

  // ── Bottom strip: recruit summary + Start Run + progress ────
  private buildBottom() {
    // Recruit summary (bottom-left)
    this.panel(20, 500, 240, 90)
    this.add.text(32, 508, '👥 RECRUITS', { fontSize: '10px', color: COL.accent, fontFamily: 'monospace' })
    RECRUIT_ORDER.forEach((id, i) => {
      const cx = 52 + i * 58
      this.add.text(cx, 538, RECRUITS[id].definition.emoji, { fontSize: '20px' }).setOrigin(0.5)
      this.summaryTexts.set(id, this.add.text(cx, 566, '', {
        fontSize: '9px', color: COL.body, fontFamily: 'monospace',
      }).setOrigin(0.5))
    })

    // Progress card (bottom-right)
    this.panel(600, 500, 180, 90)
    this.add.text(612, 508, '📊 PROGRESS', { fontSize: '10px', color: COL.accent, fontFamily: 'monospace' })
    this.progressText = this.add.text(612, 528, '', {
      fontSize: '11px', color: COL.body, fontFamily: 'monospace', lineSpacing: 5,
    })

    // Start Run (bottom-center) — primary call to action with a purple glow.
    const bx = 430, by = 546, bw = 300, bh = 56
    const glow = this.add.graphics().setAlpha(0.25)
    glow.fillStyle(0x7c3aed, 1); glow.fillRoundedRect(bx - bw / 2 - 6, by - bh / 2 - 6, bw + 12, bh + 12, 16)
    const g = this.add.graphics()
    g.fillStyle(0x6d28d9, 1); g.fillRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 12)
    g.lineStyle(2, 0xc4b5fd, 1); g.strokeRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 12)
    const label = this.add.text(bx, by, '⚔  START RUN', {
      fontSize: '24px', color: COL.bright, fontFamily: 'monospace',
    }).setOrigin(0.5)
    const hit = this.add.rectangle(bx, by, bw, bh, 0x000000, 0).setInteractive({ useHandCursor: true })
    hit.on('pointerdown', () => this.scene.start('RunScene'))
    hit.on('pointerover', () => { label.setScale(1.05); glow.setAlpha(0.45) })
    hit.on('pointerout', () => { label.setScale(1); glow.setAlpha(0.25) })
  }

  // ── Tab content (rebuilt on switch / purchase) ──────────────
  private rebuild() {
    for (const o of this.content) o.destroy()
    this.content = []
    this.upgradeButtons.clear()
    this.upgradeLevels.clear()
    switch (this.activeTab) {
      case 'castle': this.buildCastleTab(); break
      case 'fireMage': this.buildFireMageTab(); break
      case 'recruits': this.buildRecruitsTab(); break
      case 'loadout': this.buildLoadoutTab(); break
    }
    this.refreshUI()
  }

  private buildCastleTab() {
    this.contentTitle('🏰 Castle Upgrades')
    // Blue Mana Gain (global) as a compact top-right mini-row.
    this.compactRow(516, 110, 256, UPGRADES['blueManaGain'])
    let y = 132
    for (const id of this.sectionIds((s) => s.upgradeIds.includes('castleMaxHp'))) {
      this.upgradeRow(240, y, 532, UPGRADES[id])
      y += 58
    }
  }

  private buildFireMageTab() {
    this.contentTitle('🔥 Fire Mage Upgrades')
    let y = 132
    for (const id of this.sectionIds((s) => s.upgradeIds.includes('fireballDamage'))) {
      this.upgradeRow(240, y, 532, UPGRADES[id])
      y += 58
    }
    this.ct(this.add.text(248, 400, '🔥 Skills stay manual — cast Fire Wall / Firestorm / Fire Elemental', {
      fontSize: '11px', color: COL.muted, fontFamily: 'monospace',
    }))
    this.ct(this.add.text(248, 420, '   with the buttons or hotkeys 1 / 2 / 3 during a run.', {
      fontSize: '11px', color: COL.muted, fontFamily: 'monospace',
    }))
  }

  private buildRecruitsTab() {
    this.contentTitle('👥 Recruits')
    let y = 126
    for (const id of RECRUIT_ORDER) {
      this.recruitCard(240, y, 532, 84, id)
      y += 89
    }
  }

  private recruitCard(x: number, y: number, w: number, h: number, id: string) {
    const info = RECRUITS[id]
    const owned = gameState.ownsRecruit(id)
    this.ct(this.panel(x, y, w, h, 0x16142e, owned ? COL.ownedBorder : COL.rowBorder, 10))
    this.ct(this.add.text(x + 18, y + h / 2, info.definition.emoji, { fontSize: '26px' }).setOrigin(0, 0.5))
    this.ct(this.add.text(x + 56, y + 16, info.definition.name, {
      fontSize: '14px', color: '#e9d5ff', fontFamily: 'monospace',
    }))
    this.ct(this.add.text(x + 56, y + 38, owned ? '● OWNED' : '🔒 LOCKED', {
      fontSize: '10px', color: owned ? COL.green : '#9b8bb5', fontFamily: 'monospace',
    }))

    if (!owned) {
      const can = RecruitSystem.canBuy(id)
      const buy = this.smallButton(x + w - 18, y + h / 2, ` Buy ${info.cost} 💧 `, () => {
        if (RecruitSystem.buy(id)) this.rebuild()
      })
      buy.setBackgroundColor(can ? COL.btnOn : COL.btnOff).setColor(can ? COL.btnOnText : COL.btnOffText)
      this.ct(buy)
      return
    }
    // Owned: its upgrades (basic damage, cast speed, skill mastery) as compact rows.
    let ry = y + 17
    for (const uid of this.sectionIds((s) => s.requiresRecruit === id)) {
      this.compactRow(x + 250, ry, w - 268, UPGRADES[uid])
      ry += 23
    }
  }

  private buildLoadoutTab() {
    this.contentTitle('⚔ Battle Loadout')
    this.slotPanel('north', '⬆ North Tower', 128)
    this.ct(this.add.text(506, 248, '🧙 Fire Mage — fixed in the centre', {
      fontSize: '11px', color: '#fca5a5', fontFamily: 'monospace',
    }).setOrigin(0.5))
    this.slotPanel('south', '⬇ South Tower', 262)
  }

  private slotPanel(slot: 'north' | 'south', label: string, y: number) {
    const x = 240, w = 532, h = 104
    this.ct(this.panel(x, y, w, h, 0x16142e, COL.panelBorder, 10))
    this.ct(this.add.text(x + 16, y + 16, label, { fontSize: '13px', color: COL.accent, fontFamily: 'monospace' }))
    const cur = gameState.loadout[slot]
    const curLabel = cur ? `${RECRUITS[cur].definition.emoji} ${RECRUITS[cur].definition.name}` : '— Empty —'
    this.ct(this.add.text(x + 16, y + 42, `Assigned: ${curLabel}`, {
      fontSize: '12px', color: cur ? '#e9d5ff' : COL.btnOffText, fontFamily: 'monospace',
    }))

    let cx = x + 16
    for (const id of RECRUIT_ORDER) {
      const owned = gameState.ownsRecruit(id)
      const here = gameState.loadout[slot] === id
      const chip = this.add.text(cx, y + 78, ` ${RECRUITS[id].definition.emoji} ${RECRUITS[id].definition.name} `, {
        fontSize: '10px', fontFamily: 'monospace',
        color: !owned ? '#5b5772' : here ? '#052e16' : COL.heading,
        backgroundColor: !owned ? '#1a1830' : here ? COL.green : '#2a2350',
        padding: { x: 6, y: 4 },
      }).setOrigin(0, 0.5)
      if (owned) {
        chip.setInteractive({ useHandCursor: true })
        chip.on('pointerdown', () => { RecruitSystem.assign(slot, id); this.rebuild() })
      }
      this.ct(chip)
      cx += chip.width + 7
    }
    const clear = this.add.text(cx, y + 78, ' ✕ Clear ', {
      fontSize: '10px', color: '#fca5a5', backgroundColor: '#3a1d1d', fontFamily: 'monospace', padding: { x: 6, y: 4 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    clear.on('pointerdown', () => { gameState.setLoadoutSlot(slot, null); this.rebuild() })
    this.ct(clear)
  }

  // ── Shared row builders ─────────────────────────────────────
  private contentTitle(text: string) {
    this.ct(this.add.text(248, 110, text, { fontSize: '15px', color: COL.accent, fontFamily: 'monospace' }).setOrigin(0, 0.5))
  }

  // Full upgrade row: icon · name · description · level · cost button.
  private upgradeRow(x: number, y: number, w: number, def: typeof UPGRADES[string]) {
    const h = 54
    this.ct(this.panel(x, y, w, h, COL.rowFill, COL.rowBorder, 8))
    this.ct(this.add.text(x + 16, y + h / 2, def.emoji, { fontSize: '22px' }).setOrigin(0, 0.5))
    this.ct(this.add.text(x + 50, y + 12, def.name, { fontSize: '13px', color: '#e9d5ff', fontFamily: 'monospace' }))
    this.ct(this.add.text(x + 50, y + 32, this.truncate(def.description, 50), {
      fontSize: '10px', color: COL.muted, fontFamily: 'monospace',
    }))
    const lv = this.add.text(x + w - 150, y + h / 2, '', { fontSize: '12px', color: COL.body, fontFamily: 'monospace' }).setOrigin(0.5, 0.5)
    this.ct(lv); this.upgradeLevels.set(def.id, lv)
    const btn = this.smallButton(x + w - 14, y + h / 2, '', () => { if (UpgradeSystem.buyUpgrade(def)) this.rebuild() })
    this.ct(btn); this.upgradeButtons.set(def.id, btn)
  }

  // Compact one-line upgrade: name on the left, level+cost in the button.
  private compactRow(x: number, y: number, w: number, def: typeof UPGRADES[string]) {
    this.ct(this.add.text(x, y, `${def.emoji} ${def.name}`, {
      fontSize: '11px', color: COL.heading, fontFamily: 'monospace',
    }).setOrigin(0, 0.5))
    const btn = this.smallButton(x + w, y, '', () => { if (UpgradeSystem.buyUpgrade(def)) this.rebuild() }, '10px')
    this.ct(btn); this.upgradeButtons.set(def.id, btn)
  }

  private smallButton(x: number, y: number, label: string, onClick: () => void, fontSize = '12px'): Phaser.GameObjects.Text {
    const b = this.add.text(x, y, label, {
      fontSize, color: COL.btnOnText, fontFamily: 'monospace',
      backgroundColor: COL.btnOn, padding: { x: 9, y: 4 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
    b.on('pointerdown', onClick)
    b.on('pointerover', () => b.setAlpha(0.82))
    b.on('pointerout', () => b.setAlpha(1))
    return b
  }

  // ── Refresh all dynamic values (stats, header, summary, buttons) ──
  private refreshUI() {
    const u = gameState.upgrades
    const castle = UpgradeSystem.resolveCastle(u.castle)
    const mage = UpgradeSystem.resolveFireMage(u.defenders.fireMage)

    this.statTexts.get('hp')?.setText(`${castle.maxHp}`)
    this.statTexts.get('armor')?.setText(`${castle.armor}`)
    this.statTexts.get('shield')?.setText(`${castle.maxShield}`)
    this.statTexts.get('regen')?.setText(`${castle.regenPerSec}/s`)
    this.statTexts.get('spikes')?.setText(castle.spikeDamage > 0 ? `${castle.spikeDamage}` : '—')
    this.statTexts.get('fmDmg')?.setText(`${mage.damage}`)
    this.statTexts.get('fmCast')?.setText(`${mage.castInterval.toFixed(2)}s`)
    this.statTexts.get('fmMp')?.setText(`${mage.maxMp}`)
    this.statTexts.get('fmRegen')?.setText(`${mage.mpRegen}/s`)

    this.manaValue.setText(`${gameState.blueMana}`)
    this.bestWaveValue.setText(`${gameState.highestWaveEver}`)
    this.totalRunsValue.setText(`${gameState.totalRuns}`)

    const bonus = Math.round((UpgradeSystem.getManaGainMultiplier(u.global.blueManaGain) - 1) * 100)
    this.progressText.setText([
      `💧 Mana Bonus  +${bonus}%`,
      `🏆 Best Wave   ${gameState.highestWaveEver}`,
      `📜 Total Runs  ${gameState.totalRuns}`,
    ])

    for (const id of RECRUIT_ORDER) {
      const t = this.summaryTexts.get(id)
      if (!t) continue
      if (!gameState.ownsRecruit(id)) { t.setText('🔒').setColor(COL.btnOffText) }
      else { t.setText(`Lv.${this.masteryLevel(id)}`).setColor(COL.green) }
    }

    this.upgradeButtons.forEach((btn, id) => {
      const def = UPGRADES[id]
      const level = gameState.getUpgradeLevel(def.category, def.field)
      const lvText = this.upgradeLevels.get(id)
      if (level >= def.maxLevel) {
        lvText?.setText('MAX')
        btn.setText(' MAX ').setBackgroundColor(COL.btnOff).setColor(COL.btnOffText).disableInteractive()
      } else {
        const cost = UpgradeSystem.getCost(def, level)
        const afford = gameState.blueMana >= cost
        if (lvText) { lvText.setText(`Lv. ${level}`); btn.setText(` ${cost} 💧 `) }
        else btn.setText(` Lv.${level} · ${cost}💧 `)
        btn.setBackgroundColor(afford ? COL.btnOn : COL.btnOff).setColor(afford ? COL.btnOnText : COL.btnOffText)
      }
    })
  }

  // ── Small helpers ───────────────────────────────────────────
  private masteryLevel(recruitId: string): number {
    const section = UPGRADE_SECTIONS.find((s) => s.requiresRecruit === recruitId)
    const masteryId = section?.upgradeIds.find((idd) => idd.endsWith('Mastery'))
    if (!masteryId) return 0
    const def = UPGRADES[masteryId]
    return gameState.getUpgradeLevel(def.category, def.field)
  }

  private sectionIds(match: (s: typeof UPGRADE_SECTIONS[number]) => boolean): string[] {
    return UPGRADE_SECTIONS.find(match)?.upgradeIds ?? []
  }

  private truncate(s: string, n: number): string {
    return s.length > n ? `${s.slice(0, n - 1)}…` : s
  }

  private ct<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.content.push(o)
    return o
  }

  private panel(x: number, y: number, w: number, h: number, fill = COL.panelFill, border = COL.panelBorder, radius = 10): Phaser.GameObjects.Graphics {
    const g = this.add.graphics()
    g.fillStyle(fill, 1)
    g.fillRoundedRect(x, y, w, h, radius)
    g.lineStyle(1.5, border, 1)
    g.strokeRoundedRect(x, y, w, h, radius)
    return g
  }
}
