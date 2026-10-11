const defaultCats={Lebensmittel:'🛒',Wohnen:'🏠',Auto:'🚗',Freizeit:'🎬',Restaurant:'🍽️',Shopping:'🛍️',Gesundheit:'❤️',Gehalt:'💼',Versicherung:'🛡️',Sonstiges:'•••'};
const $=id=>document.getElementById(id), money=n=>new Intl.NumberFormat('de-AT',{style:'currency',currency:'EUR'}).format(n), key='hb-v1';
let db=JSON.parse(localStorage.getItem(key)||'{"transactions":[],"recurring":[]}'), view=new Date(); view.setDate(1);
if(!db.categories) db.categories={...defaultCats};
function cats(){return db.categories}
function save(){localStorage.setItem(key,JSON.stringify(db))}
function ym(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function localDate(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function num(v){return Number(String(v).replace(',','.'))}
function allCategoryNames(){return [...new Set([...Object.keys(cats()),...db.transactions.map(t=>t.category),...db.recurring.map(r=>r.category)].filter(Boolean))]}
function icon(c){return cats()[c]||defaultCats[c]||'•'}
function applyRecurring(){let now=new Date(),k=ym(now),marker='applied-'+k;if(localStorage.getItem(marker))return;db.recurring.forEach(r=>{let date=localDate(now.getFullYear(),now.getMonth(),Math.min(r.day,28));if(!db.transactions.some(t=>t.recurringId===r.id&&t.date.startsWith(k)))db.transactions.push({id:crypto.randomUUID(),type:r.type,amount:r.amount,category:r.category,date,note:r.name,recurringId:r.id})});save();localStorage.setItem(marker,'1')}
function fillCats(){let h=allCategoryNames().map(c=>`<option>${esc(c)}</option>`).join('');$('category').innerHTML=h;$('rCategory').innerHTML=h}
function renderCategories(){
 $('categoryList').innerHTML=Object.entries(cats()).map(([name,emoji])=>`<div class="catManageRow"><span class="emoji">${esc(emoji)}</span><b>${esc(name)}</b><span class="spacer"></span><button class="smallBtn" data-edit="${encodeURIComponent(name)}">Bearbeiten</button><button class="smallBtn danger" data-delete="${encodeURIComponent(name)}">Löschen</button></div>`).join('');
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openCategory(decodeURIComponent(b.dataset.edit)));
 document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteCategory(decodeURIComponent(b.dataset.delete)));
}
function renderChart(tx){
 const expenses=tx.filter(t=>t.type==='expense'), total=expenses.reduce((s,t)=>s+t.amount,0), sums={};
 expenses.forEach(t=>sums[t.category]=(sums[t.category]||0)+t.amount);
 const entries=Object.entries(sums).sort((a,b)=>b[1]-a[1]);
 $('chartTotal').textContent=money(total);
 if(!total){$('donut').style.background='var(--soft)';$('chartLegend').innerHTML='<div class="empty">Noch keine Ausgaben in diesem Monat.</div>';return}
 const palette=['#007aff','#34c759','#ff9500','#af52de','#ff3b30','#5ac8fa','#ffcc00','#5856d6','#30b0c7','#8e8e93'];
 let acc=0,stops=[];
 entries.forEach(([c,v],i)=>{let start=acc, end=acc+v/total*360;stops.push(`${palette[i%palette.length]} ${start}deg ${end}deg`);acc=end});
 $('donut').style.background=`conic-gradient(${stops.join(',')})`;
 $('chartLegend').innerHTML=entries.map(([c,v],i)=>`<button class="legendRow" data-detail="${encodeURIComponent(c)}"><span class="dot" style="background:${palette[i%palette.length]}"></span><span>${icon(c)} ${esc(c)}</span><b>${money(v)}</b><small>${Math.round(v/total*100)} %</small></button>`).join('');
 document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>showCategoryDetail(decodeURIComponent(b.dataset.detail)));
}
function render(){
 let k=ym(view),tx=db.transactions.filter(t=>t.date.startsWith(k)).sort((a,b)=>b.date.localeCompare(a.date)),inc=tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),exp=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
 $('monthTitle').textContent=new Intl.DateTimeFormat('de-AT',{month:'long',year:'numeric'}).format(view);$('income').textContent=money(inc);$('expense').textContent=money(exp);$('available').textContent=money(inc-exp);
 $('txList').innerHTML=tx.length?tx.map(t=>`<div class='row'><div class='meta'><span class='emoji'>${icon(t.category)}</span><div><b>${esc(t.note||t.category)}</b><small>${esc(t.category)} · ${new Date(t.date+'T12:00').toLocaleDateString('de-AT')}</small></div></div><b class='${t.type==='expense'?'negative':'positive'}'>${t.type==='expense'?'−':'+'}${money(t.amount)}</b></div>`).join(''):`<div class='empty'>Noch keine Buchungen in diesem Monat.</div>`;
 $('recurringList').innerHTML=db.recurring.length?db.recurring.map(r=>`<div class='row'><div class='meta'><span class='emoji'>${icon(r.category)}</span><div><b>${esc(r.name)}</b><small>monatlich am ${r.day}. · ${esc(r.category)}</small></div></div><b>${r.type==='expense'?'−':'+'}${money(r.amount)}</b></div>`).join(''):`<div class='empty'>Keine monatlichen Buchungen eingerichtet.</div>`;
 fillCats();renderCategories();renderChart(tx);
}
function showCategoryDetail(category){let k=ym(view),tx=db.transactions.filter(t=>t.date.startsWith(k)&&t.type==='expense'&&t.category===category).sort((a,b)=>b.date.localeCompare(a.date));$('detailTitle').textContent=`${icon(category)} ${category}`;$('detailList').innerHTML=tx.map(t=>`<div class='row'><div><b>${esc(t.note||category)}</b><small>${new Date(t.date+'T12:00').toLocaleDateString('de-AT')}</small></div><b class='negative'>−${money(t.amount)}</b></div>`).join('')||'<div class="empty">Keine Buchungen.</div>';$('categoryDetailDialog').showModal()}
function openCategory(name=''){$('categoryDialogTitle').textContent=name?'Kategorie bearbeiten':'Kategorie hinzufügen';$('categoryOldName').value=name;$('categoryName').value=name;$('categoryEmoji').value=name?cats()[name]||'':'';$('categoryDialog').showModal();setTimeout(()=>(name?$('categoryName'):$('categoryEmoji')).focus(),100)}
function deleteCategory(name){let used=db.transactions.some(t=>t.category===name)||db.recurring.some(r=>r.category===name);if(used){alert('Diese Kategorie wird bereits verwendet. Bestehende Buchungen bleiben geschützt. Du kannst sie stattdessen umbenennen.');return}if(confirm(`Kategorie „${name}“ löschen?`)){delete db.categories[name];save();render()}}
$('addCategoryBtn').onclick=()=>openCategory();
$('categoryForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return;let old=$('categoryOldName').value,name=$('categoryName').value.trim(),emoji=$('categoryEmoji').value.trim();if(!name||!emoji){e.preventDefault();return}if(!old&&cats()[name]){e.preventDefault();alert('Diese Kategorie gibt es bereits.');return}if(old&&old!==name){db.transactions.forEach(t=>{if(t.category===old)t.category=name});db.recurring.forEach(r=>{if(r.category===old)r.category=name});delete db.categories[old]}db.categories[name]=emoji;save();setTimeout(render)};
let quickType='expense';
function openQuick(type){quickType=type;$('quickTitle').textContent=type==='income'?'Einnahme':'Ausgabe';$('quickSymbol').textContent=type==='income'?'+':'−';$('quickSymbol').className=type==='income'?'qPositive':'qNegative';$('quickSave').textContent=type==='income'?'Einnahme speichern':'Ausgabe speichern';$('quickAmount').value='';$('quickNote').value='';$('quickDate').value=new Date().toISOString().slice(0,10);let names=allCategoryNames(),preferred=type==='income'?(names.includes('Gehalt')?'Gehalt':names[0]):(names.includes('Lebensmittel')?'Lebensmittel':names[0]);$('quickCats').innerHTML=names.map(c=>`<label class='catChoice'><input type='radio' name='quickCategory' value='${esc(c)}' ${c===preferred?'checked':''}><span><b>${icon(c)}</b><small>${esc(c)}</small></span></label>`).join('');$('quickDialog').showModal();setTimeout(()=>$('quickAmount').focus(),100)}
$('quickIncome').onclick=()=>openQuick('income');$('quickExpense').onclick=()=>openQuick('expense');
$('quickForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return;let a=num($('quickAmount').value),c=document.querySelector('input[name=quickCategory]:checked')?.value;if(!(a>0)||!c){e.preventDefault();return}db.transactions.push({id:crypto.randomUUID(),type:quickType,amount:a,category:c,date:$('quickDate').value,note:$('quickNote').value});save();setTimeout(render)};
$('addBtn').onclick=()=>{$('date').value=new Date().toISOString().slice(0,10);$('txDialog').showModal()};$('txForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return;let a=num($('amount').value);if(!(a>0)){e.preventDefault();return}db.transactions.push({id:crypto.randomUUID(),type:$('type').value,amount:a,category:$('category').value,date:$('date').value,note:$('note').value});save();setTimeout(render)};
$('addRecurringBtn').onclick=()=>$('recDialog').showModal();$('recForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return;let a=num($('rAmount').value);if(!(a>0)){e.preventDefault();return}db.recurring.push({id:crypto.randomUUID(),type:$('rType').value,name:$('rName').value,amount:a,category:$('rCategory').value,day:+$('rDay').value});save();setTimeout(render)};
$('prevMonth').onclick=()=>{view.setMonth(view.getMonth()-1);render()};$('nextMonth').onclick=()=>{view.setMonth(view.getMonth()+1);render()};$('todayMonth').onclick=()=>{view=new Date();view.setDate(1);render()};
function download(name,type,text){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
$('csvBtn').onclick=()=>{let k=ym(view),rows=[['Datum','Art','Kategorie','Notiz','Betrag'],...db.transactions.filter(t=>t.date.startsWith(k)).map(t=>[t.date,t.type==='income'?'Einnahme':'Ausgabe',t.category,t.note||'',String(t.amount).replace('.',',')])];download(`haushaltsbuch-${k}.csv`,'text/csv;charset=utf-8','\ufeff'+rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(';')).join('\n'))};
$('backupBtn').onclick=()=>download('haushaltsbuch-backup.json','application/json',JSON.stringify(db,null,2));$('importFile').onchange=async e=>{try{let x=JSON.parse(await e.target.files[0].text());if(!Array.isArray(x.transactions)||!Array.isArray(x.recurring))throw 0;db=x;if(!db.categories)db.categories={...defaultCats};save();render();alert('Backup wurde importiert.')}catch{alert('Dieses Backup konnte nicht gelesen werden.')}};
fillCats();applyRecurring();render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
