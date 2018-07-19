const Mockjs=require("mockjs");
module.exports=async (params,query,headers)=>{
	return Mockjs.mock(params)
};