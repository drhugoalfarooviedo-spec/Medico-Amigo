/* Médico Amigo — Agenda de citas v1.0.31 */
(()=>{
'use strict';
const BASE='https://kdjvsbiqjpztdugewuve.supabase.co/rest/v1/';
const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
const $=id=>document.getElementById(id);
const session=()=>{try{return JSON.parse(localStorage.getItem('medico_amigo_supabase_session')||'null')}catch{return null}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let patients=[],appointments=[],editing=null;
function status(s){$('agendaMessage').textContent=s||''}
async function api(path,options={}){
 const s=session();if(!s?.access_token||!s?.user?.id)throw Error('Inicia sesión para usar la agenda.');
 const r=await fetch(BASE+path,{...options,headers:{apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',...(options.headers||{})}});
 const raw=await r.text();let data;try{data=raw?JSON.parse(raw):null}catch{data=raw}
 if(!r.ok)throw Error(data?.message||data?.hint||raw||'Error de conexión');return data;
}
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const datetime=a=>new Date(a.starts_at).toLocaleString('es-BO',{dateStyle:'medium',timeStyle:'short'});
function show(){if(!session()?.user?.id){status('Inicia sesión primero.');return}document.querySelectorAll('main.app > section').forEach(e=>e.classList.add('hidden'));$('agendaScreen').classList.remove('hidden');window.scrollTo(0,0);load()}
function home(){$('agendaScreen').classList.add('hidden');$('homeScreen').classList.remove('hidden');window.scrollTo(0,0)}
function reset(){editing=null;$('agendaForm').reset();$('agendaDate').value=localDate();$('agendaTime').value='09:00';$('agendaFormTitle').textContent='Agendar nueva cita';$('agendaSubmit').textContent='Guardar cita';$('agendaCancelEdit').classList.add('hidden')}
async function load(){status('Cargando agenda…');try{
 const s=session();[patients,appointments]=await Promise.all([api('patients?select=id,full_name,document_number&order=full_name.asc'),api('medical_appointments?select=*&doctor_id=eq.'+encodeURIComponent(s.user.id)+'&order=starts_at.asc')]);
 const sel=$('agendaPatient'),prior=sel.value;sel.replaceChildren(new Option('Selecciona un paciente',''));patients.forEach(p=>sel.add(new Option(p.full_name+(p.document_number?' · '+p.document_number:''),p.id)));sel.value=prior;
 render();status('');
 }catch(e){status('No se pudo cargar la agenda: '+e.message+' Comprueba que ejecutaste el SQL de instalación.')}}
function render(){const day=$('agendaFilterDate').value,rows=appointments.filter(a=>!day||a.starts_at.slice(0,10)===day);$('agendaCount').textContent=rows.length+' cita(s)';
 $('agendaList').innerHTML=rows.length?rows.map(a=>{const p=patients.find(p=>p.id===a.patient_id);return `<article class="agenda-item"><div><strong>${esc(p?.full_name||'Paciente')}</strong><span>${esc(datetime(a))}</span><small>${esc(a.reason||'Sin motivo especificado')}</small><em class="agenda-state">${esc(({scheduled:'Programada',completed:'Atendida',cancelled:'Cancelada',no_show:'No asistió'})[a.status]||a.status)}</em></div><div class="agenda-item-actions"><button type="button" data-edit="${esc(a.id)}">Editar</button><button type="button" data-state="${esc(a.id)}">Cambiar estado</button></div></article>`}).join(''):'<p class="agenda-empty">No hay citas para esta fecha.</p>';
 $('agendaList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));$('agendaList').querySelectorAll('[data-state]').forEach(b=>b.onclick=()=>changeState(b.dataset.state));}
function edit(id){const a=appointments.find(x=>x.id===id);if(!a)return;editing=id;$('agendaPatient').value=a.patient_id;$('agendaDate').value=a.starts_at.slice(0,10);$('agendaTime').value=a.starts_at.slice(11,16);$('agendaReason').value=a.reason||'';$('agendaNotes').value=a.notes||'';$('agendaFormTitle').textContent='Editar cita';$('agendaSubmit').textContent='Guardar cambios';$('agendaCancelEdit').classList.remove('hidden');$('agendaForm').scrollIntoView({behavior:'smooth',block:'start'})}
async function changeState(id){const a=appointments.find(x=>x.id===id);if(!a)return;const values=['scheduled','completed','cancelled','no_show'];const labels=['Programada','Atendida','Cancelada','No asistió'];const choice=prompt('Estado de la cita:\n1. Programada\n2. Atendida\n3. Cancelada\n4. No asistió\n\nEscribe un número del 1 al 4:',String(values.indexOf(a.status)+1));if(choice===null)return;const i=Number(choice)-1;if(!Number.isInteger(i)||i<0||i>3){status('Selecciona un número entre 1 y 4.');return}try{await api('medical_appointments?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:values[i]})});status('Estado actualizado: '+labels[i]);await load()}catch(e){status(e.message)}}
async function save(e){e.preventDefault();const s=session(),patient_id=$('agendaPatient').value,date=$('agendaDate').value,time=$('agendaTime').value;if(!patient_id||!date||!time){status('Completa paciente, fecha y hora.');return}const starts_at=date+'T'+time+':00';const payload={patient_id,starts_at,reason:$('agendaReason').value.trim(),notes:$('agendaNotes').value.trim()};const btn=$('agendaSubmit');btn.disabled=true;try{if(editing){await api('medical_appointments?id=eq.'+encodeURIComponent(editing),{method:'PATCH',body:JSON.stringify(payload)})}else{payload.doctor_id=s.user.id;payload.status='scheduled';await api('medical_appointments',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(payload)})}reset();await load();status('Cita guardada correctamente.')}catch(err){status('No se pudo guardar: '+err.message)}finally{btn.disabled=false}}
document.addEventListener('DOMContentLoaded',()=>{
 $('openAgendaBtn')?.addEventListener('click',show);$('agendaBack')?.addEventListener('click',home);$('agendaForm')?.addEventListener('submit',save);$('agendaCancelEdit')?.addEventListener('click',reset);$('agendaFilterDate')?.addEventListener('change',render);$('agendaFilterClear')?.addEventListener('click',()=>{$('agendaFilterDate').value='';render()});reset();
});
})();
