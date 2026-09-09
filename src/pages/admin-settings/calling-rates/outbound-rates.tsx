/* What one destination costs, per minute or per message.
 *
 * The screen answers a single question — "what does calling here cost?" — so
 * it asks for one thing (a destination) and answers with a table of that
 * destination's prices: what each price connects to, what it costs, and the
 * terms it is charged under.
 *
 * It used to offer a second lookup mode, "Phone", which took a full phone
 * number instead of a country. Nothing downstream could use it: every row the
 * table renders is keyed to a country and a dialling code, so a number-level
 * search returned the same country-level rows a country search does — and
 * when the two disagreed (a number in one country, rates for another) the
 * table looked simply wrong. One lookup, one meaning.
 */

import { useEffect, useMemo, useState } from 'react';
import CustomSelect from '@/components/custom/custom-select';
import CustomTooltip from '@/components/custom/custom-tooltip';
import { LandlineOutlined, MobileOutlined } from '@/assets/icons';
import { useMutation } from '@tanstack/react-query';
import { callingRatesList } from '@/services/api';
import ReactCountryFlag from 'react-country-flag';
import { useUser } from '@/hooks/use-user';
import { demoRates } from './constant';
import Loader from '@/components/custom/loader';
import countryList from '@/lib/countries.json';
import { Info, Image as ImageIcon, Mail } from 'lucide-react';
import { Icon } from '@/assets/icons/icon';

type RateKind = 'outbound' | 'inbound' | 'sms' | 'mms';

type RateRow = {
  id: string;
  prefix?: string;
  iso?: string;
  rate?: number | string;
  countryName?: string;
  icon: React.ReactNode;
  typeName: string;
  kind: RateKind;
  /* The terms the price is charged under — see constant.ts. */
  billingIncrement?: string;
  connectionFee?: number;
  effectiveFrom?: string;
};

/* Carrier rates run to four decimals — $0.0089 is a real price and rounding it
   to $0.01 overstates it by twelve percent. Trailing zeros are dropped so the
   common prices stay short. */
const formatRate = (value?: number | string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `$${amount.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') || '0'}`;
};

const KIND_LABEL: Record<RateKind, string> = {
  outbound: 'Outbound',
  inbound: 'Inbound',
  sms: 'SMS',
  mms: 'MMS',
};

/* Per minute or per message — a bare price does not say which, and the two are
   not comparable. Short form, because it sits inline with the figure rather
   than in a column of its own with no heading. */
const KIND_UNIT: Record<RateKind, string> = {
  outbound: '/min',
  inbound: '/min',
  sms: '/msg',
  mms: '/msg',
};

/* "60 / 60 sec" is how carriers write it and not how anybody reads it. A
   second line says the same thing in the unit a person actually bills in. */
const incrementHint = (value?: string) => {
  if (!value) return null;
  const match = value.match(/^\s*(\d+)\s*\/\s*(\d+)\s*sec/i);
  if (!match) return null;
  const step = Number(match[2]);
  if (!Number.isFinite(step) || step <= 0) return null;
  if (step === 1) return 'then per second';
  if (step === 60) return 'then per minute';
  return `then per ${step} sec`;
};

