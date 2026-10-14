/* EcoSurvey V2 - unified survey/rescue event recorder */
const STORAGE_KEY = 'EcoSurveyData';
const SCHEMA_VERSION = '2.0';
const APP_VERSION = '2.0.0';

const HABITATS = ['针叶林','针阔混交林','落叶阔叶林','常绿阔叶林','灌丛','草地','草坡','农田','果园','河流','湖泊','湿地/沼泽','裸地','裸岩','居民区','其他'];
const WEATHER = ['晴','阴','多云','小雨','中雨','大雨','雪','雾','其他'];
const DISTURBANCE_TYPES = ['道路','建筑','农业活动','放牧','采集','旅游活动','施工','其他'];
const DISTURBANCE_LEVELS = ['无','轻','中','重'];
const BEHAVIORS = ['移动','休息','觅食','饮水','发声','社交','争斗','晒背','警戒','逃逸','繁殖','筑巢/筑穴','其他','不适用'];
const EVIDENCE = ['目击','声音','足迹/爪痕','粪便','羽毛等脱落物','取食痕迹','巢穴','尸体残骸','其他'];
const PROTECTION = ['一级','二级','三有','待确定'];
const HANDLING = ['无','驱离','捕捉转移','临时救护'];

let data = {
  schema_version: SCHEMA_VERSION,
  app: { name:'EcoSurvey', version:APP_VERSION },
  meta: { created_at:new Date().toISOString(), updated_at:new Date().toISOString() },
  transects: [], events: [], reserved_event_ids: []
};
let currentTransectId = null;
let editingTransectId = null;
let editingEventId = null;
let creatingEventType = null;

const $ = id => document.getElementById(id);
const currentTransectEl = $('currentTransect');
const transectFormSection = $('transectFormSection');
const eventSection = $('eventSection');
const eventFormSection = $('eventFormSection');
const recentEventsSection = $('recentEventsSection');
const recentEventsEl = $('recentEvents');
const eventMessageEl = $('eventMessage');

function now(){ return new Date().toISOString(); }
function saveData(){ data.meta.updated_at=now(); localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); renderAll(); }
function esc(v){ return String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function val(id){ return $(id)?.value.trim() ?? ''; }
function setVal(id,v){ if($(id)) $(id).value=v ?? ''; }
function nullable(v){ return v === '' ? null : v; }
function numOrNull(v){ return v === '' ? null : Number(v); }
function checked(name){ return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(x=>x.value); }
function check(name,values){ document.querySelectorAll(`input[name="${name}"]`).forEach(x=>x.checked=(values||[]).includes(x.value)); }
function radio(name){ return document.querySelector(`input[name="${name}"]:checked`)?.value || ''; }
function setRadio(name,value){ document.querySelectorAll(`input[name="${name}"]`).forEach(x=>x.checked=x.value===value); }
function copyText(text){
  if(navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).catch(()=>legacyCopy(text));
  return legacyCopy(text);
}
function legacyCopy(text){ const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); return Promise.resolve(); }

function normalizeLoadedData(){
  if(!data || typeof data!=='object') throw new Error('数据格式错误');
  data.transects=Array.isArray(data.transects)?data.transects:[];
  data.events=Array.isArray(data.events)?data.events:[];
  data.reserved_event_ids=Array.isArray(data.reserved_event_ids)?data.reserved_event_ids:[];
  data.transects.forEach(t=>{ if(!t.status)t.status='active'; });
  data.events.forEach(e=>{ if(!e.status)e.status='active'; if(e.event_id&&!data.reserved_event_ids.includes(e.event_id))data.reserved_event_ids.push(e.event_id); migrateEvent(e); });
}
function migrateEvent(e){
  // Only migrate old recorder records; never introduce KMZ/Two Steps fields.
  if(!e.event_type) e.event_type='调查';
  if(e.survey_object==null && e.subject!=null)e.survey_object=e.subject;
  if(e.quantity==null && e.total_count!=null)e.quantity=e.total_count;
  if(e.habitat==null && e.local_habitat!=null)e.habitat=e.local_habitat;
  if(e.distance_m==null && e.distance!=null)e.distance_m=e.distance;
  if(e.behavior==null)e.behavior=[];
  if(e.evidence_type==null)e.evidence_type=e.evidence||[];
  if(e.protection_level===undefined)e.protection_level=null;
  if(e.handling_method===undefined)e.handling_method='无';
  if(e.transfer_location===undefined)e.transfer_location=null;
  if(e.remark===undefined)e.remark=e.eventRemark??null;
  if(e.female===undefined)e.female=null;
  if(e.male===undefined)e.male=null;
  if(e.juvenile===undefined)e.juvenile=null;
  if(e.adult===undefined)e.adult=null;
  if(e.subadult===undefined)e.subadult=null;
  if(e.tadpole===undefined)e.tadpole=null;
  if(e.egg_mass_count===undefined)e.egg_mass_count=null;
  delete e.subject; delete e.total_count; delete e.distance; delete e.local_habitat; delete e.evidence; delete e.amphibian;
  delete e.survey_time; delete e.longitude; delete e.latitude; delete e.altitude; delete e.attachments; delete e.raw_record;
}
function loadData(){
  const raw=localStorage.getItem(STORAGE_KEY); if(!raw)return;
  try { data=JSON.parse(raw); normalizeLoadedData(); } catch(e){ console.error(e); alert('本地数据读取失败，当前数据未被修改。'); }
}

