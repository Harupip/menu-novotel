const test=require("node:test");
const assert=require("node:assert/strict");
const {createTranslator,decodeEntities}=require("../dist/translation.js");

test("dịch đúng tên món và chỉ gửi nội dung tiếng Việt",async()=>{
 const calls=[];
 const translate=createTranslator({fetchFn:async(url,options)=>{
  calls.push({url,options});
  return {ok:true,status:200,json:async()=>({responseStatus:200,responseData:{translatedText:"Grilled salmon &amp; vegetables"}})};
 }});
 const result=await translate("  Cá hồi nướng với rau củ  ");
 assert.equal(result,"Grilled salmon & vegetables");
 assert.equal(calls.length,1);
 const url=new URL(calls[0].url);
 assert.equal(url.searchParams.get("q"),"Cá hồi nướng với rau củ");
 assert.equal(url.searchParams.get("langpair"),"vi|en");
 assert.deepEqual(calls[0].options,{headers:{Accept:"application/json"}});
});

test("dùng bộ nhớ đệm cho tên món trùng nhau",async()=>{
 let requestCount=0;
 const translate=createTranslator({fetchFn:async()=>{
  requestCount++;
  return {ok:true,json:async()=>({responseStatus:200,responseData:{translatedText:"Pumpkin soup"}})};
 }});
 assert.equal(await translate("Súp bí đỏ"),"Pumpkin soup");
 assert.equal(await translate("Súp bí đỏ"),"Pumpkin soup");
 assert.equal(requestCount,1);
});

test("báo lỗi rõ ràng khi dịch vụ từ chối yêu cầu",async()=>{
 const translate=createTranslator({fetchFn:async()=>({ok:false,status:429})});
 await assert.rejects(()=>translate("Phở bò"),/translate-http-429/);
});

test("từ chối tên món trống mà không gọi mạng",async()=>{
 let called=false;
 const translate=createTranslator({fetchFn:async()=>{called=true;}});
 await assert.rejects(()=>translate("   "),/missing-source/);
 assert.equal(called,false);
});

test("giải mã HTML entity trả về từ dịch vụ",()=>{
 assert.equal(decodeEntities("Fish &#38; chips &quot;special&quot;"),'Fish & chips "special"');
});
