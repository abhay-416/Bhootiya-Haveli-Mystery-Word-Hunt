import { db, events } from 'hatchable';
export const access = 'public';
const cats = ['Mystery','Objects','Places','Food','Animals'];
const code = () => Math.random().toString(36).slice(2,6).toUpperCase();
export default async function(req,res){
 const nickname=String(req.body?.nickname||'').trim().slice(0,20);
 if(!nickname) return res.status(400).json({error:'Enter a nickname'});
 let roomCode; for(let i=0;i<8;i++){ const c=code(); const q=await db.query('SELECT id FROM rooms WHERE code=$1',[c]); if(!q.rows.length){roomCode=c;break;} }
 if(!roomCode) return res.status(503).json({error:'Could not create a room. Try again.'});
 const token=crypto.randomUUID()+crypto.randomUUID();
 const r=await db.query("INSERT INTO rooms(code,status,max_players) VALUES($1,'waiting',8) RETURNING id,code,status,round_number,version",[roomCode]);
 const room=r.rows[0];
 const p=await db.query("INSERT INTO players(room_id,nickname,token,role) VALUES($1,$2,$3,'ghost') RETURNING id,nickname,role,score",[room.id,nickname,token]);
 await events.publish('room:'+roomCode,'changed',{version:1});
 res.json({room:room,player:p.rows[0],token,role:'ghost'});
}