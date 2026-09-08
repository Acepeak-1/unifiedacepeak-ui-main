import { FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import Loader from '@/components/custom/loader';
import NumberWithFlag from '@/components/custom/number-with-flag';
import CustomTooltip from '@/components/custom/custom-tooltip';
import TableSearchHeader from '@/components/custom/table-search-header';
import { Icon } from '@/assets/icons/icon';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { allNumbersList } from '@/services/api';
import {
  canEditLabel,
  groupByLine,
  labelOf,
  matchesLineSearch,
  numberTypeOf,
  numbersWithoutLine,
  isSmsCapable,
} from '@/lib/number-labels';

/**
 * The numbers on each shared line, together.
 *
 * Every other view here is a flat list of numbers, which answers "what do we
 * own" and never answers "what rings Support". That second question is the one
 * asked when a number has to be added, retired or explained to a customer, and
 * today it is answered by reading the Forwarded-to column of a hundred rows.
 *
 * Nothing new is fetched. A line does not store its numbers — each number
 * stores where it forwards — so the grouping is that relationship read
 * backwards, out of the same list the other views use.
 *
 * The warning at the top is there because this screen would otherwise be
 * quietly misleading. A number pointed at a department, queue or menu is stored
 * correctly and looks correct here, and the switch that answers inbound calls
 * handles only two destinations: an extension and a voicemail box. Everything
 * else it logs as unhandled and drops. Showing these numbers grouped under
 * their line without saying so would tell an admin their setup is fine.
 */

const TYPE_WORDS: Record<string, string> = {
  DEPARTMENT: 'Department',
  QUEUE: 'Queue',
  IVR: 'Menu',
  AI: 'AI receptionist',
};

interface NumbersByLineProps {
  search: string;
  setSearch: (value: string) => void;
  onEditLabel: (did: any) => void;
  canLabel: boolean;
}

const NumbersByLine: FC<NumbersByLineProps> = ({ search, setSearch, onEditLabel, canLabel }) => {
  const {
    data: numbers = [],
    isPending,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['numbersByLine'],
    queryFn: () => fetchAllPages(allNumbersList),
    staleTime: 60 * 1000,
  });

  const groups = useMemo(() => groupByLine(numbers), [numbers]);
  const visible = useMemo(
    () => groups.filter((group) => matchesLineSearch(group, search)),
    [groups, search],
  );
  const unlinked = useMemo(() => numbersWithoutLine(numbers).length, [numbers]);

  if (isPending) {
    return (
      <div className="flex w-full items-center justify-center p-8">
        <Loader variant="blue" size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Description first, then search — matching All numbers' order. Its
          own top margin (not left to the shared `p:first-child` CSS rule,
          which only reaches one div deep into tbl-wrap and this component's
          own root div sits a level below that) keeps its border from
          touching the card above it, same as All numbers'. */}
      <p className="mx-4 mt-4 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-gray-900">
        <strong>These routes are stored but not yet carried out.</strong> Calls arriving on a number
        are only connected when it points at an extension or a voicemail box. A number pointing at a
        department, queue, menu or AI receptionist is saved correctly and shown here, but the call
        is dropped rather than answered. This is switch work, not a setting on this page.
      </p>

      {/* Each line renders its own small table below, so there is no single
          table header to attach this to — it sits here instead, in the same
          style as the other views' table search. Wrapped in the same
          border-b + px-3/py-2 padding TableManager gives its own
          `customHeader` (see table-manager.tsx) — without it the search
          pill sat flush against the card's edges instead of inset like
          every other Numbers table's search bar. */}
      <div className="ident-table-card ident-table-card--plain w-full flex flex-col">
        <div className="border-b border-b-gray-200">
          <div className="px-3 py-2">
            <TableSearchHeader
              value={search}
              onChange={setSearch}
              onRefresh={() => refetch()}
              refreshing={isRefetching}
              placeholder="Search lines"
            />
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="px-3 py-8 text-center">
          <p className="font-semibold text-gray-900">No lines to show</p>
          <p className="text-sm text-gray-500">
            {groups.length
              ? 'No line matches that search.'
              : 'Point a number at a department, queue or menu and it will be grouped here.'}
          </p>
        </div>
      ) : (
        visible.map((group) => (
          <section key={group.line.key} className="ident-line-card flex flex-col">
            <header className="ident-line-card__head flex flex-wrap items-baseline gap-2">
              <h3 className="text-md font-semibold text-gray-900">{group.line.name}</h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {TYPE_WORDS[group.line.type] || group.line.type}
              </span>
              <span className="text-xs text-gray-500">
                {group.numbers.length} {group.numbers.length === 1 ? 'number' : 'numbers'}
              </span>
            </header>
            <div className="ident-line-card__table-wrap">
              <table className="ident-line-table">
                <thead>
                  <tr>
                    <th>Phone number</th>
                    <th>Label</th>
                    <th>Type</th>
                    <th>Texting</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {group.numbers.map((did: any, index: number) => {
                    const label = labelOf(did);
                    const allowed = canEditLabel(did);
                    return (
                      <tr key={did?.uuid || did?.did_number}>
                        <td>
                          <div className="flex items-center gap-2">
                            <NumberWithFlag number={did?.did_number} />
                            {/* Not a stored flag — the platform has none. It is the
                                first number on the line, which is the one people
                                mean when they say "the Support number". */}
                            {index === 0 ? (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-800">
                                Primary
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>{label || <span className="text-gray-500">No label</span>}</td>
                        <td>{numberTypeOf(did)}</td>
                        <td>{isSmsCapable(did) ? 'Yes' : 'No'}</td>
                        <td className="text-center">
                          {canLabel && allowed.ok ? (
                            <CustomTooltip text={label ? 'Edit label' : 'Add label'} side="top">
                              <div
                                className="cursor-pointer flex items-center justify-center rounded-full w-8 h-8 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white mx-auto"
                                onClick={() => onEditLabel(did)}
                              >
                                <Icon name="EditStrokIcon" className="w-4 h-4" />
                              </div>
                            </CustomTooltip>
                          ) : (
                            <span className="text-gray-500">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="ident-line-card__footer">
              {group.numbers.length} {group.numbers.length === 1 ? 'record' : 'records'}
            </div>
          </section>
        ))
      )}

      {unlinked ? (
        <p className="text-xs text-gray-500">
          {unlinked} {unlinked === 1 ? 'number rings' : 'numbers ring'} a person, or nothing at all,
          so {unlinked === 1 ? 'it is' : 'they are'} not on a shared line. They are all in All
          numbers.
        </p>
      ) : null}
    </div>
  );
};

export default NumbersByLine;
