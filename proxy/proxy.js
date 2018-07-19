const request = require("request");
const {findIp} =require("./util");
global.CONFIG.proxyMaps=[];
module.exports=async (ctx, next)=>{
	let proxyMaps=global.CONFIG.proxyMaps;
	if(/^\/_mtproxy_\/addproxy/.test(ctx.url) && ctx.method =="POST"){
		let ctx_query = ctx.request.body,
  			from=ctx_query.from.trim(),
  			dest=ctx_query.dest.trim(),
  			obj={from,dest,count:0};
      obj.reg=new RegExp(from.replace(/([^\w\*])/g,"\\$1").replace(/\*/g,".*"))
      let remoteObj=await findIp(dest);
      obj.message=remoteObj.err?("警告:没有找到域名:"+dest):'';
      let oldIndex=proxyMaps.findIndex((el)=>{return el.from===from});
  		ctx.body = JSON.stringify({
  			status:0,
  			message:(oldIndex!=-1?'修改':'新增')+"一条转发规则:"+from+"--->"+dest
  		})
      Object.assign(obj,remoteObj);
      (oldIndex!=-1) && (proxyMaps[oldIndex]=obj) ||(proxyMaps.push(obj));
	}else{
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
}