function renderAll(){ renderCurrentTransect(); renderRecentEvents(); renderDataStatus(); }
function renderCurrentTransect(){
  const t=data.transects.find(x=>x.transect_id===currentTransectId);
  if(!t || t.status==='deleted'){
    currentTransectId=null; currentTransectEl.textContent='暂无当前样线'; eventSection.classList.add('hidden'); recentEventsSection.classList.add('hidden'); return;
  }
  currentTransectEl.innerHTML=`<strong>${esc(t.transect_id)}</strong><div class="current-transect-meta">观测者：${esc(t.observer)}　鉴定者：${esc(t.identifier)}　记录者：${esc(t.recorder)}</div>`;
  eventSection.classList.remove('hidden');
  const title=eventSection.querySelector('.section-title'); if(title) title.textContent='事件';
  const events=data.events.filter(e=>e.transect_id===t.transect_id&&e.status==='active');
  const survey=events.filter(e=>e.event_type==='调查').length, rescue=events.filter(e=>e.event_type==='搜救').length;
  $('eventCounts')?.replaceChildren(document.createTextNode(`调查 ${survey} · 搜救 ${rescue} · 合计 ${events.length}`));
}
function renderRecentEvents(){
  const events=data.events.filter(e=>e.transect_id===currentTransectId&&e.status==='active');
  if(!currentTransectId||!events.length){ recentEventsSection.classList.add('hidden'); return; }
  recentEventsSection.classList.remove('hidden');
  recentEventsEl.innerHTML=events.map(e=>`<div class="event-item"><div><strong>${esc(e.event_id)}</strong> <span class="event-type-badge ${e.event_type==='搜救'?'rescue':'survey'}">${esc(e.event_type)}</span></div><div>${esc(e.survey_object)}　数量：${esc(e.quantity)}</div><div class="event-actions"><button class="btn btn-small btn-secondary" data-action="edit-event" data-id="${esc(e.event_id)}">修改</button><button class="btn btn-small btn-secondary" data-action="view-event" data-id="${esc(e.event_id)}">查看</button><button class="btn btn-small btn-danger" data-action="delete-event" data-id="${esc(e.event_id)}">删除</button></div></div>`).join('');
}
function renderDataStatus(){ const el=$('dataStatus'); if(el)el.textContent=`样线 ${data.transects.filter(x=>x.status==='active').length} · 事件 ${data.events.filter(x=>x.status==='active').length}`; }

