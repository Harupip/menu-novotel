(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.DishTranslation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 const DEFAULT_ENDPOINT="https://api.mymemory.translated.net/get";

 function decodeEntities(value){
  if(typeof document!=="undefined"){
   const textarea=document.createElement("textarea");
   textarea.innerHTML=value;
   return textarea.value;
  }
  return value.replace(/&#(x?[0-9a-f]+);|&(amp|quot|apos|lt|gt);/gi,(match,number,name)=>{
   if(number)return String.fromCodePoint(parseInt(number.replace(/^x/i,""),/^x/i.test(number)?16:10));
   return {amp:"&",quot:'"',apos:"'",lt:"<",gt:">"}[name.toLowerCase()];
  });
 }

 function createTranslator({fetchFn=globalThis.fetch,endpoint=DEFAULT_ENDPOINT}={}){
  if(typeof fetchFn!=="function")throw new Error("fetch-unavailable");
  const cache=new Map();
  return async function translate(source){
   const text=String(source||"").trim();
   if(!text)throw new Error("missing-source");
   if(cache.has(text))return cache.get(text);
   const response=await fetchFn(endpoint+"?q="+encodeURIComponent(text)+"&langpair=vi%7Cen",{headers:{Accept:"application/json"}});
   if(!response.ok)throw new Error("translate-http-"+response.status);
   const result=await response.json(),translated=result?.responseData?.translatedText?.trim();
   if(!translated||Number(result.responseStatus)!==200)throw new Error("translate-response");
   const decoded=decodeEntities(translated);
   cache.set(text,decoded);
   return decoded;
  };
 }

 return {createTranslator,decodeEntities,DEFAULT_ENDPOINT};
});
