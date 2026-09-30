
async function medicoAmigoBlobDataURL(blob){
 return await new Promise((resolve,reject)=>{
  const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);
 });
}


/* ============================================================
   v1.5.1 — CAMBIO DE SESIÓN SEGURO
   Evita que estado clínico/caché de un médico sobreviva al logout.
============================================================ */
(()=>{
 const SESSION='medico_amigo_supabase_session';
 const CLINICAL_SESSION_KEYS=[
   'medicoAmigoCurrentPatientId','medicoAmigoDoctorConfig','doctorConfig',
   'medicoAmigoCurrentConsultationId','medicoAmigoCurrentPrescriptionId'
 ];
 function purgeClinicalState(){
   CLINICAL_SESSION_KEYS.forEach(k=>sessionStorage.removeItem(k));
   // Limpia únicamente estado clínico legado; no credenciales del nuevo login.
   [
    'medicoAmigoPatients','medicoAmigoConsultations','medicoAmigoPayments',
    'medicoAmigoPrescriptions','medicoAmigoRecentConsultations',
    'medicoAmigoDashboard','medicoAmigoToday','medicoAmigoState',
    'medicoAmigoLastPrescription','medicoAmigoFlow'
   ].forEach(k=>{
     localStorage.removeItem(k);
     sessionStorage.removeItem(k);
   });
   try{
     if(window.state){
       window.state.currentPatientId=null;
       window.state.selectedPatient=null;
       window.state.currentConsultationId=null;
     }
     window.selectedPatient=null;
     window.detailPatient=null;
   }catch{}
 }
 // Capture logout before legacy handlers run, purge state, then allow normal logout.
 document.addEventListener('click',e=>{
   const b=e.target.closest('#logoutBtn,.logout-button,[data-action="logout"]');
   if(!b)return;
   purgeClinicalState();
 },true);

 // Detect an actual account switch and force a clean reload once.
 const originalSet=Storage.prototype.setItem;
 Storage.prototype.setItem=function(key,value){
   if(this===localStorage && key===SESSION){
     let oldUid=null,newUid=null;
     try{oldUid=JSON.parse(localStorage.getItem(SESSION)||'null')?.user?.id||null}catch{}
     try{newUid=JSON.parse(value||'null')?.user?.id||null}catch{}
     originalSet.call(this,key,value);
     if(oldUid && newUid && oldUid!==newUid){
       purgeClinicalState();
       sessionStorage.setItem('medicoAmigoJustSwitchedUser','1');
     }
     return;
   }
   return originalSet.call(this,key,value);
 };
 window.addEventListener('load',()=>{
   const flag=sessionStorage.getItem('medicoAmigoJustSwitchedUser');
   if(flag){
     sessionStorage.removeItem('medicoAmigoJustSwitchedUser');
     setTimeout(()=>location.reload(),50);
   }
 });
})();


/* ============================================================
   v1.5 — AISLAMIENTO EXPLÍCITO POR MÉDICO
   Defensa adicional al RLS: toda lectura/escritura clínica REST
   queda ligada al UUID del usuario autenticado.
============================================================ */
(()=>{
 const BASE='https://kdjvsbiqjpztdugewuve.supabase.co/rest/v1/';
 const SESSION='medico_amigo_supabase_session';
 const OWNED=new Set(['patients','consultations','prescriptions','prescription_items','payments']);
 const nativeFetch=window.fetch.bind(window);
 const getSession=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}};
 const tableOf=url=>{
   try{
     const u=new URL(typeof url==='string'?url:url.url,location.href);
     if(!u.href.startsWith(BASE))return null;
     return u.pathname.split('/rest/v1/')[1]?.split('/')[0]||null;
   }catch{return null}
 };
 const bodyWithDoctor=(body,uid)=>{
   if(!body)return body;
   try{
     const parsed=typeof body==='string'?JSON.parse(body):body;
     if(Array.isArray(parsed)) return JSON.stringify(parsed.map(x=>({...x,doctor_id:uid})));
     if(parsed && typeof parsed==='object') return JSON.stringify({...parsed,doctor_id:uid});
   }catch{}
   return body;
 };
 window.fetch=async function(input,init={}){
   const table=tableOf(input);
   if(!table||!OWNED.has(table))return nativeFetch(input,init);
   const s=getSession(),uid=s?.user?.id;
   if(!uid)return nativeFetch(input,init);

   let raw=typeof input==='string'?input:input.url;
   const u=new URL(raw,location.href);
   const method=(init.method||'GET').toUpperCase();

   // Every clinical operation is scoped to the authenticated doctor.
   if(!u.searchParams.has('doctor_id'))u.searchParams.append('doctor_id','eq.'+uid);

   const next={...init};
   if(['POST','PATCH'].includes(method) && next.body) next.body=bodyWithDoctor(next.body,uid);

   return nativeFetch(u.toString(),next);
 };
})();

/* ============================================================
   v1.1.1 — LIMPIEZA ÚNICA DE DATOS DEMO/LOCALES
   Mantiene autenticación y configuración del médico.
============================================================ */
(function(){
  const CLEAN_KEY='medico_amigo_clean_111';
  if(localStorage.getItem(CLEAN_KEY)==='1') return;

  // Remove only legacy clinical/demo state. Do NOT clear auth/session/profile config.
  [
    'medicoAmigoPatients',
    'medicoAmigoConsultations',
    'medicoAmigoPayments',
    'medicoAmigoPrescriptions',
    'medicoAmigoRecentConsultations',
    'medicoAmigoDashboard',
    'medicoAmigoToday',
    'medicoAmigoState'
  ].forEach(k=>sessionStorage.removeItem(k));

  localStorage.setItem(CLEAN_KEY,'1');
})();

