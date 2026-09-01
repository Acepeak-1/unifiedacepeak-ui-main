import TableManager from '@/components/custom/table-manager';
import Timer from '@/components/timer';
import { isMonitoringCallForMember } from '@/pages/monitoring/live-call-helpers';
import PerfStatCard from './stat-card';
import type { QueueCallStats } from '@/hooks/use-call-stats';
import { formatSecsToClock } from './format';
import buildQueueRows from './queue-rows';
import type { QueueRow, QueueStats, LiveQueueStats } from './queue-rows';

export type { QueueRow } from './queue-rows';

const STATUS_STYLES: Record<string, string> = {
  'On Call': 'state busy',
  Available: 'state q',
  Offline: 'state away',
};

/**
 * Calls accumulated across the loaded CDR range, oldest hour first.
 *
 * Cumulative rather than per-hour on purpose. Per-hour counts are the same
 * information, but on a quiet queue they are mostly zeroes with the odd single
 * call between them, which draws a row of spikes that looks like noise and
 * reads like nothing. The running total answers the question the card is
 * actually asking — how the day built up to the figure above it.
 *
 * This is the only history the page holds. The live figures (who is on the
 * roster, who is free, who is on a call right now) are point-in-time reads with
 * nothing behind them, so the cards built on those carry no chart at all rather
 * than a shape that isn't a measurement.
 */
const HOUR_MS = 60 * 60 * 1000;

const callVolumeSeries = (rows: any[], queueUuid?: string): number[] => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const buckets = new Map<number, number>();
  rows.forEach((row) => {
    if (queueUuid && String(row?.queue_uuid || '') !== queueUuid) return;
    const stamp = Date.parse(row?.start_stamp);
    if (Number.isNaN(stamp)) return;
    // Keyed by absolute hour so a range spanning midnight stays in order
    // instead of wrapping back round to 00:00.
    const hour = Math.floor(stamp / HOUR_MS);
    buckets.set(hour, (buckets.get(hour) || 0) + 1);
  });

  if (buckets.size < 2) return [];

  const hours = [...buckets.keys()].sort((a, b) => a - b);
  const series: number[] = [];
  let running = 0;
  for (let hour = hours[0]; hour <= hours[hours.length - 1]; hour += 1) {
    running += buckets.get(hour) || 0;
    series.push(running);
  }
  return series;
};

/** Mirrors the KPI band's grading so the dot and the console agree. */
const queueTone = (sla: number | null | undefined) => {
  if (sla === null || sla === undefined) return 'muted';
  if (sla >= 80) return 'good';
  if (sla >= 60) return 'warn';
  return 'crit';
};

const getMemberStatus = (member: any, usersOnlineStatus: any[], activeQueueCalls: any[]) => {
  const key = member?.user_uuid || member?.extension || member?.uuid;
  if (!key) return 'Offline';
  if (activeQueueCalls.some((call) => isMonitoringCallForMember(call, key))) return 'On Call';
  const presence = usersOnlineStatus?.find((u: any) => String(u?.userId) === String(key));
  return presence?.online ? 'Available' : 'Offline';
};

