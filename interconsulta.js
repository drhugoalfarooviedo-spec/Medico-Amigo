/* Interconsultas v1.0.29: documento imprimible, sin persistencia clínica local */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const btn=$('interconsultationFromDetailBtn'); if(!btn)return;
const modal=$('interconsultationModal'); const form=$('interconsultationForm');
const safe=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=id=>$(id)?.value?.trim()||'';
const set=(id,v)=>{if($(id))$(id).value=v??''};
function close(){modal.classList.add('hidden');document.body.classList.remove('ic-open')}
btn.addEventListener('click',()=>{
 const name=$('detailName')?.textContent||'';
 form.reset();set('icPatient',name);set('icAge',($('detailAge')?.textContent||'').replace(/\s*años/i,''));set('icSex',$('detailSex')?.textContent==='—'?'':$('detailSex')?.textContent);set('icCi',$('detailCi')?.textContent==='—'?'':$('detailCi')?.textContent);
 const d=new Date();set('icDate',d.toISOString().slice(0,10));set('icTime',d.toTimeString().slice(0,5));
 set('icDoctor',document.querySelector('#homeScreen h1')?.textContent?.trim()||'');
 modal.classList.remove('hidden');document.body.classList.add('ic-open');
});
$('icClose').addEventListener('click',close);$('icCancel').addEventListener('click',close);
modal.addEventListener('click',e=>{if(e.target===modal)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))close()});
form.addEventListener('submit',e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const data={patient:val('icPatient'),age:val('icAge'),sex:val('icSex'),ci:val('icCi'),civil:val('icCivil'),occupation:val('icOccupation'),origin:val('icOrigin'),bed:val('icBed'),hospital:val('icHospital'),unit:val('icUnit'),diagnosis:val('icDiagnosis'),symptoms:val('icSymptoms'),treatment:val('icTreatment'),question:val('icQuestion'),doctor:val('icDoctor'),license:val('icLicense'),date:val('icDate'),time:val('icTime')};
 const f=(label,value)=>`<div class="ic-field"><b>${safe(label)}:</b> ${safe(value)||'____________________'}</div>`;
 const line=(label,value)=>`<div class="ic-textarea"><b>${safe(label)}</b><p>${safe(value).replace(/\n/g,'<br>')||'&nbsp;'}</p></div>`;
 const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Solicitud de interconsulta</title><style>@page{size:A4;margin:12mm}body{font:12px Arial;color:#111}header{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:12px}header strong{font-size:16px}h1{text-align:center;font-size:17px;border:1px solid #111;padding:8px;margin:10px 0}.ic-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;border:1px solid #555;padding:10px}.ic-field{min-height:22px;border-bottom:1px solid #aaa;overflow-wrap:anywhere}.ic-textarea{border:1px solid #555;padding:10px;margin-top:8px;min-height:90px;overflow-wrap:anywhere}.ic-textarea p{white-space:normal;line-height:1.5}.ic-end{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:18px}.ic-sign{margin-top:45px;text-align:center;border-top:1px solid #555;padding-top:5px}.ic-foot{font-size:10px;margin-top:15px;color:#555}@media print{button{display:none}}</style></head><body><header><strong>GOBIERNO AUTÓNOMO MUNICIPAL DE LA PAZ</strong><div>HOSPITAL MUNICIPAL LOS PINOS</div></header><h1>SOLICITUD DE INTERCONSULTA</h1><div class="ic-grid">${f('Apellido paterno','')}${f('Apellido materno','')}${f('Nombres',data.patient)}${f('N.º de E.C.',data.ci)}${f('Edad',data.age)}${f('Sexo',data.sex)}${f('Estado civil',data.civil)}${f('Ocupación',data.occupation)}${f('Procedencia',data.origin)}${f('N.º de cama',data.bed)}${f('Hospital interconsultado',data.hospital)}${f('Unidad interconsultada',data.unit)}</div>${line('DIAGNÓSTICO PRINCIPAL',data.diagnosis)}${line('SINTOMATOLOGÍA PRINCIPAL Y TRATAMIENTO',data.symptoms+'\n'+data.treatment)}${line('SE DESEA SABER / MOTIVO DE INTERCONSULTA',data.question)}<div class="ic-end">${f('Fecha',data.date)}${f('Hora',data.time)}${f('Médico solicitante',data.doctor)}${f('Matrícula profesional',data.license)}</div><div class="ic-sign">Firma y sello del médico solicitante</div><p class="ic-foot">Generado mediante Médico Amigo. Verificar datos, autorización institucional y firma antes de su utilización clínica.</p><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350))<\/script></body></html>`;
 const w=window.open('','_blank');if(!w){alert('Permite las ventanas emergentes para imprimir o guardar el PDF.');return}w.document.open();w.document.write(html);w.document.close();
});
})();