function clearTransectForm(){ ['transectId','observer','identifier','recorder','weather','temperature','waterTemperature','humidity','ph','mainHabitat','disturbanceType','disturbanceLevel','transectRemark'].forEach(id=>setVal(id,'')); }
function fillTransectForm(t){ setVal('transectId',t.transect_id);setVal('observer',t.observer);setVal('identifier',t.identifier);setVal('recorder',t.recorder);setVal('weather',t.weather);setVal('temperature',t.temperature);setVal('waterTemperature',t.water_temperature);setVal('humidity',t.humidity);setVal('ph',t.ph);setVal('mainHabitat',t.main_habitat);setVal('disturbanceType',t.disturbance_type);setVal('disturbanceLevel',t.disturbance_level);setVal('transectRemark',t.remark); }
function generateTransectText(t){
  return ['【样线记录】',`样线=${t.transect_id}`,`观测者=${t.observer}`,`鉴定者=${t.identifier}`,`记录者=${t.recorder}`,`天气=${t.weather}`,`温度=${t.temperature}`,`水温=${t.water_temperature??''}`,`湿度=${t.humidity??''}`,`pH=${t.ph??''}`,`主要生境=${t.main_habitat}`,`人为干扰类型=${t.disturbance_type}`,`人为干扰程度=${t.disturbance_level}`,`备注=${t.remark??''}`].join('\n');
}
function saveTransect(){
  const id=val('transectId'), observer=val('observer'), identifier=val('identifier'), recorder=val('recorder'), weather=val('weather'), temperature=val('temperature'), mainHabitat=val('mainHabitat'), disturbanceType=val('disturbanceType'), disturbanceLevel=val('disturbanceLevel');
  if(!id||!observer||!identifier||!recorder||!weather||!temperature||!mainHabitat||!disturbanceType||!disturbanceLevel){alert('请填写所有必填的样线信息。');return;}
  const old=editingTransectId?data.transects.find(t=>t.transect_id===editingTransectId):null;
  if(!old && data.transects.some(t=>t.transect_id===id&&t.status==='active')){alert('该样线编号已存在。');return;}
  if(old && id!==old.transect_id && data.events.some(e=>e.transect_id===old.transect_id)){alert('该样线已有事件，样线编号不能修改。');return;}
  if(old && id!==old.transect_id && data.transects.some(t=>t.transect_id===id&&t.status==='active')){alert('新的样线编号已存在。');return;}
  const t=old||{transect_id:id,status:'active',created_at:now()};
  if(old&&id!==old.transect_id){data.events.filter(e=>e.transect_id===old.transect_id).forEach(e=>e.transect_id=id);currentTransectId=id;}
  Object.assign(t,{transect_id:id,observer,identifier,recorder,weather,temperature,water_temperature:nullable(val('waterTemperature')),humidity:nullable(val('humidity')),ph:nullable(val('ph')),main_habitat:mainHabitat,disturbance_type:disturbanceType,disturbance_level:disturbanceLevel,remark:nullable(val('transectRemark')),status:'active',updated_at:now()});
  if(!old)data.transects.push(t); else if(!data.transects.includes(t))data.transects.push(t);
  currentTransectId=id; editingTransectId=null; saveData(); clearTransectForm(); transectFormSection.classList.add('hidden');
  copyText(generateTransectText(t)); alert(`样线 ${id} 已保存，标准化记录已复制。`); renderTransectManagement();
}

