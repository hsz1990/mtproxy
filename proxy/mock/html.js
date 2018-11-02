const template = require('art-template');
const request = require("request");
const Path = require('path');
const Fs = require('fs');
module.exports=async (params,query,headers)=>{
	let tpl=params["template"]||params,data=params["data"]||{};
	if(!tpl){
		tpl=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title></title></head><body></body></html>`;
		return template(tpl,{});
	}
	if(typeof data === "string"){
		try{
			data = await getDataByPath(data);
		}catch(e){
			throw Error({
				status:400,
				message:"参数错误[data],请检查mock配置"
			})
		}
	}
	try{
		tpl = await getDataByPath(tpl);
		return template.render(tpl, data);
	}catch(e){
		throw Error({
			status:400,
			message:"参数错误[template],请检查mock配置"
		})
	}
};
function getDataByPath(path){
	if(/^http(s)?\:\/\//.test(path)){
		return new Promise((resolve, reject) => {
			request(path,function(err,res,body){
				if(err)return reject(err);
				resolve(body);
			});
		});
	}else{
		return new Promise((resolve, reject) => {
			Fs.readFile(Path.resolve(process.cwd(),path),(err,content)=>{
				if(err)return reject(err);
				resolve(content);
			});
		});
	}
}