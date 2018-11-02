const request = require("request");
const {findIp} =require("./util");
global.CONFIG.proxyMaps=[];
module.exports=async (ctx, next)=>{
	let proxyMaps=global.CONFIG.proxyMaps;
	let host=ctx.headers.host;
  for (var i = 0; i < proxyMaps.length; i++) {
     if(proxyMaps[i].reg.test(host)){
        if(proxyMaps[i].err){
          let index=i,remoteObj=await findIp(dest);
          if(remoteObj.err){
            ctx.body=JSON.stringify({
              status:remoteObj.err.status||500,
              message:proxyMaps[index]
            });
            return;
          }
          Object.assign(proxyMaps[index],remoteObj,{message:''});
        }
        proxyMaps[i].count++;
        let dest=proxyMaps[i].dest;
        ctx.header['Host'] = dest;
        let t=request(ctx.href.replace(host,dest));
        ctx.req.pipe(t);
        ctx.body=t;
        return;
     }
  }
  await next()
}