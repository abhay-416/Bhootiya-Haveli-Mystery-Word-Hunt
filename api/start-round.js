import { db, events } from 'hatchable';
export const access='public';
export default async function(req,res){
 const code=String(req.body?.code||'').toUpperCase(), token=String(req.body?.token||''), word=String(req.body?.word||'').trim().slice(0,40), category=String(req.body?.category||'Mystery');
 if(!word) return res.status(400).json({error:'Enter a secret word'}); if(!['Mystery','Objects','Places','Food','Animals'].includes(category)) return res.status(400).json({error:'Invalid category'});
 const q=await db.query('SELECT r.id,r.status,p.id AS pid,p.role FROM rooms r JOIN players p ON p.room_id=r.id WHERE r.code=$1 AND p.token=$2',[code,token]); if(!q.rows.length||q.rows[0].role!=='ghost') return res.status(403).json({error:'Only the Ghost can start the round'}); if(q.rows[0].status!=='waiting'&&q.rows[0].status!=='finished') return res.status(409).json({error:'Round already in progress'});
 const end=new Date(Date.now()+300000).toISOString(); await db.query("UPDATE rooms SET status='playing',secret_word=$1,category=$2,round_started_at=now(),round_ends_at=$3,winner_player_id=NULL,clue='',version=version+1,updated_at=now() WHERE id=$4",[word,category,end,q.rows[0].id]); await events.publish('room:'+code,'changed',{version:Date.now()}); res.json({ok:true});
}