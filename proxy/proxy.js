/**
 * 
 * 反向代理  用于端口转发等场景
 * 可动态添加转发规则：
 * 请求 http://127.0.0.1/mtproxy/_addproxy?reg=scsdcsd&host=www.baidu.com
 * 参数 reg host 使用encodeURIComponent进行编码 
 * reg 被编译成正则表达式
 * 
 */
const request = require("request");
global.CONFIG.proxyMaps=[]
module.exports=async (ctx, next)=>{
	let proxyMaps=global.CONFIG.proxyMaps;
	if(/^\/mtproxy\/_addproxy/.test(ctx.url) && ctx.method =="GET"){
		let ctx_query = ctx.query,
  			regstr=decodeURIComponent(ctx_query.reg),
  			host=decodeURIComponent(ctx_query.host),
  			obj={regstr,host,reg:new RegExp(regstr,'i')},
  			flag=false;
  		for (let i = 0; i < proxyMaps.length; i++) {
  			if(proxyMaps[i].regstr===regstr){
   				proxyMaps[i]=obj;
   				flag=true;
   				break;
  			}
  		}
  		!flag && proxyMaps.push(obj);
  		let message=(flag?'修改':'新增')+"一条转发规则:"+regstr+"--->"+host;
  		ctx.body = JSON.stringify({
  			status:0,
  			message
  		})
	}else{
		for (let i = 0; i < proxyMaps.length; i++) {
			let urlOri=ctx.request.origin+ctx.url,
				urlNew=ctx.request.protocol+"://"+proxyMaps[i].host+ctx.url;
  			if(proxyMaps[i].reg.test(urlOri)){
  				console.log("匹配转发规则:"+proxyMaps[i].regstr);
                ctx.header['host'] = proxyMaps[i].host;
                let t=request(urlNew);
                ctx.req.pipe(t);
                ctx.response.body=t;
   				return;
  			}
  		}
		await next()
	}
}