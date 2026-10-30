import { db, events } from 'hatchable';
export const access = 'public';
export default async function(req,res){
 const code=String(req.body?.code||'').trim().toUpperCase(); const nickname=String(req.body?.nickname||'').trim().slice(0,20);
 if(!/^[A-Z0-9]{4}$/.test(code)||!nickname) return res.status(400).json({error:'Enter a valid room code and nickname'});
 const r=await db.query("SELECT id,code,status,max_players FROM rooms WHERE code=$1",[code]); if(!r.rows.length) return res.status(404).json({error:'Room not found'}); const room=r.rows[0];
 if(room.status!=='waiting') return res.status(409).json({error:'This round has already started'});
 const count=await db.query('SELECT COUNT(*)::int AS n FROM players WHERE room_id=$1',[room.id]); if(count.rows[0].n>=room.max_players) return res.status(409).json({error:'Room is full'});
 const dup=await db.query('SELECT id FROM players WHERE room_id=$1 AND lower(nickname)=lower($2)',[room.id,nickname]); if(dup.rows.length) return res.status(409).json({error:'Nickname already taken in this room'});
 const token=crypto.randomUUID()+crypto.randomUUID(); const p=await db.query("INSERT INTO players(room_id,nickname,token,role) VALUES($1,$2,$3,'explorer') RETURNING id,nickname,role,score",[room.id,nickname,token]);
 await events.publish('room:'+code,'changed',{version:Date.now()}); res.json({room:{code:room.code,status:room.status},player:p.rows[0],token,role:'explorer'});
}