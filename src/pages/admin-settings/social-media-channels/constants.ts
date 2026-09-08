import { requiredAllString, requiredString } from '@/lib/schema';
import * as yup from 'yup';

export const telegramChannelInitialValues = {
  username: '',
  token: '',
};
export const telegramChannelSchema = yup.object().shape({
  username: requiredString('Username'),
  token: requiredAllString('Token'),
});

/**
 * Demo channel state — design preview only.
 *
 * Nothing is connected on a fresh workspace, so the page rendered four
 * identical empty cards and neither the connected layout nor the filters
 * could be judged. These values stand in until the channel list returns real
 * ones.
 *
 * REMOVE THIS BLOCK (and the `?? DEMO_CHANNELS[...]` fallbacks in each
 * channel component) before release.
 */
export const DEMO_CHANNELS: Record<
  string,
  {
    connected: boolean;
    account: string;
    conversations: string;
    lastActivity: string;
    enabled?: boolean;
    capabilities: string[];
  }
> = {
  facebook: {
    /* Acepeak's real Page — facebook.com/acepeakai. */
    connected: true,
    account: '@acepeakai',
    conversations: '1,284',
    lastActivity: '2 hours ago',
    enabled: true,
    capabilities: ['Messages', 'Comments'],
  },
  whatsapp: {
    connected: true,
    account: '+1 (415) 555-0182',
    conversations: '3,907',
    lastActivity: '12 minutes ago',
    enabled: true,
    capabilities: ['Messages', 'Media'],
  },
  instagram: {
    /* Acepeak's real Instagram handle, so the connected card shows the
       account this console would actually be posting as. */
    connected: true,
    account: '@acepeak.ai',
    conversations: '742',
    lastActivity: '35 minutes ago',
    enabled: true,
    capabilities: ['Messages', 'Comments', 'Story replies'],
  },
  telegram: {
    connected: false,
    account: '',
    conversations: '',
    lastActivity: '',
    capabilities: ['Messages', 'Bot commands'],
  },
};
