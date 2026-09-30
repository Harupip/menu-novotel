/* DOCX is generated locally. Only dish names requested for translation are sent to MyMemory. */
const STORE = "soan-menu-v1";
const seedGroups = [["Khai vị","Appetizer"],["Súp","Soup"],["Món chính","Main course"],["Tráng miệng","Dessert"]];
const fieldLabels = {title:"Tên menu",subtitle:"Dòng phụ / tên đoàn",price:"Giá / ghi chú"};
const uid = () => crypto.randomUUID();
const style = (text="",bold=false,size=13) => ({text,bold,italic:false,underline:false,size});
function newMenu(n=1) {
 return {id:uid(),title:style("WESTERN SET MENU "+n,true,20),subtitle:style("",false,13),price:style("",false,13),
 showVietnameseGroups:false,showStars:true,languageOrder:"en-first",
 groups:seedGroups.map(([vi,en])=>({id:uid(),vi,en,items:[]}))};
}
function sample(){
 const m=newMenu();
 const dishes=[
 [["Tôm với quả bơ và sốt chanh dây","Prawns with avocado and passion fruit sauce"]],
 [["Súp kem bí đỏ","Cream of pumpkin soup"],["Các loại bánh mì với bơ và mứt ăn kèm","Assorted bread rolls served with butter and jam"]],
 [["Cá hồi nướng ăn kèm rau củ và sốt mù tạt","Grilled salmon with vegetables and mustard sauce"],["Bò hầm khoai tây với rượu vang đỏ","Braised beef with potatoes and red wine"]],
 [["Bánh tiramisu","Tiramisu"]]];
 m.groups.forEach((g,i)=>g.items=dishes[i].map(([vi,en])=>({id:uid(),vi,en})));
 return {menus:[m],active:m.id};
}
let state=sample();
function validState(s){return s && Array.isArray(s.menus) && s.menus.length>0 && s.menus.every(m=>typeof m.id==="string" && ["title","subtitle","price"].every(k=>m[k] && typeof m[k].text==="string" && [11,12,13,14,16,18,20,22,24,28].includes(m[k].size)) && Array.isArray(m.groups) && m.groups.every(g=>typeof g.id==="string" && typeof g.vi==="string" && typeof g.en==="string" && Array.isArray(g.items) && g.items.every(i=>typeof i.id==="string" && typeof i.vi==="string" && typeof i.en==="string")));}
try {const saved=JSON.parse(localStorage.getItem(STORE));if(validState(saved))state=saved;} catch {}
for(const m of state.menus){
 m.showVietnameseGroups=m.showVietnameseGroups===true;
 m.showStars=m.showStars!==false;
 m.languageOrder=m.languageOrder==="vi-first"?"vi-first":"en-first";
}
if(!state.menus.some(m=>m.id===state.active))state.active=state.menus[0].id;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const current=()=>state.menus.find(m=>m.id===state.active);
let toastTimer;
function notify(msg){$("#status").textContent=msg;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("#status").textContent="",4500);}
const translateText=DishTranslation.createTranslator();
let translationUndo=null,translating=false;
async function translateDish(item,changes){
 const translated=await translateText(item.vi);
 changes.push({item,before:item.en,after:translated});
 item.en=translated;
}
function undoTranslation(){
 if(translating||translationUndo?.menuId!==current().id)return false;
 const items=new Set(current().groups.flatMap(g=>g.items));
 for(const {item,before,after} of translationUndo.changes){
  if(items.has(item)&&item.en===after)item.en=before;
 }
 translationUndo=null;save();render();notify("Đã hoàn tác lần dịch vừa rồi.");
 return true;
}
document.addEventListener("keydown",e=>{
 if(e.key.toLowerCase()!=="z"||!(e.ctrlKey||e.metaKey)||e.shiftKey||e.altKey||e.target.closest("input,textarea,select,[contenteditable]"))return;
 if(undoTranslation())e.preventDefault();
});
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));$("#save-state").textContent="Đã lưu trên thiết bị này";}catch{$("#save-state").textContent="Chưa lưu được bản nháp";}preview();}
function formatButtons(k,f){return '<div class="format" role="group" aria-label="Định dạng '+fieldLabels[k]+'">'+[["bold","B","In đậm"],["italic","I","In nghiêng"],["underline","U","Gạch chân"]].map(([a,t,label])=>'<button type="button" data-action="format" data-field="'+k+'" data-format="'+a+'" aria-label="'+label+' '+fieldLabels[k]+'" aria-pressed="'+!!f[a]+'" style="'+(a==="bold"?"font-weight:bold":a==="italic"?"font-style:italic":"text-decoration:underline")+'">'+t+'</button>').join("")+'<select data-field="'+k+'" data-size aria-label="Cỡ chữ '+fieldLabels[k]+'">'+[11,12,13,14,16,18,20,22,24,28].map(n=>'<option '+(n===f.size?"selected":"")+' value="'+n+'">'+n+' pt</option>').join("")+'</select></div>';}
function render(){
 const m=current();
 $("#tabs").innerHTML=state.menus.map((x,i)=>'<button data-menu="'+x.id+'" aria-selected="'+(x.id===m.id)+'">Menu '+(i+1)+'</button>').join("");
 $("#form").innerHTML='<section class="card"><h2>Trình bày menu</h2><p class="hint">Áp dụng cho toàn bộ menu đang chọn, cả bản xem trước và file Word.</p><label class="check"><input type="checkbox" data-option="showVietnameseGroups" '+(m.showVietnameseGroups?"checked":"")+'> Hiện tên nhóm tiếng Việt</label><label class="check"><input type="checkbox" data-option="showStars" '+(m.showStars?"checked":"")+'> Hiện *** phía trên các nhóm món</label><div class="field"><label for="language-order">Thứ tự ngôn ngữ</label><select id="language-order" data-option="languageOrder"><option value="en-first" '+(m.languageOrder==="en-first"?"selected":"")+'>Tiếng Anh trước · Tiếng Việt sau</option><option value="vi-first" '+(m.languageOrder==="vi-first"?"selected":"")+'>Tiếng Việt trước · Tiếng Anh sau</option></select></div></section>'+
 '<section class="card"><h2>Thông tin đầu menu</h2><p class="hint">Chọn B, I, U cho từng dòng. Có thể kết hợp cả ba.</p>'+Object.entries(fieldLabels).map(([k,label])=>'<div class="field"><label for="field-'+k+'">'+label+'</label><input id="field-'+k+'" data-field="'+k+'" value="'+esc(m[k].text)+'" placeholder="'+(k==="price"?"Ví dụ: VND 700,000 / person":k==="subtitle"?"Không bắt buộc":"Tên menu")+'">'+formatButtons(k,m[k])+'</div>').join("")+'</section>'+
 '<section class="translate-card"><div><strong>Dịch nhanh tên món</strong><p>Chỉ tên món tiếng Việt chưa có bản tiếng Anh được gửi tới MyMemory. Hãy kiểm tra lại thuật ngữ ẩm thực trước khi xuất Word.</p><button type="button" data-action="undo-translation" '+(translating||translationUndo?.menuId!==m.id?"disabled":"")+'>Hoàn tác dịch (Ctrl+Z)</button></div><button type="button" data-action="translate-all">Dịch các món còn thiếu</button></section>'+
 m.groups.map((g,gi)=>'<section class="card" data-group="'+g.id+'"><div class="group-head"><h2>Nhóm món '+(gi+1)+'</h2><div class="tools"><button data-action="group-up" aria-label="Đưa nhóm lên" '+(!gi?"disabled":"")+'>↑</button><button data-action="group-down" aria-label="Đưa nhóm xuống" '+(gi===m.groups.length-1?"disabled":"")+'>↓</button><button class="danger" data-action="group-delete" aria-label="Xóa nhóm '+esc(g.vi)+'">Xóa</button></div></div><div class="name-grid"><div><label for="gvi-'+g.id+'">Tên nhóm · Tiếng Việt</label><input id="gvi-'+g.id+'" data-group-name="vi" value="'+esc(g.vi)+'"></div><div><label for="gen-'+g.id+'">Tên nhóm · Tiếng Anh</label><input id="gen-'+g.id+'" data-group-name="en" value="'+esc(g.en)+'"></div></div>'+
 g.items.map((d,di)=>'<div class="dish" data-item="'+d.id+'"><div class="dish-top"><span>MÓN '+(di+1)+'</span><div class="tools"><button data-action="item-up" aria-label="Đưa món lên" '+(!di?"disabled":"")+'>↑</button><button data-action="item-down" aria-label="Đưa món xuống" '+(di===g.items.length-1?"disabled":"")+'>↓</button><button data-action="item-delete" class="danger" aria-label="Xóa món">Xóa</button></div></div><label for="vi-'+d.id+'">Tiếng Việt</label><input id="vi-'+d.id+'" data-lang="vi" value="'+esc(d.vi)+'" placeholder="Nhập tên món tiếng Việt"><div class="translation-label"><label for="en-'+d.id+'">Tiếng Anh</label><button type="button" class="translate-one" data-action="translate-one" '+(!d.vi.trim()?"disabled":"")+'>'+(d.en.trim()?"Dịch lại":"Dịch tên món")+'</button></div><input id="en-'+d.id+'" data-lang="en" value="'+esc(d.en)+'" placeholder="Nhập hoặc dịch tự động sang tiếng Anh"></div>').join("")+'<button class="add-dish" data-action="item-add">+ Thêm món</button></section>').join("")+
 '<div class="bottom-actions"><button data-action="group-add">+ Thêm nhóm món</button>'+(state.menus.length>1?'<button class="danger" data-action="menu-delete">Xóa menu này</button>':"")+'</div>';
 preview();
}
function orderedLanguages(m){return m.languageOrder==="vi-first"?["vi","en"]:["en","vi"];}
function groupTitle(g,m){return orderedLanguages(m).filter(lang=>lang!=="vi"||m.showVietnameseGroups).map(lang=>g[lang]).filter(t=>t.trim()).join(" / ");}
function preview(){
 const m=current();
 $("#paper").innerHTML=["title","subtitle","price"].filter(k=>m[k].text.trim()).map(k=>{const f=m[k];return '<p class="heading" style="font-size:'+f.size+'pt;font-weight:'+(f.bold?"bold":"normal")+';font-style:'+(f.italic?"italic":"normal")+';text-decoration:'+(f.underline?"underline":"none")+'">'+esc(f.text)+'</p>';}).join("")+
 m.groups.filter(g=>g.items.some(i=>i.vi.trim()||i.en.trim())).map(g=>'<section class="group">'+(m.showStars?'<div class="stars">***</div>':"")+(groupTitle(g,m)?'<h3>'+esc(groupTitle(g,m))+'</h3>':"")+g.items.filter(i=>i.vi.trim()||i.en.trim()).map(i=>'<div class="menu-dish">'+orderedLanguages(m).filter(lang=>i[lang].trim()).map(lang=>'<p class="'+lang+'">'+esc(i[lang])+'</p>').join("")+'</div>').join("")+'</section>').join("")+
 (m.groups.every(g=>g.items.every(i=>!i.vi.trim()&&!i.en.trim()))?'<p class="empty">Thêm món để xem menu tại đây.</p>':"");
 $("#export").textContent=state.menus.length>1?"Tải Word · "+state.menus.length+" menu":"Tải file Word";
}
function groupFor(el){return current().groups.find(g=>g.id===el.closest("[data-group]")?.dataset.group);}
$("#form").addEventListener("input",e=>{
 const t=e.target,m=current(),g=groupFor(t);
 if(t.matches("input[data-field]"))m[t.dataset.field].text=t.value;
 else if(t.matches("[data-group-name]"))g[t.dataset.groupName]=t.value;
 else if(t.matches("[data-lang]"))g.items.find(i=>i.id===t.closest("[data-item]").dataset.item)[t.dataset.lang]=t.value;
 else return;
 save();
});
$("#form").addEventListener("change",e=>{const t=e.target;if(t.matches("[data-option]"))current()[t.dataset.option]=t.type==="checkbox"?t.checked:t.value;else if(t.matches("[data-size]"))current()[t.dataset.field].size=Number(t.value);else return;save();});
function move(list,index,delta){const to=index+delta;if(index>=0 && to>=0 && to<list.length)[list[index],list[to]]=[list[to],list[index]];}
$("#form").addEventListener("click",async e=>{
 const b=e.target.closest("button[data-action]");if(!b)return;
 const m=current(),g=groupFor(b),a=b.dataset.action,gi=m.groups.indexOf(g);
 const id=b.closest("[data-item]")?.dataset.item,di=g?.items.findIndex(i=>i.id===id);
 if(a==="undo-translation"){undoTranslation();return;}
 if(a==="format"){m[b.dataset.field][b.dataset.format]=!m[b.dataset.field][b.dataset.format];b.setAttribute("aria-pressed",m[b.dataset.field][b.dataset.format]);save();return;}
 if(a==="translate-one"){
  if(translating)return;
  translating=true;const changes=[];
  const item=g.items[di];b.disabled=true;b.textContent="Đang dịch…";
  try{await translateDish(item,changes);translationUndo={menuId:m.id,changes};save();notify("Đã dịch tên món. Có thể hoàn tác dịch bằng Ctrl+Z.");}
  catch(error){console.error(error);b.disabled=false;b.textContent=item.en.trim()?"Dịch lại":"Dịch tên món";notify("Chưa dịch được. Kiểm tra kết nối mạng rồi thử lại.");}
  finally{translating=false;render();}
  return;
 }
 if(a==="translate-all"){
  if(translating)return;
  const items=m.groups.flatMap(group=>group.items).filter(item=>item.vi.trim()&&!item.en.trim());
  if(!items.length){notify("Không có món nào đang thiếu bản tiếng Anh.");return;}
  translating=true;const changes=[];
  b.disabled=true;b.textContent="Đang dịch 0/"+items.length+"…";let translated=0;
  for(const item of items){
   try{await translateDish(item,changes);translated++;b.textContent="Đang dịch "+translated+"/"+items.length+"…";}
   catch(error){console.error(error);break;}
  }
  if(changes.length)translationUndo={menuId:m.id,changes};
  translating=false;save();render();notify(translated===items.length?"Đã dịch "+translated+" tên món. Có thể hoàn tác dịch bằng Ctrl+Z.":"Đã dịch "+translated+"/"+items.length+" món; kết nối dịch bị gián đoạn.");
  return;
 }
 if(a==="group-add")m.groups.push({id:uid(),vi:"Nhóm mới",en:"",items:[]});
 if(a==="group-delete"){if(g.items.some(i=>i.vi.trim()||i.en.trim())&&!confirm("Xóa nhóm này cùng các món bên trong?"))return;m.groups.splice(gi,1);}
 if(a==="group-up")move(m.groups,gi,-1);
 if(a==="group-down")move(m.groups,gi,1);
 if(a==="item-add")g.items.push({id:uid(),vi:"",en:""});
 if(a==="item-delete"){if((g.items[di].vi.trim()||g.items[di].en.trim())&&!confirm("Xóa món này?"))return;g.items.splice(di,1);}
 if(a==="item-up")move(g.items,di,-1);
 if(a==="item-down")move(g.items,di,1);
 if(a==="menu-delete"){if(!confirm("Xóa toàn bộ menu này?"))return;state.menus=state.menus.filter(x=>x.id!==m.id);state.active=state.menus[0].id;}
 save();render();
 if(a==="item-add"){const group=document.querySelector('[data-group="'+g.id+'"]');group.querySelector(".dish:last-of-type input")?.focus();}
 if(a==="group-add")document.querySelector('[data-group="'+m.groups.at(-1).id+'"] input')?.focus();
});
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("[data-menu]");if(b){state.active=b.dataset.menu;save();render();}});
$("#add-menu").addEventListener("click",()=>{const m=newMenu(state.menus.length+1);state.menus.push(m);state.active=m.id;save();render();$("#field-title").focus();});
let importing=false;
$("#ai-prompt").value=MenuExcel.AI_PROMPT;
$("#copy-prompt").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText(MenuExcel.AI_PROMPT);$("#prompt-message").textContent="Đã sao chép. Dán vào AI và đính kèm file Word của bạn.";}
 catch{$("#prompt-details").open=true;$("#ai-prompt").focus();$("#ai-prompt").select();$("#prompt-message").textContent="Chọn sao chép trong ô prompt bên dưới.";}
});
$("#import-paste").addEventListener("click",()=>importFile({name:"noi-dung.md",size:new Blob([$("#import-text").value]).size,text:async()=>$("#import-text").value}));
$("#open-import").addEventListener("click",()=>$("#import-modal").showModal());
$("#close-import").addEventListener("click",()=>$("#import-modal").close());
$("#choose-import").addEventListener("click",()=>$("#import-excel").click());
for(const name of ["dragenter","dragover"])$("#drop-zone").addEventListener(name,e=>{e.preventDefault();$("#drop-zone").classList.add("drag-over");});
$("#drop-zone").addEventListener("dragleave",()=>$("#drop-zone").classList.remove("drag-over"));
$("#drop-zone").addEventListener("drop",e=>{e.preventDefault();$("#drop-zone").classList.remove("drag-over");if(e.dataTransfer.files.length!==1){$("#import-message").textContent="Chọn một file mỗi lần import.";return;}importFile(e.dataTransfer.files[0]);});
$("#import-excel").addEventListener("change",async e=>{await importFile(e.target.files[0]);e.target.value="";});
async function importFile(file){
 if(!file||importing)return;
 importing=true;$("#choose-import").disabled=true;$("#import-message").textContent="Đang đọc file…";
 try{
  if(!/\.(xlsx|md|txt)$/i.test(file.name)||file.size>5*1024*1024)throw new Error("Chọn file .xlsx, .md hoặc .txt tối đa 5 MB.");
  const parsed=/\.xlsx$/i.test(file.name)?MenuExcel.parseWorkbook(XLSX.read(await file.arrayBuffer(),{type:"array"}),XLSX):MenuExcel.parseText(await file.text(),XLSX);
  const menus=parsed.map(data=>{
   const m=newMenu();for(const k of ["title","subtitle","price"])m[k].text=data[k];
   m.groups=data.groups.map(g=>({...g,id:uid(),items:g.items.map(i=>({...i,id:uid()}))}));return m;
  });
  state.menus.push(...menus);state.active=menus[0].id;save();render();$("#import-message").textContent="Đã thêm "+menus.length+" menu từ "+file.name+". Đóng cửa sổ để chỉnh sửa menu.";
 }catch(error){console.error(error);$("#import-message").textContent=error.message||"Không đọc được file Excel.";}
 finally{importing=false;$("#choose-import").disabled=false;}
}
function buildDocument(menus,D){
 const {Document,Paragraph,TextRun,AlignmentType,UnderlineType}=D;
 const para=(text,opts={})=>new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:90,line:280},...opts,children:[new TextRun({text,font:"Times New Roman",size:26,...opts.run})]});
 return new Document({creator:"Soạn menu",title:menus[0]?.title.text||"Menu",
 styles:{default:{document:{run:{font:"Times New Roman",size:26,color:"000000"},paragraph:{spacing:{after:90}}}}},
 sections:menus.map(m=>{
 const children=[];
 for(const k of ["title","subtitle","price"]){const f=m[k];if(f.text.trim())children.push(para(f.text,{keepNext:true,run:{size:f.size*2,bold:!!f.bold,italics:!!f.italic,underline:f.underline?{type:UnderlineType.SINGLE}:undefined}}));}
 for(const g of m.groups){
 const items=g.items.filter(i=>i.vi.trim()||i.en.trim());if(!items.length)continue;
 if(m.showStars)children.push(para("***",{keepNext:true,spacing:{before:190,after:110}}));
 const name=groupTitle(g,m);
 if(name)children.push(para(name,{keepNext:true,spacing:{before:m.showStars?0:190,after:140},run:{bold:true,size:28}}));
 for(const item of items){
 const languages=orderedLanguages(m).filter(lang=>item[lang].trim());
 languages.forEach((lang,index)=>children.push(para(item[lang],{keepNext:index<languages.length-1,run:{italics:lang==="vi",size:lang==="vi"?25:26},spacing:{after:index<languages.length-1?35:150}})));
 }
 }
 if(!children.length)children.push(para(""));
 return {properties:{type:D.SectionType.NEXT_PAGE,page:{size:{width:11906,height:16838},margin:{top:960,bottom:960,left:1134,right:1134}}},children};
 })});
}
$("#export").addEventListener("click",async()=>{
 const b=$("#export");b.disabled=true;b.textContent="Đang tạo Word…";
 try{
 if(!state.menus.some(m=>m.groups.some(g=>g.items.some(i=>i.vi.trim()||i.en.trim())))){notify("Hãy thêm ít nhất một món trước khi tải Word.");return;}
 const blob=await docx.Packer.toBlob(buildDocument(state.menus,docx));
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=(state.menus.length>1?"Bo-menu":current().title.text||"Menu").replace(/[<>:"/\\|?*\x00-\x1F]/g,"-").slice(0,90)+".docx";
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);notify("File Word đã sẵn sàng trong mục tải xuống.");
 }catch(e){console.error(e);notify("Chưa tạo được Word. Vui lòng thử lại; nội dung vẫn còn trên màn hình.");}
 finally{b.disabled=false;preview();}
});
render();
if(document.modelContext?.registerTool){
 try{Promise.resolve(document.modelContext.registerTool({name:"read_menu",description:"Read the menus currently shown in the menu editor.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(!input||typeof input!=="object"||Object.keys(input).length)throw new Error("Expected an empty object.");return JSON.parse(JSON.stringify(state));}})).catch(console.warn);}catch(e){console.warn(e);}
}
