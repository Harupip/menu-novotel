import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const width of [1440,390,320]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.goto('http://localhost:8000/',{timeout:15000});
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
  await page.getByText('Dán Markdown / text để import',{exact:true}).click();
  await page.locator('#import-text').fill(markdown.toString());
  await page.getByRole('button',{name:'Nhập nội dung đã dán'}).click();
  await page.getByText(/Đã thêm 2 menu từ noi-dung.md/).waitFor({timeout:10000});
  assert.equal(await page.locator('#tabs button').count(),11);
  await page.locator('#import-text').fill('# Menu lỗi\n- Món không nhóm');
  await page.getByRole('button',{name:'Nhập nội dung đã dán'}).click();
  await page.getByText(/Dòng 2:/).waitFor({timeout:10000});
  assert.equal(await page.locator('#tabs button').count(),11);
  assert.equal(await page.locator('#import-modal').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await page.getByText('Dán Markdown / text để import',{exact:true}).click();
  await page.screenshot({path:`tools/import-${width}.png`});
  await page.close();console.log(`PASS: ${width}px Excel/drop, MD/TXT/paste, clipboard, atomic error, no overflow, Escape/close`);
 }
}finally{await browser.close();}