document.addEventListener('DOMContentLoaded',()=>{
const $=id=>document.getElementById(id),screens=[$('loginScreen'),$('homeScreen'),$('patientScreen'),$('newPatientScreen'),$('consultationScreen'),$('prescriptionScreen'),$('paymentScreen'),$('patientsScreen'),$('patientDetailScreen'),$('settingsScreen')];let selectedPatient=null,currentConsultation=null,currentPrescription=null;
const show=s=>{screens.forEach(x=>x.classList.add('hidden'));s.classList.remove('hidden');scrollTo(0,0)};
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const cards=()=>document.querySelectorAll('.patient-result');
/* v1.0.1: eliminado el login simulado de la etapa prototipo */function openPatients(){show($('patientScreen'));$('patientSearchInput').value='';filter();setTimeout(()=>$('patientSearchInput').focus(),100)}
$('newConsultationBtn').onclick=openPatients;$('searchPatientBtn').onclick=openPatients;$('backHomeBtn').onclick=()=>show($('homeScreen'));
function filter(){const q=normalize($('patientSearchInput').value.trim());let n=0;cards().forEach(c=>{const ok=[c.dataset.name,c.dataset.ci,c.dataset.phone].some(v=>normalize(v).includes(q));c.style.display=ok?'flex':'none';if(ok)n++});$('patientResults').classList.toggle('hidden',n===0);$('noPatientResults').classList.toggle('hidden',n!==0)}$('patientSearchInput').oninput=filter;
function patientFromCard(c){const small=c.querySelector('.patient-info small')?.textContent||'';return{name:c.querySelector('.patient-info strong').textContent.trim(),ci:c.dataset.ci||'',phone:c.dataset.phone||'',meta:small,history:c.dataset.history||'',allergies:c.dataset.allergies||'',medication:c.dataset.medication||''}}
function select(c){selectedPatient=patientFromCard(c);openConsultation()}function bind(c){c.onclick=()=>select(c)}cards().forEach(bind);
window.medicoAmigoSelectPatient=(p)=>{selectedPatient=p;openConsultation()};
function openConsultation(){if(!selectedPatient)return;const p=selectedPatient;$('consultationPatientName').textContent=p.name;$('selectedPatientName').textContent=p.name;$('selectedPatientMeta').textContent=[p.ci?'CI: '+p.ci:'Sin documento',p.meta].filter(Boolean).join(' · ');$('consultationAvatar').textContent=initials(p.name);$('consultationDateTime').textContent=new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short'}).format(new Date());const items=[];if(p.history)items.push(['Antecedentes',p.history]);if(p.allergies)items.push(['Alergias',p.allergies]);if(p.medication)items.push(['Medicación habitual',p.medication]);$('clinicalSummaryContent').innerHTML='';items.forEach(([a,b])=>{const d=document.createElement('div');d.className='clinical-item';const s=document.createElement('strong');s.textContent=a;const t=document.createElement('span');t.textContent=b;d.append(s,t);$('clinicalSummaryContent').appendChild(d)});$('patientClinicalSummary').classList.toggle('hidden',items.length===0);show($('consultationScreen'))}
$('backToPatientsBtn').onclick=$('cancelConsultationBtn').onclick=()=>show($('patientScreen'));
$('registerPatientBtn').onclick=()=>{$('newPatientForm').reset();$('calculatedAge').classList.add('hidden');$('formMessage').className='form-message hidden';show($('newPatientScreen'));setTimeout(()=>$('patientFullName').focus(),100)};$('backPatientSearchBtn').onclick=$('cancelNewPatientBtn').onclick=()=>show($('patientScreen'));
const birth=$('patientBirthDate');birth.max=new Date().toISOString().split('T')[0];function age(){if(!birth.value){$('calculatedAge').classList.add('hidden');return null}const b=new Date(birth.value+'T00:00:00'),t=new Date();if(isNaN(b)||b>t||b.getFullYear()<1900){$('calculatedAge').classList.add('hidden');return null}let a=t.getFullYear()-b.getFullYear();if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))a--;$('ageValue').textContent=a+(a===1?' año':' años');$('calculatedAge').classList.remove('hidden');return a}birth.onchange=age;
function initials(n){const w=n.trim().split(/\s+/);return((w[0]?.[0]||'P')+(w[1]?.[0]||'')).toUpperCase()}function msg(t){const m=$('formMessage');m.textContent=t;m.className='form-message error';m.scrollIntoView({behavior:'smooth',block:'center'})}
$('newPatientForm').onsubmit=e=>{e.preventDefault();const name=$('patientFullName').value.trim(),ci=$('patientDocument').value.trim(),phone=$('patientPhone').value.trim();if(!name)return msg('Ingresa el nombre completo del paciente.');if(birth.value&&(age()===null))return msg('Revisa la fecha de nacimiento. Debe estar entre 1900 y la fecha actual.');if(ci&&[...cards()].some(c=>c.dataset.ci===ci))return msg('Ya existe un paciente registrado con ese CI / documento.');const a=age(),sex=$('patientSex').value,art=document.createElement('article');art.className='patient-result';Object.assign(art.dataset,{name,ci,phone,history:$('patientHistory').value.trim(),allergies:$('patientAllergies').value.trim(),medication:$('patientMedication').value.trim()});const details=[a!==null?a+(a===1?' año':' años'):'',sex].filter(Boolean).join(' · ')||'Datos básicos registrados';art.innerHTML=`<div class="patient-avatar">${initials(name)}</div><div class="patient-info"><strong></strong><span></span><small></small></div><span class="result-arrow">›</span>`;art.querySelector('strong').textContent=name;art.querySelector('.patient-info span').textContent=ci?'CI: '+ci:'Sin documento';art.querySelector('small').textContent=details;$('patientResults').prepend(art);bind(art);select(art)};
$('consultationForm').onsubmit=e=>{e.preventDefault();if(!$('consultationReason').value.trim()){$('consultationReason').focus();return}if(!$('diagnosis').value.trim()){$('diagnosis').focus();return}currentConsultation={patient:selectedPatient,date:new Date().toISOString(),reason:$('consultationReason').value.trim(),currentIllness:$('currentIllness').value.trim(),vitals:{bloodPressure:$('bloodPressure').value.trim(),heartRate:$('heartRate').value,spo2:$('oxygenSaturation').value,temperature:$('temperature').value,respiratoryRate:$('respiratoryRate').value,weight:$('weight').value,height:$('height').value},physicalExam:$('physicalExam').value.trim(),complementaryStudies:$('complementaryStudies').value.trim(),diagnosis:$('diagnosis').value.trim(),indications:$('consultationIndications').value.trim(),notes:$('consultationNotes').value.trim(),followUp:$('followUp').value.trim()};openPrescription()};
function prescriptionId(){const d=new Date(),pad=n=>String(n).padStart(2,'0');return 'RX-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+String(Date.now()).slice(-5)}
window.medicoAmigoOpenPrescription=(p,c)=>{selectedPatient=p;currentConsultation=c;openPrescription()};
window.medicoAmigoOpenPayment=()=>openPayment();
function openPrescription(){if(!selectedPatient||!currentConsultation)return;$('prescriptionPatientName').textContent=selectedPatient.name;$('prescriptionSelectedName').textContent=selectedPatient.name;$('prescriptionSelectedMeta').textContent=[selectedPatient.ci?'CI: '+selectedPatient.ci:'Sin documento',selectedPatient.meta].filter(Boolean).join(' · ');$('prescriptionAvatar').textContent=initials(selectedPatient.name);$('prescriptionDiagnosis').textContent=currentConsultation.diagnosis;$('prescriptionCode').textContent=prescriptionId();$('prescriptionGeneralInstructions').value=currentConsultation.indications||'';$('medicationsList').innerHTML='';addMedication();show($('prescriptionScreen'))}
function addMedication(data={}){const n=$('medicationsList').children.length+1,c=document.createElement('div');c.className='medication-card';c.innerHTML=`<div class="medication-card-header"><strong>Medicamento ${n}</strong><button class="remove-medication" type="button" title="Eliminar">×</button></div><div class="form-group"><label>Medicamento</label><input class="med-name" placeholder="Ej. Paracetamol" value=""></div><div class="medication-grid"><div class="form-group"><label>Presentación / concentración</label><input class="med-presentation" placeholder="Ej. 500 mg"></div><div class="form-group"><label>Dosis</label><input class="med-dose" placeholder="Ej. 1 tableta"></div><div class="form-group"><label>Vía</label><select class="med-route"><option value="">Seleccionar</option><option>Oral</option><option>Sublingual</option><option>Tópica</option><option>Inhalatoria</option><option>Intramuscular</option><option>Intravenosa</option><option>Subcutánea</option><option>Rectal</option><option>Oftálmica</option><option>Ótica</option><option>Otra</option></select></div><div class="form-group"><label>Frecuencia</label><input class="med-frequency" placeholder="Ej. cada 8 horas"></div><div class="form-group"><label>Duración</label><input class="med-duration" placeholder="Ej. 5 días"></div></div><div class="form-group"><label>Instrucciones adicionales</label><textarea class="med-instructions" rows="2" placeholder="Ej. tomar después de las comidas"></textarea></div>`;c.querySelector('.med-name').value=data.name||'';c.querySelector('.med-presentation').value=data.presentation||'';c.querySelector('.med-dose').value=data.dose||'';c.querySelector('.med-frequency').value=data.frequency||'';c.querySelector('.med-duration').value=data.duration||'';c.querySelector('.med-instructions').value=data.instructions||'';c.querySelector('.med-route').value=data.route||'';c.querySelector('.remove-medication').onclick=()=>{c.remove();renumberMeds()};$('medicationsList').appendChild(c)}
function renumberMeds(){[...document.querySelectorAll('.medication-card')].forEach((c,i)=>c.querySelector('.medication-card-header strong').textContent='Medicamento '+(i+1))}
function meds(){return[...document.querySelectorAll('.medication-card')].map(c=>({name:c.querySelector('.med-name').value.trim(),presentation:c.querySelector('.med-presentation').value.trim(),dose:c.querySelector('.med-dose').value.trim(),route:c.querySelector('.med-route').value,frequency:c.querySelector('.med-frequency').value.trim(),duration:c.querySelector('.med-duration').value.trim(),instructions:c.querySelector('.med-instructions').value.trim()})).filter(m=>Object.values(m).some(Boolean))}
$('addMedicationBtn').onclick=()=>addMedication();$('backToConsultationBtn').onclick=$('prescriptionBackBtn').onclick=()=>show($('consultationScreen'));
function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function prescriptionPrint(targetWindow=null){
 // v1.0.11: una receta independiente vive en window.selectedPatient/window.currentConsultation.
 // El flujo clínico normal usa las variables internas selectedPatient/currentConsultation.
 // Usar ambos contextos evita que el generador PDF reciba null.
 const list=meds(),
       p=selectedPatient||window.selectedPatient,
       c=currentConsultation||window.currentConsultation,
       code=$('prescriptionCode').textContent;
 if(!p){throw new Error('No se encontró el paciente para generar la receta.');}
 if(!c){throw new Error('No se encontró el contexto de la receta.');}
 const cfg=getDoctorConfig();
 const signatureHtml=cfg.signature
   ? `<div class="signature-placeholder"><img src="${cfg.signature}" alt="Firma del médico" style="max-width:260px;max-height:105px;object-fit:contain"></div>`
   : '<div class="signature-placeholder">Firma del médico</div>';
 const when=new Intl.DateTimeFormat('es-BO',{dateStyle:'long'}).format(new Date());
 const age=(p.meta||'').split(' · ')[0]||'';
 const medsHtml=list.length?list.map((m,i)=>{
   const pauta=[m.dose,m.route,m.frequency,m.duration?(/día|dias|días|semana|mes/i.test(m.duration)?m.duration:m.duration+' días'):''].filter(Boolean).map(escapeHtml).join(' · ');
   return `<div class="rx"><div class="rx-title"><span>${i+1}.</span><b>${escapeHtml(m.name||'Medicamento')}</b>${m.presentation?'<em>'+escapeHtml(m.presentation)+'</em>':''}</div>${pauta?'<div class="rx-dose">'+pauta+'</div>':''}${m.instructions?'<div class="rx-note">'+escapeHtml(m.instructions)+'</div>':''}</div>`
 }).join(''):'<div class="empty-rx">Sin medicamentos prescritos.</div>';
 const w=targetWindow||window.open('','_blank');
 if(!w){alert('El navegador bloqueó la vista previa. La receta quedó guardada; pulsa “VISTA PREVIA / PDF” para abrirla.');return}
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Receta ${escapeHtml(code)}</title><style>
 *{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;background:#edf3f7;color:#17324d;padding:28px 16px}.toolbar{max-width:210mm;margin:0 auto 14px;display:flex;justify-content:flex-end}.print-btn{border:0;border-radius:10px;background:#073b66;color:#fff;padding:11px 18px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(5,44,77,.18)}.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:17mm 18mm 15mm;box-shadow:0 12px 35px rgba(5,44,77,.13);position:relative}.head{border-bottom:3px solid #08a6bd;padding-bottom:12px;display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.brand{font-size:25px;font-weight:800;letter-spacing:.2px;color:#073b66}.brand span{color:#08a6bd}.tag{font-size:9px;font-weight:700;letter-spacing:1px;color:#4f7188;margin-top:3px}.doctor{text-align:right;font-size:10.5px;line-height:1.45;min-width:180px}.doctor b{font-size:13px;color:#073b66}.patient-box{margin:16px 0 13px;padding:12px 14px;border:1px solid #dbe5ed;border-radius:10px;background:#fbfdfe;display:grid;grid-template-columns:1fr auto;gap:20px;font-size:10.5px;line-height:1.55}.patient-box .right{text-align:right}.diagnosis{margin:13px 0 18px;font-size:11.5px;line-height:1.5}.section-title{font-size:17px;color:#073b66;margin:0 0 6px}.rx{padding:11px 0;border-bottom:1px solid #e6edf2}.rx-title{display:flex;align-items:baseline;gap:6px}.rx-title span{font-size:12px;font-weight:700}.rx-title b{font-size:14px;color:#052c4d}.rx-title em{font-size:10.5px;color:#61788a;font-style:normal}.rx-dose{font-size:11.5px;margin:5px 0 0 18px;line-height:1.5}.rx-note{font-size:10.5px;color:#5f7282;margin:4px 0 0 18px;line-height:1.45}.empty-rx{font-size:11px;color:#6f8294;padding:12px 0}.instructions-block{margin-top:20px}.instructions{white-space:pre-wrap;font-size:11.5px;line-height:1.6;padding-top:3px}.signature-area{margin-top:42px;display:flex;justify-content:flex-end}.signature-box{width:230px;text-align:center}.signature-placeholder{height:48px;display:flex;align-items:flex-end;justify-content:center;color:#8da0ae;font-size:9px}.signature-line{border-top:1px solid #60788a;padding-top:6px;font-size:10px;line-height:1.4}.signature-line b{font-size:11.5px;color:#073b66}.footer{position:absolute;left:18mm;right:18mm;bottom:12mm;border-top:1px solid #dbe5ed;padding-top:7px;font-size:8px;color:#8193a1;display:flex;justify-content:space-between}.legal-note{font-size:8px;color:#94a4af;text-align:center;margin-top:7px}@page{size:A4;margin:0}@media(max-width:850px){body{padding:12px 0}.toolbar{padding:0 12px}.page{width:100%;min-height:0;padding:22px 18px;box-shadow:none}.footer{position:static;margin-top:35px}.patient-box{grid-template-columns:1fr}.patient-box .right{text-align:left}}@media print{body{background:#fff;padding:0}.toolbar{display:none}.page{width:210mm;min-height:297mm;margin:0;padding:17mm 18mm 15mm;box-shadow:none}.footer{position:absolute;left:18mm;right:18mm;bottom:12mm}.patient-box{grid-template-columns:1fr auto}.patient-box .right{text-align:right}}
 </style></head><body><div class="toolbar"><button class="print-btn" onclick="window.print()">Descargar / imprimir PDF</button></div><main class="page"><header class="head"><div><div class="brand">MÉDICO <span>AMIGO</span></div><div class="tag">ATENCIÓN MÉDICA INTEGRAL</div></div><div class="doctor"><b>${escapeHtml(cfg.name)}</b><br>${escapeHtml(cfg.specialty)}<br>Registro profesional: ${escapeHtml(cfg.registration)}${cfg.phone?'<br>Tel. '+escapeHtml(cfg.phone):''}</div></header><section class="patient-box"><div><b>Paciente:</b> ${escapeHtml(p.name)}<br><b>CI:</b> ${escapeHtml(p.ci||'No registrado')}${age?'<br><b>Edad:</b> '+escapeHtml(age):''}</div><div class="right"><b>Fecha:</b> ${escapeHtml(when)}<br><b>Receta:</b> ${escapeHtml(code)}</div></section><div class="diagnosis"><b>Diagnóstico / impresión clínica:</b> ${escapeHtml(c.diagnosis)}</div><h2 class="section-title">Rp/</h2>${medsHtml}<section class="instructions-block"><h2 class="section-title">Indicaciones generales</h2><div class="instructions">${escapeHtml($('prescriptionGeneralInstructions').value||'Sin indicaciones adicionales.')}</div></section><div class="signature-area"><div class="signature-box">${signatureHtml}<div class="signature-line"><b>${escapeHtml(cfg.name)}</b><br>${escapeHtml(cfg.specialty)}<br>Registro profesional: ${escapeHtml(cfg.registration)}</div><div class="legal-note">${cfg.signature?'Firma cargada en la configuración del médico.':'Sin imagen de firma cargada.'}</div></div></div><footer class="footer"><span>${escapeHtml(code)}</span><span>Generado por Médico Amigo</span></footer></main></body></html>`);
 w.document.close();
} 
window.medicoAmigoPrintPrescription=prescriptionPrint;
$('previewPrescriptionBtn').type='button';
$('previewPrescriptionBtn').onclick=()=>prescriptionPrint();
$('prescriptionForm').onsubmit=e=>{
 e.preventDefault();
 currentPrescription={code:$('prescriptionCode').textContent,patient:selectedPatient,diagnosis:currentConsultation.diagnosis,medications:meds(),instructions:$('prescriptionGeneralInstructions').value.trim(),date:new Date().toISOString()};
 sessionStorage.setItem('medicoAmigoLastPrescription',JSON.stringify(currentPrescription));
 openPayment();
};

function money(v){const n=Number(v||0);return Number.isFinite(n)?n:0}
function openPayment(){
 if(!selectedPatient||!currentConsultation)return;
 $('paymentPatientName').textContent=selectedPatient.name;
 $('paymentSelectedName').textContent=selectedPatient.name;
 $('paymentSelectedMeta').textContent=[selectedPatient.ci?'CI: '+selectedPatient.ci:'Sin documento',selectedPatient.meta].filter(Boolean).join(' · ');
 $('paymentAvatar').textContent=initials(selectedPatient.name);
 $('paymentDiagnosis').textContent=currentConsultation.diagnosis||'Consulta médica';
 $('paymentDate').textContent=new Intl.DateTimeFormat('es-BO',{dateStyle:'medium'}).format(new Date());
 const cfg=getDoctorConfig();$('consultationPrice').value=cfg.fee||'';
 $('amountPaid').value='';
 $('paymentMethod').value='';
 $('paymentNotes').value='';
 updatePaymentStatus();
 show($('paymentScreen'));
 setTimeout(()=>$('consultationPrice').focus(),100);
}
function updatePaymentStatus(){
 const price=money($('consultationPrice').value),paid=money($('amountPaid').value),balance=Math.max(price-paid,0);
 const box=document.querySelector('.payment-status-box');
 box.classList.remove('paid','partial');
 let status='Pendiente';
 if(price>0&&paid>=price){status='Pagado';box.classList.add('paid')}
 else if(paid>0){status='Pago parcial';box.classList.add('partial')}
 $('paymentStatusText').textContent=status;
 $('paymentBalanceText').textContent='Saldo: Bs '+balance.toFixed(2).replace('.00','');
}
$('consultationPrice').oninput=updatePaymentStatus;
$('amountPaid').oninput=updatePaymentStatus;
$('backToPrescriptionBtn').onclick=$('paymentBackBtn').onclick=()=>show($('prescriptionScreen'));

function loadSessionRecords(){
 try{return JSON.parse(sessionStorage.getItem('medicoAmigoConsultations')||'[]')}catch{return[]}
}
function saveSessionRecords(records){sessionStorage.setItem('medicoAmigoConsultations',JSON.stringify(records))}
function sameLocalDay(iso){
 const d=new Date(iso),t=new Date();
 return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate()
}
function updateDashboard(){
 // v1.5.3: dashboard local legado deshabilitado. Supabase es la única fuente de verdad.
 return;
 const records=loadSessionRecords(),today=records.filter(r=>sameLocalDay(r.finishedAt));
 const income=today.reduce((sum,r)=>sum+money(r.payment.amountPaid),0);
 const pending=today.filter(r=>r.payment.status!=='Pagado').length;
 $('todayConsultations').textContent=today.length;
 $('todayIncome').textContent='Bs '+income.toFixed(2).replace('.00','');
 $('todayPending').textContent=pending;
 const recent=document.querySelector('.recent-section');
 const oldEmpty=recent.querySelector('.empty-state');
 recent.querySelectorAll('.recent-consultation').forEach(x=>x.remove());
 if(today.length===0){if(oldEmpty)oldEmpty.classList.remove('hidden');return}
 if(oldEmpty)oldEmpty.classList.add('hidden');
 today.slice().reverse().slice(0,5).forEach(r=>{
   const item=document.createElement('div');item.className='recent-consultation';
   const info=document.createElement('div');
   const name=document.createElement('strong');name.textContent=r.patient.name;
   const meta=document.createElement('small');
   meta.textContent=r.consultation.diagnosis+' · '+new Intl.DateTimeFormat('es-BO',{hour:'2-digit',minute:'2-digit'}).format(new Date(r.finishedAt));
   info.append(name,meta);
   const pay=document.createElement('span');pay.className='recent-payment'+(r.payment.status==='Pagado'?'':' pending');
   pay.textContent=r.payment.status==='Pagado'?'Bs '+money(r.payment.amountPaid).toFixed(2).replace('.00',''):r.payment.status;
   item.append(info,pay);recent.appendChild(item);
 });
}
$('paymentForm').onsubmit=e=>{
 e.preventDefault();
 const price=money($('consultationPrice').value),paid=money($('amountPaid').value);
 const status=price>0&&paid>=price?'Pagado':paid>0?'Pago parcial':'Pendiente';
 const payment={price,amountPaid:paid,method:$('paymentMethod').value,status,balance:Math.max(price-paid,0),notes:$('paymentNotes').value.trim(),date:new Date().toISOString()};
 currentConsultation.reason=currentConsultation.reason||currentConsultation.motive||currentConsultation.motivo||'';
 currentConsultation.illness=currentConsultation.illness||currentConsultation.currentIllness||currentConsultation.enfermedad||'';
 currentConsultation.exam=currentConsultation.exam||currentConsultation.physicalExam||'';
 currentConsultation.instructions=currentConsultation.instructions||currentConsultation.indications||'';
 const record={id:'CONS-'+Date.now(),patient:selectedPatient,consultation:currentConsultation,prescription:currentPrescription,payment,finishedAt:new Date().toISOString()};
 const records=loadSessionRecords();records.push(record);saveSessionRecords(records);upsertDirectoryPatient(selectedPatient);
 updateDashboard();
 $('consultationForm').reset();
 selectedPatient=null;currentConsultation=null;currentPrescription=null;
 show($('homeScreen'));
};

/* =========================================
   v0.8 - DIRECTORIO DE PACIENTES E HISTORIAL
========================================= */
let detailPatient=null;

function basePatients(){ return []; }
function storedPatients(){
 try{
  const saved=JSON.parse(sessionStorage.getItem('medicoAmigoPatients')||'null');
  if(Array.isArray(saved))return saved;
 }catch{}
 const initial=basePatients();
 sessionStorage.setItem('medicoAmigoPatients',JSON.stringify(initial));
 return initial;
}
function savePatientsDirectory(list){sessionStorage.setItem('medicoAmigoPatients',JSON.stringify(list))}
function upsertDirectoryPatient(p){
 const list=storedPatients();
 const key=(p.ci||'').trim();
 let i=key?list.findIndex(x=>(x.ci||'').trim()===key):-1;
 if(i<0)i=list.findIndex(x=>normalize(x.name)===normalize(p.name)&&(!key||!(x.ci||'')));
 const normalized={
  name:p.name||'Paciente',ci:p.ci||'',phone:p.phone||'',age:p.age??null,sex:p.sex||'',
  meta:p.meta||[p.age!=null?p.age+' años':'',p.sex||''].filter(Boolean).join(' · '),
  address:p.address||'',emergency:p.emergency||'',history:p.history||'',allergies:p.allergies||'',
  medication:p.medication||'',observations:p.observations||''
 };
 if(i>=0)list[i]={...list[i],...normalized};else list.push(normalized);
 savePatientsDirectory(list);
 return normalized;
}
function patientRecords(p){
 return loadSessionRecords().filter(r=>{
  if(p.ci&&r.patient.ci)return String(r.patient.ci)===String(p.ci);
  return normalize(r.patient.name)===normalize(p.name);
 });
}
function renderPatientsDirectory(){
 const q=normalize($('patientsDirectorySearch').value.trim());
 const list=storedPatients().filter(p=>[p.name,p.ci,p.phone].some(v=>normalize(v).includes(q)));
 const box=$('patientsDirectoryList');box.innerHTML='';
 $('patientsDirectoryCount').textContent=storedPatients().length+' paciente'+(storedPatients().length===1?'':'s');
 $('patientsDirectoryEmpty').classList.toggle('hidden',list.length>0);
 list.forEach(p=>{
  const card=document.createElement('article');card.className='directory-patient-card';
  const avatar=document.createElement('div');avatar.className='patient-avatar';avatar.textContent=initials(p.name);
  const info=document.createElement('div');info.className='directory-patient-info';
  const n=document.createElement('strong');n.textContent=p.name;
  const meta=document.createElement('span');meta.textContent=[p.ci?'CI: '+p.ci:'Sin documento',p.phone||'Sin teléfono'].join(' · ');
  const sub=document.createElement('small');sub.textContent=p.meta||'Datos básicos registrados';
  info.append(n,meta,sub);
  const count=document.createElement('span');count.className='directory-history-count';const c=patientRecords(p).length;count.textContent=c+' consulta'+(c===1?'':'s');
  const arrow=document.createElement('span');arrow.className='result-arrow';arrow.textContent='›';
  card.append(avatar,info,count,arrow);card.onclick=()=>openPatientDetail(p);box.appendChild(card);
 });
}
function openPatientsDirectory(){
 renderPatientsDirectory();show($('patientsScreen'));setTimeout(()=>$('patientsDirectorySearch').focus(),100);
}
function textOr(v,fallback='—'){return String(v||'').trim()||fallback}
function openPatientDetail(p){
 detailPatient=p;
 if(p?.id){
   sessionStorage.setItem('medicoAmigoCurrentPatientId',p.id);
   if(window.state)window.state.currentPatientId=p.id;
 }
 $('detailHeaderName').textContent=p.name;$('detailName').textContent=p.name;$('detailAvatar').textContent=initials(p.name);
 $('detailMeta').textContent=[p.ci?'CI: '+p.ci:'Sin documento',p.meta].filter(Boolean).join(' · ');
 $('detailPhone').textContent=p.phone||'Sin teléfono registrado';$('detailCi').textContent=textOr(p.ci);
 $('detailAge').textContent=p.age!=null?p.age+' años':'—';$('detailSex').textContent=textOr(p.sex);
 $('detailPhoneGrid').textContent=textOr(p.phone);$('detailAddress').textContent=textOr(p.address);
 $('detailEmergency').textContent=textOr(p.emergency);
 $('detailPathologicalHistory').textContent=textOr(p.pathologicalHistory||p.history,'Sin información registrada');
 $('detailNonPathologicalHistory').textContent=textOr(p.nonPathologicalHistory,'Sin información registrada');
 $('detailFamilyHistory').textContent=textOr(p.familyHistory,'Sin información registrada');
 const gyneBlock=$('detailGyneHistoryBlock'),gyneText=$('detailGyneHistory');
 if(gyneBlock&&gyneText){
   const female=/femen/i.test(p.sex||'');
   gyneBlock.classList.toggle('hidden',!female);
   if(female){
     const g=p.gyneHistory||{};
     gyneText.textContent=[
       g.menarche?'Menarca: '+g.menarche:null,g.lmp?'FUM: '+g.lmp:null,
       g.menstrual_cycle?'Ritmo menstrual: '+g.menstrual_cycle:null,
       g.pregnancies!==null&&g.pregnancies!==undefined&&g.pregnancies!==''?'Gestas: '+g.pregnancies:null,
       g.births!==null&&g.births!==undefined&&g.births!==''?'Partos: '+g.births:null,
       g.cesareans!==null&&g.cesareans!==undefined&&g.cesareans!==''?'Cesáreas: '+g.cesareans:null,
       g.abortions!==null&&g.abortions!==undefined&&g.abortions!==''?'Abortos: '+g.abortions:null,
       g.contraception?'Método anticonceptivo: '+g.contraception:null,g.other?'Otros: '+g.other:null
     ].filter(Boolean).join(' · ')||'Sin información registrada';
   }
 }
 $('detailAllergies').textContent=textOr(p.allergies,'Sin información registrada');
 $('detailMedication').textContent=textOr(p.medication,'Sin información registrada');
 $('detailObservations').textContent=textOr(p.observations,'Sin información registrada');
 renderPatientHistory(p);show($('patientDetailScreen'));
}
function renderPatientHistory(p){
 const records=patientRecords(p).slice().reverse(),box=$('patientHistoryList');box.innerHTML='';
 $('detailHistoryCount').textContent=records.length;$('patientHistoryEmpty').classList.toggle('hidden',records.length>0);
 records.forEach(r=>{
  const card=document.createElement('article');card.className='history-card';
  const main=document.createElement('div');main.className='history-card-main';
  const title=document.createElement('strong');title.textContent=r.consultation.diagnosis||'Consulta médica';
  const date=document.createElement('span');date.textContent=new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(r.finishedAt));
  const reason=document.createElement('small');reason.textContent=r.consultation.reason||'Sin motivo registrado';main.append(title,date,reason);
  const pay=document.createElement('span');pay.className='history-card-payment'+(r.payment.status==='Pagado'?'':' pending');pay.textContent=r.payment.status;
  card.append(main,pay);card.onclick=()=>openHistoryModal(r);box.appendChild(card);
 });
}
function safe(v){return textOr(v,'No registrado')}
function openHistoryModal(r){
 $('historyModalTitle').textContent=r.consultation.diagnosis||'Consulta médica';
 const c=r.consultation,p=r.payment,rx=r.prescription;
 const meds=rx&&Array.isArray(rx.medications)&&rx.medications.length
   ?rx.medications.map((m,i)=>`${i+1}. ${m.name||'Medicamento'}${m.presentation?' · '+m.presentation:''}${m.dose?' · '+m.dose:''}${m.route?' · '+m.route:''}${m.frequency?' · '+m.frequency:''}${m.duration?' · '+m.duration:''}`).join('\n')
   :'Sin receta registrada';
 $('historyModalContent').innerHTML=`
  <div class="history-detail-block"><h3>Motivo de consulta</h3><p>${escapeHtml(safe(c.reason))}</p></div>
  <div class="history-detail-block"><h3>Enfermedad actual</h3><p>${escapeHtml(safe(c.illness))}</p></div>
  <div class="history-detail-block"><h3>Signos vitales</h3><div class="history-vitals">
   <div><small>Presión arterial</small><strong>${escapeHtml(safe(c.bp))}</strong></div>
   <div><small>Frecuencia cardíaca</small><strong>${escapeHtml(safe(c.hr))}</strong></div>
   <div><small>SpO₂</small><strong>${escapeHtml(safe(c.spo2))}</strong></div>
   <div><small>Temperatura</small><strong>${escapeHtml(safe(c.temp))}</strong></div>
   <div><small>Frecuencia respiratoria</small><strong>${escapeHtml(safe(c.rr))}</strong></div>
   <div><small>Peso</small><strong>${escapeHtml(safe(c.weight))}</strong></div>
  </div></div>
  <div class="history-detail-block"><h3>Examen físico</h3><p>${escapeHtml(safe(c.exam))}</p></div>
  <div class="history-detail-block"><h3>Estudios complementarios revisados</h3><p>${escapeHtml(safe(c.complementaryStudies))}</p></div><div class="history-detail-block"><h3>Diagnóstico / impresión clínica</h3><p>${escapeHtml(safe(c.diagnosis))}</p></div>
  <div class="history-detail-block"><h3>Plan e indicaciones</h3><p>${escapeHtml(safe(c.instructions))}</p></div>
  <div class="history-detail-block"><h3>Receta</h3><p>${escapeHtml(meds)}</p></div>
  <div class="history-detail-block"><h3>Pago</h3><p>${escapeHtml(p.status)} · Bs ${money(p.amountPaid).toFixed(2).replace('.00','')} · ${escapeHtml(p.method||'Sin método')}</p></div>`;
 $('consultationHistoryModal').classList.remove('hidden');
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
$('patientsNavBtn').onclick=openPatientsDirectory;
$('patientsBackHomeBtn').onclick=()=>show($('homeScreen'));
$('patientsDirectorySearch').oninput=renderPatientsDirectory;
$('patientsAddBtn').onclick=()=>{$('newPatientForm').reset();show($('newPatientScreen'));setTimeout(()=>$('patientFullName').focus(),100)};
$('patientDetailBackBtn').onclick=openPatientsDirectory;
$('startConsultationFromDetailBtn').onclick=()=>{
 if(!detailPatient)return;
 selectedPatient=detailPatient;
 sessionStorage.setItem('medicoAmigoCurrentPatientId',detailPatient.id||'');
 $('consultationForm').reset();
 openConsultation();
};
$('closeHistoryModalBtn').onclick=()=>$('consultationHistoryModal').classList.add('hidden');
$('consultationHistoryModal').onclick=e=>{if(e.target===$('consultationHistoryModal'))$('consultationHistoryModal').classList.add('hidden')};


/* =========================================
   v0.9 - CONFIGURACIÓN DEL MÉDICO
========================================= */
const defaultDoctorConfig={
 name:'Dr. Omar Ponce',
 specialty:'Médico',
 registration:'P-6720806',
 phone:'67003714',
 fee:'',
 signature:''
};

function getDoctorConfig(){
 try{
  return {...defaultDoctorConfig,...JSON.parse(sessionStorage.getItem('medicoAmigoDoctorConfig')||'{}')};
 }catch{
  return {...defaultDoctorConfig};
 }
}
function saveDoctorConfig(cfg){
 sessionStorage.setItem('medicoAmigoDoctorConfig',JSON.stringify(cfg));
}
function updateDoctorUI(){
 const cfg=getDoctorConfig();
 const welcome=document.querySelector('.doctor-welcome h1');
 const role=document.querySelector('.doctor-welcome span');
 if(welcome)welcome.textContent=cfg.name;
 if(role)role.textContent=cfg.specialty;
}
function renderSignaturePreview(){
 const cfg=getDoctorConfig(),box=$('signaturePreview');
 box.innerHTML='';
 if(cfg.signature){
  const img=document.createElement('img');img.src=cfg.signature;img.alt='Firma del médico';box.appendChild(img);
  $('removeSignatureBtn').classList.remove('hidden');
 }else{
  const span=document.createElement('span');span.textContent='Sin firma cargada';box.appendChild(span);
  $('removeSignatureBtn').classList.add('hidden');
 }
}
function openSettings(){
 const cfg=getDoctorConfig();
 $('doctorName').value=cfg.name;
 $('doctorSpecialty').value=cfg.specialty;
 $('doctorRegistration').value=cfg.registration;
 $('doctorPhone').value=cfg.phone;
 $('doctorFee').value=cfg.fee;
 $('settingsMessage').classList.add('hidden');
 renderSignaturePreview();
 show($('settingsScreen'));
}
$('settingsBtn').onclick=openSettings;
$('settingsBackBtn').onclick=$('settingsCancelBtn').onclick=()=>show($('homeScreen'));

$('doctorSignature').onchange=e=>{
 const file=e.target.files&&e.target.files[0];
 if(!file)return;
 if(file.size>1200000){
  alert('La imagen es demasiado grande. Usa una firma de hasta 1,2 MB.');
  e.target.value='';
  return;
 }
 const reader=new FileReader();
 reader.onload=()=>{
  const cfg=getDoctorConfig();cfg.signature=reader.result;saveDoctorConfig(cfg);renderSignaturePreview();
 };
 reader.readAsDataURL(file);
};
$('removeSignatureBtn').onclick=()=>{
 const cfg=getDoctorConfig();cfg.signature='';saveDoctorConfig(cfg);$('doctorSignature').value='';renderSignaturePreview();
};
$('doctorSettingsForm').onsubmit=e=>{
 e.preventDefault();
 const existing=getDoctorConfig();
 const cfg={
  name:$('doctorName').value.trim()||defaultDoctorConfig.name,
  specialty:$('doctorSpecialty').value.trim()||'Médico',
  registration:$('doctorRegistration').value.trim()||defaultDoctorConfig.registration,
  phone:$('doctorPhone').value.trim(),
  fee:$('doctorFee').value,
  signature:existing.signature||''
 };
 saveDoctorConfig(cfg);
 updateDoctorUI();
 $('settingsMessage').textContent='Configuración guardada correctamente en este navegador.';
 $('settingsMessage').classList.remove('hidden');
 window.scrollTo({top:0,behavior:'smooth'});
};
updateDoctorUI();

updateDashboard();

});



/* ============================================================
   v1.0.4 AUTH - FIX DEFINITIVO DE INTEGRACIÓN
   Usa la misma API directa validada por auth-test-v2.
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const URL='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const SESSION='medico_amigo_supabase_session';
 const login=document.getElementById('loginScreen');
 const home=document.getElementById('homeScreen');
 const form=document.getElementById('loginForm');
 const email=document.getElementById('email');
 const password=document.getElementById('password');
 const message=document.getElementById('authMessage');
 const logout=document.getElementById('logoutBtn');

 function screen(el){
   document.querySelectorAll('main.app > section').forEach(x=>x.classList.add('hidden'));
   if(el)el.classList.remove('hidden');
   window.scrollTo(0,0);
 }
 function msg(t,ok=false){
   if(!message)return;
   message.textContent=t; message.classList.remove('hidden','success');
   if(ok)message.classList.add('success');
 }
 function clearMsg(){if(message){message.textContent='';message.classList.add('hidden');message.classList.remove('success')}}
 function saveProfile(p){
   let cfg={};
   try{cfg=JSON.parse(sessionStorage.getItem('medicoAmigoDoctorConfig')||'{}')}catch{}
   cfg.name=p.full_name||'Médico';
   cfg.specialty=p.specialty||'Médico';
   cfg.registration=p.professional_registration||'';
   cfg.phone=p.phone||'';
   cfg.fee=(p.usual_fee==null)?'':String(p.usual_fee);
   sessionStorage.setItem('medicoAmigoDoctorConfig',JSON.stringify(cfg));
   const n=document.querySelector('.doctor-welcome h1');
   const r=document.querySelector('.doctor-welcome span');
   if(n)n.textContent=cfg.name;if(r)r.textContent=cfg.specialty;
 }
 async function profile(session){
   const r=await fetch(URL+'/rest/v1/doctor_profiles?id=eq.'+encodeURIComponent(session.user.id)+'&select=*',{
     headers:{apikey:KEY,Authorization:'Bearer '+session.access_token}
   });
   const raw=await r.text();let d;try{d=JSON.parse(raw)}catch{}
   if(!r.ok)throw new Error(d?.message||raw||'Error al consultar perfil');
   if(!Array.isArray(d)||!d.length)throw new Error('No existe doctor_profiles para este usuario');
   saveProfile(d[0]); return d[0];
 }
 async function enter(session){
   try{
     await profile(session);
     clearMsg();
     // v1.5.2: nunca mostrar cifras/listados de la sesión anterior.
     const tc=document.getElementById('todayConsultations');
     const ti=document.getElementById('todayIncome');
     const tp=document.getElementById('todayPending');
     if(tc)tc.textContent='0';
     if(ti)ti.textContent='Bs 0';
     if(tp)tp.textContent='0';
     const recent=document.querySelector('.recent-section');
     recent?.querySelectorAll('.recent-consultation').forEach(x=>x.remove());
     recent?.querySelector('.empty-state')?.classList.remove('hidden');
     screen(home);
     // La sesión nueva ya está guardada: consultar Supabase otra vez con su JWT.
     if(typeof window.medicoAmigoRefreshDashboard==='function'){
       await window.medicoAmigoRefreshDashboard();
     }
   }catch(e){
     localStorage.removeItem(SESSION);screen(login);
     msg('Login correcto, pero falló el perfil: '+e.message);
   }
 }
 if(form)form.addEventListener('submit',async e=>{
   e.preventDefault();e.stopImmediatePropagation();
   const btn=form.querySelector('button[type="submit"]');
   const old=btn.textContent;btn.disabled=true;btn.textContent='INGRESANDO...';clearMsg();
   try{
     const r=await fetch(URL+'/auth/v1/token?grant_type=password',{
       method:'POST',
       headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+KEY},
       body:JSON.stringify({email:email.value.trim(),password:password.value})
     });
     const raw=await r.text();let d={};try{d=JSON.parse(raw)}catch{}
     if(!r.ok){msg('No se pudo iniciar sesión: '+(d.msg||d.message||raw));return}
     localStorage.setItem(SESSION,JSON.stringify(d));password.value='';
     await enter(d);
   }catch(err){msg('Error de conexión: '+err.message)}
   finally{btn.disabled=false;btn.textContent=old}
 },true);

 if(logout)logout.addEventListener('click',()=>{
   localStorage.removeItem(SESSION);
   const tc=document.getElementById('todayConsultations');
   const ti=document.getElementById('todayIncome');
   const tp=document.getElementById('todayPending');
   if(tc)tc.textContent='0'; if(ti)ti.textContent='Bs 0'; if(tp)tp.textContent='0';
   const recent=document.querySelector('.recent-section');
   recent?.querySelectorAll('.recent-consultation').forEach(x=>x.remove());
   recent?.querySelector('.empty-state')?.classList.remove('hidden');
   screen(login);clearMsg();
 },true);

 let s=null;try{s=JSON.parse(localStorage.getItem(SESSION)||'null')}catch{}
 if(s?.access_token&&s?.user?.id)enter(s);else screen(login);
});


/* ============================================================
   v1.1 — PACIENTES REALES EN SUPABASE
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const URL='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const SESSION='medico_amigo_supabase_session';
 const $v=id=>document.getElementById(id);

 function session(){try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}}
 function headers(representation=false){
   const s=session(); if(!s?.access_token)throw new Error('No hay una sesión autenticada.');
   const h={apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'};
   if(representation)h.Prefer='return=representation';
   return h;
 }
 function calcAge(date){
   if(!date)return null; const b=new Date(date+'T00:00:00'),t=new Date();
   let a=t.getFullYear()-b.getFullYear();
   if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))a--;
   return a;
 }
 function localPatient(p){
   const a=calcAge(p.birth_date);
   return {id:p.id,name:p.full_name||'',ci:p.document_number||'',phone:p.phone||'',age:a,sex:p.sex||'',
     meta:[a!==null?a+' años':'',p.sex||''].filter(Boolean).join(' · '),
     address:p.address||'',emergency:[p.emergency_contact_name,p.emergency_contact_phone].filter(Boolean).join(' · '),
     pathologicalHistory:p.pathological_history||p.medical_history||'',nonPathologicalHistory:p.non_pathological_history||'',familyHistory:p.family_history||'',gyneHistory:p.gynecological_history||null,history:p.pathological_history||p.medical_history||'',allergies:p.allergies||'',medication:p.regular_medications||'',observations:p.observations||''};
 }
 async function request(path,options={}){
   const r=await fetch(URL+'/rest/v1/'+path,{...options,headers:{...headers(options.representation),...(options.headers||{})}});
   const raw=await r.text(); let data=null; try{data=raw?JSON.parse(raw):null}catch{data=raw}
   if(!r.ok)throw new Error(data?.message||raw||('HTTP '+r.status));
   return data;
 }
 async function syncPatients(){
   if(!session()?.access_token)return;
   const rows=await request('patients?select=*&order=full_name.asc');
   sessionStorage.setItem('medicoAmigoPatients',JSON.stringify((rows||[]).map(localPatient)));
   // Update count/list if the Patients screen is currently open.
   if(!$v('patientsScreen').classList.contains('hidden')) $v('patientsNavBtn').click();
 }
 window.syncPatientsFromSupabase=syncPatients;

 // Replace the prototype local-only registration.
 const form=$v('newPatientForm');
 if(form)form.onsubmit=async e=>{
   e.preventDefault(); e.stopImmediatePropagation();
   const name=$v('patientFullName').value.trim();
   if(!name){alert('Ingresa el nombre completo del paciente.');return false}
   const birth=$v('patientBirthDate').value||null;
   if(birth && new Date(birth+'T00:00:00')>new Date()){alert('Revisa la fecha de nacimiento.');return false}
   const emergency=($v('emergencyContact').value||'').trim();
   const payload={
     full_name:name,
     document_number:$v('patientDocument').value.trim()||null,
     birth_date:birth,
     sex:$v('patientSex').value||null,
     phone:$v('patientPhone').value.trim()||null,
     address:$v('patientAddress').value.trim()||null,
     emergency_contact_name:emergency||null,
     emergency_contact_phone:null,
     medical_history:$v('patientPathologicalHistory')?.value.trim()||null,
     pathological_history:$v('patientPathologicalHistory')?.value.trim()||null,
     non_pathological_history:$v('patientNonPathologicalHistory')?.value.trim()||null,
     family_history:$v('patientFamilyHistory')?.value.trim()||null,
     gynecological_history:window.getGyneHistory125?.()||null,
     allergies:$v('patientAllergies').value.trim()||null,
     regular_medications:$v('patientMedication').value.trim()||null,
     observations:$v('patientObservations').value.trim()||null
   };
   const button=form.querySelector('button.save-patient-button');
   const old=button?.textContent||'GUARDAR Y CONTINUAR →';
   if(button){button.disabled=true;button.textContent='GUARDANDO...'}
   try{
     await request('patients',{method:'POST',body:JSON.stringify(payload),representation:true});
     await syncPatients();
     form.reset();
     $v('patientsNavBtn').click();
   }catch(err){
     console.error(err);
     alert('No se pudo registrar el paciente: '+err.message);
   }finally{
     if(button){button.disabled=false;button.textContent=old}
   }
   return false;
 };

 // Sync after authentication has had time to restore its session.
 setTimeout(()=>syncPatients().catch(e=>console.error('Sincronización pacientes:',e)),1000);

 // Refresh from Supabase before opening the directory.
 $v('patientsNavBtn')?.addEventListener('click',()=>{
   setTimeout(()=>syncPatients().catch(e=>console.error(e)),100);
 },{passive:true});
});


/* ============================================================
   v1.1.1 — DASHBOARD LIMPIO
   Consultas/pagos aún no están migrados a Supabase, por lo que
   no se muestran datos clínicos heredados del navegador.
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
  function cleanDashboard(){ return;
    // Remove legacy recent consultation cards.
    const recent = document.querySelector('#recentList, .recent-list, #recentConsultations');
    if(recent) recent.innerHTML = '';

    // Target the visible dashboard cards by their labels.
    document.querySelectorAll('body *').forEach(el=>{
      const t=(el.textContent||'').trim();
      if(t==='Consultas'){
        const card=el.closest('.stat-card,.summary-card,.metric-card,.today-card');
        if(card){
          const nums=card.querySelectorAll('.stat-value,.summary-value,.metric-value,strong,b');
          if(nums.length) nums[0].textContent='0';
        }
      }
      if(t==='Ingresos'){
        const card=el.closest('.stat-card,.summary-card,.metric-card,.today-card');
        if(card){
          const nums=card.querySelectorAll('.stat-value,.summary-value,.metric-value,strong,b');
          if(nums.length) nums[0].textContent='Bs 0';
        }
      }
      if(t==='Pendientes'){
        const card=el.closest('.stat-card,.summary-card,.metric-card,.today-card');
        if(card){
          const nums=card.querySelectorAll('.stat-value,.summary-value,.metric-value,strong,b');
          if(nums.length) nums[0].textContent='0';
        }
      }
    });
  }
  cleanDashboard();
  setTimeout(cleanDashboard,400);
  setTimeout(cleanDashboard,1200);
});


/* old patient resync guard disabled in v1.2.2 */


/* ============================================================
   v1.2 — CONSULTAS EN SUPABASE + HISTORIA CLÍNICA IMPRIMIBLE
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const URL='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const SESSION='medico_amigo_supabase_session';
 const $i=id=>document.getElementById(id);
 const sess=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}};
 const headers=(rep=false)=>{const s=sess();if(!s?.access_token)throw Error('No hay sesión autenticada');const h={apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'};if(rep)h.Prefer='return=representation';return h};
 async function req(path,opt={}){const r=await fetch(URL+'/rest/v1/'+path,{...opt,headers:{...headers(opt.rep),...(opt.headers||{})}});const raw=await r.text();let d=null;try{d=raw?JSON.parse(raw):null}catch{d=raw}if(!r.ok)throw Error(d?.message||raw||('HTTP '+r.status));return d}
 const val=(...ids)=>{for(const id of ids){const e=$i(id);if(e)return e.value||''}return ''};
 const num=(...ids)=>{const v=val(...ids).trim();return v===''?null:Number(v)};
 const currentPatient=()=>{
   const id=(window.state&&state.currentPatientId)||sessionStorage.getItem('medicoAmigoCurrentPatientId');
   let arr=[];try{arr=JSON.parse(sessionStorage.getItem('medicoAmigoPatients')||'[]')}catch{}
   return arr.find(p=>p.id===id)||arr.find(p=>p.name===($i('consultPatientName')?.textContent||'').trim())||null;
 };
 const mapConsult=c=>({
   id:c.id,date:c.consultation_date,reason:c.reason||'',illness:c.current_illness||'',history:c.relevant_history||'',
   bp:c.blood_pressure||'',hr:c.heart_rate,spo2:c.oxygen_saturation,temp:c.temperature,rr:c.respiratory_rate,
   weight:c.weight,height:c.height,exam:c.physical_exam||'',studies:c.complementary_studies||'',diagnosis:c.diagnosis||'',
   plan:c.indications||'',notes:c.observations||'',followUp:c.follow_up||''
 });
 async function consultationsFor(patientId){
   return (await req('consultations?patient_id=eq.'+encodeURIComponent(patientId)+'&select=*&order=consultation_date.desc')||[]).map(mapConsult);
 }
 async function hydratePatientHistory(patient){
   if(!patient?.id)return [];
   const cs=await consultationsFor(patient.id); patient.consultations=cs;
   let arr=[];try{arr=JSON.parse(sessionStorage.getItem('medicoAmigoPatients')||'[]')}catch{}
   const x=arr.find(p=>p.id===patient.id);if(x)x.consultations=cs;
   sessionStorage.setItem('medicoAmigoPatients',JSON.stringify(arr));
   return cs;
 }
 window.loadConsultationsFromSupabase=hydratePatientHistory;

 // Capture the existing consultation form and replace local persistence.
 const form=$i('consultationForm');
 if(form) form.onsubmit=async e=>{
   e.preventDefault();e.stopImmediatePropagation();
   const p=currentPatient();
   if(!p?.id){alert('Selecciona un paciente antes de guardar la consulta.');return false}
   const payload={
     patient_id:p.id,
     reason:val('consultationReason').trim()||null,
     current_illness:val('currentIllness').trim()||null,
     relevant_history:val('relevantHistory','consultRelevantHistory').trim()||null,
     blood_pressure:val('bloodPressure','bp').trim()||null,
     heart_rate:num('heartRate','hr'),
     oxygen_saturation:num('oxygenSaturation','spo2'),
     temperature:num('temperature','temp'),
     respiratory_rate:num('respiratoryRate','rr'),
     weight:num('weight'),
     height:num('height'),
     physical_exam:val('physicalExam','exam').trim()||null,
     complementary_studies:val('complementaryStudies','studies').trim()||null,
     diagnosis:val('diagnosis').trim()||null,
     indications:val('consultationIndications').trim()||null,
     observations:val('consultationNotes').trim()||null,
     follow_up:val('followUp').trim()||null
   };
   const b=form.querySelector('button[type="submit"]'),old=b?.textContent||'CONTINUAR';
   if(b){b.disabled=true;b.textContent='GUARDANDO...'}
   try{
     const inserted=await req('consultations',{method:'POST',body:JSON.stringify(payload),rep:true});
     const saved=Array.isArray(inserted)?inserted[0]:inserted;
     if(!saved?.id)throw Error('La consulta se guardó, pero no se recibió su identificador.');
     await hydratePatientHistory(p);
     const flowConsultation={
       id:saved.id,patient:p,date:saved.consultation_date||new Date().toISOString(),
       reason:payload.reason||'',currentIllness:payload.current_illness||'',
       vitals:{bloodPressure:payload.blood_pressure||'',heartRate:payload.heart_rate,spo2:payload.oxygen_saturation,
         temperature:payload.temperature,respiratoryRate:payload.respiratory_rate,weight:payload.weight,height:payload.height},
       physicalExam:payload.physical_exam||'',complementaryStudies:payload.complementary_studies||'',
       diagnosis:payload.diagnosis||'',indications:payload.indications||'',notes:payload.observations||'',followUp:payload.follow_up||''
     };
     sessionStorage.setItem('medicoAmigoFlow',JSON.stringify({patient:p,consultation:flowConsultation}));
     if(typeof window.medicoAmigoOpenPrescription==='function')window.medicoAmigoOpenPrescription(p,flowConsultation);
     else throw Error('No se pudo abrir el módulo de receta.');
   }catch(err){console.error(err);alert('No se pudo guardar la consulta: '+err.message)}
   finally{if(b){b.disabled=false;b.textContent=old}}
   return false;
 };

 // When patient detail is opened, hydrate its history shortly after.
 document.addEventListener('click',e=>{
   const card=e.target.closest?.('.patient-card,.patient-item');
   if(card) setTimeout(async()=>{
      const p=currentPatient(); if(p) try{await hydratePatientHistory(p); if(typeof window.renderPatientDetail==='function')window.renderPatientDetail(p)}catch(err){console.error(err)}
   },250);
 },true);

 function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function fmt(d){if(!d)return '';try{return new Intl.DateTimeFormat('es-BO',{dateStyle:'long',timeStyle:'short'}).format(new Date(d))}catch{return d}}
 async function printHistory(){
   const p=currentPatient(); if(!p?.id){alert('Abre primero la ficha de un paciente.');return}
   let cs;try{cs=await hydratePatientHistory(p)}catch(e){alert('No se pudo cargar la historia clínica: '+e.message);return}
   let cfg={};try{cfg=JSON.parse(sessionStorage.getItem('medicoAmigoDoctorConfig')||'{}')}catch{}
   const blocks=cs.length?cs.map((c,i)=>`<section><h3>Consulta ${cs.length-i} — ${esc(fmt(c.date))}</h3>
   <p><b>Motivo:</b> ${esc(c.reason||'No registrado')}</p><p><b>Enfermedad actual:</b> ${esc(c.illness||'No registrado')}</p>
   <p><b>Antecedentes relevantes:</b> ${esc(c.history||'No registrado')}</p>
   <p><b>Signos vitales:</b> PA ${esc(c.bp||'—')} · FC ${esc(c.hr??'—')} · SpO₂ ${esc(c.spo2??'—')} · T° ${esc(c.temp??'—')} · FR ${esc(c.rr??'—')} · Peso ${esc(c.weight??'—')} · Talla ${esc(c.height??'—')}</p>
   <p><b>Examen físico:</b> ${esc(c.exam||'No registrado')}</p><p><b>Estudios complementarios revisados:</b> ${esc(c.studies||'No registrado')}</p>
   <p><b>Diagnóstico / impresión:</b> ${esc(c.diagnosis||'No registrado')}</p><p><b>Indicaciones:</b> ${esc(c.plan||'No registrado')}</p>
   <p><b>Observaciones:</b> ${esc(c.notes||'No registrado')}</p><p><b>Seguimiento:</b> ${esc(c.followUp||'No registrado')}</p></section>`).join(''):'<p>No existen consultas registradas.</p>';
   const w=window.open('','_blank');
   w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Historia clínica - ${esc(p.name)}</title><style>
   @page{size:A4;margin:16mm}body{font:12px Arial;color:#17344a;max-width:800px;margin:auto}header{text-align:center;border-bottom:2px solid #0b789b;padding-bottom:12px}h1{margin:0;color:#073f68}h2{font-size:17px}h3{font-size:14px;color:#087d9e;border-bottom:1px solid #ccdce4;padding-bottom:6px}section{page-break-inside:avoid;margin:20px 0}p{line-height:1.45}.box{background:#f5f9fb;padding:12px;border-radius:8px}.foot{margin-top:35px;text-align:center}@media print{button{display:none}}</style></head><body>
   <header><h1>MÉDICO AMIGO</h1><div>ATENCIÓN MÉDICA INTEGRAL</div></header>
   <h2>Historia clínica</h2><div class="box"><b>Paciente:</b> ${esc(p.name)}<br><b>CI:</b> ${esc(p.ci||'No registrado')}<br><b>Teléfono:</b> ${esc(p.phone||'No registrado')}<br><b>Sexo:</b> ${esc(p.sex||'No registrado')}<br><b>Antecedentes:</b> ${esc(p.history||'No registrado')}<br><b>Alergias:</b> ${esc(p.allergies||'No registrado')}<br><b>Medicación habitual:</b> ${esc(p.medication||p.meds||'No registrado')}</div>
   ${blocks}<div class="foot"><b>${esc(cfg.name||'Médico')}</b><br>${esc(cfg.specialty||'')}<br>Matrícula profesional: ${esc(cfg.registration||'')}<br><br>_____________________________<br>Firma y sello</div>
   <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);w.document.close();
 }
 window.printClinicalHistory=printHistory;

 // Inject history button into patient detail when that screen becomes visible.
 /* v1.2.1 reemplaza el botón anterior por acciones separadas y fiables. */
});


/* ============================================================
   v1.2.1 — HISTORIA CLÍNICA: DESCARGA + IMPRESIÓN SIN POPUP ASYNC
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const $x=id=>document.getElementById(id);

 function currentPatient(){
   const id=(window.state&&state.currentPatientId)||sessionStorage.getItem('medicoAmigoCurrentPatientId');
   let arr=[];try{arr=JSON.parse(sessionStorage.getItem('medicoAmigoPatients')||'[]')}catch{}
   return arr.find(p=>p.id===id)||arr[0]||null;
 }
 function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function fmt(d){if(!d)return '';try{return new Intl.DateTimeFormat('es-BO',{dateStyle:'long',timeStyle:'short'}).format(new Date(d))}catch{return d}}
 async function data(){
   const p=currentPatient(); if(!p?.id)throw Error('No se pudo identificar al paciente.');
   let cs=[];
   if(typeof window.loadConsultationsFromSupabase==='function')cs=await window.loadConsultationsFromSupabase(p);
   let cfg={};try{cfg=JSON.parse(sessionStorage.getItem('medicoAmigoDoctorConfig')||'{}')}catch{}
   const s=(()=>{try{return JSON.parse(localStorage.getItem('medico_amigo_supabase_session')||'null')}catch{return null}})();
   const h=s?.access_token?{apikey:'sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp',Authorization:'Bearer '+s.access_token}:{};
   for(const c of (cs||[])){
     c.rx=null;
     if(!c.id||!s?.access_token)continue;
     try{
       const rr=await fetch('https://kdjvsbiqjpztdugewuve.supabase.co/rest/v1/prescriptions?consultation_id=eq.'+encodeURIComponent(c.id)+'&select=*&order=created_at.desc',{headers:h});
       const rxs=rr.ok?await rr.json():[];
       if(rxs[0]){
         const rx=rxs[0];
         const ir=await fetch('https://kdjvsbiqjpztdugewuve.supabase.co/rest/v1/prescription_items?prescription_id=eq.'+encodeURIComponent(rx.id)+'&select=*&order=item_order.asc',{headers:h});
         rx.items=ir.ok?await ir.json():[];
         c.rx=rx;
       }
     }catch(e){console.warn('Receta en historia:',e)}
   }
   return {p,cs:cs||[],cfg};
 }
 function body({p,cs,cfg}){
   const line=(label,value)=>value&&String(value).trim()?`<div class="hc-row"><b>${label}</b><div>${esc(value)}</div></div>`:'';
   const vitals=c=>[
     c.bp?'PA '+c.bp:null,c.hr!=null&&c.hr!==''?'FC '+c.hr:null,c.spo2!=null&&c.spo2!==''?'SpO₂ '+c.spo2+'%':null,
     c.temp!=null&&c.temp!==''?'T° '+c.temp+' °C':null,c.rr!=null&&c.rr!==''?'FR '+c.rr:null,
     c.weight!=null&&c.weight!==''?'Peso '+c.weight+' kg':null,c.height!=null&&c.height!==''?'Talla '+c.height+' cm':null
   ].filter(Boolean).join(' · ');
   const rxBlock=rx=>{
     if(!rx?.items?.length && !rx?.general_instructions)return '';
     const meds=(rx.items||[]).map((m,i)=>`<div class="med"><div class="med-title">${i+1}. ${esc(m.medication_name||'Medicamento')}${m.presentation?` <span>${esc(m.presentation)}</span>`:''}</div>
       ${[m.dose,m.route,m.frequency,m.duration].filter(Boolean).length?`<div class="med-meta">${[m.dose,m.route,m.frequency,m.duration].filter(Boolean).map(esc).join(' · ')}</div>`:''}
       ${m.instructions?`<div class="med-note">${esc(m.instructions)}</div>`:''}</div>`).join('');
     return `<div class="treatment"><div class="subhead">Tratamiento prescrito</div>${meds}${rx.general_instructions?`<div class="general"><b>Indicaciones generales:</b> ${esc(rx.general_instructions)}</div>`:''}</div>`;
   };
   const blocks=cs.length?cs.map(c=>`<section class="visit">
     <div class="visit-head"><div><b>${esc(fmt(c.date))}</b><span>Consulta médica</span></div>${c.diagnosis?`<div class="diagnosis">${esc(c.diagnosis)}</div>`:''}</div>
     <div class="visit-body">
       ${line('Motivo de consulta',c.reason)}
       ${line('Enfermedad actual',c.illness)}
       ${line('Antecedentes relevantes',c.history)}
       ${vitals(c)?line('Signos vitales',vitals(c)):''}
       ${line('Examen físico',c.exam)}
       ${line('Estudios complementarios revisados',c.studies)}
       ${line('Diagnóstico / impresión clínica',c.diagnosis)}
       ${line('Indicaciones',c.plan)}
       ${line('Observaciones',c.notes)}
       ${line('Seguimiento',c.followUp)}
       ${rxBlock(c.rx)}
     </div></section>`).join(''):`<div class="empty">Sin consultas registradas.</div>`;
   const medical=[
     line('Antecedentes personales patológicos',p.pathologicalHistory||p.history),
     line('Antecedentes personales no patológicos',p.nonPathologicalHistory),
     line('Antecedentes heredofamiliares',p.familyHistory),
     /femen/i.test(p.sex||'')?line('Antecedentes gineco-obstétricos',window.formatGyneHistory125?.(p.gyneHistory)): '',
     line('Alergias',p.allergies),line('Medicación habitual',p.medication||p.meds),line('Observaciones',p.observations||p.obs)
   ].filter(Boolean).join('');
   return `<header><div><h1>MÉDICO <span>AMIGO</span></h1><small>ATENCIÓN MÉDICA INTEGRAL</small></div>
     <div class="doctor"><b>${esc(cfg.name||'')}</b>${cfg.specialty?`<span>${esc(cfg.specialty)}</span>`:''}${cfg.registration?`<span>Mat. ${esc(cfg.registration)}</span>`:''}</div></header>
   <div class="title"><h2>Historia clínica</h2><div>Documento clínico del paciente</div></div>
   <div class="patient-card"><div><small>Paciente</small><b>${esc(p.name)}</b></div><div><small>CI / Documento</small><b>${esc(p.ci||'—')}</b></div><div><small>Edad</small><b>${esc(p.age!=null?p.age+' años':'—')}</b></div><div><small>Sexo</small><b>${esc(p.sex||'—')}</b></div><div><small>Teléfono</small><b>${esc(p.phone||'—')}</b></div><div class="wide"><small>Dirección</small><b>${esc(p.address||'—')}</b></div></div>
   ${medical?`<div class="section-title">Antecedentes e información médica</div><div class="medical-card">${medical}</div>`:''}
   <div class="section-title">Evolución clínica</div>${blocks}
   <div class="foot">${cfg.signature?`<div class="history-signature"><img src="${esc(cfg.signature)}" alt="Firma del médico"></div>`:''}<div class="signature-line"></div><b>${esc(cfg.name||'Médico')}</b>${cfg.specialty?`<span>${esc(cfg.specialty)}</span>`:''}${cfg.registration?`<span>Matrícula profesional: ${esc(cfg.registration)}</span>`:''}</div>`;
 }
 function doc(inner,autoPrint=false){
   return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Historia clínica</title><style>
@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#18364b;max-width:900px;margin:0 auto;padding:18px;background:#fff;font-size:12px}
header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:3px solid #16a4b8;padding:0 0 12px}h1{margin:0;color:#073f68;font-size:24px}h1 span{color:#13a6b8}header small{font-size:9px;letter-spacing:.4px}.doctor{text-align:right;display:grid;gap:3px}.doctor span{font-size:10px}
.title{display:flex;justify-content:space-between;align-items:end;margin:20px 0 10px}.title h2{margin:0;font-size:20px;color:#073f68}.title div{color:#718696;font-size:10px}
.patient-card{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;background:#f3f8fa;border:1px solid #dce9ee;border-radius:10px;padding:14px}.patient-card div{display:grid;gap:3px}.patient-card small{color:#6e8595}.patient-card b{font-size:12px}.patient-card .wide{grid-column:span 2}
.section-title{font-size:14px;font-weight:bold;color:#087d9e;margin:20px 0 8px;border-bottom:1px solid #bcdbe3;padding-bottom:6px}
.medical-card,.visit{border:1px solid #dce8ed;border-radius:10px;overflow:hidden;background:#fff}.medical-card{padding:5px 14px}
.hc-row{display:grid;grid-template-columns:190px 1fr;gap:12px;padding:8px 0;border-bottom:1px solid #edf2f4;line-height:1.45}.hc-row:last-child{border-bottom:0}.hc-row b{color:#294a5e}
.visit{margin:0 0 14px;page-break-inside:avoid}.visit-head{display:flex;justify-content:space-between;gap:15px;align-items:center;background:#f3f8fa;padding:10px 14px;border-bottom:1px solid #dce8ed}.visit-head>div:first-child{display:grid;gap:2px}.visit-head span{font-size:10px;color:#718696}.diagnosis{font-weight:bold;color:#087d9e;text-align:right}.visit-body{padding:5px 14px}
.treatment{margin:10px 0 6px;border-left:4px solid #12a6b8;background:#f4fbfc;padding:10px 12px}.subhead{font-weight:bold;color:#087d9e;margin-bottom:8px}.med{padding:7px 0;border-bottom:1px solid #d9ecef}.med:last-of-type{border-bottom:0}.med-title{font-weight:bold}.med-title span{font-weight:normal;color:#5f7787}.med-meta{margin-top:3px}.med-note{margin-top:3px;color:#5f7787;font-style:italic}.general{margin-top:9px}
.foot{text-align:center;margin:38px auto 5px;display:grid;gap:3px;width:260px}.foot span{font-size:10px}.history-signature{height:72px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:2px}.history-signature img{display:block;max-width:220px;max-height:70px;object-fit:contain}.signature-line{border-top:1px solid #466273;margin-bottom:5px}.empty{padding:18px;text-align:center;color:#718696}
.no-print{text-align:center;margin:24px 0}.no-print button{padding:12px 20px;border:0;border-radius:9px;background:#073f68;color:#fff;font-weight:bold}
@media(max-width:600px){body{padding:10px}.patient-card{grid-template-columns:1fr 1fr}.patient-card .wide{grid-column:1/-1}.hc-row{grid-template-columns:1fr;gap:3px}.visit-head{align-items:flex-start;flex-direction:column}.diagnosis{text-align:left}.doctor{font-size:9px}}
@media print{body{padding:0}.no-print{display:none!important}}
</style></head><body>${inner}${autoPrint?'<script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script>':''}</body></html>`;
 }
 async function download(){
   const w=window.open('about:blank','_blank');
   if(!w){alert('El navegador bloqueó el documento. Habilita ventanas emergentes para Médico Amigo.');return}
   w.document.write('<p style="font-family:Arial;padding:30px">Preparando historia clínica…</p>');
   try{
     const d=await data();
     w.document.open();
     w.document.write(doc(body(d),false).replace('</body>','<div class="no-print" style="margin:25px 0;text-align:center"><button onclick="window.print()" style="padding:12px 18px;border:0;border-radius:9px;background:#073b66;color:white;font-weight:bold">Imprimir / Guardar como PDF</button></div><style>@media print{.no-print{display:none!important}}</style></body>'));
     w.document.close();
   }catch(e){w.close();alert('No se pudo preparar la historia clínica: '+e.message)}
 }
 async function printNow(){
   // Open synchronously on the user click so popup blockers do not reject it.
   const w=window.open('about:blank','_blank');
   if(!w){alert('El navegador bloqueó la ventana de impresión. Habilita ventanas emergentes para este sitio.');return}
   w.document.write('<p style="font-family:Arial;padding:30px">Preparando historia clínica…</p>');
   try{const d=await data();w.document.open();w.document.write(doc(body(d),true));w.document.close()}
   catch(e){w.close();alert('No se pudo preparar la historia clínica: '+e.message)}
 }
 function inject(){
   const screen=$x('patientDetailScreen'); if(!screen||screen.classList.contains('hidden'))return;
   if(screen.querySelector('#historyActions121'))return;
   const wrap=document.createElement('div');wrap.id='historyActions121';wrap.style.cssText='display:grid;gap:10px;margin:18px 0 8px';
   const d=document.createElement('button');d.type='button';d.className='primary-button';d.textContent='📄 VER / GUARDAR HISTORIA CLÍNICA';d.onclick=download;
   wrap.append(d);
   const target=screen.querySelector('.patient-actions,.detail-actions')||screen.querySelector('.screen-content,.content')||screen;
   target.appendChild(wrap);
 }
 const ob=new MutationObserver(inject);ob.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
 document.addEventListener('click',()=>setTimeout(inject,80),true);
 inject();
});


/* ============================================================
   v1.2.2 — PACIENTES ESTABLES / SUPABASE ÚNICA FUENTE
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const URL='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const SESSION='medico_amigo_supabase_session';
 const $e=id=>document.getElementById(id);

 function session(){try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}}
 function headers(rep=false){
   const s=session(); if(!s?.access_token)throw Error('No hay sesión autenticada.');
   const h={apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'};
   if(rep)h.Prefer='return=representation';
   return h;
 }
 async function request(path,opt={}){
   const r=await fetch(URL+'/rest/v1/'+path,{...opt,headers:{...headers(opt.rep),...(opt.headers||{})}});
   const raw=await r.text();let d=null;try{d=raw?JSON.parse(raw):null}catch{d=raw}
   if(!r.ok)throw Error(d?.message||raw||('HTTP '+r.status));return d;
 }
 function age(date){
   if(!date)return null;const b=new Date(date+'T00:00:00'),t=new Date();let a=t.getFullYear()-b.getFullYear();
   if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))a--;return a;
 }
 function map(p){
   const a=age(p.birth_date);
   return {id:p.id,name:p.full_name||'',ci:p.document_number||'',phone:p.phone||'',age:a,sex:p.sex||'',
    meta:[a!==null?a+' años':'',p.sex||''].filter(Boolean).join(' · '),address:p.address||'',
    emergency:[p.emergency_contact_name,p.emergency_contact_phone].filter(Boolean).join(' · '),
    pathologicalHistory:p.pathological_history||p.medical_history||'',nonPathologicalHistory:p.non_pathological_history||'',familyHistory:p.family_history||'',gyneHistory:p.gynecological_history||null,
    history:p.pathological_history||p.medical_history||'',allergies:p.allergies||'',medication:p.regular_medications||'',
    observations:p.observations||'',consultations:[]};
 }
 function unique(rows){
   const seen=new Set();return rows.filter(p=>p?.id&&!seen.has(p.id)&&seen.add(p.id));
 }
 async function fetchPatients(){
   const rows=await request('patients?select=*&order=full_name.asc');
   const patients=unique((rows||[]).map(map));
   sessionStorage.setItem('medicoAmigoPatients',JSON.stringify(patients));
   return patients;
 }
 function renderStable(patients){
   const list=$e('patientsList'), count=$e('patientsCount');
   if(count)count.textContent=patients.length+' '+(patients.length===1?'paciente':'pacientes');
   if(!list)return;
   list.innerHTML='';
   if(!patients.length){
     list.innerHTML='<div class="empty-patients"><strong>👥 No encontramos pacientes</strong><br><span>Prueba con otro nombre, CI o teléfono.</span></div>';
     return;
   }
   for(const p of patients){
     const card=document.createElement('div');card.className='patient-card';card.dataset.patientId=p.id;
     const initials=(p.name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
     card.innerHTML=`<div class="patient-avatar">${escapeHtml(initials)}</div><div class="patient-card-info"><strong>${escapeHtml(p.name)}</strong><span>CI: ${escapeHtml(p.ci||'—')} · ${escapeHtml(p.phone||'—')}</span><small>${escapeHtml(p.meta||'')}</small></div><span class="consult-count">0 consultas</span><span class="chevron">›</span>`;
     card.onclick=()=>{
       sessionStorage.setItem('medicoAmigoCurrentPatientId',p.id);
       if(window.state)state.currentPatientId=p.id;
       if(typeof window.openPatientDetail==='function')window.openPatientDetail(p);
       else {
         // Let the legacy directory handler use the same single cached row.
         const legacy=[...document.querySelectorAll('[data-patient-id]')].find(x=>x!==card&&x.dataset.patientId===p.id);
         legacy?.click();
       }
     };
     list.appendChild(card);
   }
 }
 async function refresh(){
   if(!session()?.access_token)return;
   try{const p=await fetchPatients();renderStable(p)}catch(e){console.error(e)}
 }
 window.refreshPatientsStable=refresh;

 // Open directory: fetch once, render once. Never click the nav recursively.
 $e('patientsNavBtn')?.addEventListener('click',()=>setTimeout(refresh,50),true);

 // Keep + NUEVO entirely available.
 $e('newPatientBtn')?.addEventListener('click',()=>{
   const f=$e('newPatientForm'); if(f){f.reset(); const age=$e('patientAge');if(age)age.value='';}
 },true);

 // One authoritative INSERT handler.
 const form=$e('newPatientForm');
 if(form)form.onsubmit=async ev=>{
   ev.preventDefault();ev.stopImmediatePropagation();
   const name=$e('patientFullName')?.value.trim()||'';
   if(!name){alert('Ingresa el nombre completo del paciente.');return false}
   const payload={
    full_name:name,document_number:$e('patientDocument')?.value.trim()||null,birth_date:$e('patientBirthDate')?.value||null,
    sex:$e('patientSex')?.value||null,phone:$e('patientPhone')?.value.trim()||null,address:$e('patientAddress')?.value.trim()||null,
    emergency_contact_name:$e('emergencyContact')?.value.trim()||null,emergency_contact_phone:null,
    medical_history:$e('patientPathologicalHistory')?.value.trim()||null,pathological_history:$e('patientPathologicalHistory')?.value.trim()||null,non_pathological_history:$e('patientNonPathologicalHistory')?.value.trim()||null,family_history:$e('patientFamilyHistory')?.value.trim()||null,gynecological_history:window.getGyneHistory125?.()||null,allergies:$e('patientAllergies')?.value.trim()||null,
    regular_medications:$e('patientMedication')?.value.trim()||null,observations:$e('patientObservations')?.value.trim()||null
   };
   const b=form.querySelector('button[type="submit"],.save-patient-button'),old=b?.textContent||'GUARDAR Y CONTINUAR →';
   if(b){b.disabled=true;b.textContent='GUARDANDO...'}
   try{
     await request('patients',{method:'POST',body:JSON.stringify(payload),rep:true});
     form.reset();await refresh();
     $e('patientsNavBtn')?.click();
   }catch(e){alert('No se pudo registrar el paciente: '+e.message)}
   finally{if(b){b.disabled=false;b.textContent=old}}
   return false;
 };

 // Initial sync only once.
 setTimeout(refresh,900);
});


/* ============================================================
   v1.2.3 — FICHA -> CONSULTA + HISTORIAL DESDE SUPABASE
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const btn=document.getElementById('startConsultationFromDetailBtn');
 // Extra guard in case another legacy handler was attached.
 if(btn) btn.addEventListener('click',()=>{
   const id=sessionStorage.getItem('medicoAmigoCurrentPatientId');
   if(id) sessionStorage.setItem('medicoAmigoCurrentPatientId',id);
 },true);

 async function refreshVisibleHistory(){
   const screen=document.getElementById('patientDetailScreen');
   if(!screen || screen.classList.contains('hidden')) return;
   let patients=[];try{patients=JSON.parse(sessionStorage.getItem('medicoAmigoPatients')||'[]')}catch{}
   const id=sessionStorage.getItem('medicoAmigoCurrentPatientId');
   const p=patients.find(x=>x.id===id);
   if(!p || typeof window.loadConsultationsFromSupabase!=='function')return;
   try{
     const cs=await window.loadConsultationsFromSupabase(p);
     const count=document.getElementById('detailHistoryCount');
     const box=document.getElementById('patientHistoryList');
     const empty=document.getElementById('patientHistoryEmpty');
     if(count)count.textContent=cs.length;
     if(empty)empty.classList.toggle('hidden',cs.length>0);
     if(!box)return;
     box.innerHTML='';
     cs.forEach(c=>{
       const card=document.createElement('article');card.className='history-card';
       const main=document.createElement('div');main.className='history-card-main';
       const title=document.createElement('strong');title.textContent=c.diagnosis||'Consulta médica';
       const date=document.createElement('span');date.textContent=new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(c.date));
       const reason=document.createElement('small');reason.textContent=c.reason||'Sin motivo registrado';
       main.append(title,date,reason);card.append(main);
       card.onclick=()=>{
         const modal=document.getElementById('consultationHistoryModal'),mt=document.getElementById('historyModalTitle'),mc=document.getElementById('historyModalContent');
         if(mt)mt.textContent=c.diagnosis||'Consulta médica';
         const safe=v=>String(v??'').trim()||'No registrado';
         const esc=v=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
         if(mc)mc.innerHTML=`<div class="history-detail-block"><h3>Motivo de consulta</h3><p>${esc(safe(c.reason))}</p></div>
<div class="history-detail-block"><h3>Enfermedad actual</h3><p>${esc(safe(c.illness))}</p></div>
<div class="history-detail-block"><h3>Signos vitales</h3><p>PA: ${esc(safe(c.bp))} · FC: ${esc(safe(c.hr))} · SpO₂: ${esc(safe(c.spo2))} · T°: ${esc(safe(c.temp))} · FR: ${esc(safe(c.rr))} · Peso: ${esc(safe(c.weight))} · Talla: ${esc(safe(c.height))}</p></div>
<div class="history-detail-block"><h3>Examen físico</h3><p>${esc(safe(c.exam))}</p></div>
<div class="history-detail-block"><h3>Estudios complementarios revisados</h3><p>${esc(safe(c.studies))}</p></div>
<div class="history-detail-block"><h3>Diagnóstico / impresión clínica</h3><p>${esc(safe(c.diagnosis))}</p></div>
<div class="history-detail-block"><h3>Indicaciones</h3><p>${esc(safe(c.plan))}</p></div>
<div class="history-detail-block"><h3>Observaciones</h3><p>${esc(safe(c.notes))}</p></div>
<div class="history-detail-block"><h3>Seguimiento</h3><p>${esc(safe(c.followUp))}</p></div>`;
         modal?.classList.remove('hidden');
       };
       box.appendChild(card);
     });
   }catch(e){console.error('Historial Supabase:',e)}
 }
 const obs=new MutationObserver(()=>setTimeout(refreshVisibleHistory,80));
 obs.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
 document.addEventListener('click',e=>{
   if(e.target.closest?.('.directory-patient-card,.patient-card'))setTimeout(refreshVisibleHistory,250);
 },true);
});


/* ============================================================
   v1.2.6 — ANTECEDENTES CLÍNICOS ESTRUCTURADOS
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const el=id=>document.getElementById(id);
 const sex=el('patientSex'),wrap=el('patientGyneHistoryWrap');
 function isFemale(){return /femen/i.test(sex?.value||'')}
 function toggle(){
   if(!wrap)return;
   wrap.classList.toggle('hidden',!isFemale());
   if(!isFemale()) wrap.querySelectorAll('input,textarea').forEach(x=>x.value='');
 }
 sex?.addEventListener('change',toggle);toggle();

 window.getGyneHistory125=()=>{
   if(!isFemale())return null;
   const v=id=>el(id)?.value?.trim?.()||null;
   return {menarche:v('patientMenarche'),lmp:v('patientLmp'),menstrual_cycle:v('patientMenstrualCycle'),
     pregnancies:v('patientPregnancies'),births:v('patientBirths'),cesareans:v('patientCesareans'),
     abortions:v('patientAbortions'),contraception:v('patientContraception'),other:v('patientGyneOther')};
 };
 window.formatGyneHistory125=g=>{
   if(!g)return '';
   return [
     g.menarche?'Menarca: '+g.menarche:null,g.lmp?'FUM: '+g.lmp:null,
     g.menstrual_cycle?'Ritmo menstrual: '+g.menstrual_cycle:null,
     g.pregnancies!==null&&g.pregnancies!==undefined&&g.pregnancies!==''?'Gestas: '+g.pregnancies:null,
     g.births!==null&&g.births!==undefined&&g.births!==''?'Partos: '+g.births:null,
     g.cesareans!==null&&g.cesareans!==undefined&&g.cesareans!==''?'Cesáreas: '+g.cesareans:null,
     g.abortions!==null&&g.abortions!==undefined&&g.abortions!==''?'Abortos: '+g.abortions:null,
     g.contraception?'Método anticonceptivo: '+g.contraception:null,g.other?'Otros: '+g.other:null
   ].filter(Boolean).join(' · ');
 };
});


/* ============================================================
   v1.3 — RECETA + COBRO REALES EN SUPABASE
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const SUPABASE_URL='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const SESSION='medico_amigo_supabase_session';
 const $=id=>document.getElementById(id);
 const sess=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}};
 const head=(rep=false)=>{const s=sess();if(!s?.access_token)throw Error('No hay sesión autenticada');const h={apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'};if(rep)h.Prefer='return=representation';return h};
 async function req(path,opt={}){const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{...opt,headers:{...head(opt.rep),...(opt.headers||{})}});const raw=await r.text();let d=null;try{d=raw?JSON.parse(raw):null}catch{d=raw}if(!r.ok)throw Error(d?.message||raw||('HTTP '+r.status));return d}
 const flow=()=>{try{return JSON.parse(sessionStorage.getItem('medicoAmigoFlow')||'null')}catch{return null}};
 const medRows=()=>[...document.querySelectorAll('.medication-card')].map((c,i)=>({
   medication_name:c.querySelector('.med-name')?.value.trim()||null,
   presentation:c.querySelector('.med-presentation')?.value.trim()||null,
   dose:c.querySelector('.med-dose')?.value.trim()||null,
   route:c.querySelector('.med-route')?.value||null,
   frequency:c.querySelector('.med-frequency')?.value.trim()||null,
   duration:c.querySelector('.med-duration')?.value.trim()||null,
   instructions:c.querySelector('.med-instructions')?.value.trim()||null,item_order:i+1
 })).filter(x=>Object.values(x).some(v=>v!==null&&v!==''&&v!==x.item_order));

 // Save prescription to Supabase, then continue to payment.
 const pf=$('prescriptionForm');
 if(pf)pf.onsubmit=async e=>{
   e.preventDefault();e.stopImmediatePropagation();
   const f=flow();if(!f?.patient?.id||!f?.consultation?.id){alert('No se encontró la consulta activa.');return false}
   const btn=pf.querySelector('button[type="submit"]'),old=btn?.textContent||'GUARDAR Y CONTINUAR →';
   if(btn){btn.disabled=true;btn.textContent='GUARDANDO...'}
   let rx=null;
   try{
     const code=$('prescriptionCode').textContent||('RX-'+Date.now());
     const rows=await req('prescriptions',{method:'POST',rep:true,body:JSON.stringify({
       patient_id:f.patient.id,consultation_id:f.consultation.id,prescription_code:code,
       diagnosis:f.consultation.diagnosis||null,general_instructions:$('prescriptionGeneralInstructions').value.trim()||null
     })});
     rx=rows?.[0]; if(!rx?.id)throw Error('No se recibió el identificador de la receta.');
     const items=medRows().map(x=>({...x,prescription_id:rx.id}));
     if(items.length)await req('prescription_items',{method:'POST',body:JSON.stringify(items)});
     f.prescription={id:rx.id,code,items};sessionStorage.setItem('medicoAmigoFlow',JSON.stringify(f));
     if(typeof window.medicoAmigoOpenPayment==='function')window.medicoAmigoOpenPayment();
   }catch(err){
     console.error(err);
     if(rx?.id)try{await req('prescriptions?id=eq.'+encodeURIComponent(rx.id),{method:'DELETE'})}catch{}
     alert('No se pudo guardar la receta: '+err.message);
   }finally{if(btn){btn.disabled=false;btn.textContent=old}}
   return false;
 };

 $('skipPrescriptionBtn')?.addEventListener('click',()=>{
   const f=flow();if(f){f.prescription=null;sessionStorage.setItem('medicoAmigoFlow',JSON.stringify(f))}
   if(typeof window.medicoAmigoOpenPayment==='function')window.medicoAmigoOpenPayment();
 });

 // Save payment to Supabase and finish the attention.
 const pay=$('paymentForm');
 if(pay)pay.onsubmit=async e=>{
   e.preventDefault();e.stopImmediatePropagation();
   const f=flow();if(!f?.patient?.id||!f?.consultation?.id){alert('No se encontró la consulta activa.');return false}
   const price=Number($('consultationPrice').value||0),paid=Number($('amountPaid').value||0);
   const status=price>0&&paid>=price?'Pagado':paid>0?'Pago parcial':'Pendiente';
   const btn=pay.querySelector('button[type="submit"]'),old=btn?.textContent||'FINALIZAR';
   if(btn){btn.disabled=true;btn.textContent='GUARDANDO...'}
   try{
     await req('payments',{method:'POST',body:JSON.stringify({
       patient_id:f.patient.id,consultation_id:f.consultation.id,
       consultation_price:Number.isFinite(price)?price:0,amount_paid:Number.isFinite(paid)?paid:0,
       payment_method:$('paymentMethod').value||null,payment_status:status,
       notes:$('paymentNotes').value.trim()||null,payment_date:new Date().toISOString()
     })});
     sessionStorage.removeItem('medicoAmigoFlow');
     $('consultationForm')?.reset();$('prescriptionForm')?.reset();pay.reset();
     alert('Atención finalizada correctamente.');
     $('backHomeBtn')?.click();
     const home=$('homeScreen'); if(home){document.querySelectorAll('main.app > section').forEach(x=>x.classList.add('hidden'));home.classList.remove('hidden');window.scrollTo(0,0)}
   }catch(err){console.error(err);alert('No se pudo guardar el cobro: '+err.message)}
   finally{if(btn){btn.disabled=false;btn.textContent=old}}
   return false;
 };

 // Private signature upload: the file never goes to GitHub.
 const sig=$('doctorSignature');
 if(sig)sig.onchange=async e=>{
   const file=e.target.files?.[0];if(!file)return;
   if(file.size>2000000){alert('Usa una imagen de firma de hasta 2 MB.');e.target.value='';return}
   const s=sess();if(!s?.user?.id){alert('Debes iniciar sesión.');return}
   const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
   const path=s.user.id+'/signature.'+ext;
   try{
     const up=await fetch(SUPABASE_URL+'/storage/v1/object/doctor-signatures/'+path,{
       method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':file.type||'image/jpeg','x-upsert':'true'},body:file
     });
     if(!up.ok)throw Error(await up.text());
     await req('doctor_profiles?id=eq.'+encodeURIComponent(s.user.id),{method:'PATCH',body:JSON.stringify({signature_url:path,updated_at:new Date().toISOString()})});
     const blobRes=await fetch(SUPABASE_URL+'/storage/v1/object/authenticated/doctor-signatures/'+path,{headers:{apikey:KEY,Authorization:'Bearer '+s.access_token}});
     if(!blobRes.ok)throw Error(await blobRes.text());
     const objectUrl=URL.createObjectURL(await blobRes.blob());
     let cfg={};try{cfg=JSON.parse(sessionStorage.getItem('medicoAmigoDoctorConfig')||'{}')}catch{}
     cfg.signature=objectUrl;sessionStorage.setItem('medicoAmigoDoctorConfig',JSON.stringify(cfg));
     const box=$('signaturePreview');if(box){box.innerHTML='';const im=document.createElement('img');im.src=objectUrl;im.alt='Firma del médico';box.appendChild(im)}
     $('removeSignatureBtn')?.classList.remove('hidden');
     alert('Firma guardada de forma privada.');
   }catch(err){console.error(err);alert('No se pudo guardar la firma: '+err.message)}
 };

 // Load private signature for the authenticated doctor.
 async function loadPrivateSignature(){
   const s=sess();if(!s?.user?.id)return;
   try{
     const prof=await req('doctor_profiles?id=eq.'+encodeURIComponent(s.user.id)+'&select=signature_url');
     const path=prof?.[0]?.signature_url;if(!path)return;
     const r=await fetch(SUPABASE_URL+'/storage/v1/object/authenticated/doctor-signatures/'+path,{headers:{apikey:KEY,Authorization:'Bearer '+s.access_token}});
     if(!r.ok)return;
     const objectUrl=await medicoAmigoBlobDataURL(await r.blob());
     let cfg={};try{cfg=JSON.parse(sessionStorage.getItem('medicoAmigoDoctorConfig')||'{}')}catch{}
     cfg.signature=objectUrl;sessionStorage.setItem('medicoAmigoDoctorConfig',JSON.stringify(cfg));
   }catch(err){console.error('Firma:',err)}
 }
 setTimeout(loadPrivateSignature,800);
});


/* ============================================================
   v1.3.3 — BÚSQUEDA SUPABASE + DASHBOARD REAL + COBRO VERIFICADO
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const BASE='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const SESSION='medico_amigo_supabase_session';
 const $=id=>document.getElementById(id);
 const session=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}};
 const headers=(rep=false)=>{const s=session();if(!s?.access_token)throw Error('No hay sesión autenticada.');const h={apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'};if(rep)h.Prefer='return=representation';return h};
 async function req(path,opt={}){const r=await fetch(BASE+'/rest/v1/'+path,{...opt,headers:{...headers(opt.rep),...(opt.headers||{})}});const raw=await r.text();let d=null;try{d=raw?JSON.parse(raw):null}catch{d=raw}if(!r.ok)throw Error(d?.message||raw||('HTTP '+r.status));return d}
 const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 function age(date){if(!date)return null;const b=new Date(date+'T00:00:00'),t=new Date();let a=t.getFullYear()-b.getFullYear();if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))a--;return a}
 function map(p){const a=age(p.birth_date);return{id:p.id,name:p.full_name||'',ci:p.document_number||'',phone:p.phone||'',age:a,sex:p.sex||'',meta:[a!==null?a+' años':'',p.sex||''].filter(Boolean).join(' · '),address:p.address||'',emergency:[p.emergency_contact_name,p.emergency_contact_phone].filter(Boolean).join(' · '),pathologicalHistory:p.pathological_history||p.medical_history||'',nonPathologicalHistory:p.non_pathological_history||'',familyHistory:p.family_history||'',gyneHistory:p.gynecological_history||null,history:p.pathological_history||p.medical_history||'',allergies:p.allergies||'',medication:p.regular_medications||'',observations:p.observations||'',consultations:[]}}
 async function patients(){return (await req('patients?select=*&order=full_name.asc')||[]).map(map)}

 async function renderSearch(){
   if(!session()?.access_token)return;
   const box=$('patientResults'),empty=$('noPatientResults'),input=$('patientSearchInput');
   if(!box||!input)return;
   let rows=[];try{rows=await patients()}catch(e){console.error('Pacientes:',e);return}
   sessionStorage.setItem('medicoAmigoPatients',JSON.stringify(rows));
   const q=norm(input.value.trim());
   const shown=q?rows.filter(p=>[p.name,p.ci,p.phone].some(v=>norm(v).includes(q))):rows;
   box.innerHTML='';
   shown.forEach(p=>{
     const a=document.createElement('article');a.className='patient-result';
     a.dataset.name=p.name;a.dataset.ci=p.ci;a.dataset.phone=p.phone;
     const ini=(p.name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
     a.innerHTML=`<div class="patient-avatar">${ini}</div><div class="patient-info"><strong></strong><span></span><small></small></div><span class="result-arrow">›</span>`;
     a.querySelector('strong').textContent=p.name;
     a.querySelector('.patient-info span').textContent=p.ci?'CI: '+p.ci:'Sin documento';
     a.querySelector('small').textContent=[p.meta,p.phone].filter(Boolean).join(' · ');
     a.onclick=()=>{sessionStorage.setItem('medicoAmigoCurrentPatientId',p.id);if(window.state)state.currentPatientId=p.id;window.medicoAmigoSelectPatient?.(p)};
     box.appendChild(a);
   });
   box.classList.toggle('hidden',shown.length===0);
   empty?.classList.toggle('hidden',shown.length!==0);
 }
 $('patientSearchInput')?.addEventListener('input',()=>renderSearch());
 $('newConsultationBtn')?.addEventListener('click',()=>setTimeout(renderSearch,80));
 $('searchPatientBtn')?.addEventListener('click',()=>setTimeout(renderSearch,80));

 function localDateISO(){const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
 async function dashboard(){
   if(!session()?.access_token)return;
   try{
     const day=localDateISO(), start=day+'T00:00:00', end=day+'T23:59:59.999';
     const cs=await req('consultations?select=id,patient_id,diagnosis,consultation_date&consultation_date=gte.'+encodeURIComponent(start)+'&consultation_date=lte.'+encodeURIComponent(end)+'&order=consultation_date.desc');
     const ps=await req('payments?select=id,consultation_id,amount_paid,payment_status,payment_date&payment_date=gte.'+encodeURIComponent(start)+'&payment_date=lte.'+encodeURIComponent(end));
     $('todayConsultations').textContent=cs.length;
     const income=ps.reduce((s,p)=>s+Number(p.amount_paid||0),0);
     $('todayIncome').textContent='Bs '+income.toFixed(2).replace('.00','');
     $('todayPending').textContent=ps.filter(p=>String(p.payment_status||'').toLowerCase()!=='pagado').length;
     const recent=document.querySelector('.recent-section'),empty=recent?.querySelector('.empty-state');
     recent?.querySelectorAll('.recent-consultation').forEach(x=>x.remove());
     if(!cs.length){empty?.classList.remove('hidden');return}
     empty?.classList.add('hidden');
     const pats=await patients(), byId=new Map(pats.map(p=>[p.id,p]));
     cs.slice(0,5).forEach(c=>{
       const p=byId.get(c.patient_id), item=document.createElement('div');item.className='recent-consultation';
       const info=document.createElement('div'), name=document.createElement('strong'), meta=document.createElement('small');
       name.textContent=p?.name||'Paciente';meta.textContent=(c.diagnosis||'Consulta')+' · '+new Intl.DateTimeFormat('es-BO',{hour:'2-digit',minute:'2-digit'}).format(new Date(c.consultation_date));
       info.append(name,meta);item.append(info);recent?.appendChild(item);
     });
   }catch(e){console.error('Dashboard:',e)}
 }
 window.medicoAmigoRefreshDashboard=dashboard;
 setTimeout(()=>{renderSearch();dashboard()},1000);

 // Replace only the final payment submit with a verified Supabase save.
 const pay=$('paymentForm');
 if(pay)pay.onsubmit=async e=>{
   e.preventDefault();e.stopImmediatePropagation();
   let f=null;try{f=JSON.parse(sessionStorage.getItem('medicoAmigoFlow')||'null')}catch{}
   if(!f?.patient?.id||!f?.consultation?.id){alert('No se encontró la consulta activa.');return false}
   const price=Number($('consultationPrice').value||0),paid=Number($('amountPaid').value||0);
   const status=price>0&&paid>=price?'Pagado':paid>0?'Pago parcial':'Pendiente';
   const btn=pay.querySelector('button[type="submit"]'),old=btn?.textContent||'FINALIZAR';
   if(btn){btn.disabled=true;btn.textContent='GUARDANDO...'}
   try{
     const saved=await req('payments',{method:'POST',rep:true,body:JSON.stringify({
       patient_id:f.patient.id,consultation_id:f.consultation.id,
       consultation_price:Number.isFinite(price)?price:0,amount_paid:Number.isFinite(paid)?paid:0,
       payment_method:$('paymentMethod').value||null,payment_status:status,
       notes:$('paymentNotes').value.trim()||null,payment_date:new Date().toISOString()
     })});
     if(!Array.isArray(saved)||!saved[0]?.id)throw Error('Supabase no confirmó el registro del cobro.');
     sessionStorage.removeItem('medicoAmigoFlow');
     $('consultationForm')?.reset();$('prescriptionForm')?.reset();pay.reset();
     await dashboard();
     alert('Atención finalizada correctamente. Cobro guardado en Supabase.');
     $('backHomeBtn')?.click();
     const home=$('homeScreen');if(home){document.querySelectorAll('main.app > section').forEach(x=>x.classList.add('hidden'));home.classList.remove('hidden');window.scrollTo(0,0)}
   }catch(err){console.error(err);alert('No se pudo guardar el cobro: '+err.message)}
   finally{if(btn){btn.disabled=false;btn.textContent=old}}
   return false;
 };
});


/* ============================================================
   v1.3.4 — FIRMA PRIVADA EN HISTORIA CLÍNICA
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const BASE='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const SESSION='medico_amigo_supabase_session';
 const sess=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}};
 async function loadHistorySignature(){
   const s=sess(); if(!s?.access_token||!s?.user?.id)return;
   try{
     const h={apikey:KEY,Authorization:'Bearer '+s.access_token};
     const pr=await fetch(BASE+'/rest/v1/doctor_profiles?id=eq.'+encodeURIComponent(s.user.id)+'&select=full_name,specialty,professional_registration,signature_url',{headers:h});
     if(!pr.ok)return;
     const rows=await pr.json(), p=rows?.[0]; if(!p)return;
     let signature='';
     if(p.signature_url){
       const sr=await fetch(BASE+'/storage/v1/object/authenticated/doctor-signatures/'+p.signature_url,{headers:h});
       if(sr.ok) signature=await medicoAmigoBlobDataURL(await sr.blob());
     }
     const doctor={
       name:p.full_name||'Dr. Hugo Alfaro Oviedo',
       specialty:p.specialty||'Medicina General',
       registration:p.professional_registration||'A-4833274',
       signature
     };
     // Keep both configuration keys synchronized because different document
     // modules in the existing app read different legacy keys.
     let a={}; try{a=JSON.parse(sessionStorage.getItem('medicoAmigoDoctorConfig')||'{}')}catch{}
     Object.assign(a,doctor); sessionStorage.setItem('medicoAmigoDoctorConfig',JSON.stringify(a));
     let b={}; try{b=JSON.parse(sessionStorage.getItem('doctorConfig')||'{}')}catch{}
     Object.assign(b,doctor); sessionStorage.setItem('doctorConfig',JSON.stringify(b));
   }catch(e){console.error('Firma historia clínica:',e)}
 }
 loadHistorySignature();
 setTimeout(loadHistorySignature,900);
});


/* ============================================================
   v1.4 — GESTIÓN DE REGISTROS
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const BASE='https://kdjvsbiqjpztdugewuve.supabase.co', KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp', SESSION='medico_amigo_supabase_session';
 const $=id=>document.getElementById(id);
 const sess=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}};
 const heads=(rep=false)=>{const s=sess();if(!s?.access_token)throw Error('No hay sesión autenticada.');const h={apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'};if(rep)h.Prefer='return=representation';return h};
 async function req(path,opt={}){const r=await fetch(BASE+'/rest/v1/'+path,{...opt,headers:{...heads(opt.rep),...(opt.headers||{})}});const t=await r.text();let d=null;try{d=t?JSON.parse(t):null}catch{d=t}if(!r.ok)throw Error(d?.message||t||('HTTP '+r.status));return d}
 const pid=()=>sessionStorage.getItem('medicoAmigoCurrentPatientId')||window.state?.currentPatientId||null;
 const set=(id,v)=>{if($(id))$(id).value=v??''};
 const show=id=>{document.querySelectorAll('main.app > section').forEach(x=>x.classList.add('hidden'));$(id)?.classList.remove('hidden');scrollTo(0,0)};
 async function patient(){
   let id=pid();
   if(id){
     const r=await req('patients?id=eq.'+encodeURIComponent(id)+'&select=*');
     if(r?.[0])return r[0];
   }
   // Compatibility with older directory cards that opened the detail without persisting the UUID.
   const shownCi=(document.getElementById('detailCi')?.textContent||'').trim();
   const shownName=(document.getElementById('detailName')?.textContent||'').trim();
   let r=[];
   if(shownCi && shownCi!=='—'){
     r=await req('patients?document_number=eq.'+encodeURIComponent(shownCi)+'&select=*');
   }
   if(!r?.[0] && shownName){
     r=await req('patients?full_name=eq.'+encodeURIComponent(shownName)+'&select=*');
   }
   if(!r?.[0])throw Error('No se pudo identificar este paciente en Supabase.');
   id=r[0].id;
   sessionStorage.setItem('medicoAmigoCurrentPatientId',id);
   if(window.state)window.state.currentPatientId=id;
   if(window.detailPatient)window.detailPatient.id=id;
   return r[0];
 }
 function gyne(){ $('editGyneWrap')?.classList.toggle('hidden',!/femen/i.test($('editSex')?.value||'')) }
 $('editSex')?.addEventListener('change',gyne);

 $('editPatientBtn')?.addEventListener('click',async()=>{
  try{const p=await patient(),g=p.gynecological_history||{};
   set('editFullName',p.full_name);set('editDocument',p.document_number);set('editBirthDate',p.birth_date);set('editSex',p.sex);set('editPhone',p.phone);set('editAddress',p.address);set('editEmergencyName',p.emergency_contact_name);set('editEmergencyPhone',p.emergency_contact_phone);set('editEmergencyRelationship',p.emergency_contact_relationship);
   set('editPathological',p.pathological_history||p.medical_history);set('editNonPathological',p.non_pathological_history);set('editFamily',p.family_history);
   set('editMenarche',g.menarche);set('editLmp',g.lmp);set('editCycle',g.menstrual_cycle);set('editPregnancies',g.pregnancies);set('editBirths',g.births);set('editCesareans',g.cesareans);set('editAbortions',g.abortions);set('editContraception',g.contraception);set('editGyneOther',g.other);
   set('editAllergies',p.allergies);set('editMedication',p.regular_medications);set('editObservations',p.observations);gyne();show('editPatientScreen');
  }catch(e){alert('No se pudo abrir la edición: '+e.message)}
 });
 const cancel=()=>{$('patientsNavBtn')?.click()};
 $('editPatientBackBtn')?.addEventListener('click',cancel);$('cancelEditPatientBtn')?.addEventListener('click',cancel);

 $('editPatientForm')?.addEventListener('submit',async e=>{
  e.preventDefault();e.stopImmediatePropagation();const id=pid(),female=/femen/i.test($('editSex').value||'');
  const g=female?{menarche:$('editMenarche').value.trim()||null,lmp:$('editLmp').value||null,menstrual_cycle:$('editCycle').value.trim()||null,pregnancies:$('editPregnancies').value||null,births:$('editBirths').value||null,cesareans:$('editCesareans').value||null,abortions:$('editAbortions').value||null,contraception:$('editContraception').value.trim()||null,other:$('editGyneOther').value.trim()||null}:null;
  const b={full_name:$('editFullName').value.trim(),document_number:$('editDocument').value.trim()||null,birth_date:$('editBirthDate').value||null,sex:$('editSex').value||null,phone:$('editPhone').value.trim()||null,address:$('editAddress').value.trim()||null,emergency_contact_name:$('editEmergencyName').value.trim()||null,emergency_contact_phone:$('editEmergencyPhone').value.trim()||null,emergency_contact_relationship:$('editEmergencyRelationship').value.trim()||null,pathological_history:$('editPathological').value.trim()||null,medical_history:$('editPathological').value.trim()||null,non_pathological_history:$('editNonPathological').value.trim()||null,family_history:$('editFamily').value.trim()||null,gynecological_history:g,allergies:$('editAllergies').value.trim()||null,regular_medications:$('editMedication').value.trim()||null,observations:$('editObservations').value.trim()||null,updated_at:new Date().toISOString()};
  try{const r=await req('patients?id=eq.'+encodeURIComponent(id),{method:'PATCH',rep:true,body:JSON.stringify(b)});if(!r?.[0]?.id)throw Error('Supabase no confirmó los cambios.');alert('Paciente actualizado correctamente.');$('patientsNavBtn')?.click()}
  catch(err){alert('No se pudo actualizar: '+err.message)}
 });

 $('deletePatientBtn')?.addEventListener('click',async()=>{
  let p;try{p=await patient()}catch(e){alert(e.message);return}
  if(!confirm(`¿Eliminar a ${p.full_name}?\n\nSe eliminarán sus consultas, recetas y cobros asociados.`))return;
  if(!confirm('CONFIRMACIÓN FINAL\n\nEsta acción no se puede deshacer. ¿Eliminar definitivamente?'))return;
  try{
   const deleted=await req('patients?id=eq.'+encodeURIComponent(p.id),{method:'DELETE',rep:true,headers:{Prefer:'return=representation'}});
   if(!Array.isArray(deleted)||!deleted.some(x=>x.id===p.id))throw Error('Supabase no confirmó la eliminación del paciente.');
   const check=await req('patients?id=eq.'+encodeURIComponent(p.id)+'&select=id');
   if(Array.isArray(check)&&check.length)throw Error('El paciente todavía existe en la base de datos.');
   sessionStorage.removeItem('medicoAmigoCurrentPatientId');
   if(window.state){window.state.currentPatientId=null;window.state.selectedPatient=null}
   alert('Paciente eliminado correctamente.');
   $('patientsNavBtn')?.click();
   window.medicoAmigoRefreshDashboard?.();
  }catch(e){console.error('Eliminar paciente:',e);alert('No se pudo eliminar el paciente: '+e.message)}
 });

 // Consultation cards created by the history renderer get a safe delete button.
 const addDeleteButtons=()=>{
  document.querySelectorAll('#patientHistoryList [data-id],#patientHistoryList [data-consultation-id]').forEach(card=>{
   if(card.querySelector('.delete-consultation-btn'))return;
   const id=card.dataset.consultationId||card.dataset.id;if(!id)return;
   const b=document.createElement('button');b.type='button';b.className='delete-consultation-btn';b.textContent='🗑 Eliminar consulta';
   b.onclick=async ev=>{ev.preventDefault();ev.stopPropagation();if(!confirm('¿Eliminar esta consulta? También se eliminarán su receta y cobro asociados.'))return;
    try{
     const deleted=await req('consultations?id=eq.'+encodeURIComponent(id),{method:'DELETE',rep:true,headers:{Prefer:'return=representation'}});
     if(!Array.isArray(deleted)||!deleted.some(x=>x.id===id))throw Error('Supabase no confirmó la eliminación de la consulta.');
     const check=await req('consultations?id=eq.'+encodeURIComponent(id)+'&select=id');
     if(Array.isArray(check)&&check.length)throw Error('La consulta todavía existe en la base de datos.');
     card.remove();alert('Consulta eliminada correctamente.');window.medicoAmigoRefreshDashboard?.();
    }catch(e){console.error('Eliminar consulta:',e);alert('No se pudo eliminar la consulta: '+e.message)}
   };card.appendChild(b);
  });
 };
 new MutationObserver(addDeleteButtons).observe(document.getElementById('patientHistoryList')||document.body,{childList:true,subtree:true});
 addDeleteButtons();
});


/* ============================================================
   v1.0.1 — CORRECCIONES DE USO REAL / MÓVIL
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const BASE='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const SESSION='medico_amigo_supabase_session';
 const $=id=>document.getElementById(id);
 const sess=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}};
 const headers=(rep=false)=>{const s=sess();if(!s?.access_token)throw Error('No hay sesión autenticada');const h={apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'};if(rep)h.Prefer='return=representation';return h};
 async function req(path,opt={}){const r=await fetch(BASE+'/rest/v1/'+path,{...opt,headers:{...headers(opt.rep),...(opt.headers||{})}});const raw=await r.text();let d=null;try{d=raw?JSON.parse(raw):null}catch{d=raw}if(!r.ok)throw Error(d?.message||raw||('HTTP '+r.status));return d}
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const currentPatientId=()=>sessionStorage.getItem('medicoAmigoCurrentPatientId')||(window.state&&state.currentPatientId)||null;
 const currentPatient=()=>{let a=[];try{a=JSON.parse(sessionStorage.getItem('medicoAmigoPatients')||'[]')}catch{};return a.find(x=>x.id===currentPatientId())||window.detailPatient||null};
 let editConsultationId=null, modalConsultation=null, rxMode=null;

 async function prescriptionForConsultation(cid){
   const r=await req('prescriptions?consultation_id=eq.'+encodeURIComponent(cid)+'&select=*&order=created_at.desc');
   const rx=r?.[0];if(!rx)return null;
   rx.items=await req('prescription_items?prescription_id=eq.'+encodeURIComponent(rx.id)+'&select=*&order=item_order.asc')||[];
   return rx;
 }
 function rxHtml(rx){
   if(!rx)return '<div class="history-detail-block"><h3>Tratamiento / receta</h3><p>Sin receta asociada.</p></div>';
   const items=(rx.items||[]).map((x,i)=>`<div class="history-rx-item"><b>${i+1}. ${esc(x.medication_name||'Medicamento')}</b>${x.presentation?' · '+esc(x.presentation):''}<br>${[x.dose,x.route,x.frequency,x.duration].filter(Boolean).map(esc).join(' · ')}${x.instructions?'<br><small>'+esc(x.instructions)+'</small>':''}</div>`).join('');
   return `<div class="history-detail-block"><h3>Tratamiento / receta</h3>${items||'<p>Sin medicamentos.</p>'}${rx.general_instructions?'<p><b>Indicaciones generales:</b> '+esc(rx.general_instructions)+'</p>':''}</div>`;
 }

 // Enhance consultation modal: show prescription and expose edit actions.
 const hist=$('patientHistoryList');
 hist?.addEventListener('click',async ev=>{
   const card=ev.target.closest('.history-card'); if(!card || ev.target.closest('.delete-consultation-btn'))return;
   setTimeout(async()=>{
     const title=$('historyModalTitle')?.textContent||'';
     let cs=[];const p=currentPatient();
     if(p&&window.loadConsultationsFromSupabase)cs=await window.loadConsultationsFromSupabase(p);
     // Match the opened card by diagnosis/date text; renderer keeps same object order.
     const cards=[...hist.querySelectorAll('.history-card')],idx=cards.indexOf(card);
     modalConsultation=cs[idx]||cs.find(c=>(c.diagnosis||'Consulta médica')===title)||null;
     if(!modalConsultation)return;
     try{
       const rx=await prescriptionForConsultation(modalConsultation.id);
       $('historyModalContent')?.insertAdjacentHTML('beforeend',rxHtml(rx));
       const rb=$('historyPrescriptionBtn');if(rb){rb.disabled=!rx;rb.textContent=rx?'💊 VER / EDITAR RECETA':'💊 GENERAR RECETA'}
     }catch(e){console.error(e)}
   },40);
 },true);

 $('editHistoryConsultationBtn')?.addEventListener('click',()=>{
   const c=modalConsultation;if(!c)return;
   editConsultationId=c.id;
   sessionStorage.setItem('medicoAmigoEditingConsultation',c.id);
   const set=(id,v)=>{if($(id))$(id).value=v??''};
   set('consultationReason',c.reason);set('currentIllness',c.illness);set('bloodPressure',c.bp);set('heartRate',c.hr);set('oxygenSaturation',c.spo2);
   set('temperature',c.temp);set('respiratoryRate',c.rr);set('weight',c.weight);set('height',c.height);set('physicalExam',c.exam);
   set('complementaryStudies',c.studies);set('diagnosis',c.diagnosis);set('consultationIndications',c.plan);set('consultationNotes',c.notes);set('followUp',c.followUp);
   $('consultationHistoryModal')?.classList.add('hidden');
   if(typeof show==='function')show($('consultationScreen'));
   const b=$('consultationForm')?.querySelector('button[type="submit"]');if(b)b.textContent='GUARDAR CAMBIOS';
 });

 // Capture edit-submit before legacy POST handler: PATCH same consultation, no duplicate consultation/cobro.
 $('consultationForm')?.addEventListener('submit',async e=>{
   if(!editConsultationId)return;
   e.preventDefault();e.stopImmediatePropagation();
   const v=id=>$(id)?.value?.trim?.()||null,n=id=>{const x=$(id)?.value;return x===''||x==null?null:Number(x)};
   const payload={reason:v('consultationReason'),current_illness:v('currentIllness'),blood_pressure:v('bloodPressure'),heart_rate:n('heartRate'),
    oxygen_saturation:n('oxygenSaturation'),temperature:n('temperature'),respiratory_rate:n('respiratoryRate'),weight:n('weight'),height:n('height'),
    physical_exam:v('physicalExam'),complementary_studies:v('complementaryStudies'),diagnosis:v('diagnosis'),indications:v('consultationIndications'),
    observations:v('consultationNotes'),follow_up:v('followUp'),updated_at:new Date().toISOString()};
   try{
     const rows=await req('consultations?id=eq.'+encodeURIComponent(editConsultationId),{method:'PATCH',rep:true,body:JSON.stringify(payload)});
     if(!rows?.[0]?.id)throw Error('Supabase no confirmó la actualización.');
     editConsultationId=null;
     sessionStorage.removeItem('medicoAmigoEditingConsultation');
     const b=$('consultationForm')?.querySelector('button[type="submit"]');if(b)b.textContent='GUARDAR Y CONTINUAR →';
     alert('Consulta actualizada correctamente.');
     $('patientsNavBtn')?.click();
   }catch(err){alert('No se pudo actualizar la consulta: '+err.message)}
 },true);

 function populateRx(rx,p,c){
   selectedPatient=p;currentConsultation=c||{id:null,diagnosis:rx?.diagnosis||'',indications:rx?.general_instructions||''};
   $('prescriptionPatientName').textContent=p.name;$('prescriptionSelectedName').textContent=p.name;$('prescriptionSelectedMeta').textContent=[p.ci?'CI: '+p.ci:'Sin documento',p.meta].filter(Boolean).join(' · ');
   $('prescriptionAvatar').textContent=(p.name||'P').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
   $('prescriptionDiagnosis').textContent=rx?.diagnosis||currentConsultation.diagnosis||'Receta independiente';
   $('prescriptionCode').textContent=rx?.prescription_code||('RX-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+String(Date.now()).slice(-5));
   $('prescriptionGeneralInstructions').value=rx?.general_instructions||currentConsultation.indications||'';
   $('medicationsList').innerHTML='';
   const its=rx?.items?.length?rx.items:[{}];
   its.forEach(x=>addMedication({name:x.medication_name||'',presentation:x.presentation||'',dose:x.dose||'',route:x.route||'',frequency:x.frequency||'',duration:x.duration||'',instructions:x.instructions||''}));
   show($('prescriptionScreen'));
 }
 async function openRxForCurrentConsult(){
   if(!modalConsultation)return;
   const p=currentPatient();if(!p)return;
   const rx=await prescriptionForConsultation(modalConsultation.id);
   rxMode=rx?{type:'edit',rx}:{type:'new-linked',consultationId:modalConsultation.id};
   populateRx(rx,p,{id:modalConsultation.id,diagnosis:modalConsultation.diagnosis||'',indications:modalConsultation.plan||''});
   $('consultationHistoryModal')?.classList.add('hidden');
 }
 $('historyPrescriptionBtn')?.addEventListener('click',()=>openRxForCurrentConsult().catch(e=>alert(e.message)));

 async function standaloneFor(p){
   if(!p?.id){alert('Selecciona primero un paciente.');return}
   rxMode={type:'standalone'};
   populateRx(null,p,{id:null,diagnosis:'',indications:''});
   $('prescriptionDiagnosis').textContent='Receta independiente';
 }
 $('standalonePrescriptionFromDetailBtn')?.addEventListener('click',()=>standaloneFor(currentPatient()));

 // v1.0.8: shortcut antiguo retirado. Nueva receta usa exclusivamente el selector Rx independiente.

 // Capture prescription submit for edit / standalone / linked-from-history.
 $('prescriptionForm')?.addEventListener('submit',async e=>{
   if(!rxMode)return;
   e.preventDefault();e.stopImmediatePropagation();
   const p=currentPatient()||selectedPatient;if(!p?.id){alert('No se identificó al paciente.');return}
   const items=[...document.querySelectorAll('.medication-card')].map((c,i)=>({
    medication_name:c.querySelector('.med-name')?.value.trim()||null,presentation:c.querySelector('.med-presentation')?.value.trim()||null,
    dose:c.querySelector('.med-dose')?.value.trim()||null,route:c.querySelector('.med-route')?.value||null,frequency:c.querySelector('.med-frequency')?.value.trim()||null,
    duration:c.querySelector('.med-duration')?.value.trim()||null,instructions:c.querySelector('.med-instructions')?.value.trim()||null,item_order:i+1
   })).filter(x=>x.medication_name||x.presentation||x.dose||x.instructions);
   const general=$('prescriptionGeneralInstructions').value.trim()||null;
   try{
     if(rxMode.type==='edit'){
       const id=rxMode.rx.id;
       await req('prescriptions?id=eq.'+encodeURIComponent(id),{method:'PATCH',rep:true,body:JSON.stringify({general_instructions:general,updated_at:new Date().toISOString()})});
       await req('prescription_items?prescription_id=eq.'+encodeURIComponent(id),{method:'DELETE'});
       if(items.length)await req('prescription_items',{method:'POST',body:JSON.stringify(items.map(x=>({...x,prescription_id:id})))});
       alert('Receta actualizada correctamente. Ya puedes volver a imprimirla.');
     }else{
       const cid=rxMode.type==='new-linked'?rxMode.consultationId:null;
       const code=$('prescriptionCode').textContent;
       const rows=await req('prescriptions',{method:'POST',rep:true,body:JSON.stringify({patient_id:p.id,consultation_id:cid,prescription_code:code,diagnosis:cid?(modalConsultation?.diagnosis||null):null,general_instructions:general})});
       const rx=rows?.[0];if(!rx?.id)throw Error('No se recibió el identificador de la receta.');
       if(items.length)await req('prescription_items',{method:'POST',body:JSON.stringify(items.map(x=>({...x,prescription_id:rx.id})))});
       alert(cid?'Receta guardada correctamente.':'Receta independiente guardada correctamente.');
     }
     rxMode=null;$('patientsNavBtn')?.click();
   }catch(err){console.error(err);alert('No se pudo guardar la receta: '+err.message)}
 },true);
});


/* v1.0.2 — APERTURA ROBUSTA DE RECETA */
document.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id);
 function patient(){
   const id=sessionStorage.getItem('medicoAmigoCurrentPatientId')||(window.state&&state.currentPatientId);
   let a=[];try{a=JSON.parse(sessionStorage.getItem('medicoAmigoPatients')||'[]')}catch{}
   return a.find(x=>x.id===id)||window.detailPatient||null;
 }
 function openRx(p,consultation=null){
   if(!p?.id){alert('No se pudo identificar al paciente. Vuelve a abrir su ficha.');return}
   window.selectedPatient=p;
   window.currentConsultation=consultation||{id:null,diagnosis:'',indications:''};
   const set=(id,t)=>{const e=$(id);if(e)e.textContent=t||''};
   set('prescriptionPatientName',p.name);set('prescriptionSelectedName',p.name);
   set('prescriptionSelectedMeta',[p.ci?'CI: '+p.ci:'Sin documento',p.meta].filter(Boolean).join(' · '));
   set('prescriptionAvatar',(p.name||'P').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase());
   set('prescriptionDiagnosis',consultation?.diagnosis||'Receta independiente');
   set('prescriptionCode','RX-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+String(Date.now()).slice(-5));
   if($('prescriptionGeneralInstructions'))$('prescriptionGeneralInstructions').value=consultation?.plan||consultation?.indications||'';
   if($('medicationsList')){$('medicationsList').innerHTML=''; if(typeof window.addMedication==='function')window.addMedication()}
   if(typeof window.show==='function')window.show($('prescriptionScreen'));else{$('prescriptionScreen')?.classList.remove('hidden');$('patientDetailScreen')?.classList.add('hidden')}
   sessionStorage.setItem('medicoAmigoRxStandalone',JSON.stringify({patientId:p.id,consultationId:consultation?.id||null}));
 }
 document.addEventListener('click',e=>{
   const b=e.target.closest('#standalonePrescriptionFromDetailBtn');
   if(!b)return;
   e.preventDefault();e.stopImmediatePropagation();openRx(patient(),null);
 },true);
});


