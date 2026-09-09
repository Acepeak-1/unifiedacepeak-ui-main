import { useEffect, useState, type ReactNode } from 'react';
import { Switch } from '@/components/ui/switch';
import { AtSign, Phone, Trash2 } from 'lucide-react';
import { ChevronIcon } from '@/assets/icons';
import { Icon } from '@/assets/icons/icon';
import { handleAlert } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * One channel tile, shared by Facebook, Instagram, WhatsApp and Telegram.
 *
 * The four channels each carried their own copy of this markup, so they drifted
 * apart and every fix had to be made four times. The layout decisions live here
 * once; each channel still owns its own connect flow, modal and queries.
 *
 * Two things the old card did that this one does not:
 *
 * - It showed the enable switch on every card, disabled, next to the word
 *   "Active". A switch you cannot move is not a control, it is furniture — the
 *   switch now appears only once a channel is connected and can actually be
 *   toggled.
 * - It gave "Setup required" a full-width amber strip, which filled half the
 *   card restating what the Connect button already says. Connected state is
 *   worth a badge; not-connected is simply the absence of one.
 */
const ChannelCard = ({
  icon,
  name,
  description,
  isConnected,
  isLoading = false,
  onConnect,
  onManage,
  onDelete,
  switchChecked = false,
  onSwitchChange,
  account,
  capabilities = [],
  tone,
}: {
  icon: ReactNode;
  name: string;
  description: string;
  isConnected: boolean;
  isLoading?: boolean;
  onConnect: () => void;
  onManage?: () => void;
  onDelete?: () => void;
  switchChecked?: boolean;
  onSwitchChange?: (checked: boolean) => void;
  /** Shown once connected — the account the channel posts as. */
  account?: string;
  /** What the channel carries once live — gives the pre-connect card
      something concrete to say instead of blank space. */
  capabilities?: string[];
  /** Channel key — tints the logo tile in that platform's own colour. */
  tone?: 'facebook' | 'instagram' | 'whatsapp' | 'telegram';
}) => {
  /* The switch drove itself straight off the `switchChecked` prop, so with no
     live channel behind it (and while a real status call is in flight) it
     never moved when clicked. Hold the state here, hand the change up, and
     re-sync whenever the source of truth changes. */
  const [enabled, setEnabled] = useState(switchChecked);
  useEffect(() => setEnabled(switchChecked), [switchChecked]);

  const toggle = (next: boolean) => {
    setEnabled(next);
    onSwitchChange?.(next);
    /* Pausing a channel stops customer messages reaching the console, which
       is too consequential to signal with a switch sliding 15px. */
    handleAlert({
      text: next
        ? `${name} resumed — new messages will arrive again.`
        : `${name} paused — new messages won't be received.`,
      type: next ? 'success' : 'warning',
    });
  };

  /* A spinner in the footer left the rest of the card empty and everything
     jumped when the list landed. A skeleton holds the same shape. */
  if (isLoading) {
    return (
      <div className="mcm-chcard is-skeleton" aria-busy="true">
        <div className="mcm-chcard-head">
          <span className="mcm-chcard-logo" />
          <span className="mcm-skel mcm-skel-title" />
        </div>
        <div className="mcm-chcard-intro">
          <span className="mcm-skel mcm-skel-line" />
          <span className="mcm-skel mcm-skel-line is-short" />
        </div>
        <div className="mcm-chcard-foot">
          <span className="mcm-skel mcm-skel-pill" />
        </div>
      </div>
    );
  }

  /* A paused channel is still connected but is not doing anything, and only
     one word said so. The card reads as switched off too. */
  return (
    <div className={`mcm-chcard${isConnected && !enabled ? ' is-paused' : ''}`}>
      <div className="mcm-chcard-head">
        <span className={`mcm-chcard-logo${tone ? ` is-${tone}` : ''}`}>{icon}</span>
        <h4>{name}</h4>
        {isConnected ? (
          /* Manage and Remove live here rather than on the card floor: with
             the status badge and the switch, the footer carried four
             controls in a strip barely tall enough for one. */
          <DropdownMenu>
            <DropdownMenuTrigger className="mcm-chcard-menu" aria-label={`${name} actions`}>
              <Icon name="MenuDots" className="h-5 rotate-90" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onManage ? (
                <DropdownMenuItem onClick={onManage}>
                  <Icon name="SettingsIcon" className="!h-4 !w-4" />
                  Manage settings
                </DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                  Remove channel
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {/* Every card carries the same three rows — what the channel does, the
          account behind it, then what it can handle. Swapping the
          description out for the account on connected cards meant no two
          cards in the row said the same kind of thing in the same place. */}
      <div className="mcm-chcard-intro">
        <p className="mcm-chcard-desc">{description}</p>
        <span className={`mcm-chcard-account${isConnected && account ? '' : ' is-empty'}`}>
          {/* A phone number is not a handle, so it does not get an @. */}
          {isConnected && account ? (
            <>
              {/^[+\d]/.test(account) ? <Phone /> : <AtSign />}
              {account}
            </>
          ) : (
            'No account linked yet'
          )}
        </span>
        {capabilities.length ? (
          <ul className="mcm-chcard-caps">
            {capabilities.map((cap) => (
              <li key={cap}>{cap}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mcm-chcard-foot">
        {/* No badge while disconnected: it said the same thing on every
            card and repeated what the Connect action already implies. The
            green badge appears once there is something to report. */}
        {isConnected ? (
          <>
            {/* "Connected" beside an On/Off switch said the same thing twice.
                One live status instead, and the switch is what changes it. */}
            <span className={`mcm-intstatus ${enabled ? 'connected' : ''}`}>
              <i />
              {enabled ? 'Active' : 'Paused'}
            </span>
            <div
              className="mcm-chcard-switch"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <Switch
                checked={enabled}
                onCheckedChange={toggle}
                aria-label={`${name} active`}
              />
            </div>
          </>
        ) : (
          <button type="button" className="mcm-chcard-connect" onClick={onConnect}>
            Connect account
            <ChevronIcon className="-rotate-90" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChannelCard;
