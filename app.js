const defaultCats={Lebensmittel:'🛒',Wohnen:'🏠',Auto:'🚗',Freizeit:'🎬',Restaurant:'🍽️',Shopping:'🛍️',Gesundheit:'❤️',Gehalt:'💼',Versicherung:'🛡️',Sonstiges:'•••'};
const $=id=>document.getElementById(id), money=n=>new Intl.NumberFormat('de-AT',{style:'currency',currency:'EUR'}).format(n), key='hb-v1';
let db=JSON.parse(localStorage.getItem(key)||'{"transactions":[],"recurring":[]}'), view=new Date(); view.setDate(1);
if(!db.categories) db.categories={...defaultCats};
// Ensure older transactions can always be edited/deleted.
db.transactions.forEach(t=>{if(!t.id)t.id=crypto.randomUUID()});
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
 const expenses=tx.filter(t=>t.type==='expense'), incomes=tx.filter(t=>t.type==='income');
 const total=expenses.reduce((s,t)=>s+t.amount,0), incomeTotal=incomes.reduce((s,t)=>s+t.amount,0), sums={};
 expenses.forEach(t=>sums[t.category]=(sums[t.category]||0)+t.amount);
 const entries=Object.entries(sums).sort((a,b)=>b[1]-a[1]);
 $('chartIncome').textContent=`+ ${money(incomeTotal)}`;
 $('chartExpense').textContent=`− ${money(total)}`;
 if(!total){$('donutSegments').innerHTML='';$('chartLegend').innerHTML='<div class="empty">Noch keine Ausgaben in diesem Monat.</div>';return}
 const palette=['#2f80ed','#43b92d','#ff9f0a','#7545d8','#ff375f','#19b8bd','#ffcc00','#5856d6','#30b0c7','#7f8b99'];
 let acc=0,stops=[];
 entries.forEach(([c,v],i)=>{let start=acc,end=acc+v/total*360;stops.push(`${palette[i%palette.length]} ${start}deg ${end}deg`);acc=end});
 const circumference=2*Math.PI*88;
 let offset=0;
 $('donutSegments').innerHTML=entries.map(([c,v],i)=>{
   const len=v/total*circumference, gap=Math.min(3,circumference*0.006), dash=Math.max(0,len-gap);
   const circle=`<circle cx="120" cy="120" r="88" fill="none" stroke="${palette[i%palette.length]}" stroke-width="34" stroke-linecap="butt" stroke-dasharray="${dash} ${circumference-dash}" stroke-dashoffset="${-offset}"></circle>`;
   offset+=len; return circle;
 }).join('');
 let angleAcc=0;
 $('chartLegend').innerHTML=entries.map(([c,v],i)=>{
   const share=v/total, mid=angleAcc+share*180; angleAcc+=share*360;
   return `<button class="orbitLabel" style="--angle:${mid}deg;--catColor:${palette[i%palette.length]}" data-detail="${encodeURIComponent(c)}" aria-label="${esc(c)} ${Math.round(share*100)} Prozent"><span class="orbitBubble">${icon(c)}</span><strong>${Math.round(share*100)}%</strong><small>${esc(c)}</small></button>`
 }).join('');
 document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>showCategoryDetail(decodeURIComponent(b.dataset.detail)));
}
function render(){
 let k=ym(view),tx=db.transactions.filter(t=>t.date.startsWith(k)).sort((a,b)=>b.date.localeCompare(a.date)),inc=tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),exp=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
 $('monthTitle').textContent=new Intl.DateTimeFormat('de-AT',{month:'long',year:'numeric'}).format(view);$('income').textContent=money(inc);$('expense').textContent=money(exp);$('available').textContent=money(inc-exp);
 $('txList').innerHTML=tx.length?tx.map(t=>`<div class='row txEditable'><div class='meta'><span class='emoji'>${icon(t.category)}</span><div><b>${esc(t.note||t.category)}</b><small>${esc(t.category)} · ${new Date(t.date+'T12:00').toLocaleDateString('de-AT')}</small></div></div><div class='txRight'><b class='${t.type==='expense'?'negative':'positive'}'>${t.type==='expense'?'−':'+'}${money(t.amount)}</b><div class='txActions'><button type='button' class='iconBtn editTx' data-id='${t.id}' aria-label='Buchung bearbeiten'>✎</button><button type='button' class='iconBtn deleteTx' data-id='${t.id}' aria-label='Buchung löschen'>🗑</button></div></div></div>`).join(''):`<div class='empty'>Noch keine Buchungen in diesem Monat.</div>`;
 $('recurringList').innerHTML=db.recurring.length?db.recurring.map(r=>`<div class='row'><div class='meta'><span class='emoji'>${icon(r.category)}</span><div><b>${esc(r.name)}</b><small>monatlich am ${r.day}. · ${esc(r.category)}</small></div></div><b>${r.type==='expense'?'−':'+'}${money(r.amount)}</b></div>`).join(''):`<div class='empty'>Keine monatlichen Buchungen eingerichtet.</div>`;
 fillCats();renderCategories();renderChart(tx);
}
function showCategoryDetail(category){let k=ym(view),tx=db.transactions.filter(t=>t.date.startsWith(k)&&t.type==='expense'&&t.category===category).sort((a,b)=>b.date.localeCompare(a.date));$('detailTitle').textContent=`${icon(category)} ${category}`;$('detailList').innerHTML=tx.map(t=>`<div class='row'><div><b>${esc(t.note||category)}</b><small>${new Date(t.date+'T12:00').toLocaleDateString('de-AT')}</small></div><b class='negative'>−${money(t.amount)}</b></div>`).join('')||'<div class="empty">Keine Buchungen.</div>';$('categoryDetailDialog').showModal()}
function openCategory(name=''){$('categoryDialogTitle').textContent=name?'Kategorie bearbeiten':'Kategorie hinzufügen';$('categoryOldName').value=name;$('categoryName').value=name;$('categoryEmoji').value=name?cats()[name]||'':'';$('categoryDialog').showModal();setTimeout(()=>(name?$('categoryName'):$('categoryEmoji')).focus(),100)}
function deleteCategory(name){let used=db.transactions.some(t=>t.category===name)||db.recurring.some(r=>r.category===name);if(used){alert('Diese Kategorie wird bereits verwendet. Bestehende Buchungen bleiben geschützt. Du kannst sie stattdessen umbenennen.');return}if(confirm(`Kategorie „${name}“ löschen?`)){delete db.categories[name];save();render()}}
$('addCategoryBtn').onclick=()=>openCategory();
$('categoryForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return;let old=$('categoryOldName').value,name=$('categoryName').value.trim(),emoji=$('categoryEmoji').value.trim();if(!name||!emoji){e.preventDefault();return}if(!old&&cats()[name]){e.preventDefault();alert('Diese Kategorie gibt es bereits.');return}if(old&&old!==name){db.transactions.forEach(t=>{if(t.category===old)t.category=name});db.recurring.forEach(r=>{if(r.category===old)r.category=name});delete db.categories[old]}db.categories[name]=emoji;save();$('categoryDialog').close();render();e.preventDefault()};
let quickType='expense';
function openQuick(type){quickType=type;$('quickTitle').textContent=type==='income'?'Einnahme':'Ausgabe';$('quickSymbol').textContent=type==='income'?'+':'−';$('quickSymbol').className=type==='income'?'qPositive':'qNegative';$('quickSave').textContent=type==='income'?'Einnahme speichern':'Ausgabe speichern';$('quickAmount').value='';$('quickNote').value='';$('quickDate').value=new Date().toISOString().slice(0,10);let names=allCategoryNames(),preferred=type==='income'?(names.includes('Gehalt')?'Gehalt':names[0]):(names.includes('Lebensmittel')?'Lebensmittel':names[0]);$('quickCats').innerHTML=names.map(c=>`<label class='catChoice'><input type='radio' name='quickCategory' value='${esc(c)}' ${c===preferred?'checked':''}><span><b>${icon(c)}</b><small>${esc(c)}</small></span></label>`).join('');$('quickDialog').showModal();setTimeout(()=>$('quickAmount').focus(),100)}
$('quickIncome').onclick=()=>openQuick('income');$('quickExpense').onclick=()=>openQuick('expense');
$('quickForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return;let a=num($('quickAmount').value),c=document.querySelector('input[name=quickCategory]:checked')?.value;if(!(a>0)||!c){e.preventDefault();return}db.transactions.push({id:crypto.randomUUID(),type:quickType,amount:a,category:c,date:$('quickDate').value,note:$('quickNote').value});save();$('quickDialog').close();render();e.preventDefault()};
$('addBtn').onclick=()=>{$('date').value=new Date().toISOString().slice(0,10);$('txDialog').showModal()};$('txForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return;let a=num($('amount').value);if(!(a>0)){e.preventDefault();return}db.transactions.push({id:crypto.randomUUID(),type:$('type').value,amount:a,category:$('category').value,date:$('date').value,note:$('note').value});save();$('txDialog').close();render();e.preventDefault()};
$('addRecurringBtn').onclick=()=>$('recDialog').showModal();$('recForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return;let a=num($('rAmount').value);if(!(a>0)){e.preventDefault();return}db.recurring.push({id:crypto.randomUUID(),type:$('rType').value,name:$('rName').value,amount:a,category:$('rCategory').value,day:+$('rDay').value});save();$('recDialog').close();render();e.preventDefault()};
$('prevMonth').onclick=()=>{view.setMonth(view.getMonth()-1);render()};$('nextMonth').onclick=()=>{view.setMonth(view.getMonth()+1);render()};$('todayMonth').onclick=()=>{view=new Date();view.setDate(1);render()};
function download(name,type,text){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
$('csvBtn').onclick=()=>{let k=ym(view),rows=[['Datum','Art','Kategorie','Notiz','Betrag'],...db.transactions.filter(t=>t.date.startsWith(k)).map(t=>[t.date,t.type==='income'?'Einnahme':'Ausgabe',t.category,t.note||'',String(t.amount).replace('.',',')])];download(`haushaltsbuch-${k}.csv`,'text/csv;charset=utf-8','\ufeff'+rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(';')).join('\n'))};
$('backupBtn').onclick=()=>download('haushaltsbuch-backup.json','application/json',JSON.stringify(db,null,2));$('importFile').onchange=async e=>{try{let x=JSON.parse(await e.target.files[0].text());if(!Array.isArray(x.transactions)||!Array.isArray(x.recurring))throw 0;db=x;if(!db.categories)db.categories={...defaultCats};save();render();alert('Backup wurde importiert.')}catch{alert('Dieses Backup konnte nicht gelesen werden.')}};



function openEditTransaction(id){
 const t=db.transactions.find(x=>x.id===id); if(!t)return;
 $('editTxId').value=t.id;
 $('editTxType').value=t.type;
 $('editTxAmount').value=String(t.amount);
 $('editTxDate').value=t.date;
 $('editTxNote').value=t.note||'';
 const names=allCategoryNames();
 $('editTxCategory').innerHTML=names.map(c=>`<option value="${esc(c)}" ${c===t.category?'selected':''}>${esc(c)}</option>`).join('');
 $('editTxCategory').value=t.category;
 $('editTxDialog').showModal();
}
$('txList').addEventListener('click',e=>{
 const edit=e.target.closest('.editTx'), del=e.target.closest('.deleteTx');
 if(edit){openEditTransaction(edit.dataset.id);return}
 if(del){
   const t=db.transactions.find(x=>x.id===del.dataset.id); if(!t)return;
   const label=`${t.type==='expense'?'Ausgabe':'Einnahme'} ${money(t.amount)} – ${t.category}`;
   if(confirm(`Diese Buchung wirklich löschen?\n\n${label}`)){
     db.transactions=db.transactions.filter(x=>x.id!==t.id); save(); render();
   }
 }
});
$('editTxForm').onsubmit=e=>{
 e.preventDefault();
 const id=$('editTxId').value, t=db.transactions.find(x=>x.id===id); if(!t)return;
 const amount=num($('editTxAmount').value);
 if(!Number.isFinite(amount)||amount<=0){alert('Bitte einen gültigen Betrag eingeben.');return}
 t.type=$('editTxType').value;
 t.amount=amount;
 t.category=$('editTxCategory').value;
 t.date=$('editTxDate').value;
 t.note=$('editTxNote').value.trim();
 save(); $('editTxDialog').close(); render();
};

let pendingMonefy=[];

function parseMonefyAmount(raw){
 let s=String(raw??'').trim().replace(/\s/g,'').replace(/[€]/g,'');
 if(!s)return NaN;
 // Supports -12,50 / 1250 / 1.250,50 / 1,250.50
 if(s.includes(',')&&s.includes('.')){
   if(s.lastIndexOf(',')>s.lastIndexOf('.')) s=s.replace(/\./g,'').replace(',','.');
   else s=s.replace(/,/g,'');
 } else if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.');
 return Number(s);
}
function parseMonefyDate(raw){
 const m=String(raw??'').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
 if(!m)return '';
 return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
}
function splitSemicolonCSV(text){
 text=text.replace(/^\uFEFF/,'');
 const rows=[]; let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){
   const ch=text[i];
   if(ch==='"'){
     if(quoted&&text[i+1]==='"'){field+='"';i++}
     else quoted=!quoted;
   }else if(ch===';'&&!quoted){row.push(field);field=''}
   else if((ch==='\n'||ch==='\r')&&!quoted){
     if(ch==='\r'&&text[i+1]==='\n')i++;
     row.push(field);field='';
     if(row.some(v=>v.trim()!==''))rows.push(row);
     row=[];
   }else field+=ch;
 }
 row.push(field); if(row.some(v=>v.trim()!==''))rows.push(row);
 return rows;
}
function uniqueImportId(t){
 const base=`${t.date}|${t.type}|${t.amount}|${t.category}|${t.note||''}`;
 return base;
}
$('monefyFile').onchange=async e=>{
 const file=e.target.files?.[0]; if(!file)return;
 try{
   const rows=splitSemicolonCSV(await file.text());
   if(rows.length<2)throw new Error('Keine Daten gefunden.');
   const headers=rows[0].map(h=>h.trim().toLowerCase());
   const idx=name=>headers.indexOf(name);
   const dateI=idx('date'), catI=idx('category'), amountI=idx('amount'), descI=idx('description');
   if(dateI<0||catI<0||amountI<0)throw new Error('Die Spalten date, category und amount wurden nicht gefunden.');
   const parsed=[], skipped=[];
   rows.slice(1).forEach((r,n)=>{
     const date=parseMonefyDate(r[dateI]), category=String(r[catI]??'').trim(), signed=parseMonefyAmount(r[amountI]);
     if(!date||!category||!Number.isFinite(signed)||signed===0){skipped.push(n+2);return}
     parsed.push({id:crypto.randomUUID(),type:signed<0?'expense':'income',amount:Math.abs(signed),category,date,note:descI>=0?String(r[descI]??'').trim():''});
   });
   pendingMonefy=parsed;
   const inc=parsed.filter(t=>t.type==='income'), exp=parsed.filter(t=>t.type==='expense');
   const newCats=[...new Set(parsed.map(t=>t.category))].filter(c=>!cats()[c]);
   const existing=new Set(db.transactions.map(uniqueImportId));
   const dupes=parsed.filter(t=>existing.has(uniqueImportId(t))).length;
   $('monefyFileName').textContent=file.name;
   $('monefySummary').innerHTML=`<div><b>${parsed.length}</b><small>Buchungen erkannt</small></div><div class="positive"><b>${inc.length}</b><small>Einnahmen</small></div><div class="negative"><b>${exp.length}</b><small>Ausgaben</small></div><div><b>${newCats.length}</b><small>neue Kategorien</small></div>`;
   $('monefyWarnings').innerHTML=(skipped.length?`<p>⚠️ ${skipped.length} Zeile(n) ohne gültiges Datum, Kategorie oder Betrag werden übersprungen.</p>`:'')+(dupes?`<p>ℹ️ ${dupes} bereits vorhandene identische Buchung(en) werden nicht erneut importiert.</p>`:'');
   $('monefyPreview').innerHTML=parsed.slice(0,8).map(t=>`<div class="importRow"><span>${new Date(t.date+'T12:00').toLocaleDateString('de-AT')}</span><span>${esc(t.category)}</span><b class="${t.type==='expense'?'negative':'positive'}">${t.type==='expense'?'−':'+'}${money(t.amount)}</b></div>`).join('')+(parsed.length>8?`<small class="muted">… und ${parsed.length-8} weitere</small>`:'');
   $('monefyImportBtn').disabled=!parsed.length;
   $('monefyDialog').showModal();
 }catch(err){alert('Monefy-Datei konnte nicht gelesen werden: '+(err.message||'Unbekannter Fehler'))}
 finally{e.target.value=''}
};
$('monefyForm').onsubmit=e=>{
 e.preventDefault();
 if(!pendingMonefy.length)return;
 const existing=new Set(db.transactions.map(uniqueImportId));
 let added=0;
 pendingMonefy.forEach(t=>{
   if(existing.has(uniqueImportId(t)))return;
   if(!cats()[t.category]) db.categories[t.category]=defaultCats[t.category]||'•';
   db.transactions.push(t); existing.add(uniqueImportId(t)); added++;
 });
 save(); $('monefyDialog').close(); pendingMonefy=[]; render();
 alert(`${added} Monefy-Buchung${added===1?'':'en'} importiert.`);
};

document.querySelectorAll('.cancelDialog').forEach(btn=>btn.addEventListener('click',()=>btn.closest('dialog')?.close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',e=>{e.preventDefault();d.close()}));

fillCats();applyRecurring();render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
