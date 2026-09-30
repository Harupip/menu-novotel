(function(root){
 function parseWorkbook(book,X){
  if(!book.SheetNames.length||book.SheetNames.length>50)throw new Error('File cần từ 1 đến 50 sheet menu.');
  return book.SheetNames.flatMap(name=>{
   const sheet=book.Sheets[name],cell=a=>String(sheet[a]?.v??'').trim();
   const fail=message=>{throw new Error(name+': '+message);};
   if(cell('A1')==='MENU-NOVOTEL-V2'){
    const headers=['Loại dòng','Tên Việt / tên menu','Tên Anh','Dòng phụ','Giá / ghi chú'];
    if(headers.some((h,i)=>cell(String.fromCharCode(65+i)+'4')!==h))fail('Sai tiêu đề mẫu.');
    const range=X.utils.decode_range(sheet['!ref']||'A1');
    if(range.e.r>503||range.e.c>4)fail('Chỉ nhập trong A5:E504 (500 dòng).');
    const menus=[];let menu,group;
    for(let row=5;row<=range.e.r+1;row++){
     const values=['A','B','C','D','E'].map(c=>cell(c+row));
     if(values.every(v=>!v))continue;
     const invalid=message=>fail('Dòng '+row+': '+message);
     if(['A','B','C','D','E'].some(c=>sheet[c+row]?.f))invalid('không dùng công thức.');
     const [kind,vi,en,subtitle,price]=values;
     if(!vi&&(kind!=='MÓN'||!en))invalid('thiếu tên.');
     if(kind==='MENU'){
      if(en)invalid('tên menu nằm ở cột B.');
      menu={title:vi,subtitle,price,groups:[]};menus.push(menu);group=null;
     }else if(kind==='NHÓM'){
      if(!menu||subtitle||price)invalid('NHÓM cần nằm dưới MENU; chỉ nhập cột B, C.');
      group={vi,en,items:[]};menu.groups.push(group);
     }else if(kind==='MÓN'){
      if(!group||subtitle||price)invalid('MÓN cần nằm dưới NHÓM; chỉ nhập cột B, C.');
      group.items.push({vi,en});
     }else invalid('chọn MENU, NHÓM hoặc MÓN.');
    }
    if(!menus.length||menus.some(m=>!m.groups.length||m.groups.some(g=>!g.items.length)))fail('Mỗi menu cần nhóm và mỗi nhóm cần ít nhất một món.');
    return menus;
   }
   if(cell('A1')!=='MENU-NOVOTEL-V1'||['Tên menu','Dòng phụ','Giá / ghi chú'].some((v,i)=>cell('A'+(i+2))!==v)||['Nhóm Việt','Nhóm Anh','Món Việt','Món Anh'].some((v,i)=>cell(String.fromCharCode(65+i)+'6')!==v))fail('Sai mẫu Excel. Hãy tải mẫu mới.');
   if(!cell('B2'))fail('Thiếu tên menu ở B2.');
   const range=X.utils.decode_range(sheet['!ref']||'A1');
   if(range.e.r>505||range.e.c>3)fail('Chỉ nhập trong A7:D506 (500 món).');
   const groups=[];
   for(let row=7;row<=range.e.r+1;row++){
    const values=['A','B','C','D'].map(c=>cell(c+row));
    if(values.every(v=>!v))continue;
    if(['A','B','C','D'].some(c=>sheet[c+row]?.f))fail('Dòng '+row+': nhập chữ, không dùng công thức.');
    const [vi,en,dishVi,dishEn]=values;
    if(!vi||(!dishVi&&!dishEn))fail('Dòng '+row+': cần nhóm Việt và tên món Việt hoặc Anh.');
    let group=groups.find(g=>g.vi===vi);
    if(group&&group.en!==en)fail('Dòng '+row+': tên Anh của nhóm không nhất quán.');
    if(!group){group={vi,en,items:[]};groups.push(group);}
    group.items.push({vi:dishVi,en:dishEn});
   }
   if(!groups.length)fail('Chưa nhập món nào.');
   return {title:cell('B2'),subtitle:cell('B3'),price:cell('B4'),groups};
  });
 }
 function parseText(text,X){
  const lines=String(text).replace(/^\uFEFF/,'').split(/\r?\n/);
  const rows=[['MENU-NOVOTEL-V2'],[],[],['Loại dòng','Tên Việt / tên menu','Tên Anh','Dòng phụ','Giá / ghi chú']];
  let menuRow,hasGroup=false;
  for(let i=0;i<lines.length;i++){
   const line=lines[i].trim(),fail=()=>{throw new Error('Dòng '+(i+1)+': dùng # Menu, ## Nhóm Việt | Anh, - Món Việt | Anh; dòng phụ/giá đặt ngay dưới menu.');};
   if(!line){rows.push([]);continue;}
   let match,row=[];
   if((match=line.match(/^#\s+(.+)$/))){row=['MENU',match[1].trim()];menuRow=row;hasGroup=false;}
   else if((match=line.match(/^>\s*(Dòng phụ|Giá):\s*(.*)$/i))){
    if(!menuRow||hasGroup)fail();
    const col=match[1].toLowerCase()==='giá'?4:3;
    if(menuRow[col]!==undefined)fail();menuRow[col]=match[2].trim();
   }else if((match=line.match(/^(##\s+|[-*]\s+)(.*)$/))){
    const parts=match[2].split('|').map(s=>s.trim());if(parts.length>2)fail();
    row=[match[1].startsWith('##')?'NHÓM':'MÓN',parts[0],parts[1]||''];hasGroup=true;
   }else fail();
   rows.push(row);
  }
  const book=X.utils.book_new();X.utils.book_append_sheet(book,X.utils.aoa_to_sheet(rows),'Text');
  try{return parseWorkbook(book,X);}catch(error){throw new Error(error.message.replace(/Dòng (\d+)/,(_,n)=>'Dòng '+(Number(n)-4)));}
 }
 const AI_PROMPT=`Hãy chuyển file Word/menu tôi đính kèm thành Markdown để nhập vào app Soạn menu.
Đọc toàn bộ file, giữ đủ menu, thứ tự nhóm và món. Sửa lỗi chính tả rõ ràng. Không tự thêm món, nguyên liệu, giá, khẩu phần hoặc nhóm không có trong nguồn.
Giữ nguyên tên và số thứ tự menu đúng như trong file gốc, không dịch hoặc đổi tên theo ví dụ. Nếu nguồn ghi "MENU số 1", tiêu đề phải là "# MENU số 1", không đổi thành "# SET MENU 1". Nếu không xác định được tên menu, hỏi tôi trước khi tạo bản cuối.
Ghép đúng tên Việt và Anh của cùng một món, không tách chúng thành hai món. Nếu thiếu một ngôn ngữ, dịch từ tên còn lại bằng thuật ngữ ẩm thực phù hợp. Nếu cả hai tên mơ hồ, thiếu hoặc không đọc rõ, hỏi tôi trước khi tạo bản cuối; không đoán. Giữ nguyên giá và thông tin đoàn, để trống nếu nguồn không có.
Trả về chỉ nội dung Markdown, không lời giải thích, không bọc trong dấu ba backtick, không bảng. Một dòng cho một món. Không dùng ký tự | trong tên; ký tự này chỉ ngăn cách Việt và Anh.
Ví dụ cấu trúc bắt buộc dưới đây chỉ minh họa. Tên menu, nhóm, món, dòng phụ và giá phải lấy từ file gốc; không sao chép dữ liệu ví dụ vào kết quả:
# MENU số 1
> Dòng phụ: Đoàn A
> Giá: 700,000 VND / người
## Khai vị | Appetizer
- Gỏi tôm | Prawn salad
- Salad rau | Vegetable salad
## Món chính | Main course
- Cá hồi nướng | Grilled salmon
# MENU số 2
## Súp | Soup
- Súp bí đỏ | Pumpkin soup
Mỗi menu bắt đầu bằng #. Nhóm dùng ##. Món dùng - và nằm dưới nhóm. Dòng phụ và giá (nếu có) đặt ngay sau #, trước nhóm đầu tiên. Tối đa 500 dòng mỗi file; nếu vượt, chia thành nhiều file tại ranh giới menu.
Trước khi trả kết quả, đối chiếu số menu và số món với nguồn, kiểm tra đủ hai ngôn ngữ và đúng cấu trúc. Tôi sẽ kiểm tra lại bản dịch trước khi xuất Word.`;
 root.MenuExcel={parseWorkbook,parseText,AI_PROMPT};
 if(typeof module!=='undefined')module.exports=root.MenuExcel;
})(typeof globalThis!=='undefined'?globalThis:this);
