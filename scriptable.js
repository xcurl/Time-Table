// ─────────────────────────────────────────────
//  CSE VI-B Timetable Widget  ·  Scriptable iOS
//  v10 — Universal visibility fix
//        Text = strip color (vivid on ANY bg)
//        Works on dark wallpaper & Liquid Glass
// ─────────────────────────────────────────────

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const SLOTS = [
  { l: '08:30–09:25', s: 510, e: 565 },
  { l: '09:25–10:20', s: 565, e: 620 },
  { l: '10:20–10:40', s: 620, e: 640 },
  { l: '10:40–11:35', s: 640, e: 695 },
  { l: '11:35–12:30', s: 695, e: 750 },
  { l: '12:30–01:30', s: 750, e: 810 },
  { l: '01:30–02:25', s: 810, e: 865 },
  { l: '02:25–03:20', s: 865, e: 920 },
  { l: '03:20–04:20', s: 920, e: 980 },
]

const TT = Object.freeze({
  1: [
    { n: 'CNSL Lab' }, { n: 'CNSL Lab' }, { n: 'Tea Break' },
    { n: 'PE-4', r: 'Room 201' }, { n: 'ASDD' }, { n: 'Lunch Break' },
    { n: 'CNS' }, { n: 'CC' }, { n: 'Free Hour' }
  ],
  2: [
    { n: 'CNS' }, { n: 'CC' }, { n: 'Tea Break' },
    { n: 'OE-2' }, { n: 'PE-5', r: 'Room 112' }, { n: 'Lunch Break' },
    { n: 'WT' }, { n: 'CCL Lab' }, { n: 'CCL Lab' }
  ],
  3: [
    { n: 'CC' }, { n: 'ASDD' }, { n: 'Tea Break' },
    { n: 'PE-5', r: 'Room 114' }, { n: 'PE-4', r: 'Room 114' }, { n: 'Lunch Break' },
    { n: 'WT' }, { n: 'Free Hour' }, { n: 'Free Hour' }
  ],
  4: [
    { n: 'WT' }, { n: 'CNS' }, { n: 'Tea Break' },
    { n: 'OE-2' }, { n: 'OE-2' }, { n: 'Lunch Break' },
    { n: 'PE-5', r: 'Room 113' }, { n: 'Adv Placement' }, { n: 'Adv Placement' }
  ],
  5: [
    { n: 'WTL Lab' }, { n: 'WTL Lab' }, { n: 'Tea Break' },
    { n: 'Adv Placement' }, { n: 'Adv Placement' }, { n: 'Lunch Break' },
    { n: 'PE-4', r: 'Room 101' }, { n: 'ASDD' }, { n: 'Free Hour' }
  ],
  6: [
    { n: 'Seminar/Club' }, { n: 'Seminar/Club' }, { n: 'Tea Break' },
    { n: 'Seminar/Club' }, { n: 'Seminar/Club' }, { n: 'Lunch Break' },
    { n: 'Seminar/Club' }, { n: 'Seminar/Club' }, { n: 'Seminar/Club' }
  ],
})

// ── COLOR PHILOSOPHY ──────────────────────────
// Strip colors are VIVID mid-range hues — not too light, not too dark.
// They sit in the 50–60% lightness range so they're readable on BOTH
// a white (Liquid Glass) AND a dark (normal) background.
// Row backgrounds are just a very faint tint of the same hue at low opacity.
// Text color = strip color → always visible regardless of iOS rendering mode.

const S = {
  // Strip / text colors — vivid mid-tone, readable on any bg
  normal:   new Color('#7c6eff'),   // indigo
  lab:      new Color('#0ea5e9'),   // sky
  tea:      new Color('#d97706'),   // amber  (darker so visible on white)
  lunch:    new Color('#e11d78'),   // pink   (darker for white bg)
  free:     new Color('#059669'),   // emerald
  seminar:  new Color('#ea580c'),   // orange
  active:   new Color('#9333ea'),   // purple
  past:     new Color('#6b7280'),   // gray
  accent:   new Color('#6d28d9'),   // violet — header title
}

// Row tints — same hue, very low opacity so they give a hint of color
// without fighting whatever background iOS puts behind them
const R = {
  normal:  new Color('#7c6eff', 0.12),
  lab:     new Color('#0ea5e9', 0.12),
  tea:     new Color('#d97706', 0.12),
  lunch:   new Color('#e11d78', 0.12),
  free:    new Color('#059669', 0.12),
  seminar: new Color('#ea580c', 0.12),
  active:  new Color('#9333ea', 0.22),   // slightly more prominent for NOW
  past:    new Color('#6b7280', 0.06),
}

const THEMES = {
  normal:  { strip: S.normal,  row: R.normal  },
  lab:     { strip: S.lab,     row: R.lab     },
  tea:     { strip: S.tea,     row: R.tea     },
  lunch:   { strip: S.lunch,   row: R.lunch   },
  free:    { strip: S.free,    row: R.free    },
  seminar: { strip: S.seminar, row: R.seminar },
}

