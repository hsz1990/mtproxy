#!/usr/bin/env node
const path=require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const Koa = require('koa');
const app = new Koa();
const program = require('commander');
const template = require('art-template');
const static = require('koa-send');
const bodyParser = require('koa-body')

global.CONFIG={};
const proxyUrl=require('../proxy/proxy');
const rewriteUrl=require('../proxy/rewrite');
const mockAction=require('../proxy/mock');
const {fillValue}=require('../proxy/util')

const options = {
    key: fs.readFileSync(path.join(__dirname,'../keys/key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'../keys/server.crt'))
};
const HEADERS=require("../proxy/responseType");
program
  .version('1.0', '-v, --version')
  .option('-q, --quiet', '不打开管理页面')
  .option('-p, --port [port]' , '设置http端口',/^\d+$/,80)
  .option('-s, --safe [safe]' , '设置https端口',/^\d+$/,443)
  .option('-S, --static [static]','设置静态代理目录,多个目录"::"分隔',(val)=>val.split("::"))
  .parse(process.argv);
if(program.static){
  global.CONFIG["static_path"]=program.static.map((s)=>{return path.resolve(process.cwd(),s)})
}
app.use(async (ctx,next)=>{
  if(ctx.url=="/_mtproxy_/client" && ctx.method=="GET"){
    ctx.body=template(path.resolve("./proxy/client_root/index.tpl"),global.CONFIG)
  }else if(/^\/_mtproxy_\/client\/.+/.test(ctx.url)){
    let p=path.resolve("./proxy/client_root/",ctx.url.replace("/_mtproxy_/client/",""));
    ctx.set(HEADERS[p.split(".").pop()]||{})
    ctx.body=fs.createReadStream(p);
  }else{
    await next();
  }
})
app.use(bodyParser({multipart: true}))
app.use(async (ctx,next)=>{
	if(ctx.url=="/_mtproxy_/getConfig" && ctx.method =="GET"){
    ctx.body = JSON.stringify(global.CONFIG);
    return;
	}
  await next();
});
app.use(async (ctx,next)=>{
  if(ctx.url=="/_mtproxy_/setConfig" && ctx.method =="POST"){
      let data=ctx.request.body;
      if(data.key && /^global\b/.test(data.key) && data.value){
        if(/^global[\b]+_readonly/.test(data.key)){
            ctx.body=JSON.stringify({
              status:-1,
              message:"只读属性不能修改"
            })
            return;
        }
        fillValue(global.CONFIG,data.key.replace(/^global/,""),data.value)
        ctx.body=JSON.stringify({
          status:0,
          message:"修改成功"
        })
        return;
      }
  }
  await next();
});
app.use(async (ctx,next)=>{
  if(ctx.url=="/_mtproxy_/delConfig" && ctx.method =="POST"){
      let data=ctx.request.body;
      if(data.path && /^global\b/.test(data.path)){
        if(/^global[\b]+_readonly/.test(data.path)){
            ctx.body=JSON.stringify({
              status:-1,
              message:"只读属性不能删除"
            })
        }else{
          var str=data.path.replace(/^global/,"global.CONFIG"),
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
  }
  await next();
});

app.use(proxyUrl)
app.use(rewriteUrl)
app.use(mockAction);
let init_static=global.CONFIG.static_path
if(init_static){
  init_static.map((s,i)=>{
    console.log('静态文件代理路径'+(i+1)+':'+s)
  })
}
app.use(async (ctx,next)=>{
  let sp=global.CONFIG["static_path"];
  if(sp) {
    for (var i = 0; i < sp.length; i++) {
      try{
        await static(ctx, ctx.path,{ root: sp[i] });
      }catch(err){
        if (err.status !== 404){
          console.log(err)
          throw err
        }
      }
    }
  }
})

http.createServer(app.callback()).listen(program.port);
console.log('http 代理使用端口:'+program.port)
https.createServer(options, app.callback()).listen(program.safe);
console.log('https代理使用端口:'+program.safe)
global.CONFIG._readonly={};
global.CONFIG._readonly["port_http"]=program.port;
global.CONFIG._readonly["port_https"]=program.safe;