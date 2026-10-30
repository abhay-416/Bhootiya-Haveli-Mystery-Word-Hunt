import { db } from 'hatchable';
export const access = 'public';
export default async function(req,res){
 const code=String(req.query?.code||'').toUpperCase(); const token=String(req.query?.token||''); if(!code||!token) return res.status(400).json({error:'Missing room session'});
 const r=await db.query('SELECT r.id,r.code,r.status,r.category,r.round_number,r.round_ends_at,r.winner_player_id,p.id AS me_id,p.nickname AS me_name,p.role AS me_role,p.score AS me_score FROM rooms r JOIN players p ON p.room_id=r.id WHERE r.code=$1 AND p.token=$2',[code,token]); if(!r.rows.length) return res.status(403).json({error:'Invalid room session'}); const room=r.rows[0];
 const ps=await db.query('SELECT id,nickname,role,score FROM players WHERE room_id=$1 ORDER BY joined_at',[room.id]);
 const msgs=await db.query("SELECT m.nickname,m.body,m.kind,m.created_at FROM messages m WHERE m.room_id=$1 ORDER BY m.created_at DESC LIMIT 40",[room.id]);
 const word=room.me_role==='ghost' ? (await db.query('SELECT secret_word FROM rooms WHERE id=$1',[room.id])).rows[0].secret_word : null;
 res.json({room:{code:room.code,status:room.status,category:room.category,round_number:room.round_number,round_ends_at:room.round_ends_at,winner_player_id:room.winner_player_id,secret_word:word},me:{id:room.me_id,nickname:room.me_name,role:room.me_role,score:room.me_score},players:ps.rows,messages:msgs.rows.reverse()});
}