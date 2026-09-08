/**
 * Fabricated call-log rows, used only when a fresh/test account genuinely has
 * no calls in the selected range — every figure across Performance's tabs
 * (the KPI band, Queues Activity, Agents, Interactions, Dashboards, Reports)
 * would otherwise read 0 or "—" forever. Shaped exactly like the real CDR
 * rows `useCallStats` and the report builders (`./reports/builders.ts`)
 * already know how to read, so nothing downstream needs to special-case them.
 *
 * Deliberately built from the account's own real queues/agents when they
 * exist (a real "Ucaas Test" queue gets real-looking history instead of a
 * fictional one appearing next to it) and only falls back to invented names
 * when the account has none of its own yet. See
 * `use-performance-call-stats.ts`, which is the only thing that decides
 * *whether* to use this — this module only builds the rows.
 */

const FALLBACK_QUEUES = [
  { uuid: 'dummy-queue-sales', name: 'Sales' },
  { uuid: 'dummy-queue-support', name: 'Support' },
  { uuid: 'dummy-queue-billing', name: 'Billing' },
];

const FALLBACK_AGENTS = [
  { extension: '1001', first_name: 'Alex', last_name: 'Turner' },
  { extension: '1002', first_name: 'Priya', last_name: 'Nair' },
  { extension: '1003', first_name: 'Sam', last_name: 'Rivera' },
];

const IVR_FLOWS = ['Main Greeting', 'After Hours', 'Billing Menu'];
const DIDS = ['+14155550110', '+14155550122', '+14155550134', '+14155550146'];
const CALLER_NUMBERS = [
  '+14155551201',
  '+14155551202',
  '+14155551203',
  '+14155551204',
  '+14155551205',
  '+14155551206',
  '+14155551207',
];
const CONTACT_NAMES = ['Jordan Lee', 'Casey Brooks', 'Morgan Diaz', null, null, null];

/** Small deterministic PRNG so the fallback dataset is stable across renders
 *  (no `Math.random()` reshuffling every KPI on each refetch tick). */
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pick = <T,>(rand: () => number, list: T[]): T => list[Math.floor(rand() * list.length)];

export type DummyEntityQueue = { uuid: string; name: string };
export type DummyEntityAgent = { extension?: string; first_name?: string; last_name?: string };

/**
 * ~90 rows spread across today, weighted toward queue calls (most of
 * Performance's cards and reports are queue-shaped), with a slice of IVR
 * entries, a realistic answer/abandon mix, and enough repeat callers /
 * shared DIDs for the reports that group by those to have something to show.
 */
export const buildDummyCdrRows = (
  realQueues: DummyEntityQueue[],
  realAgents: DummyEntityAgent[],
) => {
  const queues = realQueues.length ? realQueues : FALLBACK_QUEUES;
  const agents = (realAgents.length ? realAgents : FALLBACK_AGENTS).filter(
    (agent) => agent.extension,
  );
  const effectiveAgents = agents.length ? agents : FALLBACK_AGENTS;

  const rand = mulberry32(20240613);
  const dayStart = new Date();
  dayStart.setHours(8, 0, 0, 0);
  const rows: any[] = [];

  const ROW_COUNT = 90;
  for (let i = 0; i < ROW_COUNT; i += 1) {
    const isIvr = rand() < 0.12;
    const isQueueCall = !isIvr;
    const direction = rand() < 0.62 ? 'inbound' : 'outbound';
    // Roughly 14% of inbound queue calls go unanswered.
    const isAbandoned = isQueueCall && direction === 'inbound' && rand() < 0.14;
    const talkSeconds = isAbandoned ? 0 : Math.round(45 + rand() * 420);
    const waitSeconds = isAbandoned ? Math.round(10 + rand() * 90) : Math.round(rand() * 25);
    const totalSeconds = talkSeconds + waitSeconds;
    const queue = pick(rand, queues);
    const agent = pick(rand, effectiveAgents);
    const minutesIntoDay = Math.round(rand() * 9 * 60); // spread across a ~9h working day
    const startStamp = new Date(dayStart.getTime() + minutesIntoDay * 60000);
    const charge = Number((0.01 + rand() * 0.35).toFixed(4));

    rows.push({
      forward_type: isIvr ? 'IVR' : 'QUEUE',
      forward_value: isQueueCall ? queue.uuid : undefined,
      forward_uuid: isQueueCall ? queue.uuid : undefined,
      queue_uuid: isQueueCall ? queue.uuid : undefined,
      forward_name: isIvr ? pick(rand, IVR_FLOWS) : queue.name,
      direction,
      billsectotal: talkSeconds,
      billsec: talkSeconds,
      durationtotal: totalSeconds,
      duration: totalSeconds,
      is_voicemail: false,
      status: isAbandoned ? 'missed' : talkSeconds > 0 ? 'answered' : 'no_answer',
      start_stamp: startStamp.toISOString(),
      via_did: pick(rand, DIDS),
      caller_id_number: pick(rand, CALLER_NUMBERS),
      contact_name: pick(rand, CONTACT_NAMES),
      chargeTotal: charge,
      charge,
      extension: agent.extension,
      to_display_name: `${agent.first_name || ''} ${agent.last_name || ''}`.trim(),
    });
  }

  return rows;
};

