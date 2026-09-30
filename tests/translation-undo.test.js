const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

function editor(){
 const elements=new Map(),handlers={};
 const element=()=>({textContent:"",innerHTML:"",addEventListener(name,fn){this[name]=fn;}});
 const context=vm.createContext({
  crypto:require("node:crypto"),console,setTimeout:()=>0,clearTimeout(){},
  localStorage:{getItem:()=>null,setItem(){}},
  document:{querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);},addEventListener(name,fn){handlers[name]=fn;}},
  DishTranslation:{createTranslator:()=>async text=>"Translated: "+text}
  ,MenuExcel:require('../dist/excel-import.js'),XLSX:require('../dist/vendor/xlsx.full.min.js')
 });
 vm.runInContext(fs.readFileSync(require.resolve("../dist/app.js"),"utf8"),context);
 return {run:code=>vm.runInContext(code,context),handlers,elements};
}

test("hoàn tác dịch lại khôi phục bản cũ và giữ phần sửa tay",async()=>{
 const app=editor();
 app.run('globalThis.items=current().groups.flatMap(g=>g.items);globalThis.before=items[0].en;');
 await app.run('globalThis.changes=[];translateDish(items[0],changes)');
 await app.run('translateDish(items[1],changes)');
 app.run('translationUndo={menuId:current().id,changes};items[1].en="Manual edit";');
 assert.equal(app.run('typeof undoTranslation'),"function");
 app.run('undoTranslation()');
 assert.equal(app.run('items[0].en'),app.run('before'));
 assert.equal(app.run('items[1].en'),"Manual edit");
 assert.equal(app.run('translationUndo'),null);
});

test("import thêm menu hợp lệ và giữ menu cũ",async()=>{
 const app=editor();
 app.run('globalThis.oldMenu=state.menus[0];');
 await app.run(`(async()=>{
  const book=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([
   ['MENU-NOVOTEL-V1'],['Tên menu','Imported menu'],['Dòng phụ'],['Giá / ghi chú'],[],
   ['Nhóm Việt','Nhóm Anh','Món Việt','Món Anh'],['Súp','Soup','Súp bí đỏ','']
  ]),'Menu 1');
  await document.querySelector('#import-excel').change({target:{files:[{name:'menu.xlsx',size:1000,arrayBuffer:async()=>XLSX.write(book,{type:'array',bookType:'xlsx'})}],value:'menu.xlsx'}});
 })()`);
 assert.equal(app.run('state.menus.length'),2);
 assert.equal(app.run('state.menus[0]===oldMenu'),true);
 assert.equal(app.run('current().title.text'),'Imported menu');
 assert.equal(app.run('validState(state)'),true);
});

test("Ctrl+Z hoàn tác cả lượt dịch còn thiếu, không chiếm undo của ô nhập",async()=>{
 const app=editor();
 app.run('current().groups[0].items[0].en="";current().groups[1].items[0].en="";');
 const button={dataset:{action:"translate-all"},closest:()=>null};
 await app.elements.get("#form").click({target:{closest:()=>button}});
 assert.equal(typeof app.handlers.keydown,"function");
 let prevented=false;
 app.handlers.keydown({key:"z",ctrlKey:true,target:{closest:()=>({})},preventDefault(){prevented=true;}});
 assert.equal(prevented,false);
 assert.notEqual(app.run('current().groups[0].items[0].en'),"");
 app.handlers.keydown({key:"z",ctrlKey:true,target:{closest:()=>null},preventDefault(){prevented=true;}});
 assert.equal(prevented,true);
 assert.equal(app.run('current().groups[0].items[0].en'),"");
 assert.equal(app.run('current().groups[1].items[0].en'),"");
});
