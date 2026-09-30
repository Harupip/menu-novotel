import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!target.startsWith(root)){res.writeHead(403);res.end();return;}
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
  const content=await fs.readFile(target);res.setHeader('Content-Type',(types[path.extname(target)]||'application/octet-stream')+'; charset=utf-8');res.end(content);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const baseURL='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const width of [1440,390,320]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.goto(baseURL,{timeout:15000});
  await page.getByRole('button',{name:'Nhập menu từ file'}).click();
  assert.equal(await page.locator('#import-modal').evaluate(el=>el.open),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('#import-modal').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await page.screenshot({path:`tools/import-${width}.png`});
  await page.locator('#import-excel').setInputFiles('dist/menu-template.xlsx');
  await page.getByText(/Đã thêm 2 menu/).waitFor({timeout:10000});
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#import-modal').evaluate(el=>el.open),false);
  assert.equal(await page.locator('#tabs button').count(),3);
  await page.getByRole('button',{name:'Nhập menu từ file'}).click();
  const bytes=Array.from(await fs.readFile('dist/menu-template.xlsx'));
  await page.locator('#drop-zone').evaluate((el,bytes)=>{
   const transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array(bytes)],'menus.xlsx'));
   el.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));
  },bytes);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('soan-menu-v1')).menus.length===5,{},{timeout:10000});
  await page.getByRole('button',{name:'Đóng cửa sổ import'}).click();
  assert.equal(await page.locator('#import-modal').evaluate(el=>el.open),false);
  await page.getByRole('button',{name:'Nhập menu từ file'}).click();
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.getByRole('button',{name:'Sao chép prompt AI'}).click();
  await page.getByText('Đã sao chép. Dán vào AI và đính kèm file Word của bạn.').waitFor();
  assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/Không tự thêm món/);
  const markdown=await fs.readFile('dist/menu-template.md');
  for(const extension of ['md','txt']){
   await page.locator('#import-excel').setInputFiles({name:'sample.'+extension,mimeType:'text/plain',buffer:markdown});
   await page.getByText(new RegExp('Đã thêm 2 menu từ sample\\.'+extension)).waitFor({timeout:10000});
  }
  assert.equal(await page.locator('#import-text').isVisible(),true);
  await page.locator('#import-text').fill(markdown.toString());
  await page.getByRole('button',{name:'Nhập nội dung đã dán'}).click();
  await page.getByText(/Đã thêm 2 menu từ noi-dung.md/).waitFor({timeout:10000});
  assert.equal(await page.locator('#tabs button').count(),11);
  await page.locator('#import-text').fill('# Menu lỗi\n- Món không nhóm');
  await page.getByRole('button',{name:'Nhập nội dung đã dán'}).click();
  await page.getByText(/Dòng 2:/).waitFor({timeout:10000});
  assert.equal(await page.locator('#tabs button').count(),11);
  assert.equal(await page.locator('#import-modal').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await page.screenshot({path:`tools/import-${width}.png`});
  await page.getByRole('button',{name:'Đóng cửa sổ import'}).click();
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Xóa toàn bộ menu',exact:true}).click();
  assert.equal(await page.locator('#tabs button').count(),11);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Xóa toàn bộ menu',exact:true}).click();
  assert.equal(await page.locator('#tabs button').count(),0);
  assert.equal(await page.locator('.dish').count(),0);
  assert.equal(await page.getByRole('heading',{name:'Hãy thêm menu',exact:true}).isVisible(),true);
  await page.reload({timeout:15000});
  assert.equal(await page.locator('#tabs button').count(),0);
  assert.equal(await page.locator('.dish').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`tools/import-empty-${width}.png`});
  await page.getByRole('button',{name:'Import menu',exact:true}).click();
  await page.locator('#import-excel').setInputFiles('dist/menu-template.md');
  await page.getByText(/Đã thêm 2 menu từ menu-template.md/).waitFor({timeout:10000});
  await page.getByRole('button',{name:'Đóng cửa sổ import'}).click();
  assert.equal(await page.locator('#tabs button').count(),2);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Xóa toàn bộ menu',exact:true}).click();
  await page.getByRole('button',{name:'+ Thêm menu mới',exact:true}).click();
  assert.equal(await page.locator('#tabs button').count(),1);
  assert.equal(await page.locator('#field-title').isVisible(),true);
  await page.close();console.log(`PASS: ${width}px import/prompt, reset to zero menus, reload, centered empty state, add/import from empty, no overflow`);
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
