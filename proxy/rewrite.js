const request=require("request");
global.CONFIG.rewriteMaps=[]
module.exports=async (ctx, next)=>{
	let rewriteMaps=global.CONFIG.rewriteMaps;
	for (let i = 0; i < rewriteMaps.length; i++) {
      var reg=rewriteMaps[i].reg,dest=rewriteMaps[i].dest;
			if(reg.test(ctx.href)){
        rewriteMaps[i].count++;
				let newHref=ctx.href.replace(reg,dest),
					oldHost=ctx.protocol+"://"+ctx.host;
				if(newHref.indexOf(oldHost)!=0){
            ctx.headers['Host'] = (newHref.split("://")[1]).split("/")[0];
            let t=request(newHref);
            ctx.req.pipe(t);
            ctx.body=t;
            return;
				}else{
					  ctx.url=newHref.replace(oldHost,"");
            break;
				}
			}
	}
  await next()
}