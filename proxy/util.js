function fillValue(obj,path,value){
  var leftBracketsType,
      keyLeft=-1,
      keys=[];
  for (var i = 0; i < path.length; i++) {
    if(!leftBracketsType && keyLeft===-1){
      if(/\w/.test(path[i])){
        keyLeft=i;
      }
      if(path[i]==="."){
        keyLeft=i+1;
        if(!/[a-zA-Z_]/.test(path[keyLeft])){
          throw new Error("属性路径不正确:[ "+path+" ],第"+keyLeft+"位应为字母或下划线")
        }
        i++;
        continue;
      }
      if(path[i]==="["){
        i=_skipBlank(i,path)
        if(/[\'\"]/.test(path[i])){
          keyLeft=i+1;
          leftBracketsType=path[i];
        }else if(/\d/.test(path[i])){
          keyLeft=i;
        }else{
          throw new Error("属性路径不正确:[ "+path+" ],第"+(i+1)+"位应为引号或数字(目前仅支持字面量字符串和数字作为属性名)")
        }
        i++;
      }
    }
    if(!leftBracketsType && keyLeft!==-1){
      if(!/[\w]/.test(path[i])){
        keys.push(path.substring(keyLeft,i))
        keyLeft=-1;
      }else{
        continue
      }
    }
    if(leftBracketsType){
      if(path[i]===leftBracketsType && path[i-1]!=="\\"){
        keys.push(path.substring(keyLeft,i));
        keyLeft=-1;
        leftBracketsType=undefined;
        i=_skipBlank(i,path)
        if(path[i]!=="]"){
          throw new Error("属性路径不正确:[ "+path+" ],第"+(i)+"位应为']'")
        }
      }
    }
  }
  var curr=obj,last=keys.length-1;
  keys.map(function(key,index){
    if(index<last){
      curr=obj[key];
      if(typeof curr!=="object"){
        curr={};
      }
    }
  })
  curr[keys[last]]=value;
  function _skipBlank(index,path){
    if(path[index]===" "){
      index++;
      skillBlank(index);
    }else{
      return index;
    }
  }
};

const dns=require("dns");
function findIp(dest){
	return new Promise((resolve, reject)=>{
		dns.lookup(dest,(err, address, family)=>{
			resolve({err, address, family})
		})
	});
}

module.exports={
	fillValue,
	findIp
}