/* ============================================================
   v1.0.3 — NAVEGACIÓN EXCLUSIVA
   Garantiza que nunca queden Pacientes + Editar (u otras) visibles a la vez.
============================================================ */
(function(){
 const SCREEN_IDS=[
  'loginScreen','homeScreen','patientsScreen','patientFormScreen','patientDetailScreen',
  'editPatientScreen','consultationScreen','prescriptionScreen','paymentScreen','settingsScreen'
 ];
 const oldShow=window.show;
 window.show=function(target){
   if(!target)return;
   SCREEN_IDS.forEach(id=>{
     const el=document.getElementById(id);
     if(el && el!==target) el.classList.add('hidden');
   });
   target.classList.remove('hidden');
   target.style.removeProperty('display');
   window.scrollTo({top:0,left:0,behavior:'auto'});
 };
 document.addEventListener('click',e=>{
   // Al abrir Editar paciente, ocultar explícitamente la lista y detalle antes del handler legado.
   if(e.target.closest('#editPatientBtn')){
     ['patientsScreen','patientDetailScreen'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));
   }
 },true);
})();


/* ============================================================
   v1.0.8 — RECETA INDEPENDIENTE: ÚNICO GUARDADO AUTORIZADO
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const BASE='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const SESSION='medico_amigo_supabase_session';
 const $=id=>document.getElementById(id);
 const session=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}};
 const hdr=(prefer=false)=>{const a=session();if(!a?.access_token)throw Error('Sesión no válida.');const h={apikey:KEY,Authorization:'Bearer '+a.access_token,'Content-Type':'application/json'};if(prefer)h.Prefer='return=representation';return h};
 async function api(path,opt={}){
   const r=await fetch(BASE+'/rest/v1/'+path,{...opt,headers:{...hdr(opt.prefer),...(opt.headers||{})}});
   const raw=await r.text();let d=null;try{d=raw?JSON.parse(raw):null}catch{d=raw}
   if(!r.ok)throw Error(d?.message||raw||('HTTP '+r.status)); return d;
 }
 function getPatient(marker){
   let a=[];try{a=JSON.parse(sessionStorage.getItem('medicoAmigoPatients')||'[]')}catch{}
   return a.find(x=>x.id===marker?.patientId)||window.selectedPatient||window.detailPatient||null;
 }
 function items(){
   return [...document.querySelectorAll('#medicationsList .medication-card')].map((c,i)=>({
    medication_name:c.querySelector('.med-name')?.value?.trim()||null,
    presentation:c.querySelector('.med-presentation')?.value?.trim()||null,
    dose:c.querySelector('.med-dose')?.value?.trim()||null,
    route:c.querySelector('.med-route')?.value||null,
    frequency:c.querySelector('.med-frequency')?.value?.trim()||null,
    duration:c.querySelector('.med-duration')?.value?.trim()||null,
    instructions:c.querySelector('.med-instructions')?.value?.trim()||null,
    item_order:i+1
   })).filter(x=>x.medication_name||x.presentation||x.dose||x.instructions);
 }
 const form=$('prescriptionForm');
 form?.addEventListener('submit',async e=>{
   let marker=null;try{marker=JSON.parse(sessionStorage.getItem('medicoAmigoRxStandalone')||'null')}catch{}
   if(!marker || marker.consultationId)return; // receta ligada a consulta: usa el flujo clínico normal

   e.preventDefault(); e.stopImmediatePropagation();

   const p=getPatient(marker);
   if(!p?.id){alert('No se pudo identificar al paciente de esta receta.');return}
   const meds=items();
   if(!meds.length){alert('Agrega al menos un medicamento.');return}

   // Reservar la ventana AHORA, mientras el clic del usuario sigue activo.
   // Así Chrome/Safari no la bloquean después del await de Supabase.
   const previewWindow=window.open('','_blank');
   if(previewWindow){
     previewWindow.document.write('<!doctype html><title>Generando receta…</title><body style="font-family:Arial;padding:40px;color:#17324d">Generando receta médica…</body>');
     previewWindow.document.close();
   }

   const btn=e.submitter||form.querySelector('button[type="submit"]');
   const old=btn?.textContent||'GUARDAR Y CONTINUAR →';
   if(btn){btn.disabled=true;btn.textContent='GUARDANDO…'}

   try{
     const a=window.medicoAmigoEnsureSession?await window.medicoAmigoEnsureSession(false):session();
     if(!a?.access_token||!a?.user?.id)throw Error('Tu sesión venció. Vuelve a iniciar sesión.');
     const makeCode=()=>`RX-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random()).replaceAll('-','').replace('.','').slice(-12).toUpperCase()}`;
     let code=makeCode();if($('prescriptionCode'))$('prescriptionCode').textContent=code;
     const general=$('prescriptionGeneralInstructions')?.value?.trim()||null;
     const insertRx=()=>api('prescriptions',{method:'POST',prefer:true,body:JSON.stringify({doctor_id:a.user.id,patient_id:p.id,consultation_id:null,prescription_code:code,diagnosis:'Receta independiente',general_instructions:general})});
     let rows;try{rows=await insertRx()}catch(err){if(/duplicate|unique|prescription_code/i.test(err.message)){code=makeCode();if($('prescriptionCode'))$('prescriptionCode').textContent=code;rows=await insertRx()}else throw err}
     const rx=rows?.[0]; if(!rx?.id)throw Error('Supabase no confirmó el registro de la receta.');
     await api('prescription_items',{method:'POST',prefer:true,body:JSON.stringify(
       meds.map(x=>({...x,doctor_id:a.user.id,prescription_id:rx.id}))
     )});

     // Mantener contexto hasta DESPUÉS de construir el documento profesional.
     window.selectedPatient={...p,meta:p.meta||[p.ci?'CI: '+p.ci:'',p.phone,p.sex].filter(Boolean).join(' · ')};
     window.currentConsultation={id:null,diagnosis:'Receta independiente',indications:general||'',meta:{}};
     if(typeof window.medicoAmigoPrintPrescription==='function'){
       window.medicoAmigoPrintPrescription(previewWindow);
     }else if(previewWindow){
       previewWindow.close();
       alert('Receta guardada. Pulsa “VISTA PREVIA / PDF” para verla.');
     }

     sessionStorage.removeItem('medicoAmigoRxStandalone');
     alert('Receta independiente guardada correctamente.');
   }catch(err){
     if(previewWindow&&!previewWindow.closed)previewWindow.close();
     console.error(err);
     alert('No se pudo guardar la receta: '+err.message);
   }finally{
     if(btn){btn.disabled=false;btn.textContent=old}
   }
 },true);
});

/* ============================================================
   v1.0.4 — FLUJO DE PANTALLAS Y RETORNO DESDE EDICIÓN
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id);
 const allScreens=()=>document.querySelectorAll(
   '#loginScreen,#homeScreen,#patientScreen,#newPatientScreen,#consultationScreen,#prescriptionScreen,#paymentScreen,#patientsScreen,#patientDetailScreen,#editPatientScreen,#settingsScreen'
 );
 function only(id){
   allScreens().forEach(x=>x.classList.add('hidden'));
   $(id)?.classList.remove('hidden');
   window.scrollTo({top:0,left:0,behavior:'auto'});
 }
 // Edit patient: the old module has its own private show(), so enforce exclusivity after it runs.
 $('editPatientBtn')?.addEventListener('click',()=>setTimeout(()=>only('editPatientScreen'),0));
 // Back from edit patient must return to the same patient's detail, not reopen/list beside it.
 $('editPatientBackBtn')?.addEventListener('click',e=>{
   e.preventDefault();e.stopImmediatePropagation();only('patientDetailScreen');
 },true);
 $('cancelEditPatientBtn')?.addEventListener('click',e=>{
   e.preventDefault();e.stopImmediatePropagation();only('patientDetailScreen');
 },true);

 // When a historical consultation is being corrected, Back returns to patient detail.
 const backFromConsult=e=>{
   if(!sessionStorage.getItem('medicoAmigoEditingConsultation'))return;
   e.preventDefault();e.stopImmediatePropagation();
   sessionStorage.removeItem('medicoAmigoEditingConsultation');
   const form=$('consultationForm'); form?.reset();
   const b=form?.querySelector('button[type="submit"]'); if(b)b.textContent='GUARDAR Y CONTINUAR →';
   only('patientDetailScreen');
 };
 $('backToPatientsBtn')?.addEventListener('click',backFromConsult,true);
 $('cancelConsultationBtn')?.addEventListener('click',backFromConsult,true);

 // Defensive cleanup when navigating to the directory/home.
 $('patientsNavBtn')?.addEventListener('click',()=>setTimeout(()=>only('patientsScreen'),0));
 $('backHomeBtn')?.addEventListener('click',()=>setTimeout(()=>only('homeScreen'),0));
});


/* v1.0.8: módulo v1.0.5 retirado por conflicto de navegación. */

