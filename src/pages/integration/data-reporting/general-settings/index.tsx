import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@/assets/icons/icon';
import { ChevronIcon } from '@/assets/icons';
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
            <Info className="mcm-intpage-info" />
          </CustomTooltip>
        </div>
      </div>
      <div className="mcm-intbody w-full space-y-3 p-3 overflow-y-auto xs:max-h-[62vh] md:max-h-full">
        {/* One card, not three. The heading and the two credentials were a
            card each, so the page opened with three stacked containers — the
            first holding nothing but two lines of text. They are one thing,
            so they are one card: heading, then a row per credential. */}
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

          <div className="mcm-gsrows">
            <CredentialItem
              icon="Key"
              label="API Key"
              description="Connects your app to Zapier."
              value={user?.uuid}
            />
            <CredentialItem
              icon="LockFilled"
              label="Client Secret"
              description="Signs OAuth token requests."
              value="d6d5ed116231378022040f108c9607cd"
            />
          </div>
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
                name: 'Copy the API Key',
                text: 'Use the Copy button on the field above.',
              },
              {
                n: '2',
                name: 'Add the app in Zapier',
                text: "Find this console's app and paste the key.",
              },
              {
                n: '3',
                name: 'Using OAuth?',
                text: 'Provide the Client Secret if Zapier asks.',
              },
            ].map((step) => (
              <div key={step.n} className="mcm-gsstep">
                {/* Number beside its own heading. It used to sit at the left
                    of a dotted rail with an unrelated glyph at the far right,
                    and the heading began on the line below — so the number,
                    the rail, the glyph and the words were four things
                    competing in a space that holds one idea. */}
                <div className="mcm-gsstep-head">
                  <span className="mcm-gsstep-num">{step.n}</span>
                  <div className="mcm-gsstep-name">{step.name}</div>
                </div>
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

        {/* Where to go next. Both are pages in this same section, and neither
            was reachable from here without going back to the nav. */}
        <div className="mcm-gsnext">
          <Link className="mcm-gsnext-card" to="/admin-settings/integration/data-reporting/zapier">
            <span className="mcm-gsicon">
              <Icon name="IntegrationIcon" />
            </span>
            <span className="mcm-gsnext-text">
              <span className="mcm-gsnext-title">Connect an app</span>
              <span className="mcm-gsnext-sub">
                Google Contacts, Sheets, HubSpot and Pipedrive.
              </span>
            </span>
            <ChevronIcon className="mcm-gsnext-arrow -rotate-90" />
          </Link>
          <Link
            className="mcm-gsnext-card"
            to="/admin-settings/integration/data-reporting/manage-webhook"
          >
            <span className="mcm-gsicon">
              <Icon name="WebhookIcon" />
            </span>
            <span className="mcm-gsnext-text">
              <span className="mcm-gsnext-title">Send to your own endpoint</span>
              <span className="mcm-gsnext-sub">Point these events at a URL you control.</span>
            </span>
            <ChevronIcon className="mcm-gsnext-arrow -rotate-90" />
          </Link>
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
  /* A fixed run of dots, not one per character: a 36-character key drew 32
     dots and stretched the field to the full width of the card. It also
     published the key's length for no benefit. */
  const masked = value ? `${'•'.repeat(8)}${value.slice(-4)}` : 'Not set';

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
    /* One of the two columns beneath the App Credentials heading: label,
       description, then the value with its two actions. */
    <div className="mcm-gsrow">
      <span className="mcm-gsicon">
        <Icon name={icon} />
      </span>
      <div className="mcm-gsrow-text">
        <label className="mcm-gslabel">{label}</label>
        <p className="mcm-gsdesc">{description}</p>
      </div>
      {/* Beside the whole text block and vertically centred, not on the
          label's line alone: "API Key" is 50px, so pinning the field to that
          short line's right edge left an obvious gap in the middle of it. */}
      <div className="mcm-gsfield">
        <Input
            readOnly
            aria-label={`${label}${isVisible ? '' : ' (hidden)'}`}
            value={isVisible ? value : masked}
            className="min-w-0 flex-1 border-none bg-transparent p-0 font-mono"
          />
          {/* Says when it will cover itself again, so the countdown is not a
              surprise mid-read. */}
          {isVisible ? <span className="mcm-gscount">{secondsLeft}s</span> : null}
          {/* Icon-only: spelled out, "Copy" and "Show" crowded the field. Both
              keep an accessible name and a tooltip. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={copied ? 'Copied' : `Copy ${label}`}
            title={copied ? 'Copied' : 'Copy'}
            className="mcm-gsbtn cursor-pointer"
            onClick={handleCopy}
          >
            <Icon name={copied ? 'VerifiedCheck' : 'CopyLine'} className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
            title={isVisible ? 'Hide' : 'Show'}
            className="mcm-gsbtn cursor-pointer"
            onClick={() => setIsVisible(!isVisible)}
          >
            <Icon name={isVisible ? 'EyeLineOff' : 'EyeLine'} className="w-4 h-4" />
          </Button>
      </div>
    </div>
  );
};

export default GeneralSettings;
