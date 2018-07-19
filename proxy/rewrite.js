const request=require("request");
global.CONFIG.rewriteMaps=[]
module.exports=async (ctx, next)=>{
	let rewriteMaps=global.CONFIG.rewriteMaps;
	if(/^\/_mtproxy_\/addrewrite/.test(ctx.url) && ctx.method =="POST"){
		let ctx_query = ctx.request.body,
  			regstr=ctx_query.regx,
  			dest=ctx_query.dest,
        flag="i";
      try{
        var json=JSON.parse(regstr);
        regstr=json.str;
        flag=json.flag==="g"?"gi":(json.flag||flag);
      }catch(e){
        console.log("addrewrite:[reg]参数转JSON失败,输入值为"+regstr+"\n"+e)
      }
  		let	obj={regstr,dest,reg:new RegExp(regstr,flag),flag,count:0};
      let ruleIndex=rewriteMaps.findIndex((rule)=>{return rule.regstr===regstr})
  		ruleIndex==-1 && rewriteMaps.push(obj) || (rewriteMaps[ruleIndex]=obj);
  		ctx.body = JSON.stringify({
  			status:0,
  			message:(ruleIndex!=-1?'修改':'新增')+"一条规则:"+regstr+"--->"+dest
  		})
	}else{
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
}