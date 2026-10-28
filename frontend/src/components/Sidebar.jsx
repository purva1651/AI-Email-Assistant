import { Inbox, Flame, Send, Settings, Sun, Moon, Monitor, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ view, setView, theme, setTheme }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const items = [{ id: 'inbox', label: 'inbox', Icon: Inbox }, { id: 'priority', label: 'priority', Icon: Flame }, { id: 'sent', label: 'sent', Icon: Send }];
  return <aside className="sidebar">
    <div className="brand-mark" aria-label="Mail assistant"><Sparkles size={21}/></div>
    <nav aria-label="main navigation">{items.map(({id,label,Icon}) => <button key={id} className={`nav-item ${view===id?'active':''}`} onClick={() => setView(id)} aria-current={view===id?'page':undefined}><Icon size={19}/><span>{label}</span></button>)}</nav>
    <div className="sidebar-bottom"><AnimatePresence>{settingsOpen && <motion.div className="settings-menu" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}>{[{id:'light',Icon:Sun},{id:'dark',Icon:Moon},{id:'system',Icon:Monitor}].map(({id,Icon}) => <button key={id} onClick={() => {setTheme(id);setSettingsOpen(false)}} className={theme===id?'chosen':''}><Icon size={16}/>{id}</button>)}</motion.div>}</AnimatePresence><button className={`nav-item settings-button ${settingsOpen?'active':''}`} onClick={() => setSettingsOpen(v=>!v)} aria-expanded={settingsOpen}><Settings size={19}/><span>settings</span><ChevronUp className="settings-chevron" size={15}/></button><div className="avatar">✿</div></div>
  </aside>;
}