// ── HELPERS ───────────────────────────────────
function nowMins() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function slotAt(m) {
  for (let i = 0; i < SLOTS.length; i++)
    if (m >= SLOTS[i].s && m < SLOTS[i].e) return i
  return -1
}

function msToNextBoundary(m) {
  for (let i = 0; i < SLOTS.length; i++)
    if (m < SLOTS[i].s) return (SLOTS[i].s - m) * 60000
  return 3600000
}

function typeOf(n) {
  const lo = n.toLowerCase()
  if (lo === 'tea break')                            return 'tea'
  if (lo === 'lunch break')                          return 'lunch'
  if (lo === 'free hour')                            return 'free'
  if (lo.includes('lab'))                            return 'lab'
  if (lo.includes('seminar') || lo.includes('club')) return 'seminar'
  return 'normal'
}

function getDayGroups(d) {
  const row = TT[d]
  if (!row) return []
  const out = []
  let i = 0
  while (i < SLOTS.length) {
    const e = row[i]
    if (!e) { i++; continue }
    let j = i + 1
    while (j < SLOTS.length && row[j] && row[j].n === e.n && (row[j].r||'') === (e.r||'')) j++
    out.push({ entry: e, from: i, to: j - 1, type: typeOf(e.n) })
    i = j
  }
  return out
}

// ── RUNTIME ───────────────────────────────────
const now    = new Date()
const day    = now.getDay()
const mins   = nowMins()
const groups = getDayGroups(day)

let curGroup = -1
const si = slotAt(mins)
if (si >= 0) {
  for (let i = 0; i < groups.length; i++) {
    if (si >= groups[i].from && si <= groups[i].to) { curGroup = i; break }
  }
}

// ── WIDGET SHELL ──────────────────────────────
const WSIZE = config.widgetFamily
const w = new ListWidget()
w.backgroundColor = Color.clear()   // let iOS apply its material (dark or glass)
w.setPadding(13, 13, 13, 13)
w.refreshAfterDate = new Date(Date.now() + msToNextBoundary(mins))
// No w.url — tapping does nothing

if      (WSIZE === 'small')  buildSmall(w)
else if (WSIZE === 'medium') buildMedium(w)
else                         buildLarge(w)

Script.setWidget(w)
if (!config.runsInWidget) await w.presentLarge()
Script.complete()

// ─────────────────────────────────────────────
//  HEADER
// ─────────────────────────────────────────────
function drawHeader(w) {
  const hdr = w.addStack()
  hdr.layoutHorizontally()
  hdr.centerAlignContent()

  const t = hdr.addText('CSE VI‑B')
  t.font = Font.boldSystemFont(16)
  t.textColor = S.accent

  hdr.addSpacer()

  const dl = hdr.addText(DAYS[day].toUpperCase())
  dl.font = Font.boldSystemFont(10)
  // Use a label color that adapts — system label is always readable
  dl.textColor = new Color('#888888', 0.80)
}

// ─────────────────────────────────────────────
//  ROW
// ─────────────────────────────────────────────
function drawRow(w, grp, gIdx, pNum, vertPad) {
  const { entry, type, from, to } = grp
  const isBreak = type === 'tea' || type === 'lunch'
  const isAct   = gIdx === curGroup
  const isPast  = curGroup >= 0 && gIdx < curGroup

  // Pick strip + row tint
  let strip, rowBg
  if (isAct) {
    strip = S.active;  rowBg = R.active
  } else if (isPast) {
    strip = S.past;    rowBg = R.past
  } else {
    const th = THEMES[type]
    strip = th.strip;  rowBg = th.row
  }

  // Row shell — faint tint only, no solid fill
  const outer = w.addStack()
  outer.layoutHorizontally()
  outer.cornerRadius = 10
  outer.backgroundColor = rowBg

  // Left colour strip (5px)
  const strp = outer.addStack()
  strp.layoutVertically()
  strp.size = new Size(5, 0)
  strp.backgroundColor = isPast ? new Color(strip.hex, 0.40) : strip

  // Content
  const inner = outer.addStack()
  inner.layoutHorizontally()
  inner.centerAlignContent()
  inner.setPadding(vertPad, 10, vertPad, 10)
  inner.spacing = 6

  // Period number / break dot — strip color, always vivid
  const idxT = inner.addText(isBreak ? '·' : String(pNum))
  idxT.font = Font.boldSystemFont(isBreak ? 11 : 12)
  idxT.textColor = new Color(strip.hex, isPast ? 0.40 : 0.90)
  idxT.minimumScaleFactor = 0.8

  // Subject name — strip color = vivid on any background
  const nameT = inner.addText(to > from ? entry.n + '  ×' + (to - from + 1) : entry.n)
  nameT.font = isAct
    ? Font.boldSystemFont(14)
    : (isBreak ? Font.regularSystemFont(12) : Font.semiboldSystemFont(13))
  nameT.textColor = isPast
    ? new Color(strip.hex, 0.45)
    : strip                          // ← key fix: text = strip color
  nameT.minimumScaleFactor = 0.65
  nameT.lineLimit = 1

  inner.addSpacer()

  // Room pill
  if (entry.r && !isPast) {
    const rmSt = inner.addStack()
    rmSt.layoutHorizontally()
    rmSt.centerAlignContent()
    rmSt.setPadding(2, 6, 2, 6)
    rmSt.cornerRadius = 5
    rmSt.backgroundColor = new Color(strip.hex, 0.15)
    const rmT = rmSt.addText(entry.r.replace('Room ', 'R'))
    rmT.font = Font.boldSystemFont(8)
    rmT.textColor = strip
    inner.addSpacer(5)
  }

  // Start time — strip color at reduced opacity
  const timeT = inner.addText(SLOTS[from].l.split('–')[0].trim())
  timeT.font = Font.regularSystemFont(10)
  timeT.textColor = new Color(strip.hex, isPast ? 0.30 : 0.60)
}

