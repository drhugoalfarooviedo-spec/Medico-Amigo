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
function prescriptionPrint(){
 const list=meds(),p=selectedPatient,c=currentConsultation,code=$('prescriptionCode').textContent;
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
 const w=window.open('','_blank');
 if(!w){alert('El navegador bloqueó la vista previa. Habilita ventanas emergentes para generar la receta.');return}
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Receta ${escapeHtml(code)}</title><style>
 *{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;background:#edf3f7;color:#17324d;padding:28px 16px}.toolbar{max-width:210mm;margin:0 auto 14px;display:flex;justify-content:flex-end}.print-btn{border:0;border-radius:10px;background:#073b66;color:#fff;padding:11px 18px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(5,44,77,.18)}.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:17mm 18mm 15mm;box-shadow:0 12px 35px rgba(5,44,77,.13);position:relative}.head{border-bottom:3px solid #08a6bd;padding-bottom:12px;display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.brand{font-size:25px;font-weight:800;letter-spacing:.2px;color:#073b66}.brand span{color:#08a6bd}.tag{font-size:9px;font-weight:700;letter-spacing:1px;color:#4f7188;margin-top:3px}.doctor{text-align:right;font-size:10.5px;line-height:1.45;min-width:180px}.doctor b{font-size:13px;color:#073b66}.patient-box{margin:16px 0 13px;padding:12px 14px;border:1px solid #dbe5ed;border-radius:10px;background:#fbfdfe;display:grid;grid-template-columns:1fr auto;gap:20px;font-size:10.5px;line-height:1.55}.patient-box .right{text-align:right}.diagnosis{margin:13px 0 18px;font-size:11.5px;line-height:1.5}.section-title{font-size:17px;color:#073b66;margin:0 0 6px}.rx{padding:11px 0;border-bottom:1px solid #e6edf2}.rx-title{display:flex;align-items:baseline;gap:6px}.rx-title span{font-size:12px;font-weight:700}.rx-title b{font-size:14px;color:#052c4d}.rx-title em{font-size:10.5px;color:#61788a;font-style:normal}.rx-dose{font-size:11.5px;margin:5px 0 0 18px;line-height:1.5}.rx-note{font-size:10.5px;color:#5f7282;margin:4px 0 0 18px;line-height:1.45}.empty-rx{font-size:11px;color:#6f8294;padding:12px 0}.instructions-block{margin-top:20px}.instructions{white-space:pre-wrap;font-size:11.5px;line-height:1.6;padding-top:3px}.signature-area{margin-top:42px;display:flex;justify-content:flex-end}.signature-box{width:230px;text-align:center}.signature-placeholder{height:48px;display:flex;align-items:flex-end;justify-content:center;color:#8da0ae;font-size:9px}.signature-line{border-top:1px solid #60788a;padding-top:6px;font-size:10px;line-height:1.4}.signature-line b{font-size:11.5px;color:#073b66}.footer{position:absolute;left:18mm;right:18mm;bottom:12mm;border-top:1px solid #dbe5ed;padding-top:7px;font-size:8px;color:#8193a1;display:flex;justify-content:space-between}.legal-note{font-size:8px;color:#94a4af;text-align:center;margin-top:7px}@page{size:A4;margin:0}@media(max-width:850px){body{padding:12px 0}.toolbar{padding:0 12px}.page{width:100%;min-height:0;padding:22px 18px;box-shadow:none}.footer{position:static;margin-top:35px}.patient-box{grid-template-columns:1fr}.patient-box .right{text-align:left}}@media print{body{background:#fff;padding:0}.toolbar{display:none}.page{width:210mm;min-height:297mm;margin:0;padding:17mm 18mm 15mm;box-shadow:none}.footer{position:absolute;left:18mm;right:18mm;bottom:12mm}.patient-box{grid-template-columns:1fr auto}.patient-box .right{text-align:right}}
 </style></head><body><div class="toolbar"><button class="print-btn" onclick="window.print()">Descargar / imprimir PDF</button></div><main class="page"><header class="head"><div><div class="brand">MÉDICO <span>AMIGO</span></div><div class="tag">ATENCIÓN MÉDICA INTEGRAL</div></div><div class="doctor"><b>${escapeHtml(cfg.name)}</b><br>${escapeHtml(cfg.specialty)}<br>Registro profesional: ${escapeHtml(cfg.registration)}${cfg.phone?'<br>Tel. '+escapeHtml(cfg.phone):''}</div></header><section class="patient-box"><div><b>Paciente:</b> ${escapeHtml(p.name)}<br><b>CI:</b> ${escapeHtml(p.ci||'No registrado')}${age?'<br><b>Edad:</b> '+escapeHtml(age):''}</div><div class="right"><b>Fecha:</b> ${escapeHtml(when)}<br><b>Receta:</b> ${escapeHtml(code)}</div></section><div class="diagnosis"><b>Diagnóstico / impresión clínica:</b> ${escapeHtml(c.diagnosis)}</div><h2 class="section-title">Rp/</h2>${medsHtml}<section class="instructions-block"><h2 class="section-title">Indicaciones generales</h2><div class="instructions">${escapeHtml($('prescriptionGeneralInstructions').value||'Sin indicaciones adicionales.')}</div></section><div class="signature-area"><div class="signature-box">${signatureHtml}<div class="signature-line"><b>${escapeHtml(cfg.name)}</b><br>${escapeHtml(cfg.specialty)}<br>Registro profesional: ${escapeHtml(cfg.registration)}</div><div class="legal-note">${cfg.signature?'Firma cargada en la configuración del médico.':'Sin imagen de firma cargada.'}</div></div></div><footer class="footer"><span>${escapeHtml(code)}</span><span>Generado por Médico Amigo</span></footer></main></body></html>`);
 w.document.close();
} 
$('previewPrescriptionBtn').onclick=prescriptionPrint;
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
     clearMsg();screen(home);
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
   localStorage.removeItem(SESSION);screen(login);clearMsg();
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
   return {p,cs:cs||[],cfg};
 }
 function body({p,cs,cfg}){
   const blocks=cs.length?cs.map((c,i)=>`<section><h3>Consulta ${cs.length-i} — ${esc(fmt(c.date))}</h3>
<p><b>Motivo de consulta:</b> ${esc(c.reason||'No registrado')}</p>
<p><b>Enfermedad actual:</b> ${esc(c.illness||'No registrado')}</p>
<p><b>Antecedentes relevantes:</b> ${esc(c.history||'No registrado')}</p>
<p><b>Signos vitales:</b> PA ${esc(c.bp||'—')} · FC ${esc(c.hr??'—')} · SpO₂ ${esc(c.spo2??'—')} · T° ${esc(c.temp??'—')} · FR ${esc(c.rr??'—')} · Peso ${esc(c.weight??'—')} · Talla ${esc(c.height??'—')}</p>
<p><b>Examen físico:</b> ${esc(c.exam||'No registrado')}</p>
<p><b>Estudios complementarios revisados:</b> ${esc(c.studies||'No registrado')}</p>
<p><b>Diagnóstico / impresión:</b> ${esc(c.diagnosis||'No registrado')}</p>
<p><b>Indicaciones:</b> ${esc(c.plan||'No registrado')}</p>
<p><b>Observaciones:</b> ${esc(c.notes||'No registrado')}</p>
<p><b>Seguimiento:</b> ${esc(c.followUp||'No registrado')}</p></section>`).join(''):`<section><h3>Historial de consultas</h3><p>Sin consultas registradas.</p></section>`;
   return `<header><h1>MÉDICO AMIGO</h1><div>ATENCIÓN MÉDICA INTEGRAL</div></header>
<h2>Historia clínica</h2>
<div class="box"><b>Paciente:</b> ${esc(p.name)}<br><b>CI / Documento:</b> ${esc(p.ci||'No registrado')}<br><b>Edad:</b> ${esc(p.age!=null?p.age+' años':'No registrada')}<br><b>Sexo:</b> ${esc(p.sex||'No registrado')}<br><b>Teléfono:</b> ${esc(p.phone||'No registrado')}<br><b>Dirección:</b> ${esc(p.address||'No registrada')}</div>
<h3>Información médica</h3>
<div class="box"><b>Antecedentes personales patológicos:</b> ${esc(p.pathologicalHistory||p.history||'No registrado')}<br><b>Antecedentes personales no patológicos:</b> ${esc(p.nonPathologicalHistory||'No registrado')}<br><b>Antecedentes heredofamiliares:</b> ${esc(p.familyHistory||'No registrado')}${/femen/i.test(p.sex||'')?'<br><b>Antecedentes gineco-obstétricos:</b> '+esc(window.formatGyneHistory125?.(p.gyneHistory)||'No registrado'):''}<br><b>Alergias:</b> ${esc(p.allergies||'No registrado')}<br><b>Medicación habitual:</b> ${esc(p.medication||p.meds||'No registrado')}<br><b>Observaciones:</b> ${esc(p.observations||p.obs||'No registrado')}</div>
${blocks}
<div class="foot"><b>${esc(cfg.name||'Médico')}</b><br>${esc(cfg.specialty||'')}<br>${cfg.registration?'Matrícula profesional: '+esc(cfg.registration)+'<br>':''}<br>_____________________________<br>Firma y sello</div>`;
 }
 function doc(inner,autoPrint=false){
   return `<!doctype html><html><head><meta charset="utf-8"><title>Historia clínica</title><style>
@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#17344a;max-width:800px;margin:0 auto;padding:12px}header{text-align:center;border-bottom:2px solid #0b789b;padding-bottom:12px}h1{margin:0;color:#073f68}h2{font-size:18px}h3{font-size:14px;color:#087d9e;border-bottom:1px solid #ccdce4;padding-bottom:6px}section{page-break-inside:avoid;margin:20px 0}p{line-height:1.5;white-space:pre-wrap}.box{background:#f5f9fb;padding:12px;border-radius:8px;line-height:1.7}.foot{margin-top:38px;text-align:center}</style></head><body>${inner}${autoPrint?'<script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script>':''}</body></html>`;
 }
 async function download(){
   try{
     const d=await data(), content=doc(body(d),false);
     const blob=new Blob([content],{type:'text/html;charset=utf-8'});
     const a=document.createElement('a');a.href=URL.createObjectURL(blob);
     const safe=(d.p.name||'paciente').replace(/[^\p{L}\p{N}]+/gu,'_').replace(/^_+|_+$/g,'');
     a.download='Historia_Clinica_'+safe+'.html';
     document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
   }catch(e){alert('No se pudo descargar la historia clínica: '+e.message)}
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
   const d=document.createElement('button');d.type='button';d.className='primary-button';d.textContent='⬇ DESCARGAR HISTORIA CLÍNICA';d.onclick=download;
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
     card.innerHTML=`<div class="patient-avatar">${initials}</div><div class="patient-card-info"><strong>${p.name}</strong><span>CI: ${p.ci||'—'} · ${p.phone||'—'}</span><small>${p.meta||''}</small></div><span class="consult-count">0 consultas</span><span class="chevron">›</span>`;
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
     const objectUrl=URL.createObjectURL(await r.blob());
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
