
/**
 * Demo rates — design preview only.
 *
 * The rates endpoint returns nothing for this workspace, so the grid was
 * always empty and neither the cards nor the Outbound/Inbound/SMS filter
 * could be judged. `demoRates` builds a result in the same shape the API
 * returns, for whichever destination is selected.
 *
 * REMOVE THIS BLOCK (and the `?? demoRates(...)` fallback in
 * outbound-rates.tsx) before release.
 */
type DemoRate = {
  dialprefix: string;
  type: string;
  rate: number;
  destination: string;
  /* The terms a price is only meaningful alongside. A per-minute figure
     with no billing increment understates a 61-second call by a whole
     minute, and a connection fee is charged before the first second is.
     Real rate cards publish all three; the API does not return them yet,
     so the table shows "—" when they are missing. */
  billing_increment?: string;
  connection_fee?: number;
  effective_from?: string;
};

export const demoRates = (name: string, iso: string, dialCode: string) => {
  /* Derived from the destination so two countries do not show identical
     prices, and stable so the same country always reads the same. */
  const seed = [...(iso || name || 'XX')].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const vary = (base: number, spread: number) =>
    Number((base + ((seed % 17) / 17) * spread).toFixed(4));
  const prefix = String(dialCode || '').replace(/^\+/, '');

  const rate = (
    type: string,
    value: number,
    extra: Partial<DemoRate> = {},
  ): DemoRate => ({
    dialprefix: prefix,
    type,
    rate: value,
    destination: name,
    billing_increment: '60 / 60 sec',
    connection_fee: 0,
    effective_from: '2026-09-01',
    ...extra,
  });

  return {
    country: { name, iso },
    outbound_call_rates: [
      /* Mobile termination usually carries a connection fee where landline
         does not — worth showing, since it is charged per call regardless
         of how short the call is. */
      rate('Mobile', vary(0.0089, 0.011), { connection_fee: 0.003 }),
      rate('Landline', vary(0.0062, 0.008), { billing_increment: '60 / 1 sec' }),
    ],
    inbound_call_rates: [rate('Toll-Free', vary(0.0125, 0.009))],
    sms_rates: [
      rate('SMS', vary(0.0074, 0.006), {
        billing_increment: 'Per message',
        connection_fee: undefined,
      }),
    ],
    /* MMS is priced separately from SMS everywhere else in the app (billing
       carries mms_per_unit; RateType is call|sms|mms|fax) — a rates screen
       without it was answering for three products out of four. */
    mms_rates: [
      rate('MMS', vary(0.0212, 0.009), {
        billing_increment: 'Per message',
        connection_fee: undefined,
      }),
    ],
  };
};