// ─────────────────────────────────────────────
//  SMALL
// ─────────────────────────────────────────────
function buildSmall(w) {
  drawHeader(w)
  w.addSpacer(10)

  if (day === 0) {
    const s = w.addText('Sunday\n🌿 Rest Day')
    s.font = Font.boldSystemFont(16)
    s.textColor = S.free
    return
  }

  const g = curGroup >= 0 ? groups[curGroup] : null
  if (g) {
    const th = THEMES[g.type] || THEMES.normal
    const badge = w.addText('▸ NOW')
    badge.font = Font.boldSystemFont(9)
    badge.textColor = th.strip
    w.addSpacer(4)
    const nm = w.addText(g.entry.n)
    nm.font = Font.boldSystemFont(20)
    nm.textColor = th.strip
    nm.minimumScaleFactor = 0.5
    if (g.entry.r) {
      w.addSpacer(2)
      const rm = w.addText(g.entry.r)
      rm.font = Font.boldSystemFont(10)
      rm.textColor = S.accent
    }
    w.addSpacer(5)
    const tl = w.addText(SLOTS[g.from].l.split('–')[0] + '–' + SLOTS[g.to].l.split('–')[1])
    tl.font = Font.regularSystemFont(10)
    tl.textColor = new Color('#888888', 0.80)
  } else {
    const msg = mins < 510 ? 'Before\n08:30 AM' : (mins >= 980 ? 'All Done!\n🎉' : 'No class\nright now')
    const t2 = w.addText(msg)
    t2.font = Font.boldSystemFont(16)
    t2.textColor = new Color('#888888', 0.80)
  }

  w.addSpacer()

  const ni = curGroup >= 0 ? curGroup + 1 : 0
  if (ni < groups.length) {
    const ng = groups[ni]
    const np = THEMES[ng.type] || THEMES.normal
    const nr = w.addStack()
    nr.layoutHorizontally()
    nr.centerAlignContent()
    const nxt = nr.addText('Next  ')
    nxt.font = Font.regularSystemFont(10)
    nxt.textColor = new Color('#888888', 0.70)
    const nxn = nr.addText(ng.entry.n)
    nxn.font = Font.boldSystemFont(10)
    nxn.textColor = np.strip
    nxn.minimumScaleFactor = 0.7
  }
}

// ─────────────────────────────────────────────
//  MEDIUM
// ─────────────────────────────────────────────
function buildMedium(w) {
  drawHeader(w)
  w.addSpacer(7)

  if (day === 0) {
    w.addSpacer()
    const s = w.addText('Sunday — No Classes 🌿')
    s.font = Font.boldSystemFont(14)
    s.textColor = S.free
    w.addSpacer()
    return
  }

  const visible = groups.slice(0, 5)
  let pNum = 1
  for (let g = 0; g < visible.length; g++) {
    drawRow(w, visible[g], g, pNum, 8)
    if (visible[g].type !== 'tea' && visible[g].type !== 'lunch') pNum++
    if (g < visible.length - 1) w.addSpacer(3)
  }
}

// ─────────────────────────────────────────────
//  LARGE
// ─────────────────────────────────────────────
function buildLarge(w) {
  drawHeader(w)
  w.addSpacer(6)

  if (day === 0) {
    w.addSpacer()
    const s = w.addText('Sunday\nNo Classes 🌿')
    s.font = Font.boldSystemFont(18)
    s.textColor = S.free
    w.addSpacer()
    return
  }

  const sec = w.addStack()
  sec.layoutHorizontally()
  sec.addSpacer()
  const secT = sec.addText("TODAY'S SCHEDULE")
  secT.font = Font.boldSystemFont(7)
  secT.textColor = new Color('#888888', 0.60)
  sec.addSpacer()
  w.addSpacer(5)

  let pNum = 1
  for (let g = 0; g < groups.length; g++) {
    const grp = groups[g]
    const isBreak = grp.type === 'tea' || grp.type === 'lunch'
    drawRow(w, grp, g, pNum, isBreak ? 7 : 12)
    if (!isBreak) pNum++
    if (g < groups.length - 1) w.addSpacer(3)
  }
}