/* ============================================================
   v1.0.12 — RENOVACIÓN AUTOMÁTICA DE SESIÓN SUPABASE
   Evita "JWT expired" al dejar Médico Amigo abierto.
============================================================ */
(()=>{
 const BASE='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const STORAGE='medico_amigo_supabase_session';
 let refreshing=null;

 const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'null')}catch{return null}};
 const write=x=>{if(x)localStorage.setItem(STORAGE,JSON.stringify(x))};
 const expiring=(x,margin=90)=>{
   if(!x?.access_token)return true;
   try{
     const payload=JSON.parse(atob(x.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
     return !payload.exp || (payload.exp*1000-Date.now()) < margin*1000;
   }catch{return true}
 };

 async function renew(force=false){
   const cur=read();
   if(!cur?.refresh_token)throw new Error('SESSION_RELOGIN');
   if(!force && !expiring(cur))return cur;
   if(refreshing)return refreshing;
   refreshing=(async()=>{
     const r=await fetch(BASE+'/auth/v1/token?grant_type=refresh_token',{
       method:'POST',
       headers:{apikey:KEY,'Content-Type':'application/json'},
       body:JSON.stringify({refresh_token:cur.refresh_token})
     });
     const data=await r.json().catch(()=>null);
     if(!r.ok || !data?.access_token)throw new Error('SESSION_RELOGIN');
     const next={...cur,...data,user:data.user||cur.user};
     write(next);
     return next;
   })().finally(()=>refreshing=null);
   return refreshing;
 }
 window.medicoAmigoEnsureSession=renew;

 // Refresh proactively while the app remains open and whenever the user returns to it.
 setInterval(()=>renew(false).catch(()=>{}),4*60*1000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)renew(false).catch(()=>{})});
 window.addEventListener('focus',()=>renew(false).catch(()=>{}));

 // Protect all Supabase REST/Storage requests. If Supabase says JWT expired,
 // renew once and transparently retry the original request.
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async function(input,init={}){
   const url=typeof input==='string'?input:(input?.url||'');
   const protectedCall=url.startsWith(BASE+'/rest/v1/') || url.startsWith(BASE+'/storage/v1/');
   if(!protectedCall)return nativeFetch(input,init);

   let cur;
   try{cur=await renew(false)}catch(e){cur=read()}
   const makeInit=(token)=>{
     const headers=new Headers(init.headers || (typeof input!=='string' ? input.headers : undefined) || {});
     if(token?.access_token)headers.set('Authorization','Bearer '+token.access_token);
     if(!headers.has('apikey'))headers.set('apikey',KEY);
     return {...init,headers};
   };

   let response=await nativeFetch(input,makeInit(cur));
   if(response.status===401){
     const probe=response.clone();
     const msg=await probe.text().catch(()=>'');
     if(/jwt.*expired|token.*expired|invalid.*jwt/i.test(msg)){
       try{
         cur=await renew(true);
         response=await nativeFetch(input,makeInit(cur));
       }catch(e){
         // Keep the 401 response path predictable for the caller.
         throw new Error('Tu sesión venció y no pudo renovarse. Cierra sesión e inicia nuevamente.');
       }
     }
   }
   return response;
 };
})(); 

