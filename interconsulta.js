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
 let cfg={};try{cfg=JSON.parse(sessionStorage.getItem('medicoAmigoDoctorConfig')||'{}')}catch{}
 set('icDoctor',cfg.name||document.querySelector('#homeScreen h1')?.textContent?.trim()||'');
 set('icLicense',cfg.registration||'');
 modal.classList.remove('hidden');document.body.classList.add('ic-open');
});
$('icClose').addEventListener('click',close);$('icCancel').addEventListener('click',close);
modal.addEventListener('click',e=>{if(e.target===modal)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))close()});
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const data={patient:val('icPatient'),age:val('icAge'),sex:val('icSex'),ci:val('icCi'),civil:val('icCivil'),occupation:val('icOccupation'),origin:val('icOrigin'),bed:val('icBed'),hospital:val('icHospital'),unit:val('icUnit'),diagnosis:val('icDiagnosis'),symptoms:val('icSymptoms'),treatment:val('icTreatment'),question:val('icQuestion'),doctor:val('icDoctor'),license:val('icLicense'),date:val('icDate'),time:val('icTime')};
 // Abrir durante el gesto del usuario para evitar bloqueos de ventanas emergentes.
 const w=window.open('','_blank');
 if(!w){alert('Permite las ventanas emergentes para imprimir o guardar el PDF.');return}
 w.document.write('<!doctype html><html lang="es"><meta charset="utf-8"><title>Preparando interconsulta</title><body style="font-family:Arial;padding:30px">Preparando solicitud de interconsulta…</body></html>');
 let cfg={};try{cfg=JSON.parse(sessionStorage.getItem('medicoAmigoDoctorConfig')||'{}')}catch{}
 let signature='';
 if(cfg.signature){
   try{
     if(cfg.signature.startsWith('data:image/'))signature=cfg.signature;
     else if(cfg.signature.startsWith('blob:')){
       const r=await fetch(cfg.signature);
       if(r.ok){const blob=await r.blob();signature=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(blob)})}
     }
   }catch(err){console.warn('No se pudo cargar la firma privada',err)}
 }
 const field=(label,value,extra='')=>`<div class="field ${extra}"><div class="label">${safe(label)}</div><div class="value">${safe(value)||'—'}</div></div>`;
 const section=(icon,title,body)=>`<section class="panel"><div class="panel-title"><span class="panel-icon">${icon}</span>${safe(title)}</div><div class="panel-body">${body}</div></section>`;
 const patient=section('●','DATOS DEL PACIENTE',`<div class="grid four">${field('Paciente',data.patient,'wide2')}${field('N.º de E.C. / CI',data.ci)}${field('Edad',data.age?data.age+' años':'')}${field('Sexo',data.sex)}${field('Estado civil',data.civil)}${field('Ocupación',data.occupation)}${field('Procedencia',data.origin)}${field('N.º de cama',data.bed)}${field('Hospital interconsultado',data.hospital,'wide2')}${field('Unidad interconsultada',data.unit)}</div>`);
 const clinical=section('✚','INFORMACIÓN CLÍNICA',`<div class="grid two">${field('Diagnóstico principal',data.diagnosis)}${field('Sintomatología principal y tratamiento actual',[data.symptoms,data.treatment].filter(Boolean).join('\n'))}</div>`);
 const reason=section('●','MOTIVO DE INTERCONSULTA',field('Se desea saber / motivo de interconsulta',data.question));
 const doctor=section('●','DATOS DEL MÉDICO SOLICITANTE',`<div class="grid two"><div>${field('Médico solicitante',data.doctor)}${field('Matrícula profesional',data.license)}</div><div><div class="label">Firma del médico solicitante</div><div class="signature">${signature?`<img src="${signature}" alt="Firma privada del médico">`:'<div class="no-signature">Firma pendiente</div>'}<div class="signline"></div><b>${safe(data.doctor)}</b><small>${data.license?'Matrícula profesional: '+safe(data.license):'Matrícula no registrada'}</small></div></div></div>`);
 const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Interconsulta · ${safe(data.patient)}</title><style>
 *{box-sizing:border-box}body{margin:0;background:#edf4fa;font-family:Arial,Helvetica,sans-serif;color:#142d48}.toolbar{max-width:210mm;margin:14px auto;display:flex;justify-content:flex-end}.toolbar button{border:0;border-radius:9px;background:#087eab;color:white;padding:11px 18px;font-weight:bold;cursor:pointer}.page{width:210mm;min-height:297mm;margin:0 auto 22px;padding:13mm 12mm;background:#fff;box-shadow:0 9px 35px #1a527020}.head{display:grid;grid-template-columns:1fr 1.5fr .85fr;gap:12px;align-items:center;margin-bottom:12px}.brand{font-size:23px;font-weight:800;color:#073b66;white-space:nowrap}.brand span{color:#087ac5}.brand small{display:block;font-size:8px;font-weight:normal;margin-top:3px}.heading{background:#116094;color:#fff;border-radius:8px;padding:13px 7px;text-align:center;font-size:16px;font-weight:800}.datetime{background:#e9f3fc;padding:10px;border-radius:9px;font-size:10px;line-height:1.8}.panel{border:1px solid #b6d9f4;border-radius:9px;overflow:hidden;margin:9px 0;break-inside:avoid}.panel-title{background:#e0f0fc;color:#09558f;font-size:12px;font-weight:800;padding:9px 12px}.panel-icon{display:inline-block;width:22px}.panel-body{padding:11px 13px}.grid{display:grid;gap:10px 12px}.grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.wide2{grid-column:span 2}.field{min-width:0}.label{font-size:10px;font-weight:700;color:#0b548d;margin-bottom:5px}.value{border:1px solid #c7def0;border-radius:5px;padding:9px 10px;min-height:32px;font-size:10.5px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45}.signature{border:1px solid #c7def0;border-radius:6px;text-align:center;min-height:105px;padding:6px 12px;font-size:10px}.signature img{display:block;max-height:65px;max-width:95%;object-fit:contain;margin:0 auto}.no-signature{height:55px;display:flex;align-items:center;justify-content:center;color:#7d91a3}.signline{border-top:1px solid #6689a5;width:75%;margin:4px auto}.signature small{display:block;font-size:9px;margin-top:3px}.footer{border-top:1px solid #1681bd;padding-top:9px;color:#627d93;font-size:8px;margin-top:12px}@page{size:A4;margin:0}@media print{body{background:white}.toolbar{display:none}.page{box-shadow:none;margin:0;min-height:297mm;break-after:avoid}print-color-adjust:exact;-webkit-print-color-adjust:exact}@media(max-width:800px){.page{width:100%;min-height:0;padding:18px}.head{grid-template-columns:1fr}.grid.four,.grid.two{grid-template-columns:1fr 1fr}.wide2{grid-column:span 2}}
 </style></head><body><div class="toolbar"><button onclick="window.print()">🖨 Imprimir / guardar como PDF</button></div><main class="page"><header class="head"><div class="brand">🩺 Médico <span>Amigo</span><small>ATENCIÓN MÉDICA INTEGRAL</small></div><div class="heading">SOLICITUD DE INTERCONSULTA</div><div class="datetime"><b>Fecha:</b> ${safe(data.date)}<br><b>Hora:</b> ${safe(data.time)}</div></header>${patient}${clinical}${reason}${doctor}<footer class="footer">Generado mediante Médico Amigo. Verificar datos, autorización institucional y firma antes de su utilización clínica.</footer></main></body></html>`;
 w.document.open();w.document.write(html);w.document.close();
});
})();