function clearEventForm(){
  ['subject','totalCount','distance','localHabitat','female','male','juvenile','adult','subadult','tadpole','eggMass','eventRemark','protectionLevel','handlingMethod','transferLocation'].forEach(id=>setVal(id,''));
  check('behavior',[]);check('evidence',[]);setRadio('identificationStatus','');
}
function openEventForm(type,event=null){
  if(!currentTransectId){alert('请先建立当前样线。');return;}
  editingEventId=event?.event_id||null; creatingEventType=event?.event_type||type;
  $('eventFormTitle').textContent=event?`修改${event.event_type}事件`:`新建${type}事件`;
  $('eventTypeDisplay').textContent=event?.event_type||type;
  clearEventForm();
  if(event){ setVal('subject',event.survey_object);setVal('totalCount',event.quantity);setVal('distance',event.distance_m);setVal('localHabitat',event.habitat);setVal('female',event.female);setVal('male',event.male);setVal('juvenile',event.juvenile);setVal('adult',event.adult);setVal('subadult',event.subadult);setVal('tadpole',event.tadpole);setVal('eggMass',event.egg_mass_count);setVal('eventRemark',event.remark);setVal('protectionLevel',event.protection_level);setVal('handlingMethod',event.handling_method||'无');setVal('transferLocation',event.transfer_location);check('behavior',event.behavior);check('evidence',event.evidence_type);setRadio('identificationStatus',event.identification_status); $('eventIdDisplay').textContent=event.event_id; }
  else { $('eventIdDisplay').textContent='保存后生成'; setVal('handlingMethod','无'); }
  eventFormSection.classList.remove('hidden'); eventFormSection.scrollIntoView({behavior:'smooth'});
}
function createOrUpdateEvent(){
  if(!currentTransectId){alert('当前没有样线。');return;}
  const subject=val('subject'), quantity=val('totalCount'), distance=val('distance'), habitat=val('localHabitat'), behavior=checked('behavior'), evidence=checked('evidence'), identification=radio('identificationStatus'), handling=val('handlingMethod');
  if(!subject){alert('请输入调查对象。');return;}
  if(!/^\d+$/.test(quantity)||Number(quantity)<1){alert('数量必须为大于等于1的整数。');return;}
  if(!habitat){alert('请选择生境类型。');return;}
  if(!behavior.length){alert('请选择行为。');return;}
  if(!evidence.length){alert('请选择证据类型。');return;}
  if(!identification){alert('请选择鉴定状态。');return;}
  if(!handling){alert('请选择处理方式。');return;}
  const payload={survey_object:subject,quantity:Number(quantity),protection_level:nullable(val('protectionLevel')),distance_m:distance===''?null:Number(distance),habitat,behavior,evidence_type:evidence,identification_status:identification,female:numOrNull(val('female')),male:numOrNull(val('male')),juvenile:numOrNull(val('juvenile')),adult:numOrNull(val('adult')),subadult:numOrNull(val('subadult')),tadpole:numOrNull(val('tadpole')),egg_mass_count:numOrNull(val('eggMass')),handling_method:handling,transfer_location:nullable(val('transferLocation')),remark:nullable(val('eventRemark'))};
  if(editingEventId){
    const e=data.events.find(x=>x.event_id===editingEventId); if(!e||e.status==='deleted'){alert('事件不存在或已删除。');return;}
    Object.assign(e,payload,{updated_at:now()}); const id=e.event_id; saveData(); eventFormSection.classList.add('hidden'); editingEventId=null; copyText(generateEventText(e)); alert(`${id} 已修改，更新后的标准化记录已复制。`); return;
  }
  const eventId=generateNextEventId(currentTransectId); const e={event_id:eventId,transect_id:currentTransectId,event_type:creatingEventType,status:'active',...payload,created_at:now(),updated_at:now()}; data.events.push(e); saveData(); eventFormSection.classList.add('hidden'); copyText(generateEventText(e)); alert(`${eventId} 已保存，标准化记录已复制。`);
}
function generateNextEventId(transectId){ const prefix=`${transectId}_E`; let n=0; data.reserved_event_ids.forEach(id=>{if(id.startsWith(prefix)){const m=id.match(/_E(\d+)$/);if(m)n=Math.max(n,Number(m[1]));}}); const id=`${prefix}${String(n+1).padStart(3,'0')}`;data.reserved_event_ids.push(id);return id; }
function generateEventText(e){
  const lines=['【调查事件】',`事件=${e.event_id}`,`样线=${e.transect_id}`,`事件类型=${e.event_type}`,`调查对象=${e.survey_object}`,`数量=${e.quantity}`,`保护级别=${e.protection_level??''}`,`截距=${e.distance_m==null?'':e.distance_m+'m'}`,`生境类型=${e.habitat}`,`行为=${e.behavior.join(',')}`,`证据类型=${e.evidence_type.join(',')}`,`鉴定状态=${e.identification_status}`,`雌=${e.female??''}`,`雄=${e.male??''}`,`幼体=${e.juvenile??''}`,`成体=${e.adult??''}`,`亚成体=${e.subadult??''}`,`蝌蚪=${e.tadpole??''}`,`卵块数量=${e.egg_mass_count??''}`,`处理方式=${e.handling_method}`,`转移地点=${e.transfer_location??''}`,`备注=${e.remark??''}`]; return lines.join('\n');
}

