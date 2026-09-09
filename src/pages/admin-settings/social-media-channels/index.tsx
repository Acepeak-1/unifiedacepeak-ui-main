import { useState } from 'react';
import CustomTooltip from '@/components/custom/custom-tooltip';
import { useCompanyFeatures } from '@/hooks/rbac';
import TelegramChannel from './telegram-channel';
import WhatsappChannel from './whatsapp-channel';
import InstagramChannel from './instagram-channel';
import FacebookChannel from './facebook-channel';
import { DEMO_CHANNELS } from './constants';

const SocialMediaChannels = () => {
  const { features } = useCompanyFeatures();
  const ominiChannelAccess = features?.plan_features?.omni_channel?.access || {};
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected'>('all');

  /* Which channels the plan allows, in display order. `connected` is demo
     state for now (see DEMO_CHANNELS) and should read from the channel list
     once that drives the cards. */
  const channels = [
    { key: 'facebook', allowed: Boolean(ominiChannelAccess?.FACEBOOK), Component: FacebookChannel },
    {
      key: 'instagram',
      allowed: Boolean(ominiChannelAccess?.INSTAGRAM),
      Component: InstagramChannel,
    },
    { key: 'whatsapp', allowed: Boolean(ominiChannelAccess?.WHATSAPP), Component: WhatsappChannel },
    { key: 'telegram', allowed: true, Component: TelegramChannel },
  ].filter((c) => c.allowed);

  const isConnected = (key: string) => Boolean(DEMO_CHANNELS[key]?.connected);
  const visible = channels.filter((c) =>
    filter === 'all' ? true : filter === 'connected' ? isConnected(c.key) : !isConnected(c.key),
  );

  /* Counts on the tabs: without them you have to click a filter to find out
     whether it holds anything, and "Not connected" can come back empty with
     no warning. */
  const connectedCount = channels.filter((c) => isConnected(c.key)).length;
  const tabs = [
    { key: 'all' as const, label: 'All', count: channels.length },
    { key: 'connected' as const, label: 'Connected', count: connectedCount },
    {
      key: 'disconnected' as const,
      label: 'Not connected',
      count: channels.length - connectedCount,
    },
  ];

  return (
    <section className="mcm-intpage w-full flex flex-col">
      <div className="mcm-intpage-head">
        <div className="mcm-intpage-eyebrow">Channels</div>
        {/* The standing description used to sit in a banner above the cards,
            costing a row of vertical space to say something you read once.
            It lives behind the "i" now, as on the Integration pages. */}
        <div className="flex flex-1 min-w-0 items-center gap-2">
          <h1>Social Media Channels</h1>
          <CustomTooltip
            side="bottom"
            sideOffset={10}
            className="mcm-tooltip-info"
            text="Connect your business accounts to engage with customers across platforms, and manage every conversation in one place."
          >
            <span className="mcm-intpage-info">i</span>
          </CustomTooltip>
          <div className="mcm-segmented" role="group" aria-label="Filter channels by status">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={filter === tab.key}
                className={filter === tab.key ? 'is-active' : ''}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
                <em>{tab.count}</em>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shared card grid, so channels sit on the same rhythm as the
          Integration screens instead of a parallel one. */}
      <div className="mcm-intgrid mcm-chgrid">
        {visible.map(({ key, Component }) => (
          <Component key={key} />
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-gray-500 py-6">
            No channels are {filter === 'connected' ? 'connected' : 'waiting to be connected'}.
          </p>
        )}
      </div>
    </section>
  );
};

export default SocialMediaChannels;
