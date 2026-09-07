/* The settings a company rule can be set on, and where the flag sits in the
 * stored record. Keys are the names callers use; paths are what the company page
 * writes. Anything absent from this map is not governed and stays editable.
 *
 * This lives in its own module to break an import cycle that crashed every page
 * reaching either side of it:
 *
 *   company-rule-flags.ts  →  POLICY_FIELDS  from  company-policy.ts
 *   company-policy.ts      →  readRuleFlags  from  company-rule-flags.ts
 *
 * Whichever of the two the bundler evaluated first asked the other for a binding
 * that had not been initialised yet, and the module threw
 * `ReferenceError: Cannot access 'POLICY_FIELDS' before initialization` before a
 * single component rendered — taking down All numbers and everything else that
 * imports the pair. A constant with no dependencies of its own cannot take part
 * in a cycle, so it sits here and both modules read it from one direction.
 */

export const POLICY_FIELDS = {
  voicemail: 'voicemail_pin.override',
  recording: 'recording.override',
  transcription: 'transcription.override',
  ai_call_monitoring: 'ai_call_monitoring.override',
  display_number: 'display_number.override',
  business_hours: 'operational_hours.override',
  regional: 'operational_hours.regional.override',
  role: 'role.override',
} as const;

export type PolicyField = keyof typeof POLICY_FIELDS;
