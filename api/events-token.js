import { db, events } from 'hatchable';
export const access = 'public';
export default async function(req,res){
 const code = String(req.body?.code || req.query?.code || '').toUpperCase(); const token = String(req.body?.token || req.query?.token || ''); if(!code||!token) return res.status(400).json({error:'Room and player token are required'});
 const q=await db.query('SELECT p.id FROM players p JOIN rooms r ON r.id=p.room_id WHERE r.code=$1 AND p.token=$2',[String(code).toUpperCase(),token]); if(!q.rows.length) return res.status(403).json({error:'Invalid room session'});
 res.json(await events.grant(['room:'+String(code).toUpperCase()]));
}