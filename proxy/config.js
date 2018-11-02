const path=require('path');
const fs = require('fs');
const template = require('art-template');
const HEADERS=require("../proxy/responseType");
const {fillValue}=require('../proxy/util')
module.exports=async (ctx, next)=>{
  let CONFIG=ctx.CONFIG;
  if(ctx.method=="GET"){
    if(ctx.path =="/_mtproxy_/getConfig"){
      ctx.body = JSON.stringify(CONFIG);
      if(ctx.query.download){
        ctx.attachment('mtproxy-config.json')
      }
    }else if(ctx.path=="/_mtproxy_/client"){
      ctx.body=template(path.resolve("./proxy/client_root/index.tpl"),CONFIG)
    }else if(/^\/_mtproxy_\/client\/.+/.test(ctx.path)){
      let p=path.resolve("./proxy/client_root/",ctx.path.replace("/_mtproxy_/client/",""));
      ctx.set(HEADERS[p.split(".").pop()]||{})
      ctx.body=fs.createReadStream(p);
    }
  }else if(ctx.method=="POST"){
    let ctx_query=ctx.request.body;
    if(ctx.path=="/_mtproxy_/setConfig"){
        if(ctx_query.key && /^global\b/.test(ctx_query.key) && ctx_query.value){
          if(/^global[\b]+_readonly/.test(ctx_query.key)){
              ctx.body=JSON.stringify({
                status:-1,
                message:"只读属性不能修改"
              })
              return;
          }
          fillValue(CONFIG,ctx_query.key.replace(/^global/,""),ctx_query.value)
          ctx.body=JSON.stringify({
            status:0,
            message:"修改成功"
          })
          return;
        }
    }else if(ctx.path=="/_mtproxy_/importConfig"){
        try{
          ctx.CONFIG=CONFIG=JSON.parse(ctx_query.data);
          ctx.body=JSON.stringify({
            status:0,
            message:"导入成功"
          })
        }catch(e){
          ctx.body=JSON.stringify({
            status:-1,
            message:"导入失败"
          })
        }
    }else if(ctx.path=="/_mtproxy_/delConfig"){
        if(ctx_query.path && /^global\b/.test(ctx_query.path)){
          if(/^global[\b]+_readonly/.test(ctx_query.path)){
              ctx.body=JSON.stringify({
                status:-1,
                message:"只读属性不能删除"
              })
          }else{
            var str=ctx_query.path.replace(/^global/,"global.CONFIG"),
                message="",status=0,last,
                reg1=/\[\s*[\'\"]{0,1}(.+)[\'\"]{0,1}\s*\]$/,
                reg2=/\b([\w]+)$/;
            str=str.replace(reg1,''),last=RegExp.$1;
            if(!last){
                lstr=str.replace(reg2,''),last=RegExp.$1;
            }
            try{
              var obj=new Function('return '+str)();
              if(obj instanceof Array){
                obj.splice(last,1)
              }else{
                delete obj[last];
              }
            }catch(e){
                console.log(e)
                message="没有找到被删除的属性"
            }
            ctx.body=JSON.stringify({
                status:0,
                message:message||"删除成功"
            })
          }
          return;
        }
    }else if(ctx.path=="/_mtproxy_/addproxy"){
      let from=ctx_query.from.trim(),
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
    }else if(ctx.path=="/_mtproxy_/addmock"){
      let action=ctx_query.url,
        method=ctx_query.method||"GET",
        oridata=ctx_query.data,
        data=new Function("return "+ctx_query.data),
        responseType=ctx_query.type||'json';
      responseType=responseType.toLowerCase();
      let obj={
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
    }else if(ctx.path=="/_mtproxy_/addrewrite"){
      let regstr=ctx_query.regx,
          dest=ctx_query.dest,
          flag="i";
        try{
          var json=JSON.parse(regstr);
          regstr=json.str;
          flag=json.flag==="g"?"gi":(json.flag||flag);
        }catch(e){
          console.log("addrewrite:[reg]参数转JSON失败,输入值为"+regstr+"\n"+e)
        }
        let obj={regstr,dest,reg:new RegExp(regstr,flag),flag,count:0};
        let ruleIndex=rewriteMaps.findIndex((rule)=>{return rule.regstr===regstr})
        ruleIndex==-1 && rewriteMaps.push(obj) || (rewriteMaps[ruleIndex]=obj);
        ctx.body = JSON.stringify({
          status:0,
          message:(ruleIndex!=-1?'修改':'新增')+"一条规则:"+regstr+"--->"+dest
        })
    }
  }
  await next();
};