const QueuesActivityTab = ({
  queues,
  activeQueueCalls,
  queueStatsByUuid,
  liveSlaByName,
  liveQueueStatsByName,
  cdrByQueueUuid,
  cdrRows,
  isCdrSampled,
  usersOnlineStatus,
  isLoading,
  selectedQueueUuid,
  setSelectedQueueUuid,
}: {
  queues: QueueRow[];
  activeQueueCalls: any[];
  queueStatsByUuid: Record<string, QueueStats>;
  liveSlaByName: Record<string, number>;
  liveQueueStatsByName: Record<string, LiveQueueStats>;
  cdrByQueueUuid?: Record<string, QueueCallStats>;
  /** Raw CDR rows for the selected range — the source of the cards' history. */
  cdrRows?: any[];
  isCdrSampled?: boolean;
  usersOnlineStatus: any[];
  isLoading: boolean;
  selectedQueueUuid: string | null;
  setSelectedQueueUuid: (uuid: string | null) => void;
}) => {
  const rows = buildQueueRows({
    queues,
    activeQueueCalls,
    queueStatsByUuid,
    liveSlaByName,
    liveQueueStatsByName,
    cdrByQueueUuid,
  });

  const selectedRow = rows.find((row) => row.uuid === selectedQueueUuid) || null;

  // Prefer the queue with a live interacting call; when nothing is in progress
  // right now (common outside peak hours) fall back to who handled the most
  // today instead of always reading "—".
  const queuesWithInteracting = rows.filter((row) => row.interacting > 0);
  const busiestQueue = queuesWithInteracting.length
    ? queuesWithInteracting.reduce((top, row) => (row.interacting > top.interacting ? row : top))
    : rows.reduce((top: (typeof rows)[number] | null, row) => {
        if (row.handledToday === null) return top;
        if (!top || (top.handledToday ?? -1) < row.handledToday) return row;
        return top;
      }, null);

  const longestWaitingQueue = rows.reduce((top: (typeof rows)[number] | null, row) => {
    if (row.longestWaitTimestamp === null) return top;
    if (!top || top.longestWaitTimestamp === null) return row;
    return row.longestWaitTimestamp < top.longestWaitTimestamp ? row : top;
  }, null);
  const slaRows = rows.filter((row) => row.sla !== null);
  const lowestSlaQueue = slaRows.reduce(
    (worst: (typeof rows)[number] | null, row) =>
      !worst || (row.sla as number) < (worst.sla as number) ? row : worst,
    null,
  );
  const totalMembers = new Set(rows.flatMap((row) => row.memberKeys)).size;

  // Available Now — dedupe by agent, not by queue: an agent on 3 queues was
  // getting counted 3x by summing each queue's available_count directly.
  const distinctMembersByKey = new Map<string, any>();
  queues.forEach((queue) => {
    (queue.members || []).forEach((member: any) => {
      const key = member?.user_uuid || member?.extension || member?.uuid;
      if (key && !distinctMembersByKey.has(String(key)))
        distinctMembersByKey.set(String(key), member);
    });
  });
  const totalAvailable = Array.from(distinctMembersByKey.values()).filter(
    (member) => getMemberStatus(member, usersOnlineStatus, activeQueueCalls) === 'Available',
  ).length;

  const totalInteracting = rows.reduce((sum, row) => sum + row.interacting, 0);

  const columns = [
    {
      header: 'Queue',
      accessorKey: 'name',
      /* The name is the row's anchor, so it carries the most weight and the
         health dot rather than a badge. Left in ink rather than the accent —
         coloured, it read as a hyperlink; the accent arrives on hover, where
         it means "this is clickable". */
      cell: ({ row }: any) => (
        <button
          type="button"
          className={`qt-name tone-${queueTone(row.original.sla)}`}
          onClick={() => setSelectedQueueUuid(row.original.uuid)}
        >
          <i className="qt-dot" aria-hidden="true" />
          {row.original.name}
        </button>
      ),
    },
    {
      header: 'Media',
      accessorKey: 'media',
      cell: () => <span className="qt-mute">Voice</span>,
    },
    { header: 'Waiting', accessorKey: 'waiting' },
    {
      header: 'Longest',
      accessorKey: 'longestWaitTimestamp',
      cell: ({ row }: any) =>
        row.original.longestWaitTimestamp ? (
          <Timer startTime={row.original.longestWaitTimestamp} />
        ) : (
          '—'
        ),
    },
    { header: 'Members', accessorKey: 'membersCount' },
    { header: 'Interacting', accessorKey: 'interacting' },
    {
      header: 'Offered',
      accessorKey: 'offered',
      cell: ({ row }: any) => (row.original.offered === null ? '—' : row.original.offered),
    },
    {
      header: 'Handled',
      accessorKey: 'handledToday',
      cell: ({ row }: any) =>
        row.original.handledToday === null || row.original.handledToday === undefined
          ? '—'
          : row.original.handledToday,
    },
    {
      header: 'SL today',
      accessorKey: 'sla',
      /* The one column that earns a graphic: a hairline meter under the figure
         turns "which queue is in trouble" into something you catch without
         reading any of the numbers. It is also the only column allowed colour. */
      cell: ({ row }: any) => {
        if (row.original.sla === null) return <span className="qt-mute">—</span>;
        const pct = Math.round(row.original.sla);
        return (
          <span className={`qt-sla tone-${queueTone(row.original.sla)}`}>
            <span className="qt-sla-v">{pct}%</span>
            <span className="qt-sla-bar">
              <i style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
            </span>
          </span>
        );
      },
    },
    {
      header: 'ASA',
      accessorKey: 'asa',
      cell: ({ row }: any) =>
        row.original.asa === null || row.original.asa === undefined ? (
          <span className="qt-mute">—</span>
        ) : (
          <span className="qt-mute">{formatSecsToClock(row.original.asa)}</span>
        ),
    },
    {
      header: 'AHT',
      accessorKey: 'aht',
      cell: ({ row }: any) =>
        row.original.aht === null ? (
          <span className="qt-mute">—</span>
        ) : (
          <span className="qt-mute">{formatSecsToClock(row.original.aht)}</span>
        ),
    },
    { header: 'Abandon', accessorKey: 'abandonRate' },
  ];

  if (selectedRow) {
    const memberRows = (selectedRow.members || []).map((member: any) => ({
      name: member?.name || 'Unknown',
      status: getMemberStatus(member, usersOnlineStatus, activeQueueCalls),
    }));

    const memberColumns = [
      { header: 'Agent', accessorKey: 'name' },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }: any) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.original.status] || STATUS_STYLES.Offline}`}
          >
            {row.original.status}
          </span>
        ),
      },
    ];

    const detailKpis = [
      { label: 'Waiting', value: String(selectedRow.waiting) },
      {
        label: 'Longest wait',
        value: selectedRow.longestWaitTimestamp ? (
          <Timer startTime={selectedRow.longestWaitTimestamp} />
        ) : (
          '00:00'
        ),
      },
      { label: 'Interacting', value: String(selectedRow.interacting) },
      { label: 'Members', value: String(selectedRow.membersCount) },
      {
        label: 'Handled',
        value:
          selectedRow.handledToday === null || selectedRow.handledToday === undefined
            ? '—'
            : String(selectedRow.handledToday),
      },
      {
        label: 'Service level',
        value: selectedRow.sla === null ? '—' : `${Math.round(selectedRow.sla)}%`,
      },
      {
        label: 'ASA',
        value:
          selectedRow.asa === null || selectedRow.asa === undefined
            ? '—'
            : formatSecsToClock(selectedRow.asa),
      },
      { label: 'Abandon', value: selectedRow.abandonRate },
    ];

    return (
      <div className="flex flex-col gap-3 px-[22px] py-4">
        <div
          className="flex items-center gap-1.5"
          style={{ fontSize: 11.5, color: 'var(--ink-3)' }}
        >
          <button
            type="button"
            onClick={() => setSelectedQueueUuid(null)}
            className="cursor-pointer text-primary hover:underline"
          >
            Queues Activity
          </button>
          <span>›</span>
          <span style={{ fontWeight: 700, color: 'var(--ink-2)' }}>{selectedRow.name}</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-.035em' }}>
          {selectedRow.name}
        </h2>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {detailKpis.map((kpi) => (
            <PerfStatCard key={kpi.label} label={kpi.label} value={kpi.value} />
          ))}
        </div>

        <div>
          <h3 className="sect-title" style={{ marginBottom: 8 }}>
            Members — live status
          </h3>
          <TableManager
            columns={memberColumns}
            staticData={memberRows}
            showPagination={false}
            emptyTablePlaceholder="No members in this queue"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-[22px] py-4">
      {/* Charts appear only on the cards whose figure has a run of history
          behind it — the three queue-scoped ones plus overall traffic. Members,
          available and interacting are live counts with nothing to plot. */}
      {/* Six across from tablet up so the row never wraps and the queue table
          stays above the fold — it used to break to three columns under 1280px,
          which pushed the table off screen on a laptop. `stat-row` caps how
          wide the row may grow, which is what keeps the cards upright on a
          large screen. */}
      <div className="stat-row grid grid-cols-3 gap-2 md:grid-cols-6">
        <PerfStatCard
          portrait
          label="Busiest queue"
          value={busiestQueue ? busiestQueue.name : '—'}
          sub={
            busiestQueue
              ? busiestQueue.interacting > 0
                ? `${busiestQueue.interacting} interacting now`
                : `${busiestQueue.handledToday} handled today`
              : undefined
          }
          series={busiestQueue ? callVolumeSeries(cdrRows || [], busiestQueue.uuid) : undefined}
        />
        <PerfStatCard
          portrait
          label="Longest waiting"
          value={
            longestWaitingQueue && longestWaitingQueue.longestWaitTimestamp !== null ? (
              <Timer startTime={longestWaitingQueue.longestWaitTimestamp} />
            ) : (
              '00:00'
            )
          }
          sub={
            longestWaitingQueue && longestWaitingQueue.longestWaitTimestamp !== null
              ? longestWaitingQueue.name
              : undefined
          }
          series={
            longestWaitingQueue
              ? callVolumeSeries(cdrRows || [], longestWaitingQueue.uuid)
              : undefined
          }
        />
        <PerfStatCard
          portrait
          label="Lowest SLA today"
          value={lowestSlaQueue ? `${Math.round(lowestSlaQueue.sla as number)}%` : '—'}
          sub={lowestSlaQueue ? lowestSlaQueue.name : undefined}
          tone={lowestSlaQueue && (lowestSlaQueue.sla as number) < 60 ? 'danger' : 'default'}
          series={lowestSlaQueue ? callVolumeSeries(cdrRows || [], lowestSlaQueue.uuid) : undefined}
        />
        <PerfStatCard
          portrait
          label="Total members"
          value={String(totalMembers)}
          sub="across all queues"
        />
        <PerfStatCard
          portrait
          label="Available now"
          value={String(totalAvailable)}
          sub="free to take a call"
        />
        <PerfStatCard
          portrait
          label="Total interacting"
          value={String(totalInteracting)}
          sub="on a call right now"
          series={callVolumeSeries(cdrRows || [])}
        />
      </div>
      {isCdrSampled && (
        <p className="page-note">
          Offered, Handled, ASA, AHT and Abandon are counted from the most recent 1,000 calls in
          this range — older calls in the range aren't included in these columns.
        </p>
      )}
      <TableManager
        columns={columns}
        staticData={rows}
        loading={isLoading}
        showPagination={false}
        /* Scopes this page's table treatment — TableManager is shared by ~84
           screens, so none of it is applied globally. */
        customClass="queues-table"
        emptyTablePlaceholder="No queues configured"
        descriptionEmptyTable="Call queues you create will show live activity here."
      />
    </div>
  );
};

export default QueuesActivityTab;
