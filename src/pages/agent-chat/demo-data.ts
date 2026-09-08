/* ============================================================================
 * DEMO DATA — sample agent-chat conversations, for design review only.
 *
 * Same three rules the phone console's demo module follows, so nothing here
 * can be mistaken for a real visitor:
 *   1. Obviously synthetic — fixed names, ids prefixed `demo-`.
 *   2. Every list that renders it also renders a "Demo data" chip.
 *   3. Real data always wins. These only appear when the queue is empty, and
 *      are never mixed in alongside real conversations.
 *
 * TO TURN IT OFF: set DEMO_ENABLED to false. The queue then shows its honest
 * "All caught up!" state again and nothing else needs to change.
 * ==========================================================================*/

export const DEMO_ENABLED = true;

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

type DemoAgentChat = {
  chatId: string;
  isGroupChat: boolean;
  users: { uuid: string; first_name: string; last_name: string; profile: string }[];
  lastMessage: { message: string; senderId: string; createdAt: string };
  metaData: Record<string, any>;
};

/* Session and contact details the visitor profile panel reads, so a sample
   chat fills that panel instead of showing "Not provided" against every row. */
const PROFILES: Record<string, { email: string; city: string; country: string; device: string; ip: string; page: string }> = {
  u1: { email: 'priya.nair@example.com', city: 'Mumbai', country: 'IN', device: 'Windows 11 - Chrome 128', ip: '49.36.180.22', page: 'https://ajoxi.com/pricing' },
  u2: { email: 'tom.whitfield@example.com', city: 'Leeds', country: 'UK', device: 'macOS - Safari 17', ip: '81.132.44.9', page: 'https://ajoxi.com/checkout' },
  a1: { email: 'rahul.verma@example.com', city: 'Pune', country: 'IN', device: 'Android 14 - Chrome 128', ip: '103.21.58.140', page: 'https://ajoxi.com/orders' },
  a2: { email: 'emily.clark@example.com', city: 'Austin', country: 'US', device: 'macOS - Chrome 128', ip: '73.162.10.44', page: 'https://ajoxi.com/support' },
  a3: { email: 'marco.bianchi@example.com', city: 'Milan', country: 'IT', device: 'iOS 18 - Safari', ip: '93.44.201.7', page: 'https://ajoxi.com/billing' },
  m1: { email: 'daniel.osei@example.com', city: 'Accra', country: 'GH', device: 'Windows 10 - Edge 128', ip: '154.160.7.61', page: 'https://ajoxi.com/contact' },
  m2: { email: 'aiko.tanaka@example.com', city: 'Osaka', country: 'JP', device: 'macOS - Chrome 127', ip: '126.208.33.19', page: 'https://ajoxi.com/help' },
};

const chat = (
  id: string,
  firstName: string,
  lastName: string,
  message: string,
  minutes: number,
): DemoAgentChat => {
  const visitorId = `demo-visitor-${id}`;
  const profile = PROFILES[id] || PROFILES.a1;
  return {
    chatId: `demo-agent-chat-${id}`,
    isGroupChat: false,
    users: [{ uuid: visitorId, first_name: firstName, last_name: lastName, profile: '' }],
    lastMessage: { message, senderId: visitorId, createdAt: minutesAgo(minutes) },
    metaData: {
      lastMessage: message,
      lastMessageTimeStamp: minutesAgo(minutes),
      email: profile.email,
      location: { city: profile.city, country: profile.country },
      device: profile.device,
      ipAddress: profile.ip,
      page: profile.page,
      visitorType: 'Website Visitor',
    },
  };
};

/**
 * Sample conversations for a tab, shaped exactly as `ListItem` expects so the
 * rows render through the real component rather than a lookalike.
 *
 * The split is deliberate: an unassigned queue holds openers nobody has picked
 * up, an active one holds conversations mid-flow, and missed holds the ones
 * that timed out — so each tab reads like the thing it is.
 */
export const demoAgentChats = (tab: string): DemoAgentChat[] => {
  if (!DEMO_ENABLED) return [];

  if (tab === 'unassigned') {
    return [
      chat('u1', 'Priya', 'Nair', 'Hi — is the annual plan still discounted?', 2),
      chat('u2', 'Tom', 'Whitfield', 'My card was declined but the order went through?', 9),
    ];
  }

  if (tab === 'missed') {
    return [
      chat('m1', 'Daniel', 'Osei', 'Anyone there? I’ll try again later.', 64),
      chat('m2', 'Aiko', 'Tanaka', 'Never mind — found it in the help centre.', 132),
    ];
  }

  return [
    chat('a1', 'Rahul', 'Verma', 'Still waiting on the refund for order 48213-A.', 4),
    chat('a2', 'Emily', 'Clark', 'That worked, thank you! One more question…', 17),
    chat('a3', 'Marco', 'Bianchi', 'Can you send the invoice to a different address?', 41),
  ];
};

export default demoAgentChats;

/* ---------------------------------------------------------- conversation --
 * A short thread for a sample chat, so selecting one in the queue opens
 * something rather than an empty pane. Keyed off the chat id so each sample
 * reads as its own conversation, continuing the opener shown in the list.
 */
export type DemoAgentMessage = { id: string; fromVisitor: boolean; text: string; at: string };

const THREADS: Record<string, [boolean, string, number][]> = {
  'demo-agent-chat-u1': [
    [true, 'Hi — is the annual plan still discounted?', 2],
    [false, 'Hello! Yes, 20% off the annual plan runs until the end of the month.', 1],
  ],
  'demo-agent-chat-u2': [
    [true, 'My card was declined but the order went through?', 9],
    [false, 'Let me check that for you — could you confirm the last four digits?', 8],
  ],
  'demo-agent-chat-a1': [
    [true, 'Still waiting on the refund for order 48213-A.', 12],
    [false, 'Sorry about the delay. I can see it was approved on the 3rd.', 9],
    [true, 'How long does it usually take to land?', 6],
    [false, 'Three to five working days from approval, so it should be with you today.', 4],
  ],
  'demo-agent-chat-a2': [
    [true, 'That worked, thank you! One more question…', 17],
    [false, 'Of course — go ahead.', 16],
  ],
  'demo-agent-chat-a3': [
    [true, 'Can you send the invoice to a different address?', 41],
    [false, 'Certainly. What address should I use?', 38],
  ],
  'demo-agent-chat-m1': [[true, 'Anyone there? I’ll try again later.', 64]],
  'demo-agent-chat-m2': [[true, 'Never mind — found it in the help centre.', 132]],
};

export const demoAgentMessages = (chatId: string): DemoAgentMessage[] => {
  if (!DEMO_ENABLED) return [];
  const thread = THREADS[chatId] || THREADS['demo-agent-chat-a1'];
  return thread.map(([fromVisitor, text, minutes], i) => ({
    id: `${chatId}-msg-${i}`,
    fromVisitor,
    text,
    at: new Date(Date.now() - minutes * 60_000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));
};