function renderTransectManagement(){
  const section=$('transectManagementSection'), list=$('transectManagementList'); if(!section||!list)return;
  section.classList.remove('hidden');
  list.innerHTML=data.transects.map(t=>{const count=data.events.filter(e=>e.transect_id===t.transect_id).length;return `<div class="management-item ${t.status==='deleted'?'deleted':''}"><div><strong>${esc(t.transect_id)}</strong><div>事件：${count} 条 · ${t.status==='deleted'?'已删除':'正常'}</div></div><div class="management-actions">${t.status==='active'?`<button class="btn btn-small btn-secondary" data-mgmt="view" data-id="${esc(t.transect_id)}">查看</button><button class="btn btn-small btn-secondary" data-mgmt="edit" data-id="${esc(t.transect_id)}">修改</button><button class="btn btn-small btn-danger" data-mgmt="delete" data-id="${esc(t.transect_id)}">删除</button>`:`<button class="btn btn-small btn-secondary" data-mgmt="view" data-id="${esc(t.transect_id)}">查看</button><button class="btn btn-small btn-secondary" data-mgmt="restore" data-id="${esc(t.transect_id)}">恢复</button><button class="btn btn-small btn-danger" data-mgmt="harddelete" data-id="${esc(t.transect_id)}">彻底删除</button>`}</div></div>`}).join('');
}
function viewTransect(id){ const t=data.transects.find(x=>x.transect_id===id);if(!t)return;const es=data.events.filter(e=>e.transect_id===id);$('viewModalTitle').textContent=`样线：${id}`;$('viewModalBody').innerHTML=`<div class="detail-grid">${[['观测者',t.observer],['鉴定者',t.identifier],['记录者',t.recorder],['天气',t.weather],['温度',t.temperature],['主要生境',t.main_habitat],['人为干扰类型',t.disturbance_type],['人为干扰程度',t.disturbance_level],['备注',t.remark||'']].map(x=>`<div><strong>${esc(x[0])}</strong><br>${esc(x[1])}</div>`).join('')}</div><hr><h3>事件（${es.length}）</h3>${es.map(e=>`<div class="event-item"><strong>${esc(e.event_id)}</strong> ${esc(e.event_type)} · ${esc(e.survey_object)} · ${esc(e.quantity)}${e.status==='deleted'?' · 已删除':''}</div>`).join('')}`;$('viewModal').classList.remove('hidden'); }
function editTransect(id){const t=data.transects.find(x=>x.transect_id===id);if(!t||t.status==='deleted')return;editingTransectId=id;fillTransectForm(t);$('transectFormSection').querySelector('.section-title').textContent='修改样线';$('transectFormSection').classList.remove('hidden');$('transectFormSection').scrollIntoView({behavior:'smooth'});}
function deleteTransect(id){const t=data.transects.find(x=>x.transect_id===id);if(!t)return;if(!confirm(`样线：${id}\n调查事件：${data.events.filter(e=>e.transect_id===id).length} 条\n将进入删除状态，是否确认？`))return;t.status='deleted';data.events.filter(e=>e.transect_id===id&&e.status==='active').forEach(e=>e.status='deleted');if(currentTransectId===id)currentTransectId=null;saveData();renderTransectManagement();}
function restoreTransect(id){const t=data.transects.find(x=>x.transect_id===id);if(!t)return;t.status='active';data.events.filter(e=>e.transect_id===id&&e.cascaded_deleted).forEach(e=>{e.status='active';delete e.cascaded_deleted;});saveData();renderTransectManagement();}
function hardDeleteTransect(id){const t=data.transects.find(x=>x.transect_id===id);if(!t)return;const n=data.events.filter(e=>e.transect_id===id).length;if(!confirm(`样线：${id}  调查事件：${n} 条  将彻底删除，是否确认。`))return;if(!confirm('此操作将无法恢复。\n[取消] [彻底删除]'))return;data.transects=data.transects.filter(x=>x.transect_id!==id);data.events=data.events.filter(e=>e.transect_id!==id);if(currentTransectId===id)currentTransectId=null;saveData();renderTransectManagement();}
function deleteEvent(id){const e=data.events.find(x=>x.event_id===id);if(!e||e.status==='deleted')return;if(!confirm(`事件：${id}\n将进入删除状态，是否确认？`))return;e.status='deleted';e.deleted_at=now();saveData();}
function editEvent(id){const e=data.events.find(x=>x.event_id===id);if(e)openEventForm(e.event_type,e);}
function viewEvent(id){const e=data.events.find(x=>x.event_id===id);if(!e)return;$('viewModalTitle').textContent=`事件：${id}`;$('viewModalBody').innerHTML=`<div class="detail-grid">${[['事件类型',e.event_type],['调查对象',e.survey_object],['数量',e.quantity],['保护级别',e.protection_level??''],['截距',e.distance_m==null?'':e.distance_m+' m'],['生境类型',e.habitat],['行为',e.behavior.join('、')],['证据类型',e.evidence_type.join('、')],['鉴定状态',e.identification_status],['处理方式',e.handling_method],['转移地点',e.transfer_location??''],['备注',e.remark??'']].map(x=>`<div><strong>${esc(x[0])}</strong><br>${esc(x[1])}</div>`).join('')}</div>`;$('viewModal').classList.remove('hidden');}

