/**
 * Fabricated data for the Performance tabs that fetch their own, independent
 * data (each has its own `useQuery`/API call rather than sharing the CDR
 * dataset in `dummy-call-data.ts`). Used only as a fallback when the real
 * result is empty — see each tab file for exactly where it's applied.
 */

/** Shaped like a `campaignList` row (see `campaign-activity-tab.tsx` /
 *  `reports/builders.ts`'s `campaignPerformance`). */
export const DUMMY_CAMPAIGNS = [
  {
    name: 'Spring Renewal Outreach',
    dialMethod: 'PREDICTIVE',
    campaignStatus: 'ACTIVE',
    members: JSON.stringify([{ user_uuid: 'dummy-agent-1' }, { user_uuid: 'dummy-agent-2' }]),
    campaignAnalytics: {
      assignedLeads: 420,
      answeredLeads: 168,
      totalCallNotAnswered: 210,
      totalDnc: 12,
    },
  },
  {
    name: 'Winback — Lapsed Accounts',
    dialMethod: 'PROGRESSIVE',
    campaignStatus: 'ACTIVE',
    members: JSON.stringify([{ user_uuid: 'dummy-agent-2' }]),
    campaignAnalytics: {
      assignedLeads: 260,
      answeredLeads: 94,
      totalCallNotAnswered: 151,
      totalDnc: 5,
    },
  },
  {
    name: 'Q3 Product Survey',
    dialMethod: 'PREVIEW',
    campaignStatus: 'PAUSED',
    members: JSON.stringify([{ user_uuid: 'dummy-agent-3' }]),
    campaignAnalytics: {
      assignedLeads: 150,
      answeredLeads: 61,
      totalCallNotAnswered: 84,
      totalDnc: 3,
    },
  },
] as const;

/** Shaped like a `calendarMeetingList` task row (see `callbacks-tab.tsx`). */
export const DUMMY_TASKS = [
  {
    name: 'Follow up — pricing question',
    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    startTime: new Date(Date.now() + 2 * 3600_000).toISOString(),
    status: 'PENDING',
    source: 'Inbound call',
  },
  {
    name: 'Callback — missed support call',
    createdAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
    startTime: new Date(Date.now() - 1 * 3600_000).toISOString(),
    status: 'PENDING',
    source: 'Voicemail',
  },
  {
    name: 'Confirm onboarding call',
    createdAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    startTime: new Date(Date.now() + 24 * 3600_000).toISOString(),
    status: 'COMPLETED',
    source: 'Inbound call',
  },
] as const;

/** Shaped like a `callList` voicemail row (see `callbacks-tab.tsx`). */
export const DUMMY_VOICEMAILS = [
  {
    start_stamp: new Date(Date.now() - 2 * 3600_000).toISOString(),
    caller_id_number: '+14155551208',
    via_did: '+14155550110',
    billsectotal: 38,
  },
  {
    start_stamp: new Date(Date.now() - 6 * 3600_000).toISOString(),
    caller_id_number: '+14155551209',
    via_did: '+14155550122',
    billsectotal: 21,
  },
] as const;

/** Shaped like the socket "AI live wallboard" result read by
 *  `dashboards-tab.tsx`, `speech-text-tab.tsx` and `reports-tab.tsx`
 *  (sentiment/topics report). */
export const DUMMY_AI_RESULT = {
  avg_sentiment: 24,
  total_ai_calls: 37,
  ai_containment_percent: 62,
  total_ai_chats: 54,
  transferred_calls: 14,
  ai_receptionist_performance: {
    handled_ai_only: 23,
    avg_duration_sec: 96,
    lead_captured_counts: 11,
  },
  voice_vs_text_interactions: { voice_percent: 58, text_percent: 42 },
  sentiment_buckets: [
    { label: 'Positive', count: 21, percent: 57 },
    { label: 'Neutral', count: 10, percent: 27 },
    { label: 'Negative', count: 6, percent: 16 },
  ],
  intent_count: {
    billing: 14,
    support: 11,
    sales: 8,
    scheduling: 4,
  },
} as const;

/** Shaped like the socket AI wallboard's `agents` list read by
 *  `speech-text-tab.tsx`. */
export const DUMMY_AI_AGENTS = [
  { agent_name: 'Alex Turner', today_sentiment_calls: 14, avg_sentiment: 31, sentiment_counts: { negative_percent: 9 } },
  { agent_name: 'Priya Nair', today_sentiment_calls: 11, avg_sentiment: 18, sentiment_counts: { negative_percent: 14 } },
  { agent_name: 'Sam Rivera', today_sentiment_calls: 12, avg_sentiment: 12, sentiment_counts: { negative_percent: 22 } },
] as const;
