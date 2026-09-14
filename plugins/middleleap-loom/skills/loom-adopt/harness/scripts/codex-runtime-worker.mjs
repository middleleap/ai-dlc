// Internal capture supervisor. Public entry point: loom runtime codex.
import {runCodex} from './codex-runtime.mjs';

let running=false,cancelled=false,finished=false;
function cancel(){
 if(finished)return;
 cancelled=true;
 if(running)process.emit('SIGTERM');
 else if(!process.connected)process.exit(1);
}
process.on('disconnect',cancel);
process.on('message',async message=>{
 if(message?.type==='cancel'){cancel();return;}
 if(message?.type!=='run'||running)return;
 if(cancelled){if(process.connected)process.disconnect();return;}
 running=true;
 let reply;
 try{reply={type:'result',value:await runCodex(message.request)};}
 catch(e){reply={type:'error',error:e.message};}
 running=false;finished=true;
 if(process.connected){
  process.send(reply,()=>{if(process.connected)process.disconnect();});
 }
});