const formatFee = (value?: number) => {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) return '—';
  const amount = Number(value);
  if (amount === 0) return 'None';
  return `$${amount.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const OutboundRates = () => {
  const { user } = useUser();
  const [selectedCountry, setSelectedCountry]: any = useState({ label: '', value: '' });
  const [ratesData, setRatesData]: any = useState({});
  const [kind, setKind] = useState<'all' | RateKind>('all');

  const { mutate: getRates, isPending } = useMutation({
    mutationKey: ['callingRatesList'],
    mutationFn: callingRatesList,
    onSuccess: (data) => {
      setRatesData(data?.data?.data?.result);
    },
  });

  useEffect(() => {
    const home = (countryList as any[]).find((c) => c?.name === user?.countryInfo?.countryname);
    setSelectedCountry({
      label: home?.phonecode
        ? `${user?.countryInfo?.countryname} (+${String(home.phonecode).replace(/^\+/, '')})`
        : user?.countryInfo?.countryname,
      value: user?.countryInfo?.countryname,
      icon: <ReactCountryFlag countryCode={user?.countryInfo?.alpha2code} svg />,
    });

    if (user?.countryInfo?.countryname) {
      getRates({ filter: { key: 'COUNTRY', value: user?.countryInfo?.countryname } });
    }
  }, [user]);

  /* Picking a destination is the whole query, so it runs on selection. The
     separate "Show rates" button asked for a second click to do the only
     thing the first click could have meant. */
  const handleCountryChange = (value: any) => {
    setSelectedCountry(value);
    if (value?.value) getRates({ filter: { key: 'COUNTRY', value: value.value } });
  };

  /* DEMO fallback — remove with `demoRates` before release. The endpoint
     returns nothing for this workspace, so without it the table is empty and
     there is nothing to design against. */
  const selectedIso = useMemo(
    () =>
      (countryList as any[]).find((c) => c?.name === selectedCountry?.value)?.isoCode ||
      user?.countryInfo?.alpha2code ||
      '',
    [selectedCountry, user],
  );
  const selectedDial = useMemo(
    () => (countryList as any[]).find((c) => c?.name === selectedCountry?.value)?.phonecode || '',
    [selectedCountry],
  );

  const ratesBlock: RateRow[] = useMemo(() => {
    const buildRows = (source: any): RateRow[] => {
      const iso = source?.country?.iso;
      const country = source?.country?.name;
      /* Every row used to key off the country name, which is the same string
         on all of them — React saw one row where there were nine. */
      const build = (list: any[], kindKey: RateKind, typeOf: (rate: any) => string) =>
        (list ?? []).map((rate: any, index: number) => ({
          id: `${kindKey}-${rate?.dialprefix ?? ''}-${rate?.type ?? ''}-${index}`,
          prefix: rate?.dialprefix,
          iso,
          rate: rate?.rate,
          countryName: country || rate?.destination,
          typeName: typeOf(rate),
          kind: kindKey,
          billingIncrement: rate?.billing_increment,
          connectionFee: rate?.connection_fee,
          effectiveFrom: rate?.effective_from,
          icon:
            kindKey === 'mms' ? (
              <ImageIcon className="h-4 w-4" />
            ) : kindKey === 'sms' ? (
              <Mail className="h-4 w-4" />
            ) : rate?.type === 'Mobile' ? (
              <MobileOutlined className="h-4 w-4" />
            ) : (
              <LandlineOutlined className="h-4 w-4" />
            ),
        }));

      return [
        ...build(source?.outbound_call_rates, 'outbound', (r) => r?.type || 'Landline'),
        ...build(source?.inbound_call_rates, 'inbound', () => 'Toll-Free'),
        ...build(source?.sms_rates, 'sms', (r) => r?.type || 'SMS'),
        ...build(source?.mms_rates, 'mms', (r) => r?.type || 'MMS'),
      ];
    };

    /* The endpoint answers with a result object whose rate arrays are empty
       rather than with nothing at all, so the fallback keys off "no rows
       came back", not "no response came back". */
    const rows = buildRows(ratesData);
    if (rows.length > 0) return rows;
    return buildRows(
      demoRates(selectedCountry?.value || 'India', selectedIso || 'IN', selectedDial || '+91'),
    );
  }, [ratesData, selectedCountry, selectedIso, selectedDial]);

  const countOf = (key: RateKind) => ratesBlock.filter((r) => r.kind === key).length;
  const tabs = [
    { key: 'all' as const, label: 'All', count: ratesBlock.length },
    { key: 'outbound' as const, label: 'Outbound', count: countOf('outbound') },
    { key: 'inbound' as const, label: 'Inbound', count: countOf('inbound') },
    { key: 'sms' as const, label: 'SMS', count: countOf('sms') },
    { key: 'mms' as const, label: 'MMS', count: countOf('mms') },
  ];
  const visible = kind === 'all' ? ratesBlock : ratesBlock.filter((r) => r.kind === kind);

  const destination = ratesBlock[0];

  return (
    <section className="mcm-intpage flex w-full min-w-0 flex-col overflow-hidden">
      {/* Same head as the Integration screens: title and filter on the left,
          the page's one input on the right, both sitting on the columns the
          content below uses. The destination picker had a strip of its own
          under the head, which spent a full row on a single dropdown. */}
      <div className="mcm-intpage-head">
        <div className="mcm-intpage-eyebrow">SMS / Calling Rates</div>
        <div className="mcm-intpage-headrow">
          <div className="mcm-intpage-headleft">
            <div className="flex min-w-0 items-center gap-2">
              <h1>Outbound Rates</h1>
              <CustomTooltip
                side="bottom"
                sideOffset={10}
                className="mcm-tooltip-info"
                text="What each destination costs to call or text — per minute for calls, per message for SMS."
              >
                <Info className="mcm-intpage-info" />
              </CustomTooltip>
            </div>

            {ratesBlock.length > 0 ? (
              <div className="mcm-segmented" role="group" aria-label="Filter rates by type">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={kind === tab.key}
                    className={kind === tab.key ? 'is-active' : ''}
                    onClick={() => setKind(tab.key)}
                  >
                    {tab.label}
                    <em>{tab.count}</em>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mcm-intpage-search mcm-ratepicker">
            <CustomSelect
              inputClass="mcm-select"
              /* The dial code belongs on the destination, not only in the
                 table below — it is half of what identifies a destination. */
              options={countryList?.map((country) => ({
                label: country?.phonecode
                  ? `${country?.name} (+${String(country.phonecode).replace(/^\+/, '')})`
                  : country?.name || '',
                value: country?.name || '',
                icon: <ReactCountryFlag countryCode={country?.isoCode} svg />,
              }))}
              handleChange={handleCountryChange}
              value={selectedCountry || ''}
              placeholder="Select a destination"
            />
            {isPending ? (
              <span className="mcm-ratepicker-loading">
                <Loader variant="blue" />
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mcm-intbody flex-1 overflow-y-auto p-3">
        {/* Same bordered, rounded card the Destinations table sits in — the
            rates table was bare on the page ground while its sibling had a
            frame. */}
        <div className="mcm-tablecard">
          <div className="scroller overflow-x-auto">
            <table className="mcm-ratetbl w-full min-w-[44rem] border-collapse text-sm">
            {/* Same header band as TableManager gives the Manage Webhook and
                Performance tables — grey strip, sticky to the top of the
                scroll area, so the columns stay labelled while you scroll a
                long rate list. This table is hand-rolled, so it does not get
                that treatment for free. */}
            <thead className="mcm-ratetbl-head sticky top-0 z-10">
              <tr>
                <th>Type</th>
                <th>Connects to</th>
                <th>Rate</th>
                <th>Billed in</th>
                <th>Connection fee</th>
                <th>Effective from</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={6}>
                      <span className="mcm-skel mcm-skel-line" />
                    </td>
                  </tr>
                ))
              ) : visible.length > 0 ? (
                visible.map((rate) => (
                  <tr key={rate.id}>
                    <td>
                      <span className={`mcm-ratecard-kind is-${rate.kind}`}>
                        {KIND_LABEL[rate.kind]}
                      </span>
                    </td>
                    <td className="text-gray-700">
                      <span className="mcm-ratetbl-category">
                        {rate.icon}
                        {rate.typeName}
                      </span>
                    </td>
                    {/* Price and unit in one cell — the unit was a column with
                        no heading, and a figure without it does not mean
                        anything. */}
                    <td>
                      <span className="mcm-ratetbl-rate">
                        <strong>{formatRate(rate.rate)}</strong>
                        <span>{KIND_UNIT[rate.kind]}</span>
                      </span>
                    </td>
                    <td className="text-gray-700">
                      <span className="mcm-ratetbl-stack">
                        <span>{rate.billingIncrement || '—'}</span>
                        {incrementHint(rate.billingIncrement) ? (
                          <small>{incrementHint(rate.billingIncrement)}</small>
                        ) : null}
                      </span>
                    </td>
                    <td className="tabular-nums text-gray-700">
                      <span className="mcm-ratetbl-stack">
                        <span>{formatFee(rate.connectionFee)}</span>
                        {Number(rate.connectionFee) > 0 ? <small>per call</small> : null}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-gray-700">
                      {formatDate(rate.effectiveFrom)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-gray-600">
                    {ratesBlock.length > 0
                      ? `No ${KIND_LABEL[kind as RateKind]?.toLowerCase()} rates for this destination.`
                      : 'No rates were found for this destination.'}
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* What the table covers, and what its two unfamiliar columns mean —
            one paragraph under the table. This used to be a summary band
            across the top of the table, which was a full row of chrome
            restating what the destination picker and the filter counts
            already said, with a stretch of empty space in the middle. */}
        {!isPending && visible.length > 0 ? (
          <div className="mcm-ratetbl-note">
            <Icon name="InfoIcon" className="mcm-ratetbl-note-icon" />
            {/* The sentence is ONE flex item. Left as bare text beside the
                icon, every fragment between the <strong>s became a flex item
                of its own and the paragraph laid itself out in columns. */}
            <p>
              {destination?.countryName ? (
                <>
                  Rates for <strong>{destination.countryName}</strong>
                  {destination.prefix
                    ? ` (+${String(destination.prefix).replace(/^\+/, '')})`
                    : ''}
                  , in USD.{' '}
                </>
              ) : null}
              <strong>Billed in</strong> is the minimum charge, then the step after it — “60 / 60
              sec” means a 61-second call is charged as two minutes.{' '}
              <strong>Connection fee</strong> is charged once per answered call, on top of the
              rate.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default OutboundRates;
