import GoogleSheet from '@/assets/images/google-sheet.png';
import GoogleContact from '@/assets/images/google-contacts.png';
import McmLogo from '@/assets/images/LogoIcon.svg';
export { McmLogo };
import Hubspot from '@/assets/images/Hubspot.png';
import Pipedrive from '@/assets/images/Pipedrive.png';
import Zoho from '@/assets/images/zoho.png';
import Salesforce from '@/assets/images/Salesforce.png';
import MondayLogo from '@/assets/images/MondayLogo.png';
import Zendesk from '@/assets/images/Zendesk.png';
import Microsoft from '@/assets/images/Microsoft.png';
import MsTeams from '@/assets/images/MsTeams.png';
import * as yup from 'yup';
import { getEnv } from '@/lib/utils';

type MainSiteInfoWithSmallLogo = { small_logo?: unknown } | null | undefined;

export const getMcmLogoIcon = (mainSiteInfo?: MainSiteInfoWithSmallLogo): string => {
  return mainSiteInfo?.small_logo
    ? `${getEnv().VITE_API_BASE_URL}/${mainSiteInfo?.small_logo}`
    : McmLogo;
};

const AiIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`;

export const getBelongsToIcons = (
  mainSiteInfo?: MainSiteInfoWithSmallLogo,
): Record<string, string> => {
  const dynamicMcmLogo = getMcmLogoIcon(mainSiteInfo);

  return {
    HUBSPOT: Hubspot,
    ZOHO: Zoho,
    PIPEDRIVE: Pipedrive,
    GOOGLE_CONTACTS: GoogleContact,
    GOOGLE_SHEETS: GoogleSheet,
    GOOGLE: GoogleContact,
    SALESFORCE: Salesforce,
    ZENDESK: Zendesk,
    MICROSOFT365: Microsoft,
    MSTEAMS: MsTeams,
    MONDAY: MondayLogo,
    AI: AiIcon,
    DEFAULT: dynamicMcmLogo,
  };
};

export const belongsToIcons: Record<string, string> = getBelongsToIcons();

export const BELONGS_TO_LABELS: Record<string, string> = {
  HUBSPOT: 'HubSpot',
  ZOHO: 'Zoho',
  PIPEDRIVE: 'Pipedrive',
  GOOGLE_CONTACTS: 'Google Contacts',
  GOOGLE_SHEETS: 'Google Sheets',
  SALESFORCE: 'Salesforce',
  ZENDESK: 'Zendesk',
  MICROSOFT365: 'Microsoft 365',
  MSTEAMS: 'MS TEAMS',
  AI: 'AI',
  DEFAULT: 'MCM',
};
export const generalSettings = [
  {
    id: 'createNewContacts',
    icon: 'ContactIcon',
    title: 'Create New Contacts',
    description: 'Add new contacts to the address book in {crmName}',
  },
  {
    id: 'contacts2WaySync',
    icon: 'Refresh',
    title: 'Contacts 2-Way Sync',
    description:
      'Contacts added and uploaded in UCaaS must synchronize in {crmName} and vice versa',
  },
  // {
  //   id: 'notesLogging',
  //   icon: 'NotebookLine',
  //   title: 'Notes Logging',
  //   description: 'Drop only notes in Call Details',
  // },
  // {
  //   id: 'phoneAsContactName',
  //   icon: 'MessageIcon',
  //   title: 'Phone Numbers as Contact Names',
  //   description: 'Create new contacts with phone numbers as their contact names',
  // },
  {
    id: 'syncCallLogs',
    icon: 'OutgoingCallStrokeIcon',
    title: 'Sync Calls',
    description: 'Log outgoing answered and unanswered calls',
  },
  // {
  //   id: 'incomingCalls',
  //   icon: 'IncomingCallStrokeIcon',
  //   title: 'Incoming Calls',
  //   description: 'Log incoming answered and unanswered calls',
  // },
  // {
  //   id: 'voicemail',
  //   icon: 'VoicemailLineIcon',
  //   title: 'Voicemail',
  //   description: 'Log voicemails',
  // },
];

export interface CRMConfigurationProps {
  drawerData: crmListProps | undefined;
  setDrawerState: (state: boolean) => void;
}
export type CRMConfigurationForm = {
  createNewContacts: boolean;
  contacts2WaySync: boolean;
  notesLogging: boolean;
  phoneAsContactName: boolean;
  syncCallLogs: boolean;
  incomingCalls: boolean;
  voicemail: boolean;
};
export const CRMConfigurationInitialValues = {
  createNewContacts: false,
  contacts2WaySync: false,
  notesLogging: false,
  phoneAsContactName: false,
  syncCallLogs: false,
  incomingCalls: false,
  voicemail: false,
};
export interface crmListProps {
  name: string;
  label: string;
  image: string;
  alt: string;
  description: string;
  comingSoon: boolean;
  id: string;
}

export const crmList: crmListProps[] = [
  {
    name: 'HubSpot',
    label: 'hubspot-crm',
    image: Hubspot,
    alt: 'HubSpot',
    description: 'Connect HubSpot to sync your contacts and log call activity automatically.',
    comingSoon: false,
    id: 'HubSpot',
  },
  {
    name: 'Zoho',
    label: 'zoho-crm',
    image: Zoho,
    alt: 'Zoho',
    description: 'Connect with Zoho CRM to sync contacts and automate communication flows.',
    comingSoon: false,
    id: 'Zoho',
  },
  {
    name: 'Pipedrive',
    label: 'pipedrive-crm',
    image: Pipedrive,
    alt: 'Pipedrive',
    description: 'Connect Pipedrive to sync your contacts and get insights from every call.',
    comingSoon: false,
    id: 'Pipedrive',
  },

  {
    name: 'SalesForce',
    label: 'salesforce-crm',
    image: Salesforce,
    alt: 'SalesForce',
    description: 'Enhance CRM functionality and improve overall business telephony operations.',
    comingSoon: false,
    id: 'SalesForce',
  },
  {
    name: 'Zendesk',
    label: 'zendesk-crm',
    image: Zendesk,
    alt: 'Zendesk',
    description:
      'Integrate Zendesk to manage support tickets and customer communication.',
    comingSoon: true,
    id: 'Zendesk',
  },
  {
    name: 'Microsoft 365',
    label: 'microsoft365-crm',
    image: Microsoft,
    alt: 'Microsoft 365',
    description:
      'Connect Microsoft 365 to sync contacts and streamline productivity workflows.',
    comingSoon: true,
    id: 'Microsoft',
  },
  {
    name: 'MS Teams',
    label: 'MS_TEAMS',
    image: MsTeams,
    alt: 'MS Teams',
    description:
      'Enhance collaboration with MS Teams for unified communication and teamwork.',
    comingSoon: false,
    id: 'MS_TEAMS',
  },
  {
    name: 'Monday',
    label: 'monday-crm',
    image: MondayLogo,
    alt: 'Monday',
    description:
      'Integrate Monday.com to manage workflows and customer interactions.',
    comingSoon: false,
    id: 'Monday',
  },
];

export const crmZapData: Record<
  string,
  {
    title: string;
    zaps: {
      label: string;
      subtitle: string;
      icons: string[];
      url: string;
    }[];
  }
> = {
  google_contacts: {
    title: 'Google Contacts',
    zaps: [
      {
        label: 'Create contacts in UCaaS added to Google Contacts',
        subtitle: 'UCaaS → Google Contacts',
        icons: [McmLogo, GoogleContact],
        url: 'https://zapier.com/editor/313251219/draft/313251220/setup',
      },
      {
        label: 'Create new contacts in Google Contacts added to UCaaS',
        subtitle: 'Google Contacts → UCaaS',
        icons: [GoogleContact, McmLogo],
        url: 'https://zapier.com/editor/313272431/draft/313272431/setup',
      },
      {
        label: 'Trigger SMS sending from new Google Contact',
        subtitle: 'Google Contacts → UCaaS (Send SMS)',
        icons: [GoogleContact, McmLogo],
        url: 'https://zapier.com/editor/313251582/draft/313251583/setup',
      },
      // {
      //   label: 'Trigger MMS sending from new Google Contact',
      //   subtitle: 'Google Contacts → UCaaS (Send MMS)',
      //   icons: [GoogleContact, McmLogo],
      // url: 'url',
      // },
    ],
  },
  google_sheets: {
    title: 'Google Sheets',
    zaps: [
      {
        label: 'Create new contacts in UCaaS added to Google Sheets',
        subtitle: 'UCaaS → Google Sheets',
        icons: [McmLogo, GoogleSheet],
        url: 'https://zapier.com/editor/313251890/draft/313251891/setup',
      },
      {
        label: 'Create rows in Google Sheets for new contacts added to UCaaS',
        subtitle: 'Google Sheets → UCaaS',
        icons: [GoogleSheet, McmLogo],
        url: 'https://zapier.com/editor/313273038/draft/313273039/setup',
      },
      {
        label: 'Trigger SMS sending from new Google Sheet row',
        subtitle: 'Google Sheets → UCaaS (Send SMS)',
        icons: [GoogleSheet, McmLogo],
        url: 'https://zapier.com/editor/313251934/draft/313251935/setup',
      },
      // {
      //   label: 'Trigger MMS sending from new Google Sheet row',
      //   subtitle: 'Google Sheets → UCaaS (Send MMS)',
      //   icons: [GoogleSheet, McmLogo],
      // url: 'url',
      // },
    ],
  },
  pipedrive: {
    title: 'Pipedrive',
    zaps: [
      {
        label: 'Create contacts in UCaaS added to Pipedrive',
        subtitle: 'UCaaS → Pipedrive',
        icons: [McmLogo, Pipedrive],
        url: 'https://zapier.com/editor/313252061/draft/313252062/setup',
      },
      {
        label: 'Create new contacts in Pipedrive added to UCaaS',
        subtitle: 'Pipedrive → UCaaS',
        icons: [Pipedrive, McmLogo],
        url: 'https://zapier.com/editor/313273430/draft/313273431/setup',
      },
      {
        label: 'Send SMS from new contact added in Pipedrive',
        subtitle: 'Pipedrive → UCaaS (Send SMS)',
        icons: [Pipedrive, McmLogo],
        url: 'https://zapier.com/editor/313252124/draft/313252125/setup',
      },
      // {
      //   label: 'Send MMS from new contact added in Pipedrive',
      //   subtitle: 'Pipedrive → UCaaS (Send MMS)',
      //   icons: [Pipedrive, McmLogo],
      // url:'url',
      // },
    ],
  },
  hubSpot: {
    title: 'HubSpot',
    zaps: [
      {
        label: 'Create contacts in UCaaS added to HubSpot',
        subtitle: 'UCaaS → HubSpot',
        icons: [McmLogo, Hubspot],
        url: 'https://zapier.com/editor/313252488/draft/313252489/setup',
      },
      {
        label: 'Create new contacts in HubSpot added to UCaaS',
        subtitle: 'HubSpot → UCaaS',
        icons: [Hubspot, McmLogo],
        url: 'https://zapier.com/editor/313273732/draft/313273733/setup',
      },
      {
        label: 'Send SMS from new contact added in HubSpot',
        subtitle: 'HubSpot → UCaaS (Send SMS)',
        icons: [Hubspot, McmLogo],
        url: 'https://zapier.com/editor/313252609/draft/313252610/setup',
      },
      // {
      //   label: 'Send MMS from new contact added in HubSpot',
      //   subtitle: 'HubSpot → UCaaS (Send MMS)',
      //   icons: [Hubspot, McmLogo],
      // url:'url',
      // },
    ],
  },
};

export const crmTypes = [
  { label: 'Google Contacts', value: 'GOOGLE_CONTACTS' },
  { label: 'Google Sheets', value: 'GOOGLE_SHEETS' },
  { label: 'Pipedrive', value: 'PIPEDRIVE' },
  { label: 'Monday', value: 'MONDAY' },
  { label: 'HubSpot', value: 'HUBSPOT' },
  { label: 'Zendesk', value: 'ZENDESK' },
  { label: 'Microsoft 365', value: 'MICROSOFT365' },
  { label: 'MS Teams', value: 'MSTEAMS' },
];
/* What a webhook fires ON.
 *
 * The Add-webhook dialog was offering `crmTypes` — Google Sheets, HubSpot,
 * Zendesk and the rest — which is the list of apps the CRM page connects to,
 * not a list of events. The table it saves into shows types like
 * "Call Completed" and "SMS Received", so the dialog was asking a different
 * question from the one the screen answers. These are those events, grouped
 * so a long list stays scannable. */
export const webhookEventTypes = [
  {
    label: 'Calls',
    options: [
      { label: 'Call completed', value: 'call_completed' },
      { label: 'Call missed', value: 'call_missed' },
      { label: 'Voicemail left', value: 'voicemail_left' },
      { label: 'Call recording ready', value: 'call_recording_ready' },
    ],
  },
  {
    label: 'Messaging',
    options: [
      { label: 'SMS received', value: 'sms_received' },
      { label: 'SMS delivered', value: 'sms_delivered' },
      { label: 'MMS received', value: 'mms_received' },
    ],
  },
  {
    label: 'Contacts',
    options: [
      { label: 'Contact created', value: 'contact_created' },
      { label: 'Contact updated', value: 'contact_updated' },
    ],
  },
];

export const initialState = {
  type: null,
  path: '',
};
export const validationSchema = yup.object().shape({
  type: yup
    .object({
      label: yup.string().required('Event label is required'),
      value: yup.string().required('Choose the event this webhook fires on'),
    })
    .nullable()
    .required('Choose the event this webhook fires on'),
  /* A webhook path is a URL we will POST to. "Required" was the only rule,
     so a typo like "hooks.zapier.com/..." (no scheme) or a bare word saved
     happily and then silently never delivered. */
  path: yup
    .string()
    .required('Endpoint URL is required')
    .trim()
    .matches(/^https?:\/\/.+/i, 'Must start with https:// (or http://)')
    .test('is-url', 'That does not look like a valid URL', (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }),
});
export interface editForm {
  isEdit: boolean;
  formData: any;
}
export interface ReportingDataProps {
  items: {
    title: string;
    description: string;
    icon: string;
    id: string;
    /* Demo only — the API returns no status or sync time for Zapier apps
       yet. Remove these two fields (and the stats row / status badges that
       read them) once real values are available. */
    status?: 'connected' | 'setup' | 'disconnected';
    lastSync?: string;
  }[];
}
export const reportingData: Record<string, ReportingDataProps> = {
  zapier: {
    items: [
      {
        title: 'Google Contacts',
        id: 'google_contacts',
        status: 'connected',
        lastSync: '2 hours ago',
        description:
          'Sync Google Contacts to call and message straight from your contact book.',
        icon: GoogleContact,
      },
      {
        title: 'Google Sheets',
        id: 'google_sheets',
        status: 'disconnected',
        lastSync: '',
        description:
          'Import contacts from Google Sheets and track incoming and outgoing SMS.',
        icon: GoogleSheet,
      },
      {
        title: 'Pipedrive',
        id: 'pipedrive',
        status: 'connected',
        lastSync: 'Yesterday',
        description:
          'Sync contacts and log SMS activity between Pipedrive and the console.',
        icon: Pipedrive,
      },
      {
        title: 'HubSpot',
        id: 'hubSpot',
        status: 'setup',
        lastSync: '',
        description:
          'Import contacts and record SMS/MMS history in HubSpot automatically.',
        icon: Hubspot,
      },
    ],
  },
};
