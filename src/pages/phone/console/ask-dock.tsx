import { useState } from 'react';
import type { DialpadSession } from '@/context/dialpad-context';
import { Ic } from './icons';
import { useCopilotAsk } from './use-copilot-ask';
import { SUGGESTED_QUESTIONS } from './copilot-adapter';
import { demoAskThread } from './demo-data';

/**
 * Ask-Copilot dock — question box, agent picker and the answer thread.
 *
 * Lifted out of `panel-column.tsx` (which nothing renders) so the call
 * side-panel can host it without pulling in that whole module. Behaviour is
 * unchanged; it is still driven by `useCopilotAsk`.
 */
export const AskDock = ({ session }: { session: DialpadSession | null }) => {
  const {
    ask,
    socketOffline,
    contextSummary,
    messages,
    canAsk,
    noAgent,
    agentsLoading,
    agentOptions,
    agentId,
    setAgentId,
  } = useCopilotAsk(session);
  const [text, setText] = useState('');

  /* Nothing has been asked yet (no agent, no call, or simply a fresh panel):
     show a sample exchange so the pane demonstrates itself. The first real
     answer replaces it outright. */
  const demoThread = demoAskThread();
  const isDemo = messages.length === 0 && demoThread.length > 0;

  const send = (value: string) => {
    if (!value.trim() || !canAsk) return;
    ask(value);
    setText('');
  };

  return (
    <>
      <div className="pscroll" style={{ borderTop: '1px solid var(--line)' }}>
        {isDemo ? (
          <>
            <div style={{ marginBottom: 10 }}>
              <span className="src demo">
                <Ic n="alert" size={9} />
                Demo data
              </span>
            </div>
            {demoThread.map((m, i) => (
              <div className="qa" key={`demo-${i}`}>
                <div className={m.role === 'q' ? 'bub-q' : 'bub-a'}>{m.text}</div>
              </div>
            ))}
          </>
        ) : null}
        {messages.length
          ? messages.map((m, i) => (
              <div className="qa" key={i}>
                {m.role === 'q' ? (
                  <div className="bub-q">{m.text}</div>
                ) : m.pending ? (
                  <div className="bub-a">
                    <span className="typing">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                ) : (
                  <div className="bub-a">{m.text}</div>
                )}
              </div>
            ))
          : null}
      </div>
      <div className="askdock">
        <div className="scope">
          {socketOffline ? (
            <span className="scopebtn offline">
              <Ic n="alert" size={10} /> AI service not connected
            </span>
          ) : agentsLoading ? (
            <span className="scopebtn">Loading agents…</span>
          ) : noAgent ? (
            <span className="scopebtn">No AI agent configured</span>
          ) : (
            agentOptions.map((a: any) => (
              <button
                type="button"
                key={a.value}
                className={`scopebtn ${agentId === a.value ? 'on' : ''}`}
                onClick={() => setAgentId(a.value)}
              >
                {a.label}
              </button>
            ))
          )}
        </div>
        <div className="askrow">
          <textarea
            rows={1}
            placeholder={
              socketOffline
                ? 'Copilot is offline — the AI socket is not connected'
                : noAgent
                  ? 'No AI agent available'
                  : canAsk
                    ? 'Ask the Copilot about this call…'
                    : 'Available once a call is connected'
            }
            value={text}
            disabled={!canAsk}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
          />
          <button
            type="button"
            className="sendbtn"
            aria-label="Ask"
            disabled={!canAsk}
            onClick={() => send(text)}
          >
            <Ic n="send" size={17} />
          </button>
        </div>
        {canAsk && contextSummary ? (
          <div className="ask-context">
            <Ic n="merge" size={10} />
            Sending with this call: {contextSummary.hasContact ? 'contact record' : 'number only'}
            {contextSummary.turns
              ? ` · last ${contextSummary.turns} turns`
              : ' · no transcript yet'}
          </div>
        ) : null}
        {!messages.length && canAsk ? (
          <div className="suggests">
            {SUGGESTED_QUESTIONS.map((s) => (
              <button type="button" className="sugg" key={s} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
};


export default AskDock;
