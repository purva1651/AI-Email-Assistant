import { ArrowLeft, AlertCircle, Check, Clock3, Copy, Flame, Pencil, RotateCw, Send, Sparkles, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const tones = ['Professional', 'Formal', 'Friendly'];

export default function EmailDetail({ email, onBack, onDelete, onDraft, onSend, onAnalyze, busy, analysisError }) {
  const [showDraft, setShowDraft] = useState(false);
  const [tone, setTone] = useState('Professional');
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState('');
  const [checked, setChecked] = useState({});
  const [sending, setSending] = useState(false);
  const analysis = email.analysis || {
    category: email.category || 'Other', priority: email.priority || 'Medium',
    summary: email.summary || 'No summary yet. Run AI analysis to get the key points.',
    action_items: email.actionItems || [],
    reasons: email.reasons || ['Review the sender’s request', 'Check for deadlines or required actions'],
  };
  const priorityClass = (analysis.priority || 'Medium').toLowerCase();
  const draftNow = async () => {
    setShowDraft(true); setDraftError('');
    try { const result = await onDraft(email, tone); setDraft(result.draft); }
    catch (error) { setDraftError(error.message || 'Could not make a draft.'); }
  };
  const changeTone = async nextTone => {
    setTone(nextTone);
    if (!showDraft) return;
    setDraftError('');
    try { const result = await onDraft(email, nextTone); setDraft(result.draft); }
    catch (error) { setDraftError(error.message || 'Could not make a draft.'); }
  };
  const copyDraft = async () => {
    try { await navigator.clipboard.writeText(draft); }
    catch { setDraftError('Clipboard access is blocked by your browser.'); }
  };
  const send = async () => {
    setSending(true); setDraftError('');
    try { await onSend(email, draft); }
    catch (error) { setDraftError(error.message || 'Could not send reply.'); }
    finally { setSending(false); }
  };
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  return <motion.section className="detail-page" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
    <div className="detail-toolbar">
      <button className="button button-soft" onClick={onBack}><ArrowLeft size={15}/> inbox</button>
      <button className="button delete-button" onClick={() => onDelete(email.id)}><Trash2 size={14}/> delete</button>
    </div>
    <div className="detail-grid">
      <article className="message-column">
        <section className="message-card">
          <div className="message-card-top"><strong>{email.sender}</strong><time>{email.time || 'just now'}</time></div>
          <h1 className="detail-subject">{email.subject}</h1>
          <span className={`category-chip cat-${(analysis.category || 'other').toLowerCase()}`}>{(analysis.category || 'Other').toLowerCase()}</span>
          <div className="message-body">{email.body}</div>
        </section>

        <details className="message-extras">
          <summary>Summary and action items</summary>
          <p>{analysis.summary}</p>
          {analysis.action_items?.length > 0 && <div className="action-items-compact">
            {analysis.action_items.map((item, index) => <label className={`action-item ${checked[index] ? 'checked' : ''}`} key={`${item.task}-${index}`}>
              <input type="checkbox" checked={!!checked[index]} onChange={event => setChecked(value => ({ ...value, [index]: event.target.checked }))}/>
              <span className="custom-check"><Check size={12}/></span><span className="action-task">{item.task}</span>
              {item.deadline && <span className="deadline-chip"><Clock3 size={11}/>{item.deadline}</span>}
            </label>)}
          </div>}
        </details>

        {!showDraft && <button className="button draft-trigger" onClick={draftNow} disabled={busy}><Sparkles size={15}/>{busy ? 'drafting…' : 'draft reply'}</button>}
        <AnimatePresence>{showDraft && <motion.section className="draft-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
          <div className="draft-heading"><h3><Pencil size={13}/> your reply draft</h3><button className="icon-button" onClick={() => setShowDraft(false)} aria-label="Close draft"><X size={16}/></button></div>
          <div className="draft-meta"><span>to</span><strong>{email.sender}</strong><span>subject</span><strong>Re: {email.subject}</strong></div>
          <div className="tone-picker" aria-label="Reply tone">{tones.map(item => <button key={item} className={tone === item ? 'active' : ''} onClick={() => changeTone(item)}>{item.toLowerCase()}</button>)}</div>
          <textarea value={draft} onChange={event => setDraft(event.target.value)} placeholder="Your reply draft will appear here" aria-label="Editable reply draft" rows={6}/>
          {draftError && <p className="inline-error"><AlertCircle size={14}/>{draftError}</p>}
          <div className="draft-footer"><span className="word-count">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span><div className="draft-actions">
            <button className="button button-soft" onClick={draftNow} disabled={busy}><RotateCw size={13}/> redo</button>
            <button className="button button-soft" onClick={copyDraft} disabled={!draft}><Copy size={13}/> copy</button>
            <button className="button button-soft send-button" onClick={send} disabled={!draft.trim() || sending}><Send size={13}/>{sending ? 'sending…' : 'send'}</button>
          </div></div>
          <p className="safety-note">Review AI drafts before sending.</p>
        </motion.section>}</AnimatePresence>
        {analysisError && <p className="inline-error"><AlertCircle size={14}/>{analysisError}</p>}
      </article>

      <aside className="ai-panel">
        <div className="ai-panel-head"><Sparkles size={14}/><span>ai read</span></div>
        <div className="priority-label">priority</div>
        <div className={`priority-pill priority-${priorityClass}`}><Flame size={12}/>{analysis.priority || 'Medium'}</div>
        <div className={`priority-segments priority-${priorityClass}`} aria-label={`${analysis.priority || 'Medium'} priority`}><span/><span/><span/></div>
        <div className="ai-reasons"><span className="micro-label">why</span>{(analysis.reasons || []).map((reason, index) => <p className="reason-copy" key={index}>{reason}</p>)}</div>
        {!email.analysis && <button className="button button-soft full-button" onClick={() => onAnalyze(email)} disabled={busy}>{busy ? 'analysing…' : 'refresh ai read'}</button>}
      </aside>
    </div>
  </motion.section>;
}
