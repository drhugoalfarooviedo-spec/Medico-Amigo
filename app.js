document.addEventListener('DOMContentLoaded',()=>{
const $=id=>document.getElementById(id), screens=[$('loginScreen'),$('homeScreen'),$('patientScreen'),$('newPatientScreen'),$('consultationScreen')];
const show=s=>{screens.forEach(x=>x.classList.add('hidden'));s.classList.remove('hidden');scrollTo(0,0)};
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const cards=()=>document.querySelectorAll('.patient-result');
$('loginForm').onsubmit=e=>{e.preventDefault();show($('homeScreen'))};
function openPatients(){show($('patientScreen'));$('patientSearchInput').value='';filter();setTimeout(()=>$('patientSearchInput').focus(),100)}
$('newConsultationBtn').onclick=openPatients;$('searchPatientBtn').onclick=openPatients;$('backHomeBtn').onclick=()=>show($('homeScreen'));
function filter(){const q=normalize($('patientSearchInput').value.trim());let n=0;cards().forEach(c=>{const ok=[c.dataset.name,c.dataset.ci,c.dataset.phone].some(v=>normalize(v).includes(q));c.style.display=ok?'flex':'none';if(ok)n++});$('patientResults').classList.toggle('hidden',n===0);$('noPatientResults').classList.toggle('hidden',n!==0)}
$('patientSearchInput').oninput=filter;
function select(c){const name=c.querySelector('.patient-info strong').textContent.trim();$('consultationPatientName').textContent=name;$('selectedPatientSummary').textContent=name;show($('consultationScreen'))}
function bind(c){c.onclick=()=>select(c)} cards().forEach(bind);
$('backToPatientsBtn').onclick=()=>show($('patientScreen'));
$('registerPatientBtn').onclick=()=>{$('newPatientForm').reset();$('calculatedAge').classList.add('hidden');$('formMessage').className='form-message hidden';show($('newPatientScreen'));setTimeout(()=>$('patientFullName').focus(),100)};
$('backPatientSearchBtn').onclick=$('cancelNewPatientBtn').onclick=()=>show($('patientScreen'));
const birth=$('patientBirthDate');birth.max=new Date().toISOString().split('T')[0];
function age(){if(!birth.value){$('calculatedAge').classList.add('hidden');return null}const b=new Date(birth.value+'T00:00:00'),t=new Date();if(isNaN(b)||b>t||b.getFullYear()<1900){$('calculatedAge').classList.add('hidden');return null}let a=t.getFullYear()-b.getFullYear();if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))a--;$('ageValue').textContent=a+(a===1?' año':' años');$('calculatedAge').classList.remove('hidden');return a}birth.onchange=age;
function initials(n){const w=n.trim().split(/\s+/);return ((w[0]?.[0]||'P')+(w[1]?.[0]||'')).toUpperCase()}
function msg(t){const m=$('formMessage');m.textContent=t;m.className='form-message error';m.scrollIntoView({behavior:'smooth',block:'center'})}
$('newPatientForm').onsubmit=e=>{e.preventDefault();const name=$('patientFullName').value.trim(),ci=$('patientDocument').value.trim(),phone=$('patientPhone').value.trim();if(!name)return msg('Ingresa el nombre completo del paciente.');if(birth.value&&(age()===null))return msg('Revisa la fecha de nacimiento. Debe estar entre 1900 y la fecha actual.');if(ci&&[...cards()].some(c=>c.dataset.ci===ci))return msg('Ya existe un paciente registrado con ese CI / documento.');const a=age(),sex=$('patientSex').value,art=document.createElement('article');art.className='patient-result';art.dataset.name=name;art.dataset.ci=ci;art.dataset.phone=phone;const details=[a!==null?a+(a===1?' año':' años'):'',sex].filter(Boolean).join(' · ')||'Datos básicos registrados';art.innerHTML=`<div class="patient-avatar">${initials(name)}</div><div class="patient-info"><strong></strong><span></span><small></small></div><span class="result-arrow">›</span>`;art.querySelector('strong').textContent=name;art.querySelector('.patient-info span').textContent=ci?'CI: '+ci:'Sin documento';art.querySelector('small').textContent=details;$('patientResults').prepend(art);bind(art);select(art)};
});
