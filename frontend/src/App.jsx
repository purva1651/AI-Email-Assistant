import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCcw, X, AlertCircle, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import EmailList from './components/EmailList.jsx';
import EmailDetail from './components/EmailDetail.jsx';
import AddEmailModal from './components/AddEmailModal.jsx';
import PriorityView from './components/PriorityView.jsx';
import SentView from './components/SentView.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { sampleEmails } from './lib/sampleEmails.js';
import { analyzeEmail, draftReply, sendReply } from './api.js';

const makeId=()=>`mail-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const timeNow=()=>new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
const apiEmail=e=>({sender:e.sender,sender_email:e.senderEmail||'',subject:e.subject,body:e.body});

export default function App() {
  const [emails,setEmails]=useLocalStorage('mailclub.emails',sampleEmails);
  const [sentItems,setSentItems]=useLocalStorage('mailclub.sent',[]);
  const [theme,setTheme]=useLocalStorage('mailclub.theme','system');
  const [view,setView]=useState('inbox');
  const [selectedId,setSelectedId]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [busyIds,setBusyIds]=useState([]);
  const [toast,setToast]=useState(null);
  const [undoDelete,setUndoDelete]=useState(null);
  const [sort,setSort]=useState('priority');
  const [sendUndo,setSendUndo]=useState(null);
  const [lastSent,setLastSent]=useState(null);
  const selected=emails.find(e=>e.id===selectedId);
  const themeValue=theme==='system'?(window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;
  useEffect(()=>{document.documentElement.dataset.theme=themeValue;},[themeValue]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(null),4200);return()=>clearTimeout(id)},[toast]);
  useEffect(()=>{if(!sendUndo)return;const id=setTimeout(async()=>{try{const result=await sendReply({to:sendUndo.to,subject:sendUndo.subject,body:sendUndo.body});const completed={...sendUndo,status:result.status};setSentItems(current=>[completed,...current]);updateEmail(sendUndo.originalId,{replied:true});setLastSent(completed);setToast({message:result.status==='dry_run'?'dry run complete — no email sent':'reply sent',kind:'success'});}catch(err){setToast({message:err.message||'could not send reply',kind:'error'});}finally{setSendUndo(null)}},4000);return()=>clearTimeout(id)},[sendUndo]);
  const updateEmail=(id,patch)=>setEmails(current=>current.map(e=>e.id===id?{...e,...patch}:e));
  const openEmail=id=>{setSelectedId(id);setView('inbox');updateEmail(id,{unread:false})};
  const deleteEmail=id=>{const item=emails.find(e=>e.id===id);if(!item)return;setUndoDelete({item,index:emails.findIndex(e=>e.id===id)});setEmails(current=>current.filter(e=>e.id!==id));if(selectedId===id)setSelectedId(null);setToast({message:'email deleted',kind:'delete'});};
  const undoDeleteNow=()=>{if(!undoDelete)return;setEmails(current=>{const next=[...current];next.splice(Math.min(undoDelete.index,next.length),0,undoDelete.item);return next});setUndoDelete(null);setToast(null)};
  const analyse=async email=>{setBusyIds(v=>v.includes(email.id)?v:[...v,email.id]);try{const result=await analyzeEmail(apiEmail(email));updateEmail(email.id,{analysis:result,category:result.category,priority:result.priority,reasons:result.reasons,summary:result.summary,actionItems:result.action_items||[]});return result;}catch(err){setToast({message:err.message,kind:'error'});throw err;}finally{setBusyIds(v=>v.filter(id=>id!==email.id))}};
  const draft=async(email,tone)=>{setBusyIds(v=>v.includes(email.id)?v:[...v,email.id]);try{return await draftReply({...apiEmail(email),tone,analysis:email.analysis||null})}finally{setBusyIds(v=>v.filter(id=>id!==email.id))}};
  const send=async(email,body)=>{const to=email.senderEmail;if(!to)throw new Error('add a sender email address before sending this reply');const item={id:makeId(),to,subject:`Re: ${email.subject}`,body,time:timeNow(),originalId:email.id};setSendUndo(item);setLastSent(null);setToast({message:'reply queued — you have 4 seconds to undo',kind:'success'});};
  const addEmail=async form=>{const email={id:makeId(),...form,senderEmail:form.senderEmail.trim(),time:timeNow(),createdAt:Date.now(),category:'Other',priority:'Medium',reasons:[],summary:'',actionItems:[],unread:true};setEmails(current=>[email,...current]);setShowAdd(false);setView('inbox');setSelectedId(null);setBusyIds(v=>[...v,email.id]);try{const result=await analyzeEmail(apiEmail(email));setEmails(current=>current.map(e=>e.id===email.id?{...e,analysis:result,category:result.category,priority:result.priority,reasons:result.reasons,summary:result.summary,actionItems:result.action_items||[]}:e));setToast({message:'email added + analysed',kind:'success'});}catch(err){setToast({message:`email saved; AI analysis failed: ${err.message}`,kind:'error'});}finally{setBusyIds(v=>v.filter(id=>id!==email.id))}};
  const sortedEmails=useMemo(()=>emails,[emails]);
  return <div className="app-shell"><Sidebar view={view} setView={v=>{setView(v);setSelectedId(null)}} theme={theme} setTheme={setTheme}/><main className="workspace"><AnimatePresence mode="wait" initial={false}>
    {view==='inbox'&&!selected&&<motion.div key="inbox"><EmailList emails={sortedEmails} onOpen={openEmail} onDelete={deleteEmail} onAdd={()=>setShowAdd(true)} onAnalyze={analyse} busyIds={busyIds}/></motion.div>}
    {view==='inbox'&&selected&&<motion.div key={selected.id}><EmailDetail email={selected} onBack={()=>setSelectedId(null)} onDelete={deleteEmail} onDraft={draft} onSend={send} onAnalyze={analyse} busy={busyIds.includes(selected.id)} analysisError={null}/></motion.div>}
    {view==='priority'&&<motion.div key="priority"><PriorityView emails={emails} onOpen={openEmail} sort={sort} setSort={setSort}/></motion.div>}
    {view==='sent'&&<motion.div key="sent"><SentView sentItems={sentItems}/></motion.div>}
  </AnimatePresence></main>
  <AnimatePresence>{showAdd&&<AddEmailModal onClose={()=>setShowAdd(false)} onSubmit={addEmail} busy={busyIds.length>0}/>}</AnimatePresence>
  <AnimatePresence>{toast&&<motion.div className={`toast ${toast.kind==='error'?'toast-error':''}`} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}} role="status">{toast.kind==='error'?<AlertCircle size={17}/>:<Check size={17}/>}<span>{toast.message}</span>{toast.kind==='delete'&&<button onClick={undoDeleteNow}><RotateCcw size={14}/> undo</button>}<button className="toast-close" onClick={()=>setToast(null)} aria-label="Dismiss notification"><X size={15}/></button></motion.div>}</AnimatePresence>
  <AnimatePresence>{sendUndo&&<motion.div className="undo-send-bar" initial={{y:60,opacity:0}} animate={{y:0,opacity:1}} exit={{y:60,opacity:0}}><span><Sparkles size={16}/> reply queued — undo send?</span><button onClick={()=>{setSendUndo(null);setLastSent(null);setToast({message:'send cancelled — nothing was sent',kind:'success'})}}>undo send</button><span className="undo-count">4s</span></motion.div>}</AnimatePresence>
  <AnimatePresence>{lastSent&&<motion.div className="sent-confirm-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}><span className="confirm-icon"><Check size={18}/></span><div><strong>{lastSent.status==='dry_run'?'dry run complete':'reply sent'}</strong><span>{lastSent.status==='dry_run'?'nothing was emailed — safe preview mode':'your reply is in sent things'}</span></div><button className="icon-button" onClick={()=>{setLastSent(null);setView('sent');setSelectedId(null)}}>view sent</button><button className="icon-button" onClick={()=>{setLastSent(null)}} aria-label="Dismiss sent confirmation"><X size={15}/></button></motion.div>}</AnimatePresence>
  </div>;
}
