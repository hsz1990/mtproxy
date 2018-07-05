#!/usr/bin/env node
const path=require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const Koa = require('koa');
const app = new Koa();
const program = require('commander');
const static = require('koa-static');
global.CONFIG={};

const reverseProxy=require('../proxy/proxy');

const options = {
    key: fs.readFileSync(path.join(__dirname,'../keys/key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'../keys/server.crt'))
};

program
  .version('1.0', '-v, --version')
  .option('-q, --quiet', '不打开管理页面')
  .option('-p, --port [port]' , '设置http端口',/^\d$/,80)
  .option('-s, --safe [safe]' , '设置https端口',/^\d$/,443)
  .option('-S, --static [static]','设置静态代理目录')
  .parse(process.argv);

if(program.static) {
	let staticPath=path.resolve(program.static);
	app.use(static(staticPath));
	console.log('静态文件代理路径:'+staticPath)
}

let localHttpUrl=("http://127.0.0.1:"+program.port).replace(":80","")
app.use(async (ctx,next)=>{
	if(ctx.request.origin==(localHttpUrl+"/_getConfig") && ctx.method =="GET"){
		ctx.body = JSON.stringify(global.CONFIG);
	}
});
//反向代理
app.use(reverseProxy);

http.createServer(app.callback()).listen(program.port);
console.log('http 代理使用端口:'+program.port)
https.createServer(options, app.callback()).listen(program.safe);
console.log('https代理使用端口:'+program.safe)