const test=require('node:test'),assert=require('node:assert/strict');
const XLSX=require('../dist/vendor/xlsx.full.min.js');
const parse=()=>require('../dist/excel-import.js').parseWorkbook;
function workbook(rows){const b=XLSX.utils.book_new();XLSX.utils.book_append_sheet(b,XLSX.utils.aoa_to_sheet(rows),'Menu 1');return b;}
const rows=()=>[['MENU-NOVOTEL-V1'],['Tên menu','SET MENU'],['Dòng phụ','Đoàn A'],['Giá / ghi chú','700,000 VND'],['Hướng dẫn'],['Nhóm Việt','Nhóm Anh','Món Việt','Món Anh'],['Súp','Soup','Súp bí đỏ',''],['Súp','Soup','Súp nấm','Mushroom soup']];
test('import giữ thứ tự nhóm, món và bản Anh trống để dịch sau',()=>{
 const result=parse()(workbook(rows()),XLSX);
 assert.equal(result[0].title,'SET MENU');assert.equal(result[0].groups.length,1);
 assert.deepEqual(result[0].groups[0].items,[{vi:'Súp bí đỏ',en:''},{vi:'Súp nấm',en:'Mushroom soup'}]);
});
test('từ chối cả file khi dòng thiếu nhóm hoặc cấu trúc bị đổi',()=>{
 const data=rows();data.push(['','','Món lỗi','']);
 assert.throws(()=>parse()(workbook(data),XLSX),/Menu 1.*9/);
 data[0][0]='Sai mẫu';assert.throws(()=>parse()(workbook(data),XLSX),/mẫu/);
});
test('một sheet chứa hai menu và một nhóm chứa nhiều món',()=>{
 const data=[['MENU-NOVOTEL-V2'],[],[],['Loại dòng','Tên Việt / tên menu','Tên Anh','Dòng phụ','Giá / ghi chú'],['MENU','Menu A'],['NHÓM','Súp','Soup'],['MÓN','Súp bí đỏ'],['MÓN','Súp nấm','Mushroom soup'],['MENU','Menu B'],['NHÓM','Món chính','Main course'],['MÓN','Cá hồi']];
 const result=parse()(workbook(data),XLSX);
 assert.equal(result.length,2);assert.equal(result[0].groups[0].items.length,2);
 assert.equal(result[1].title,'Menu B');
 data[5]=['MÓN','Sai thứ tự'];assert.throws(()=>parse()(workbook(data),XLSX),/6/);
});
test('mẫu tải về chứa ví dụ nhiều menu hợp lệ',()=>{
 const book=XLSX.read(require('node:fs').readFileSync(require('node:path').join(__dirname,'../dist/menu-template.xlsx')),{type:'buffer'});
 const result=parse()(XLSX.read(XLSX.write(book,{type:'buffer',bookType:'xlsx'})),XLSX);
 assert.equal(result.length,2);assert.equal(result[0].groups[0].items.length,2);
});
