import { db, events } from 'hatchable';
export const access='public';
export default async function(req,res){
 const code=String(req.body?.code||'').toUpperCase(),token=String(req.body?.token||''),body=String(req.body?.body||'').trim().slice(0,240),kind=String(req.body?.kind||'chat'); if(!body) return res.status(400).json({error:'Message is empty'}); if(!['chat','clue','guess'].includes(kind)) return res.status(400).json({error:'Invalid message type'});
 const q=await db.query("SELECT r.id,r.status,r.secret_word,p.id AS pid,p.nickname,p.role FROM rooms r JOIN players p ON p.room_id=r.id WHERE r.code=$1 AND p.token=$2",[code,token]); if(!q.rows.length) return res.status(403).json({error:'Invalid room session'}); const x=q.rows[0]; if(x.status!=='playing') return res.status(409).json({error:'No active round'});
 if(kind==='clue'&&x.role!=='ghost') return res.status(403).json({error:'Only the Ghost can reveal clues'}); if(kind==='guess'&&x.role!=='explorer') return res.status(403).json({error:'Only Explorers can guess'});
 if(kind==='guess'&&body.toLowerCase()===String(x.secret_word).toLowerCase()){
  await db.query("UPDATE players SET score=score+100 WHERE id=$1",[x.pid]); await db.query("UPDATE rooms SET status='finished',winner_player_id=$1,round_ends_at=NULL,version=version+1,updated_at=now() WHERE id=$2",[x.pid,x.id]);
  await db.query('INSERT INTO messages(room_id,player_id,nickname,body,kind) VALUES($1,$2,$3,$4,$5)',[x.id,x.pid,x.nickname,'Solved the mystery!','system']); await events.publish('room:'+code,'changed',{version:Date.now()}); return res.json({ok:true,correct:true});
 }
 if(kind==='guess') return res.json({ok:true,correct:false});
 await db.query('INSERT INTO messages(room_id,player_id,nickname,body,kind) VALUES($1,$2,$3,$4,$5)',[x.id,x.pid,x.nickname,body,kind]); await events.publish('room:'+code,'changed',{version:Date.now()}); res.json({ok:true});
}