/* ============================================================
   v1.0.9 — NUEVA RECETA: PACIENTE EXISTENTE O NUEVO
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id);
 const BASE='https://kdjvsbiqjpztdugewuve.supabase.co';
 const KEY='sb_publishable_wKlqLyUpXL41rpCDA-6aJQ_u4JYqlVp';
 const SESSION='medico_amigo_supabase_session';
 const sess=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch{return null}};
 const patients=()=>{try{return JSON.parse(sessionStorage.getItem('medicoAmigoPatients')||'[]')}catch{return []}};
 const close=()=>document.getElementById('rxPickerOverlay')?.remove();
 const rxCode=()=>{const d=new Date().toISOString().slice(0,10).replaceAll('-','');const u=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random()).replaceAll('-','').replace('.','').slice(-12).toUpperCase();return `RX-${d}-${u}`};

 function openRx(p){
   if(!p?.id){alert('No se pudo identificar al paciente.');return}
   p={...p,meta:p.meta||[p.ci?'CI: '+p.ci:'',p.phone,p.sex].filter(Boolean).join(' · ')};
   close();
   sessionStorage.setItem('medicoAmigoCurrentPatientId',p.id);
   sessionStorage.setItem('medicoAmigoRxStandalone',JSON.stringify({patientId:p.id,consultationId:null}));
   window.selectedPatient=p;
   window.currentConsultation={id:null,diagnosis:'Receta independiente',indications:''};
   const put=(id,v)=>{if($(id))$(id).textContent=v||''};
   put('prescriptionPatientName',p.name);put('prescriptionSelectedName',p.name);
   put('prescriptionSelectedMeta',[p.ci?'CI: '+p.ci:'Sin documento',p.phone].filter(Boolean).join(' · '));
   put('prescriptionAvatar',(p.name||'P').split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase());
   put('prescriptionDiagnosis','Receta independiente');put('prescriptionCode',rxCode());
   if($('prescriptionGeneralInstructions'))$('prescriptionGeneralInstructions').value='';
   if($('medicationsList')){$('medicationsList').innerHTML='';$('addMedicationBtn')?.click()}
   document.querySelectorAll('#loginScreen,#homeScreen,#patientScreen,#newPatientScreen,#consultationScreen,#paymentScreen,#patientsScreen,#patientDetailScreen,#editPatientScreen,#settingsScreen').forEach(x=>x.classList.add('hidden'));
   $('prescriptionScreen')?.classList.remove('hidden');window.scrollTo(0,0);
 }

 async function saveQuick(form){
   const a=window.medicoAmigoEnsureSession?await window.medicoAmigoEnsureSession(false):sess();
   if(!a?.access_token||!a?.user?.id)throw Error('Sesión no válida.');
   const fd=new FormData(form), body={
     doctor_id:a.user.id,full_name:(fd.get('full_name')||'').trim(),
     document_number:(fd.get('document_number')||'').trim()||null,
     birth_date:(fd.get('birth_date')||'').trim()||null,
     sex:(fd.get('sex')||'').trim()||null,phone:(fd.get('phone')||'').trim()||null
   };
   if(!body.full_name)throw Error('Ingresa el nombre completo.');
   const r=await fetch(BASE+'/rest/v1/patients',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+a.access_token,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(body)});
   const raw=await r.text();let d;try{d=JSON.parse(raw)}catch{d=raw}
   if(!r.ok){if(r.status===409)throw Error('Ese CI/documento ya está registrado. Búscalo en la lista.');throw Error(d?.message||raw)}
   const x=d?.[0];if(!x?.id)throw Error('No se confirmó el registro.');
   const p={id:x.id,name:x.full_name,ci:x.document_number||'',phone:x.phone||'',sex:x.sex||'',birth_date:x.birth_date||'',meta:[x.document_number?'CI: '+x.document_number:'',x.phone,x.sex].filter(Boolean).join(' · ')};
   const arr=patients();arr.unshift(p);sessionStorage.setItem('medicoAmigoPatients',JSON.stringify(arr));return p;
 }

 function quickNew(){
   const c=document.querySelector('#rxPickerOverlay .rx-picker-card');if(!c)return;
   c.innerHTML=`<div class="rx-picker-head"><div><strong>Paciente nuevo</strong><span>Registro rápido para la receta</span></div><button type="button" id="rxPickerClose">×</button></div>
   <form id="rxQuickPatientForm" class="rx-quick-form">
    <label>Nombre completo *<input name="full_name" required></label>
    <div class="rx-quick-grid"><label>CI / Documento<input name="document_number"></label><label>Fecha de nacimiento<input type="date" name="birth_date"></label><label>Sexo<select name="sex"><option value="">Seleccionar</option><option>Masculino</option><option>Femenino</option><option>Otro</option></select></label><label>Teléfono / WhatsApp<input name="phone" inputmode="tel"></label></div>
    <p class="rx-quick-note">Podrás completar el resto de la ficha clínica posteriormente.</p>
    <div class="rx-quick-actions"><button type="button" id="rxQuickBack" class="rx-secondary">← VOLVER</button><button type="submit" class="rx-primary">GUARDAR Y GENERAR RECETA →</button></div>
   </form>`;
   $('rxPickerClose').onclick=close;$('rxQuickBack').onclick=picker;
   $('rxQuickPatientForm').onsubmit=async e=>{e.preventDefault();const b=e.submitter,old=b.textContent;b.disabled=true;b.textContent='GUARDANDO…';try{openRx(await saveQuick(e.currentTarget))}catch(err){alert(err.message)}finally{b.disabled=false;b.textContent=old}};
 }

 function picker(){
   close();const data=patients(),o=document.createElement('div');o.id='rxPickerOverlay';
   o.innerHTML=`<div class="rx-picker-card"><div class="rx-picker-head"><div><strong>Nueva receta</strong><span>Selecciona o registra al paciente</span></div><button type="button" id="rxPickerClose">×</button></div><div class="rx-picker-body"><button type="button" id="rxNewPatientBtn" class="rx-new-patient">＋ NUEVO PACIENTE <small>Registrar y generar receta sin consulta</small></button><div class="rx-picker-search"><span>⌕</span><input id="rxPickerSearch" type="search" placeholder="Nombre, CI o teléfono"></div><div id="rxPickerList" class="rx-picker-list"></div></div></div>`;
   document.body.appendChild(o);const list=$('rxPickerList');
   const draw=q=>{q=(q||'').toLowerCase().trim();const rows=data.filter(p=>!q||[p.name,p.ci,p.phone].some(v=>String(v||'').toLowerCase().includes(q)));list.innerHTML='';if(!rows.length){list.innerHTML='<div class="rx-picker-empty">No se encontraron pacientes.</div>';return}rows.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='rx-picker-patient';const i=(p.name||'P').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();b.innerHTML=`<span class="rx-picker-avatar">${escapeHtml(i)}</span><span><b>${escapeHtml(p.name)}</b><small>CI: ${escapeHtml(p.ci||'—')}${p.phone?' · '+escapeHtml(p.phone):''}</small></span><i>›</i>`;b.onclick=()=>openRx(p);list.appendChild(b)})};
   draw('');$('rxPickerSearch').oninput=e=>draw(e.target.value);$('rxPickerClose').onclick=close;$('rxNewPatientBtn').onclick=quickNew;
 }
 window.medicoAmigoOpenRxPicker=picker;
 $('quickPrescriptionBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();picker()},true);
});


/* v1.0.8 — Volver desde receta independiente no debe abrir Consulta */
document.addEventListener('DOMContentLoaded',()=>{
 const back=e=>{
   let m=null;try{m=JSON.parse(sessionStorage.getItem('medicoAmigoRxStandalone')||'null')}catch{}
   if(!m || m.consultationId)return;
   e.preventDefault();e.stopImmediatePropagation();
   sessionStorage.removeItem('medicoAmigoRxStandalone');
   document.querySelectorAll('#loginScreen,#homeScreen,#patientScreen,#newPatientScreen,#consultationScreen,#prescriptionScreen,#paymentScreen,#patientsScreen,#patientDetailScreen,#editPatientScreen,#settingsScreen')
     .forEach(x=>x.classList.add('hidden'));
   document.getElementById('homeScreen')?.classList.remove('hidden');
   window.scrollTo(0,0);
 };
 document.getElementById('backToConsultationBtn')?.addEventListener('click',back,true);
 document.getElementById('prescriptionBackBtn')?.addEventListener('click',back,true);
});
