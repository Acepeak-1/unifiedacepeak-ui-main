import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@/assets/icons/icon';
import type { IconType } from '@/assets/icons/type';
import CustomTooltip from '@/components/custom/custom-tooltip';
import { useUser } from '@/hooks/use-user';
import { handleAlert } from '@/lib/utils';

const GeneralSettings = () => {
  const { user } = useUser();

  return (
    <div className="mcm-intpage w-full min-w-0 bg-gray-200/15 flex flex-col overflow-hidden">
      <div className="mcm-intpage-head">
        <div className="mcm-intpage-eyebrow">Integration</div>
        {/* Description behind the "i", as on the CRM page. */}
        <div className="flex items-center gap-2">
          <h1>General Settings</h1>
          <CustomTooltip
            side="right"
            sideOffset={8}
            className="mcm-tooltip-info"
            text="How call and message data is shared with the systems you have connected."
          >
            <span className="mcm-intpage-info">i</span>
          </CustomTooltip>
        </div>
      </div>
      <div className="mcm-intbody w-full space-y-3 p-3 overflow-y-auto xs:max-h-[62vh] md:max-h-full">
        {/* One card per section rather than all three stacked inside a single
            panel — together they read as one dense block. */}
        <div className="mcm-gscard">
          <div className="flex items-start gap-3">
            <span className="mcm-gsicon">
              <Icon name="VerifiedCheck" />
            </span>
            <div className="flex flex-col gap-1">
              <div className="text-md font-semibold">App Credentials</div>
              <div className="text-sm text-gray-500">
                Use these to access the Zapier platform. Keep them private and secure.
              </div>
            </div>
          </div>
        </div>

        {/* The two credentials are peers, so they sit side by side rather than
            stacked down the page. */}
        <div className="mcm-gsgrid">
          <CredentialItem
            icon="Key"
            label="API Key"
            description="Use this to connect your app with Zapier."
            value={user?.uuid}
          />
          <CredentialItem
            icon="LockFilled"
            label="Client Secret"
            description="Use this to get an access token when using OAuth."
            value="d6d5ed116231378022040f108c9607cd"
          />
        </div>

        {/* Steps live in their own panel, matching the reference layout. */}
        <div className="mcm-gscard mcm-gssteps space-y-5">
          <div className="flex items-start gap-3">
            <span className="mcm-gsicon">
              <Icon name="IntegrationIcon" />
            </span>
            <div>
              <div className="mcm-gssteps-title">Connect in three steps</div>
              <p className="mcm-gssteps-sub">Takes about a minute.</p>
            </div>
          </div>

          <div className="mcm-gssteps-row">
            {[
              {
                n: '1',
                icon: 'CopyLine',
                name: 'Copy the API Key',
                text: 'Use the Copy button on the field above.',
              },
              {
                n: '2',
                icon: 'MenuDots',
                name: 'Add the app in Zapier',
                text: "Find this console's app and paste the key.",
              },
              {
                n: '3',
                icon: 'LockFilled',
                name: 'Using OAuth?',
                text: 'Provide the Client Secret if Zapier asks.',
              },
            ].map((step) => (
              <div key={step.n} className="mcm-gsstep">
                <div className="mcm-gsstep-rail">
                  <span className="mcm-gsstep-num">{step.n}</span>
                  <span className="mcm-gsstep-dots" />
                  <span className="mcm-gsstep-ico">
                    <Icon name={step.icon as IconType} />
                  </span>
                </div>
                <div className="mcm-gsstep-name">{step.name}</div>
                <p>{step.text}</p>
              </div>
            ))}
          </div>

          <div className="mcm-gsnote">
            <Icon name="InfoIcon" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>Keep these private.</strong> Anyone holding them can act as your account —
              don&apos;t share them in chats, screenshots or code repositories.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* How long a revealed secret stays on screen before it re-masks itself. Long
   enough to read one out, short enough that a key is not left uncovered on a
   desk while its owner is at lunch. */
const REVEAL_SECONDS = 30;

const CredentialItem = ({
  label,
  description,
  value,
  icon,
}: {
  label: string;
  description: string;
  value: string;
  icon: IconType;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REVEAL_SECONDS);

  /* A row of identical dots says nothing: it cannot tell you whether the
     value is even set, and the two credentials look the same masked. The
     last four characters are the convention for exactly this — enough to
     check you pasted the right one, useless to anybody who sees it. */
  const masked = value
    ? `${'•'.repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`
    : 'Not set';

  useEffect(() => {
    if (!isVisible) {
      setSecondsLeft(REVEAL_SECONDS);
      return;
    }
    const tick = setInterval(() => {
      setSecondsLeft((left) => {
        if (left <= 1) {
          setIsVisible(false);
          return REVEAL_SECONDS;
        }
        return left - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [isVisible]);

  const handleCopy = () => {
    navigator?.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleAlert({ text: 'Copied successfully!', type: 'success' });
  };

  return (
    <div className="mcm-gscard space-y-4">
      {/* Icon badge beside the label, so each credential is scannable rather
          than another line of text. */}
      <div className="flex items-start gap-3">
        <span className="mcm-gsicon">
          <Icon name={icon} />
        </span>
        <div>
          <label className="block text-sm font-medium">{label}</label>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="mcm-gsfield flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          readOnly
          aria-label={`${label}${isVisible ? '' : ' (hidden)'}`}
          value={isVisible ? value : masked}
          className="min-w-0 max-w-xl border-none bg-transparent p-0 font-mono text-sm"
        />
        {/* Says when it will cover itself again, so the countdown is not a
            surprise mid-read. */}
        {isVisible ? <span className="mcm-gscount">Hides in {secondsLeft}s</span> : null}
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hover:text-black cursor-pointer"
            onClick={handleCopy}
          >
            <Icon name={copied ? 'VerifiedCheck' : 'CopyLine'} className="w-4 h-4" />
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hover:text-black cursor-pointer"
            onClick={() => setIsVisible(!isVisible)}
          >
            <Icon name={isVisible ? 'EyeLineOff' : 'EyeLine'} className="w-4 h-4" />
            {isVisible ? 'Hide' : 'Show'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
