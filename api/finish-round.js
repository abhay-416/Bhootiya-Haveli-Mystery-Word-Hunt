import { db, events } from 'hatchable';
export const access='public';
export default async function(req,res){
 const code=String(req.body?.code||'').toUpperCase(),token=String(req.body?.token||'');
 const q=await db.query('SELECT r.id,r.status,r.round_ends_at,p.id AS pid FROM rooms r JOIN players p ON p.room_id=r.id WHERE r.code=$1 AND p.token=$2',[code,token]);
 if(!q.rows.length) return res.status(403).json({error:'Invalid room session'}); const x=q.rows[0];
 if(x.status!=='playing') return res.json({ok:true});
 if(!x.round_ends_at||new Date(x.round_ends_at).getTime()>Date.now()) return res.status(409).json({error:'Round timer is still running'});
 const ended=await db.query("UPDATE rooms SET status='finished',round_ends_at=NULL,version=version+1,updated_at=now() WHERE id=$1 AND status='playing' RETURNING id",[x.id]);
 if(!ended.rows.length) return res.json({ok:true});
 const ghost=await db.query("SELECT id,nickname FROM players WHERE room_id=$1 AND role='ghost' LIMIT 1",[x.id]);
 if(ghost.rows.length){await db.query('UPDATE players SET score=score+100 WHERE id=$1',[ghost.rows[0].id]);await db.query("INSERT INTO messages(room_id,player_id,nickname,body,kind) VALUES($1,$2,$3,$4,'system')",[x.id,ghost.rows[0].id,ghost.rows[0].nickname,'Time is up! The Ghost survives.']);}
 await events.publish('room:'+code,'changed',{version:Date.now()}); res.json({ok:true});
}