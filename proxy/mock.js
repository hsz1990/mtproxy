/**
 * 
 * 数据mock  用于前后端接口联调前的开发
 *
 * POST请求 http://127.0.0.1/_mtproxy_/addmock
 * 支持的类型 file(直接传路径) html text json 
 * reg 被编译成正则表达式
 * 
 */
const Readable = require('stream').Readable;
const defaultType="json";
global.CONFIG.mockActions=[];
const Mocks={
	"json":require("./mock/json"),
	"html":require("./mock/html"),
	"file":require("./mock/file"),
	"basic":require("./mock/basic")
};
const HEADERS=require("./responseType");
module.exports=async (ctx, next)=>{
	let mockActions=global.CONFIG.mockActions;
	if(/^\/_mtproxy_\/addmock/.test(ctx.url) && ctx.method =="POST"){
		let ctx_query = ctx.request.body;
		let action=ctx_query.url,
			method=ctx_query.method||"GET",
			oridata=ctx_query.data,
			data=new Function("return "+ctx_query.data),
			responseType=ctx_query.type||'json';
		responseType=responseType.toLowerCase();
		let	obj={
				key:method+"::"+action,
				type:responseType,
				action,
				method,
				oridata,
				data,
				count:0
			};
		let ruleIndex=mockActions.findIndex((item)=>{return item.key===obj.key});
		ruleIndex==-1 &&  mockActions.push(obj) || (mockActions[ruleIndex]=obj);
  		ctx.body = JSON.stringify({
  			status:0,
  			message:(ruleIndex!=-1?'修改':'新增')+"一条规则:"+obj.key
  		})
		return;
	}
	let key=ctx.method+"::"+ctx.url.split("?")[0];
	for (let i = 0; i < mockActions.length; i++) {
  		if(mockActions[i].key===key){
        	mockActions[i].count++;
        	query=Object.assign({},ctx.query,ctx.request.body);
  			Mocks[type](mockActions[i].data,query,ctx.headers).then((response)=>{
				let headers=response.headers||HEADERS[type],
					data=response.body||response;
				ctx.set(headers);
				ctx.body=data;
			}).catch((response)=>{
				ctx.body=JSON.stringify({
					status:response.status||"500",
					message:response.message||response
				})
				// ctx.set("status",response.status||"500")
				// ctx.body=response.message||response;
			})
			return;
  		}
	}
	await next()
}