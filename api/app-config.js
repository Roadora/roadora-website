// Roadora publieke runtimeconfiguratie — v6.9.0
// Retourneert uitsluitend waarden die veilig in de browser gebruikt mogen worden.

function header(req,name){
  const value=req?.headers?.[name] ?? req?.headers?.[String(name).toLowerCase()];
  return Array.isArray(value)?value[0]:String(value||'');
}
function allowedOrigins(){
  const configured=String(process.env.ROADORA_ALLOWED_ORIGINS||'').split(',').map(value=>value.trim().replace(/\/$/,'')).filter(Boolean);
  const defaults=['https://roadora.eu','https://www.roadora.eu'];
  if(process.env.VERCEL_URL) defaults.push(`https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//,'').replace(/\/$/,'')}`);
  if(process.env.NODE_ENV!=='production'||process.env.ROADORA_ALLOW_LOCALHOST==='1') defaults.push('http://localhost:3000','http://127.0.0.1:3000','http://localhost:5173','http://127.0.0.1:5173');
  return new Set([...defaults,...configured]);
}

export default function handler(req,res){
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Accept');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','no-store, max-age=0');
  const origin=header(req,'origin').replace(/\/$/,'');
  if(origin){
    if(!allowedOrigins().has(origin)) return res.status(403).json({configured:false});
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
  }
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='GET') return res.status(405).json({configured:false});

  const supabaseUrl=String(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim().replace(/\/$/,'');
  const supabasePublishableKey=String(
    process.env.SUPABASE_PUBLISHABLE_KEY||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||
    process.env.SUPABASE_ANON_KEY||''
  ).trim();
  const validUrl=/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl);
  const configured=Boolean(validUrl&&supabasePublishableKey);
  return res.status(200).json({
    configured,
    supabaseUrl:configured?supabaseUrl:'',
    supabasePublishableKey:configured?supabasePublishableKey:''
  });
}
