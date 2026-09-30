const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../dist/excel-import.js'),X=require('../dist/vendor/xlsx.full.min.js');
test('Markdown nhiều menu giữ thứ tự và hỗ trợ thiếu một ngôn ngữ',()=>{
 const menus=api.parseText('\uFEFF# Menu A\r\n> Dòng phụ: Đoàn A\r\n> Giá: 700,000 VND\r\n## Súp | Soup\r\n- Súp bí đỏ | Pumpkin soup\r\n- | Mushroom soup\r\n# Menu B\r\n## Món chính\r\n- Cá hồi',X);
 assert.equal(menus.length,2);assert.equal(menus[0].subtitle,'Đoàn A');
 assert.deepEqual(menus[0].groups[0].items[1],{vi:'',en:'Mushroom soup'});
 assert.equal(menus[1].groups[0].items[0].en,'');
});
test('báo dòng lỗi thay vì bỏ qua nội dung hoặc món ngoài nhóm',()=>{
 assert.throws(()=>api.parseText('# Menu\n- Món không nhóm',X),/Dòng 2/);
 assert.throws(()=>api.parseText('# Menu\n## Súp\n- Súp nấm\nNội dung sai',X),/Dòng 4/);
});
test('prompt AI có ví dụ dùng được và mẫu text tải về import được',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const sample=fs.readFileSync(path.join(__dirname,'../dist/menu-template.md'),'utf8');
 assert.equal(api.parseText(sample,X).length,2);
 assert.match(api.AI_PROMPT,/không tự thêm món/i);
});
