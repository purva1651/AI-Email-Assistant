import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Send, CheckCircle2 } from 'lucide-react';

export default function SentView({ sentItems }) {
  const [expanded,setExpanded]=useState(null);
  return <section className="list-page"><div className="page-heading"><div><div className="eyebrow">you said what you said</div><h1>sent things <span className="heading-sticker">↗</span></h1><p>your replies, all tucked away.</p></div><div className="sent-count"><Send size={17}/>{sentItems.length} replies</div></div><div className="sent-list">{sentItems.map(item=><motion.article layout key={item.id} className="sent-card"><button className="sent-card-top" onClick={()=>setExpanded(expanded===item.id?null:item.id)} aria-expanded={expanded===item.id}><span className="sent-check"><CheckCircle2 size={17}/></span><span className="sent-copy"><strong>{item.subject}</strong><span>to {item.to} · {item.time}</span></span><ChevronDown size={17} className={expanded===item.id?'rotate':''}/></button><AnimatePresence>{expanded===item.id&&<motion.div className="sent-body" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}><p>{item.body}</p><span className="sent-status">{item.status==='dry_run'?'dry run — not actually emailed':'reply sent'}</span></motion.div>}</AnimatePresence></motion.article>)}{sentItems.length===0&&<div className="empty-state"><span>✉</span><h3>it's giving empty</h3><p>replies you send will show up here.</p></div>}</div></section>;
}
