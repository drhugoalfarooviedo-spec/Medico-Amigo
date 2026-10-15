/* Médico Amigo v1.0.32 · Navegación del dashboard y vista de citas */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getSession=()=>{try{return JSON.parse(localStorage.getItem('medico_amigo_supabase_session')||'null')}catch{return null}};
let lastLoad=0, loading=false;
function navigate(action){
 const targets={new:'newConsultationBtn',patients:'patientsNavBtn',agenda:'openAgendaBtn',rx:'quickPrescriptionBtn'};
 if(targets[action])$(targets[action])?.click();
}
async function loadUpcoming(){
 const home=$('homeScreen'),container=$('dashUpcomingList'),s=getSession();
 if(!home||home.classList.contains('hidden')||!s?.access_token||!s?.user?.id||loading||Date.now()-lastLoad<12000)return;
 loading=true;lastLoad=Date.now();
 const base='https://kdjvsbiqjpztdugewuve.supabase.co/rest/v1/';
 const key='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const headers={apikey:key,Authorization:'Bearer '+s.access_token};
 try{
  const start=new Date();start.setHours(0,0,0,0);
  const date=[start.getFullYear(),String(start.getMonth()+1).padStart(2,'0'),String(start.getDate()).padStart(2,'0')].join('-');
  const url=base+'medical_appointments?select=id,patient_id,starts_at,reason,status&doctor_id=eq.'+encodeURIComponent(s.user.id)+'&status=eq.scheduled&starts_at=gte.'+date+'T00%3A00%3A00&order=starts_at.asc&limit=4';
  const res=await fetch(url,{headers});if(!res.ok)throw Error('Agenda no disponible');
  const rows=await res.json();
  if(!rows.length){container.innerHTML='<p>No tienes citas programadas próximamente.</p>';return}
  const ids=[...new Set(rows.map(a=>a.patient_id))];
  const pr=await fetch(base+'patients?select=id,full_name&id=in.('+ids.join(',')+')',{headers});
  const names=pr.ok?await pr.json():[];const byId=new Map(names.map(p=>[p.id,p.full_name]));
  container.innerHTML=rows.map(a=>{
   const dt=new Date(a.starts_at),when=dt.toLocaleString('es-BO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
   return '<div class="dash-appointment"><span class="dash-appointment-time">'+esc(when)+'</span><div class="dash-appointment-info"><strong>'+esc(byId.get(a.patient_id)||'Paciente')+'</strong><small>'+esc(a.reason||'Consulta programada')+'</small></div></div>';
  }).join('');
 }catch{container.innerHTML='<p>Abre la agenda para consultar tus citas.</p>'}finally{loading=false}
}
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('[data-dash-action]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.dashAction)));
 const d=new Date();if($('dashTodayLabel'))$('dashTodayLabel').textContent=d.toLocaleDateString('es-BO',{day:'numeric',month:'long',year:'numeric'});
 const home=$('homeScreen');if(home){new MutationObserver(()=>{if(!home.classList.contains('hidden'))loadUpcoming()}).observe(home,{attributes:true,attributeFilter:['class']});}
 window.addEventListener('focus',loadUpcoming);document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadUpcoming()});
 loadUpcoming();
});
})();
