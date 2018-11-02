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
const settings=require('../proxy/config');
const proxyUrl=require('../proxy/proxy');
const rewriteUrl=require('../proxy/rewrite');
const mockAction=require('../proxy/mock');

const options = {
    key: fs.readFileSync(path.join(__dirname,'../keys/key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'../keys/server.crt'))
};

program
  .version('1.0', '-v, --version')
  .option('-q, --quiet', '不打开管理页面')
  .option('-p, --port [port]' , '设置http端口',/^\d+$/,80)
  .option('-s, --safe [safe]' , '设置https端口',/^\d+$/,443)
  .option('-c, --config [config]' , '设置配置文件路径',(val)=>path.resolve(process.cwd(),val))
  .option('-S, --static [static]','设置静态代理目录,多个目录"::"分隔',(val)=>val.split("::"))
  .parse(process.argv);
if(program.config){
  console.log("配置文件路径:"+program.config)
  let configStr=fs.readFileSync(program.config, 'utf8');
  global.CONFIG=JSON.parse(configStr);
}else{
  global.CONFIG._readonly={};
  global.CONFIG._readonly["port_http"]=program.port;
  global.CONFIG._readonly["port_https"]=program.safe;
  if(program.static){
    global.CONFIG["static_path"]=program.static.map((s)=>{return path.resolve(process.cwd(),s)})
  }
}
app.use(bodyParser({multipart: true}));
app.use(async (ctx,next)=>{
  ctx.CONFIG=global.CONFIG;
  await settings(ctx,next);
  global.CONFIG=ctx.CONFIG;
})
app.use(proxyUrl);
app.use(rewriteUrl);
app.use(mockAction);
let init_static=global.CONFIG.static_path;
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

http.createServer(app.callback()).listen(global.CONFIG._readonly.port_http);
console.log('http 代理使用端口:'+global.CONFIG._readonly.port_http)
https.createServer(options, app.callback()).listen(global.CONFIG._readonly.port_https);
console.log('https代理使用端口:'+global.CONFIG._readonly.port_https)