/** The server-side aggregate `callStats` block the real API returns beside
 *  the row page — kept in sync with the generated rows above. */
export const buildDummyCallStatsSummary = (rows: any[]) => {
  const missed = rows.filter((row) => row.status === 'missed').length;
  const inbound = rows.filter((row) => row.direction === 'inbound').length;
  const outbound = rows.length - inbound;
  return {
    total_calls: rows.length,
    missed_calls: missed,
    inbound_calls: inbound,
    outbound_calls: outbound,
    voicemail: 0,
  };
};

/** Per-agent "today" stats, shaped like `callReportAgentList`'s rows —
 *  the source `useLiveContactCentre` reads for each agent's Daily Stats /
 *  AHT on Performance ▸ Agents (a different endpoint from the CDR above). */
export const buildDummyAgentStats = (rows: any[], realAgents: DummyEntityAgent[]) => {
  const agents = (realAgents.length ? realAgents : FALLBACK_AGENTS).filter(
    (agent) => agent.extension,
  );
  const effectiveAgents = agents.length ? agents : FALLBACK_AGENTS;

  return effectiveAgents.map((agent) => {
    const ownRows = rows.filter((row) => row.extension === agent.extension);
    const answered = ownRows.filter((row) => Number(row.billsectotal) > 0);
    const incoming = ownRows.filter((row) => row.direction === 'inbound').length;
    const outgoing = ownRows.filter((row) => row.direction === 'outbound').length;
    const talkMinutes = Math.round(
      answered.reduce((sum, row) => sum + Number(row.billsectotal || 0), 0) / 60,
    );
    return {
      first_name: agent.first_name,
      last_name: agent.last_name,
      stats: {
        answered_calls: answered.length,
        total_calls: ownRows.length,
        incoming_calls: incoming,
        outgoing_calls: outgoing,
        time_on_calls_minutes: talkMinutes,
      },
    };
  });
};

/** Per-queue "live" reads (SLA, seats available) — sourced from the live
 *  socket feed on the real hook, not the CDR, so they need their own fake
 *  values keyed the same way (`liveSlaByName`/`liveQueueStatsByName`, both
 *  keyed by lowercased queue name). */
export const buildDummyLiveQueueReads = (queues: DummyEntityQueue[]) => {
  const list = queues.length ? queues : FALLBACK_QUEUES;
  const rand = mulberry32(4242);
  const liveSlaByName: Record<string, number> = {};
  const liveQueueStatsByName: Record<
    string,
    { totalCalls: number; avgWaitSec: number; availableCount: number }
  > = {};
  list.forEach((queue) => {
    const key = queue.name.toLowerCase();
    liveSlaByName[key] = Math.round(70 + rand() * 25);
    liveQueueStatsByName[key] = {
      totalCalls: Math.round(10 + rand() * 25),
      avgWaitSec: Math.round(5 + rand() * 20),
      availableCount: Math.max(1, Math.round(rand() * 3)),
    };
  });
  return { liveSlaByName, liveQueueStatsByName };
};
