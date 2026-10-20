const base=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000/api/v1';
export interface LiveChange {changed:boolean;kinds:string[];}
/** Authenticated SSE over fetch: credentials never appear in URLs or browser history. */
export function watchEvents(path:string,token:string,onChange:(event:LiveChange)=>void) {
 const controller=new AbortController();let lastId='';let retry=1000;let retryTimer:ReturnType<typeof setTimeout>;let initialized=false;
 const connect=async()=>{
  try {
   const response=await fetch(`${base}${path}`,{headers:{Authorization:`Bearer ${token}`,Accept:'text/event-stream',...(lastId?{'Last-Event-ID':lastId}:{})},cache:'no-store',signal:controller.signal});
   if(response.status===401||response.status===403)return;
   if(!response.ok||!response.body)throw new Error('Stream unavailable');
   retry=1000;
   const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';
   while(!controller.signal.aborted) {
    const result=await reader.read();if(result.done)break;buffer+=decoder.decode(result.value,{stream:true}).replace(/\r\n/g,'\n');
    let boundary:number;
    while((boundary=buffer.indexOf('\n\n'))>=0) {
     const frame=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);
     const parsed=parseEventFrame(frame);if(!parsed)continue;
     if(parsed.id)lastId=parsed.id;
     if(!initialized||parsed.data.changed){onChange(parsed.data);initialized=true;}
    }
   }
  }catch{ /* Reconnect with the last cursor; leave the existing screen usable. */ }
  if(!controller.signal.aborted){retryTimer=setTimeout(connect,retry);retry=Math.min(retry*2,30000);}
 };
 connect();return()=>{controller.abort();clearTimeout(retryTimer);};
}
export function parseEventFrame(frame:string):{id:string;data:LiveChange}|null {
 const lines=frame.split('\n');const text=lines.filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(!text)return null;
 try{const data=JSON.parse(text);if(typeof data.changed!=='boolean'||!Array.isArray(data.kinds))return null;return {id:lines.find(l=>l.startsWith('id:'))?.slice(3).trim()||'',data};}catch{return null;}
}
