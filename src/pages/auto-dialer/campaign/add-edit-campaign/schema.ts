import * as yup from 'yup';
import { CAMPAIGN_UPSERT_TAB_CONSTANT } from '../const';
import { requiredString } from '@/lib/schema';

/**
 * Campaign name: letters, numbers and spaces only.
 *
 * The shared `requiredString` helper is used by forms all over the app,
 * so the character rule is added here rather than there. It also carried
 * the wrong field label — a campaign name reported itself as "First
 * name" in every error this form raised.
 */
const CAMPAIGN_NAME_PATTERN = /^[A-Za-z0-9 ]+$/;
const campaignName = requiredString('Campaign name', 2, 50).matches(CAMPAIGN_NAME_PATTERN, {
  message: 'Campaign name can contain letters, numbers and spaces only.',
  excludeEmptyString: true,
});

export const CAMPAIGN_SCEHAM: any = {
  [CAMPAIGN_UPSERT_TAB_CONSTANT.BASIC_INFORMATION]: yup.object().shape({
    name: campaignName,
    siteId: yup.object().shape({
      value: yup.string().required('Site is required'),
    }),
    description: yup.string().max(500, 'Description cannot be more than 500 characters').optional(),
    callerId: yup.array().min(1, 'Select atleast one caller ID'),
    groupId: yup.array().min(1, 'Select atleast one lead'),
  }),

  [CAMPAIGN_UPSERT_TAB_CONSTANT.SETTING_PERMISSION]: yup.object().shape({
    startDate: yup.string().required('Start date is required'),
    endDate: yup.string().required('End date is required'),
    settings: yup.object().shape({
      operational_hours: yup.object().shape({
        value: yup.mixed(),
        holidays: yup.array().optional(),
        regional: yup.object().shape({
          override: yup.boolean(),
          country_code: yup.object().shape({
            value: yup.string().required('Country code is required'),
          }),
          timezone: yup.object().shape({
            value: yup.string().required('Timezone is required'),
          }),
          country: yup.object().shape({
            value: yup.string().required('Country is required'),
          }),
        }),
      }),
      display_number: yup.object().shape({
        masking: yup.object().shape({
          value: yup.string().when('$schemaContext', {
            is: (schema: any) => {
              return (
                schema?.settings?.display_number?.masking?.type?.value &&
                schema?.settings?.display_number?.masking?.type?.value !== 'N' &&
                schema?.settings?.display_number?.incoming?.value
              );
            },
            then: () => yup.string().required('Masking value is required'),
            otherwise: () => yup.string().notRequired(),
          }),
        }),
      }),
    }),
  }),

  [CAMPAIGN_UPSERT_TAB_CONSTANT.SETTING]: yup.object().shape({
    dialerSetting: yup.object().shape({
      preview_time: yup.number().required('Preview time is required'),
      ringing_agent_time: yup.number().required('Ringing agent time is required'),
      wrapup_time: yup.number().required('Wrapup time is required'),
      max_ring_time: yup.number().required('Ring time is required'),
      // max_attempt: yup.number().required('Max attempts is required'),
      max_attempt_per_record: yup.number().required('Max attempts per record  is required'),
      default_retry_period: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .required('Default retry period is required')
        .min(3, 'Minimum value is 3')
        .max(30, 'Maximum value is 30'),
      default_retry_period_type: yup.object().shape({
        value: yup.string().required('Default retry period type is required'),
      }),
      agent_contact_limit: yup.number().optional().nullable(),
      answering_detection_machine: yup.object().shape({
        enabled: yup.boolean().optional(),
        type: yup.string().optional(),
        value: yup.object().shape({
          value: yup.string().optional(),
        }),
      }),
      auto_answering: yup.object().shape({
        enabled: yup.boolean().optional(),
        // timeout: yup.number().min(2).max(60).optional().nullable(),
      }),
      manual_review_required: yup.boolean().optional(),
      require_disposition: yup.boolean().optional(),
      agent_availability_percent: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .min(1, 'Minimum value is 1')
        .max(100, 'Maximum value is 100')
        .optional()
        .nullable(),
      dialing_ratio: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .min(1, 'Minimum value is 1')
        .max(10, 'Maximum value is 10')
        .optional()
        .nullable(),
      max_concurrent_calls: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .min(1, 'Minimum value is 1')
        .max(500, 'Maximum value is 500')
        .optional()
        .nullable(),
      abandon_rate_percent: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .min(0, 'Minimum value is 0')
        .max(100, 'Maximum value is 100')
        .optional()
        .nullable(),
    }),
    agentDisposition: yup
      .array()
      .of(
        yup.object().shape({
          _id: yup.string().required('Key is required'),
          disposition: yup.object().shape({
            name: yup.string().required('Name is required'),
            description: yup
              .string()
              .max(500, 'Description cannot be more than 500 characters')
              .optional(),
          }),
        }),
      )
      .min(1, 'Select atleast one disposition'),
  }),

  [CAMPAIGN_UPSERT_TAB_CONSTANT.AGENTS]: yup.object().shape({
    members: yup
      .array()
      .of(
        yup.object({
          value: yup.string().trim().required('Member is required'),
        }),
      )
      .min(1, 'At least one member is required'),
    allowSkipping: yup.boolean(),
    agentScripting: yup.boolean(),
    script: yup.object().shape({
      value: yup.string().when('$schemaContext', {
        is: (schema: any) => {
          return schema?.agentScripting;
        },
        then: (schema) => schema.required('Script is required'),
        otherwise: (schema) => schema.optional(),
      }),
    }),
  }),
  [CAMPAIGN_UPSERT_TAB_CONSTANT.MEDIA]: yup.object().shape({
    greetings: yup.object().shape({
      hold: yup.object().shape({
        value: yup.object().shape({
          value: yup.string().when('$schemaContext', {
            is: (schema: any) => schema?.greetings?.hold?.enabled,
            then: () => yup.string().required('On hold music is required'),
            otherwise: () => yup.string().notRequired(),
          }),
        }),
      }),
    }),
  }),
};

/**
 * All five steps' fields validated together, for the single-page form.
 *
 * Each step's schema above targets a disjoint set of top-level keys
 * (name/siteId/... vs startDate/... vs dialerSetting/... etc.), so
 * `.concat()`-ing them just unions the shape — nothing here overrides
 * anything, it only combines.
 */
export const CAMPAIGN_FULL_SCHEMA = CAMPAIGN_SCEHAM[
  CAMPAIGN_UPSERT_TAB_CONSTANT.BASIC_INFORMATION
]
  .concat(CAMPAIGN_SCEHAM[CAMPAIGN_UPSERT_TAB_CONSTANT.SETTING_PERMISSION])
  .concat(CAMPAIGN_SCEHAM[CAMPAIGN_UPSERT_TAB_CONSTANT.SETTING])
  .concat(CAMPAIGN_SCEHAM[CAMPAIGN_UPSERT_TAB_CONSTANT.AGENTS])
  .concat(CAMPAIGN_SCEHAM[CAMPAIGN_UPSERT_TAB_CONSTANT.MEDIA]);
