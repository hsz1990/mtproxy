const request = require("request");
const Path = require('path');
const Fs = require('fs');
module.exports=async (params,query,headers)=>{
	let path=params.path||params,filename=query.filename||params.filename||"",stream;
	if(/^http(s)?\:\/\//.test(path)){
			stream=await request(path);
	}else{
			stream=await Fs.createReadStream(Path.resolve(process.cwd(),path))
	}
	if(filename){
		stream.headers=stream.headers||{};
		stream.headers["Content-Disposition"]="attachment;filename="+filename;
	}
	return stream;
};