function exportJSON(){ const out={backup_format:'EcoSurvey_Recorder_JSON',backup_version:'2.0',schema_version:'2.0',app:{name:'EcoSurvey',version:APP_VERSION},data:{transects:data.transects,events:data.events,reserved_event_ids:data.reserved_event_ids}};const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`EcoSurvey_Backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);}
function importJSON(){ const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>{const f=input.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(x.backup_format!=='EcoSurvey_Recorder_JSON'||!x.data||!Array.isArray(x.data.transects)||!Array.isArray(x.data.events)||!Array.isArray(x.data.reserved_event_ids))throw new Error('格式不正确');const candidate={...x.data,schema_version:'2.0',app:{name:'EcoSurvey',version:APP_VERSION},meta:{created_at:now(),updated_at:now()}};candidate.transects.forEach(t=>{if(!['active','deleted'].includes(t.status))throw new Error('样线状态无效');});candidate.events.forEach(e=>{if(!['active','deleted'].includes(e.status)||!candidate.transects.some(t=>t.transect_id===e.transect_id))throw new Error('事件关系无效');migrateEvent(e);});if(!confirm('导入将完整替换当前录入器数据，是否继续？'))return;data=candidate;currentTransectId=null;saveData();alert('JSON导入成功。');}catch(e){alert('导入失败：'+e.message);}};r.readAsText(f);};input.click();}

$('newTransectBtn').addEventListener('click',()=>{editingTransectId=null;clearTransectForm();$('transectFormSection').querySelector('.section-title').textContent='新建样线';transectFormSection.classList.remove('hidden');transectFormSection.scrollIntoView({behavior:'smooth'});});
$('saveTransectBtn').addEventListener('click',saveTransect);
$('cancelTransectBtn').addEventListener('click',()=>{editingTransectId=null;clearTransectForm();transectFormSection.classList.add('hidden');});
$('newSurveyEventBtn')?.addEventListener('click',()=>openEventForm('调查'));
$('newRescueEventBtn')?.addEventListener('click',()=>openEventForm('搜救'));
$('saveEventBtn').addEventListener('click',createOrUpdateEvent);
$('cancelEventBtn').addEventListener('click',()=>{editingEventId=null;eventFormSection.classList.add('hidden');clearEventForm();});
$('eventManagementBtn').addEventListener('click',()=>{if(currentTransectId)renderTransectManagement();});
$('transectManagementBtn').addEventListener('click',renderTransectManagement);
$('closeTransectManagementBtn').addEventListener('click',()=>$('transectManagementSection').classList.add('hidden'));
$('closeViewModalBtn').addEventListener('click',()=>$('viewModal').classList.add('hidden'));
$('recentEvents').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.id;if(b.dataset.action==='edit-event')editEvent(id);if(b.dataset.action==='view-event')viewEvent(id);if(b.dataset.action==='delete-event')deleteEvent(id);});
$('transectManagementList').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.id;switch(b.dataset.mgmt){case'view':viewTransect(id);break;case'edit':editTransect(id);break;case'delete':deleteTransect(id);break;case'restore':restoreTransect(id);break;case'harddelete':hardDeleteTransect(id);break;}});
window.closeViewModal=()=>$('viewModal').classList.add('hidden');

// Add backup controls if the existing page does not have them.
function ensureDataButtons(){
  const status=$('dataStatus'); if(!status)return;
  if(!$('exportJsonBtn')){const row=document.createElement('div');row.className='button-row';row.innerHTML='<button id="exportJsonBtn" class="btn btn-secondary">导出JSON</button><button id="importJsonBtn" class="btn btn-secondary">导入JSON</button>';status.parentElement?.appendChild(row);$('exportJsonBtn').addEventListener('click',exportJSON);$('importJsonBtn').addEventListener('click',importJSON);}
}

loadData();ensureDataButtons();renderAll();
