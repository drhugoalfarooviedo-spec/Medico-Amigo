document.addEventListener('DOMContentLoaded',()=>{
const $=id=>document.getElementById(id),screens=[$('loginScreen'),$('homeScreen'),$('patientScreen'),$('newPatientScreen'),$('consultationScreen'),$('prescriptionScreen'),$('paymentScreen'),$('patientsScreen'),$('patientDetailScreen')];let selectedPatient=null,currentConsultation=null,currentPrescription=null;
const show=s=>{screens.forEach(x=>x.classList.add('hidden'));s.classList.remove('hidden');scrollTo(0,0)};
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const cards=()=>document.querySelectorAll('.patient-result');
$('loginForm').onsubmit=e=>{e.preventDefault();show($('homeScreen'))};function openPatients(){show($('patientScreen'));$('patientSearchInput').value='';filter();setTimeout(()=>$('patientSearchInput').focus(),100)}
$('newConsultationBtn').onclick=openPatients;$('searchPatientBtn').onclick=openPatients;$('backHomeBtn').onclick=()=>show($('homeScreen'));
function filter(){const q=normalize($('patientSearchInput').value.trim());let n=0;cards().forEach(c=>{const ok=[c.dataset.name,c.dataset.ci,c.dataset.phone].some(v=>normalize(v).includes(q));c.style.display=ok?'flex':'none';if(ok)n++});$('patientResults').classList.toggle('hidden',n===0);$('noPatientResults').classList.toggle('hidden',n!==0)}$('patientSearchInput').oninput=filter;
function patientFromCard(c){const small=c.querySelector('.patient-info small')?.textContent||'';return{name:c.querySelector('.patient-info strong').textContent.trim(),ci:c.dataset.ci||'',phone:c.dataset.phone||'',meta:small,history:c.dataset.history||'',allergies:c.dataset.allergies||'',medication:c.dataset.medication||''}}
function select(c){selectedPatient=patientFromCard(c);openConsultation()}function bind(c){c.onclick=()=>select(c)}cards().forEach(bind);
function openConsultation(){if(!selectedPatient)return;const p=selectedPatient;$('consultationPatientName').textContent=p.name;$('selectedPatientName').textContent=p.name;$('selectedPatientMeta').textContent=[p.ci?'CI: '+p.ci:'Sin documento',p.meta].filter(Boolean).join(' · ');$('consultationAvatar').textContent=initials(p.name);$('consultationDateTime').textContent=new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short'}).format(new Date());const items=[];if(p.history)items.push(['Antecedentes',p.history]);if(p.allergies)items.push(['Alergias',p.allergies]);if(p.medication)items.push(['Medicación habitual',p.medication]);$('clinicalSummaryContent').innerHTML='';items.forEach(([a,b])=>{const d=document.createElement('div');d.className='clinical-item';const s=document.createElement('strong');s.textContent=a;const t=document.createElement('span');t.textContent=b;d.append(s,t);$('clinicalSummaryContent').appendChild(d)});$('patientClinicalSummary').classList.toggle('hidden',items.length===0);show($('consultationScreen'))}
$('backToPatientsBtn').onclick=$('cancelConsultationBtn').onclick=()=>show($('patientScreen'));
$('registerPatientBtn').onclick=()=>{$('newPatientForm').reset();$('calculatedAge').classList.add('hidden');$('formMessage').className='form-message hidden';show($('newPatientScreen'));setTimeout(()=>$('patientFullName').focus(),100)};$('backPatientSearchBtn').onclick=$('cancelNewPatientBtn').onclick=()=>show($('patientScreen'));
const birth=$('patientBirthDate');birth.max=new Date().toISOString().split('T')[0];function age(){if(!birth.value){$('calculatedAge').classList.add('hidden');return null}const b=new Date(birth.value+'T00:00:00'),t=new Date();if(isNaN(b)||b>t||b.getFullYear()<1900){$('calculatedAge').classList.add('hidden');return null}let a=t.getFullYear()-b.getFullYear();if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))a--;$('ageValue').textContent=a+(a===1?' año':' años');$('calculatedAge').classList.remove('hidden');return a}birth.onchange=age;
function initials(n){const w=n.trim().split(/\s+/);return((w[0]?.[0]||'P')+(w[1]?.[0]||'')).toUpperCase()}function msg(t){const m=$('formMessage');m.textContent=t;m.className='form-message error';m.scrollIntoView({behavior:'smooth',block:'center'})}
$('newPatientForm').onsubmit=e=>{e.preventDefault();const name=$('patientFullName').value.trim(),ci=$('patientDocument').value.trim(),phone=$('patientPhone').value.trim();if(!name)return msg('Ingresa el nombre completo del paciente.');if(birth.value&&(age()===null))return msg('Revisa la fecha de nacimiento. Debe estar entre 1900 y la fecha actual.');if(ci&&[...cards()].some(c=>c.dataset.ci===ci))return msg('Ya existe un paciente registrado con ese CI / documento.');const a=age(),sex=$('patientSex').value,art=document.createElement('article');art.className='patient-result';Object.assign(art.dataset,{name,ci,phone,history:$('patientHistory').value.trim(),allergies:$('patientAllergies').value.trim(),medication:$('patientMedication').value.trim()});const details=[a!==null?a+(a===1?' año':' años'):'',sex].filter(Boolean).join(' · ')||'Datos básicos registrados';art.innerHTML=`<div class="patient-avatar">${initials(name)}</div><div class="patient-info"><strong></strong><span></span><small></small></div><span class="result-arrow">›</span>`;art.querySelector('strong').textContent=name;art.querySelector('.patient-info span').textContent=ci?'CI: '+ci:'Sin documento';art.querySelector('small').textContent=details;$('patientResults').prepend(art);bind(art);select(art)};
$('consultationForm').onsubmit=e=>{e.preventDefault();if(!$('consultationReason').value.trim()){$('consultationReason').focus();return}if(!$('diagnosis').value.trim()){$('diagnosis').focus();return}currentConsultation={patient:selectedPatient,date:new Date().toISOString(),reason:$('consultationReason').value.trim(),currentIllness:$('currentIllness').value.trim(),vitals:{bloodPressure:$('bloodPressure').value.trim(),heartRate:$('heartRate').value,spo2:$('oxygenSaturation').value,temperature:$('temperature').value,respiratoryRate:$('respiratoryRate').value,weight:$('weight').value,height:$('height').value},physicalExam:$('physicalExam').value.trim(),diagnosis:$('diagnosis').value.trim(),indications:$('consultationIndications').value.trim(),notes:$('consultationNotes').value.trim(),followUp:$('followUp').value.trim()};openPrescription()};
function prescriptionId(){const d=new Date(),pad=n=>String(n).padStart(2,'0');return 'RX-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+String(Date.now()).slice(-5)}
function openPrescription(){if(!selectedPatient||!currentConsultation)return;$('prescriptionPatientName').textContent=selectedPatient.name;$('prescriptionSelectedName').textContent=selectedPatient.name;$('prescriptionSelectedMeta').textContent=[selectedPatient.ci?'CI: '+selectedPatient.ci:'Sin documento',selectedPatient.meta].filter(Boolean).join(' · ');$('prescriptionAvatar').textContent=initials(selectedPatient.name);$('prescriptionDiagnosis').textContent=currentConsultation.diagnosis;$('prescriptionCode').textContent=prescriptionId();$('prescriptionGeneralInstructions').value=currentConsultation.indications||'';$('medicationsList').innerHTML='';addMedication();show($('prescriptionScreen'))}
function addMedication(data={}){const n=$('medicationsList').children.length+1,c=document.createElement('div');c.className='medication-card';c.innerHTML=`<div class="medication-card-header"><strong>Medicamento ${n}</strong><button class="remove-medication" type="button" title="Eliminar">×</button></div><div class="form-group"><label>Medicamento</label><input class="med-name" placeholder="Ej. Paracetamol" value=""></div><div class="medication-grid"><div class="form-group"><label>Presentación / concentración</label><input class="med-presentation" placeholder="Ej. 500 mg"></div><div class="form-group"><label>Dosis</label><input class="med-dose" placeholder="Ej. 1 tableta"></div><div class="form-group"><label>Vía</label><select class="med-route"><option value="">Seleccionar</option><option>Oral</option><option>Sublingual</option><option>Tópica</option><option>Inhalatoria</option><option>Intramuscular</option><option>Intravenosa</option><option>Subcutánea</option><option>Rectal</option><option>Oftálmica</option><option>Ótica</option><option>Otra</option></select></div><div class="form-group"><label>Frecuencia</label><input class="med-frequency" placeholder="Ej. cada 8 horas"></div><div class="form-group"><label>Duración</label><input class="med-duration" placeholder="Ej. 5 días"></div></div><div class="form-group"><label>Instrucciones adicionales</label><textarea class="med-instructions" rows="2" placeholder="Ej. tomar después de las comidas"></textarea></div>`;c.querySelector('.med-name').value=data.name||'';c.querySelector('.med-presentation').value=data.presentation||'';c.querySelector('.med-dose').value=data.dose||'';c.querySelector('.med-frequency').value=data.frequency||'';c.querySelector('.med-duration').value=data.duration||'';c.querySelector('.med-instructions').value=data.instructions||'';c.querySelector('.med-route').value=data.route||'';c.querySelector('.remove-medication').onclick=()=>{c.remove();renumberMeds()};$('medicationsList').appendChild(c)}
function renumberMeds(){[...document.querySelectorAll('.medication-card')].forEach((c,i)=>c.querySelector('.medication-card-header strong').textContent='Medicamento '+(i+1))}
function meds(){return[...document.querySelectorAll('.medication-card')].map(c=>({name:c.querySelector('.med-name').value.trim(),presentation:c.querySelector('.med-presentation').value.trim(),dose:c.querySelector('.med-dose').value.trim(),route:c.querySelector('.med-route').value,frequency:c.querySelector('.med-frequency').value.trim(),duration:c.querySelector('.med-duration').value.trim(),instructions:c.querySelector('.med-instructions').value.trim()})).filter(m=>Object.values(m).some(Boolean))}
$('addMedicationBtn').onclick=()=>addMedication();$('backToConsultationBtn').onclick=$('prescriptionBackBtn').onclick=()=>show($('consultationScreen'));
function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function prescriptionPrint(){
 const list=meds(),p=selectedPatient,c=currentConsultation,code=$('prescriptionCode').textContent;
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
 </style></head><body><div class="toolbar"><button class="print-btn" onclick="window.print()">Descargar / imprimir PDF</button></div><main class="page"><header class="head"><div><div class="brand">MÉDICO <span>AMIGO</span></div><div class="tag">ATENCIÓN MÉDICA INTEGRAL</div></div><div class="doctor"><b>Dr. Omar Ponce</b><br>Médico<br>Registro profesional: por configurar</div></header><section class="patient-box"><div><b>Paciente:</b> ${escapeHtml(p.name)}<br><b>CI:</b> ${escapeHtml(p.ci||'No registrado')}${age?'<br><b>Edad:</b> '+escapeHtml(age):''}</div><div class="right"><b>Fecha:</b> ${escapeHtml(when)}<br><b>Receta:</b> ${escapeHtml(code)}</div></section><div class="diagnosis"><b>Diagnóstico / impresión clínica:</b> ${escapeHtml(c.diagnosis)}</div><h2 class="section-title">Rp/</h2>${medsHtml}<section class="instructions-block"><h2 class="section-title">Indicaciones generales</h2><div class="instructions">${escapeHtml($('prescriptionGeneralInstructions').value||'Sin indicaciones adicionales.')}</div></section><div class="signature-area"><div class="signature-box"><div class="signature-placeholder">Firma configurada del médico</div><div class="signature-line"><b>Dr. Omar Ponce</b><br>Médico<br>Registro profesional: por configurar</div><div class="legal-note">La imagen de firma se incorporará desde Configuración.</div></div></div><footer class="footer"><span>${escapeHtml(code)}</span><span>Generado por Médico Amigo</span></footer></main></body></html>`);
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
 $('consultationPrice').value='';
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

function basePatients(){
 return [
  {name:'María Fernández',ci:'4587214',phone:'71234567',age:68,sex:'Femenino',meta:'68 años · Femenino',address:'',emergency:'',history:'',allergies:'',medication:'',observations:''},
  {name:'Carlos Mamani',ci:'6843210',phone:'76543210',age:42,sex:'Masculino',meta:'42 años · Masculino',address:'',emergency:'',history:'',allergies:'',medication:'',observations:''}
 ];
}
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
 $('detailEmergency').textContent=textOr(p.emergency);$('detailHistory').textContent=textOr(p.history,'Sin información registrada');
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
  <div class="history-detail-block"><h3>Diagnóstico / impresión clínica</h3><p>${escapeHtml(safe(c.diagnosis))}</p></div>
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
$('startConsultationFromDetailBtn').onclick=()=>{if(detailPatient)selectPatient(detailPatient)};
$('closeHistoryModalBtn').onclick=()=>$('consultationHistoryModal').classList.add('hidden');
$('consultationHistoryModal').onclick=e=>{if(e.target===$('consultationHistoryModal'))$('consultationHistoryModal').classList.add('hidden')};

updateDashboard();

});