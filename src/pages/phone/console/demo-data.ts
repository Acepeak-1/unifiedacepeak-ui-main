/* ============================================================================
 * DEMO DATA — placeholder customer intelligence, for design review only.
 *
 * The artifact's panel shows a depth of customer history the platform does not
 * expose yet: written call recaps, action items with owners, CSAT and auto-QA
 * scores, account tier and tenure, a per-interaction mood timeline. Until those
 * services exist this module invents them so the panes can be judged visually.
 *
 * Rules this module follows, so demo content can never be mistaken for real
 * customer data:
 *   1. Everything here is derived from a hash of the phone number — stable per
 *      number between renders, but obviously synthetic.
 *   2. Every pane that renders it also renders a "Demo" chip next to it.
 *   3. Real data always wins. Demo values only fill a gap the API left empty.
 *
 * TO TURN IT ALL OFF: set DEMO_ENABLED to false. The panes then show honest
 * empty states instead, and nothing else needs to change.
 * ==========================================================================*/

export const DEMO_ENABLED = true;

/** Stable, boring hash so the same number always gets the same demo profile. */
const hash = (value: string) => {
  let h = 0;
  const s = String(value || 'unknown');
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const pick = <T>(list: T[], seed: number, offset = 0) => list[(seed + offset) % list.length];

const TIERS = ['Retail — Standard', 'Retail — Plus', 'Business — Pro', 'Enterprise'];
const CITIES = [
  ['Manchester, UK', 'BST (UTC+1)'],
  ['Mumbai, IN', 'IST (UTC+5:30)'],
  ['Austin, US', 'CDT (UTC-5)'],
  ['Dublin, IE', 'IST (UTC+1)'],
];
const QUEUES = ['Retail_Billing_L1', 'Retail_Technical_L1', 'VIP_Concierge', 'Support_L2'];
const LANGS = ['English', 'English', 'Hindi', 'Spanish'];
const AGENTS = ['Sofia Petrova', 'Umar Ansari', 'Helen Chase', 'Daniel Moore', 'Meera Kapoor'];

export type DemoProfile = {
  account: string;
  tier: string;
  since: string;
  city: string;
  tz: string;
  balance: string;
  openTickets: number;
  lifetimeCalls: number;
  language: string;
  queue: string;
  flow: string;
  contractEnds: string;
  priority: number;
};

export const demoProfile = (number: string): DemoProfile => {
  const seed = hash(number);
  const [city, tz] = pick(CITIES, seed);
  const years = 1 + (seed % 7);
  const months = seed % 12;
  return {
    account: `MCM-${String(1000 + (seed % 8999))}-${String(1000 + ((seed >> 3) % 8999))}`,
    tier: pick(TIERS, seed),
    since: `${years} yr ${months} mo`,
    city,
    tz,
    balance: `$${(40 + (seed % 260)).toFixed(2)}`,
    openTickets: seed % 3,
    lifetimeCalls: 3 + (seed % 22),
    language: pick(LANGS, seed, 1),
    queue: pick(QUEUES, seed, 2),
    flow: 'MCM_Main_IVR v14',
    contractEnds: pick(['14 Oct', '02 Dec', '28 Feb', '19 Jun'], seed, 3),
    priority: 1 + (seed % 3),
  };
};

export type DemoInteraction = {
  id: string;
  date: string;
  duration: string;
  direction: 'Inbound' | 'Outbound';
  queue: string;
  agent: string;
  mood: 'pos' | 'neg' | 'neu' | 'acc';
  title: string;
  code: string;
  summary: string;
  items: string[];
};

const TOPICS: [string, string, DemoInteraction['mood'], string, string[]][] = [
  [
    'Duplicate direct debit not refunded',
    'Billing — Dispute',
    'neg',
    'Customer chased a duplicate collection raised the week before. No finance decision was found and a 24-hour callback was promised. Sentiment fell across the call.',
    ['Callback within 24h — NOT COMPLETED', 'Escalate to finance — completed'],
  ],
  [
    'Payment dispute raised',
    'Billing — Dispute',
    'neg',
    'Customer reported being charged twice for the same month. A dispute reference was logged and a 3 working day review was promised.',
    ['Finance review — OPEN 7 days'],
  ],
  [
    'Switched to paperless billing',
    'Billing — Complete',
    'pos',
    'Paperless billing enabled during the call. Customer confirmed the change and thanked the agent for the speed.',
    [],
  ],
  [
    'Annual account review',
    'AM — Review',
    'acc',
    'Reviewed tariff and usage. Customer was happy and confirmed they intended to renew.',
    ['Send tariff comparison — completed'],
  ],
  [
    'Broadband speed follow-up',
    'Technical — Resolved',
    'pos',
    'Line test run on the call, profile reset applied. Speeds confirmed back to normal before hanging up.',
    ['Monitor line for 48h — completed'],
  ],
];

export const demoInteractions = (number: string, count = 4): DemoInteraction[] => {
  const seed = hash(number);
  const profile = demoProfile(number);
  return Array.from({ length: count }).map((_, i) => {
    const [title, code, mood, summary, items] = TOPICS[(seed + i) % TOPICS.length];
    const daysAgo = (i + 1) * (2 + (seed % 4));
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return {
      id: `demo-${i}`,
      date: d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
      duration: `${String(2 + ((seed + i) % 18)).padStart(2, '0')}:${String((seed + i * 7) % 60).padStart(2, '0')}`,
      direction: (seed + i) % 3 === 0 ? 'Outbound' : 'Inbound',
      queue: profile.queue,
      agent: pick(AGENTS, seed, i),
      mood,
      title,
      code,
      summary,
      items,
    };
  });
};

export type DemoRecap = {
  reason: string;
  happened: string;
  outcome: { label: string; tone: 'pos' | 'warn' | 'neg' }[];
  outcomeNote: string;
  actions: { text: string; owner: string }[];
  stats: { k: string; v: string; tone?: 'pos' | 'neg' | 'warn' }[];
};

export const demoRecap = (number: string): DemoRecap => {
  const seed = hash(number);
  const profile = demoProfile(number);
  const interaction = demoInteractions(number, 1)[0];
  return {
    reason: `${interaction.title}. ${profile.openTickets ? `${profile.openTickets} case(s) still open on this account.` : 'No open cases on the account.'}`,
    happened:
      'Customer opened by restating the issue from the previous call. Identity verification passed. The agent confirmed the fault sat with us rather than the customer, and committed to a specific fix with a date instead of a general promise to look into it.',
    outcome: [
      { label: 'Resolved in call', tone: 'pos' },
      { label: 'Follow-up required', tone: 'warn' },
    ],
    outcomeNote:
      'Root cause identified and actioned live. Recovery is conditional on the fix actually landing within the promised window.',
    actions: [
      { text: 'Confirm the refund reached the account', owner: 'You · 3 days' },
      { text: 'Apply one month credit for the repeat failure', owner: 'Billing · 24h' },
      {
        text: `Flag contract end ${profile.contractEnds} for review`,
        owner: pick(AGENTS, seed, 4),
      },
    ],
    stats: [
      {
        k: 'Sentiment',
        v: `−${40 + (seed % 40)} → −${10 + (seed % 15)} · recovering`,
        tone: 'neg',
      },
      { k: 'Inferred CSAT', v: `${(2.8 + (seed % 20) / 10).toFixed(1)} / 5`, tone: 'warn' },
      { k: 'Talk ratio', v: `You ${35 + (seed % 15)}% · Customer ${45 + (seed % 10)}%` },
      { k: 'Auto-QA score', v: `${78 + (seed % 20)} / 100` },
      { k: 'Retention', v: 'Save play executed', tone: 'pos' },
    ],
  };
};

export type DemoNote = {
  id: string;
  who: string;
  initials: string;
  when: string;
  body: string;
  pinned?: boolean;
  ai?: boolean;
  src?: string;
};

export const demoNotes = (number: string): DemoNote[] => {
  const seed = hash(number);
  const agent = pick(AGENTS, seed, 2);
  return [
    {
      id: 'demo-note-1',
      who: 'AI Copilot',
      initials: 'AI',
      when: 'Auto-written from the last call recap',
      ai: true,
      body: 'Second contact about the same billing issue. The customer was told finance would review within 3 days on the previous call; no review was logged and no callback was made.',
      src: 'Generated from call recap',
    },
    {
      id: 'demo-note-2',
      who: agent,
      initials: agent
        .split(' ')
        .map((p) => p[0])
        .join(''),
      when: 'Pinned by the team lead',
      pinned: true,
      body: 'ESCALATION FLAG. Long-standing customer and the second month this has happened. Route straight to Billing rather than back through the IVR.',
    },
  ];
};

/* ---------------------------------------------------------------- call log --
 * Sample rows for the call list, and a sample Copilot exchange.
 *
 * Same three rules as everything above: synthetic and obvious, always chipped
 * as demo where it renders, and only ever shown when the platform returned
 * nothing. Unlike the version removed earlier, these never top up a partial
 * result — a list with one real call shows one call, not one call and five
 * inventions.
 */

export type DemoCallRow = {
  id: string;
  direction: 'in' | 'out' | 'miss';
  name: string;
  number: string;
  time: string;
  duration: string;
  hasRecording: boolean;
};

const DEMO_CALLS_BASE: DemoCallRow[] = [
  { id: 'demo-call-1', direction: 'in', name: 'Aarav Mehta', number: '+919876543210', time: '14:34', duration: '04:34', hasRecording: true },
  { id: 'demo-call-2', direction: 'out', name: 'Sophia Turner', number: '+14155550132', time: '13:20', duration: '02:36', hasRecording: true },
  { id: 'demo-call-3', direction: 'miss', name: '', number: '+447911123456', time: '12:05', duration: '—', hasRecording: false },
  { id: 'demo-call-4', direction: 'in', name: 'Rahul Verma', number: '+919812345678', time: '11:10', duration: '01:12', hasRecording: false },
  { id: 'demo-call-5', direction: 'out', name: 'Emily Clark', number: '+12025550187', time: '09:45', duration: '03:48', hasRecording: true },
  { id: 'demo-call-6', direction: 'miss', name: 'Liam Wong', number: '+61291234567', time: '08:30', duration: '—', hasRecording: false },
];

export const demoCallRows = (source: 'call' | 'recording' | 'voicemail'): DemoCallRow[] => {
  if (!DEMO_ENABLED) return [];
  if (source === 'recording') return DEMO_CALLS_BASE.filter((r) => r.hasRecording);
  /* A voicemail is an inbound call nobody picked up, so the missed rows are
     the only honest sample for that list. */
  if (source === 'voicemail') {
    return DEMO_CALLS_BASE.filter((r) => r.direction !== 'out').map((r) => ({
      ...r,
      id: `${r.id}-vm`,
      duration: r.duration === '—' ? '00:24' : r.duration,
    }));
  }
  return DEMO_CALLS_BASE;
};

/* ----------------------------------------------------------------- copilot --
 * A sample exchange, so the Copilot pane shows what it does before an agent is
 * configured or a call is up. Marked as demo, and replaced the moment the real
 * socket returns anything.
 */
export type DemoAskMessage = { role: 'q' | 'a'; text: string };

export const demoAskThread = (): DemoAskMessage[] => {
  if (!DEMO_ENABLED) return [];
  return [
    { role: 'q', text: 'Summarise this call so far' },
    {
      role: 'a',
      text: 'The caller is chasing order 48213-A, placed last Tuesday and not yet delivered. You confirmed it shipped and is out for delivery today. They asked to be notified if it slips again.',
    },
    { role: 'q', text: 'What should I say next?' },
    {
      role: 'a',
      text: 'Offer to set a delivery alert on the order, then confirm the best number to reach them on. If they push for compensation, the goodwill credit on this account is £10 without approval.',
    },
  ];
};

/* ------------------------------------------------------- record view legs --
 * Sample rows for the call record's Calls / Recordings / Voicemails lists.
 *
 * Deliberately carry no media URL: there is no recording behind them, so they
 * show the row and its metadata and offer no player rather than pointing at
 * some third-party sample clip. Shown only when the contact has none of that
 * kind, and chipped as demo where they render.
 */
export type DemoLeg = {
  id: string;
  direction: 'in' | 'out' | 'miss';
  when: string;
  duration: string;
  by: string;
  viaDid: string;
};

const DEMO_LEGS: DemoLeg[] = [
  { id: 'demo-leg-1', direction: 'out', when: '3 Sep, 6:12 PM', duration: '02:14', by: 'Priya Nair', viaDid: '+1 415 555 0132' },
  { id: 'demo-leg-2', direction: 'in', when: '2 Sep, 11:40 AM', duration: '00:47', by: 'Ravi Kumar', viaDid: '+1 415 555 0132' },
  { id: 'demo-leg-3', direction: 'miss', when: '1 Sep, 9:05 AM', duration: '00:00', by: '—', viaDid: '+1 415 555 0132' },
  { id: 'demo-leg-4', direction: 'in', when: '31 Aug, 4:22 PM', duration: '03:00', by: 'Priya Nair', viaDid: '+44 20 7946 0958' },
];

export const demoRecordLegs = (tab: 'calls' | 'recordings' | 'voicemails'): DemoLeg[] => {
  if (!DEMO_ENABLED) return [];
  /* A missed call never connected, so it has neither a recording nor a
     voicemail-length row — same rule the real lists use. */
  if (tab === 'recordings') return DEMO_LEGS.filter((l) => l.direction !== 'miss');
  if (tab === 'voicemails') {
    return DEMO_LEGS.filter((l) => l.direction !== 'out').map((l) => ({
      ...l,
      id: `${l.id}-vm`,
      duration: l.duration === '00:00' ? '00:24' : l.duration,
    }));
  }
  return DEMO_LEGS;
};

/* ------------------------------------------------- call panel placeholders --
 * Notes, transcript and summary for the call side panel, so each tab shows
 * what it is for before a call has produced anything real. Same three rules as
 * the rest of this module: obviously synthetic, chipped where it renders, and
 * only ever shown when the platform has given us nothing.
 */
export type DemoNoteEntry = { text: string; who: string; number: string; at: string };

export const demoCallNotes = (): DemoNoteEntry[] => {
  if (!DEMO_ENABLED) return [];
  return [
    {
      text: 'Wants the delivery alert set on order 48213-A. Confirmed the mobile on file is the right one to text.',
      who: 'Aarav Mehta',
      number: '+91 98765 43210',
      at: '3 Sep 2026, 18:14',
    },
    {
      text: 'Asked about the £10 goodwill credit — applied, no approval needed. Mentioned they may upgrade the plan next quarter.',
      who: 'Sophia Turner',
      number: '+1 415 555 0132',
      at: '2 Sep 2026, 11:47',
    },
  ];
};

export const demoTranscriptTurns = () => {
  if (!DEMO_ENABLED) return [];
  const turns: {
    id: string;
    speaker: 'agent' | 'customer';
    who: string;
    time: string;
    text: string;
    isSummary: boolean;
  }[] = [
    ['customer', 'Aarav Mehta', '00:02', 'Hi — I’m calling about my order, it still hasn’t turned up.'],
    ['agent', 'You', '00:07', 'Sorry about that. Could you give me the order number and I’ll take a look?'],
    ['customer', 'Aarav Mehta', '00:15', 'It’s 48213-A.'],
    ['agent', 'You', '00:21', 'Thanks. It shipped yesterday and it’s out for delivery today.'],
    ['customer', 'Aarav Mehta', '00:34', 'That’s a relief. Can you let me know if it slips again?'],
    ['agent', 'You', '00:39', 'Of course — I’ll set an alert on it now and text you on this number.'],
  ].map(([speaker, who, time, text], i) => ({
    id: `demo-turn-${i}`,
    speaker: speaker as 'agent' | 'customer',
    who: who as string,
    time: time as string,
    text: text as string,
    isSummary: false,
  }));
  return turns;
};

export const demoCallSummary = (): string[] => {
  if (!DEMO_ENABLED) return [];
  return [
    'Opened with — chasing order 48213-A, not yet delivered.',
    'Confirmed the order shipped yesterday and is out for delivery today.',
    'Agreed to set a delivery alert and text this number if it slips.',
    '6 turns so far · 3 from the agent',
  ];
};
