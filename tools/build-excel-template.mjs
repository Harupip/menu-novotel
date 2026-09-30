import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
import JSZip from 'jszip';
const wb=Workbook.create(),s=wb.worksheets.add('Menus');
s.getRange('A1:D504').format.font={name:'Arial',size:11,color:'#183E44'};
s.getRange('A1:D504').format.rowHeight=28;
s.getRange('A1:B504').format.columnWidth=26;
s.getRange('C1:D504').format.columnWidth=46;
s.getRange('A1:D504').format.wrapText=true;
s.getRange('A1:E504').format.wrapText=true;
s.getRange('A1:E4').values=[['MENU-NOVOTEL-V2',null,null,null,null],['Một sheet chứa nhiều menu. Chỉ sửa ô xanh, thay các ví dụ bằng nội dung của bạn.',null,null,null,null],['MENU mở menu mới. NHÓM mở nhóm mới. Các dòng MÓN bên dưới thuộc nhóm đó. Tối đa 500 dòng.',null,null,null,null],['Loại dòng','Tên Việt / tên menu','Tên Anh','Dòng phụ','Giá / ghi chú']];
for(const row of [2,3]){s.getRange('A'+row+':E'+row).merge();s.getRange('A'+row+':E'+row).format.rowHeight=42;}
s.getRange('A1:E1').merge();s.getRange('A1:E1').format.fill='#1B4146';s.getRange('A1:E1').format.font.color='#FFFFFF';
s.getRange('A4:E4').format.fill='#1B4146';s.getRange('A4:E4').format.font.color='#FFFFFF';
s.getRange('A5:E504').values=Array.from({length:500},()=>['','','','','']);
s.getRange('A5:E504').format.fill='#E8F4FC';s.getRange('A5:E504').setNumberFormat('@');
s.getRange('A5:E15').values=[['MENU','SET MENU 1','','Đoàn A','700,000 VND / người'],['NHÓM','Khai vị','Appetizer','',''],['MÓN','Gỏi tôm','Prawn salad','',''],['MÓN','Salad rau','Vegetable salad','',''],['NHÓM','Món chính','Main course','',''],['MÓN','Cá hồi nướng','Grilled salmon','',''],['MENU','SET MENU 2','','Đoàn B',''],['NHÓM','Súp','Soup','',''],['MÓN','Súp bí đỏ','Pumpkin soup','',''],['NHÓM','Tráng miệng','Dessert','',''],['MÓN','Bánh tiramisu','Tiramisu','','']];
s.getRange('A1:A504').format.columnWidth=14;s.getRange('B1:C504').format.columnWidth=34;s.getRange('D1:E504').format.columnWidth=27;
s.getRange('A4:E504').format.rowHeight=32;
s.freezePanes.freezeRows(4);
await fs.writeFile('tools/template-preview.png',new Uint8Array(await (await wb.render({sheetName:'Menus',range:'A1:E15',scale:1})).arrayBuffer()));
const output=await SpreadsheetFile.exportXlsx(wb);
await output.save('dist/menu-template.xlsx');
const zip=await JSZip.loadAsync(await fs.readFile('dist/menu-template.xlsx'));
// Artifact tool lacks sheet protection; add native Excel protection at export.
const unprefix=xml=>xml.replace(/(<\/?)x:/g,'$1').replace('xmlns:x=','xmlns=');
let styles=unprefix(await zip.file('xl/styles.xml').async('string'));
const section=styles.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/),original=section[1].match(/<xf\b[^>]*(?:\/>|>[\s\S]*?<\/xf>)/g);
const unlocked=original.map(x=>x.replace(/ applyProtection="[^"]*"/g,'').replace(/<protection[^>]*\/>/g,'').replace(/\/>$/,'></xf>').replace('<xf ','<xf applyProtection="1" ').replace('</xf>','<protection locked="0"/></xf>')).join('');
styles=styles.replace(section[0],'<cellXfs count="'+original.length*2+'">'+section[1]+unlocked+'</cellXfs>');zip.file('xl/styles.xml',styles);
let xml=unprefix(await zip.file('xl/worksheets/sheet1.xml').async('string'));
xml=xml.replace(/<c\b([^>]*\br="([A-E])(\d+)"[^>]*?)\s*(\/?)>/g,(full,attrs,col,row,close)=>{
 if(!(row>=5&&row<=504))return full;
 const style=Number(attrs.match(/\bs="(\d+)"/)?.[1]||0)+original.length;
 return '<c'+attrs.replace(/\s+s="\d+"/,'')+' s="'+style+'"'+close+'>';
});
xml=xml.replace('</sheetData>','</sheetData><sheetProtection sheet="1" objects="1" scenarios="1" selectLockedCells="1" selectUnlockedCells="0"/>');
zip.file('xl/worksheets/sheet1.xml',xml);
await fs.writeFile('dist/menu-template.xlsx',await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
