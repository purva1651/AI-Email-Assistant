import { motion } from 'framer-motion';
import { Flame, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const categories = ['All', 'Business', 'Personal', 'Support', 'Finance', 'Marketing', 'Other'];
const avatarColors = ['#d9e7ff', '#f8dce8', '#d8f0d5', '#cfeee5', '#f7e0d6', '#dce8ff'];

export default function EmailList({ emails, onOpen, onDelete, onAdd, busyIds = [] }) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const unreadCount = emails.filter(email => email.unread).length;
  const filtered = useMemo(() => emails.filter(email =>
    (category === 'All' || email.category === category) &&
    `${email.sender} ${email.subject} ${email.body}`.toLowerCase().includes(query.toLowerCase())
  ), [emails, category, query]);

  return <section className="list-page inbox-page">
    <header className="inbox-heading">
      <div><h1>inbox</h1><p>{unreadCount} unread, labeled by ai</p></div>
      <div className="inbox-heading-actions">
        {searchOpen && <label className="inbox-search"><Search size={15}/><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search inbox" aria-label="Search inbox"/></label>}
        <button className="button add-email-button" onClick={onAdd}><Plus size={15}/> add email</button>
        <button className="icon-button inbox-search-toggle" onClick={() => { setSearchOpen(value => !value); setQuery(''); }} aria-label={searchOpen ? 'Close search' : 'Search inbox'}><Search size={16}/></button>
      </div>
    </header>

    <nav className="category-tabs" aria-label="Filter emails by category">
      {categories.map((item) => {
        const count = item === 'All' ? emails.length : emails.filter(email => email.category === item).length;
        return <button key={item} type="button" onClick={() => setCategory(item)} className={category === item ? 'selected' : ''} aria-pressed={category === item}>
          <span className={`filter-dot filter-${item.toLowerCase()}`}/><span>{item.toLowerCase()}</span><span className="filter-count">{count}</span>
        </button>;
      })}
    </nav>

    <div className="email-list">
      {filtered.map((email, index) => <motion.article key={email.id} layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .02, .12) }} className={`email-row ${email.unread ? 'unread' : ''}`}>
        <button className="email-open" onClick={() => onOpen(email.id)} aria-label={`${email.unread ? 'Unread, ' : ''}${email.sender}: ${email.subject}`}>
          <span className="sender-avatar inbox-avatar" style={{ backgroundColor: avatarColors[index % avatarColors.length] }}>{email.sender?.trim().slice(0, 1).toUpperCase() || '?'}</span>
          <span className="email-sender">{email.sender}</span>
          <span className={`category-chip cat-${(email.category || 'other').toLowerCase()}`}>{(email.category || 'Other').toLowerCase()}</span>
          <span className="email-copy-line"><strong className="email-subject">{email.subject}{email.replied && <span className="replied-mini">replied</span>}</strong><span className="email-preview">{email.body}</span></span>
          {email.priority === 'High' ? <Flame className="priority-marker" size={15} aria-label="High priority"/> : <span className="priority-marker-placeholder"/>}
          <span className="email-time">{email.time || 'just now'}</span>
        </button>
        {busyIds.includes(email.id) && <span className="analyzing-dot">analysing…</span>}
        <button className="icon-button delete-row" onClick={() => onDelete(email.id)} aria-label={`Delete email from ${email.sender}`} title="Delete email"><Trash2 size={15}/></button>
      </motion.article>)}
      {filtered.length === 0 && <div className="empty-state"><span>✉</span><h3>No emails here</h3><p>Choose another category or add an email.</p></div>}
    </div>
  </section>;
}
