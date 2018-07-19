(function(){
	var navs=document.querySelectorAll(".left-nav li");
	[].map.call(navs,function(nav){
		nav.addEventListener("click",function(e){
			document.querySelector(".left-nav li.active").classList.remove("active");
			this.classList.add("active");
			document.querySelector(".right-content .tab-content.active").classList.remove("active");
			var index=this.dataset.tabindex;
			location.hash="#tab="+index;
			document.querySelector(".right-content .tab-content[content-index='"+index+"']").classList.add("active")
		})
	})
})();
(function(){
	if(!location.hash) return;
	var tab=location.hash.match(/\btab\=(\d+)\b/)[1]||0;
	document.querySelectorAll(".left-nav li")[tab].click();
})();
(function(){
	var changer=document.getElementById("placehoder_changer");
	var inputer=document.getElementById(changer.getAttribute("for"));
	changer.addEventListener("change",function(e){
		var holder="根据数据类型不同,data含义不同,请先选择数据类型";
		switch(this.value){
			case "json":
				holder=`一个js对象,符合mockjs规则的数据模板,例如:\n`;
				holder+=[
					"{\n",
						`\t"number1|1-100.1-10": 1,\n`,
						`\t"regexp1": /[a-z][A-Z][0-9]/,\n`,
						`\t"name": {\n`,
							`\t\tfirst: "@FIRST",\n`,
							`\t\tmiddle: "@FIRST",\n`,
							`\t\tlast: "@LAST",\n`,
							`\t\tfull: "@first @middle @last"\n`,
						`\t}\n`,
					"}"
				].join("")
			break;
			case "html":
				holder=`使用模板引擎art-template,包括{template,data}两个属性的对象,或一个字符串,如下:\n`;
				holder+=[
					"{\n",
						`\t"template":"./path/to/example.tpl",\/\/相对当前工作目录,或绝对路径,或http(s)开头的远程路径\n`,
						`\t"data":{"a":1,"b":"c"}\/\/可选参数,当为一个字符串时,配置方式同template\n`,
					"}"
				].join("")
			break;
			case "file":
				holder=`包括{path,filename}两个属性的js对象,或相对当前工作目录的相对路径,或绝对路径,或http(s)开头的远程路径,请求接口时以文件方式下载,例如:\n`;
				holder+=[
					"{\n",
						`\t"path":"./path/to/example.tpl",\/\/相对当前工作目录,或绝对路径,或http(s)开头的远程路径\n`,
						`\t"filename":"example.xls"\/\/文件名称,请求接口时加filename参数可覆盖该配置\n`,
					"}"
				].join("")
			break;
			case "basic":
				holder="给什么,返回什么,当为object时{body,headers}对应http响应的body和headers"
			break;
		}
		inputer.setAttribute("placeholder",holder)
	})
})();
(function(){
	var forms=document.querySelectorAll("form");
	[].map.call(forms,function(form){
		var opt={
			method:form.method||"GET",
			url:form.action
		};
		form.onsubmit=function(e){
			e.preventDefault();
			var typeEls=form.querySelectorAll("[data-dtype]");
			var isError=false;
			[].map.call(typeEls,function(el){
				var dtype=el.dataset.dtype;
				switch(dtype){
					case "regexp":
						var str=el.value,flag,reg=/^\/(.+)\/([ig]{0,1}[ig]{0,1})$/i;
						if(reg.test(str)){
							str=RegExp.$1,flag=RegExp.$2;
							try{
								new RegExp(str,flag);
								el.value=JSON.stringify({str,flag});
							}catch(e){
								isError=true;
								alert("匹配规则不正确,")
							}
						}else{
							var str=el.value.replace(/(\W)/g,"\\$1")
							el.value=JSON.stringify({str});
						}
					break;
					case "date":

					break;

				}
			})
			if(isError) return false;
			opt.data=new FormData(form);
			sendRemote(opt).then(function(text){
				var res=JSON.parse(text);
				if(res.status!=0){
					alert(res.message);
				}else{
					window.location.reload();
				}
			})
			return false;
		}
	})
})();
(function(){
	document.querySelector(".btn-test-rewrite").addEventListener("click",function(){
		var inputUrl=document.querySelector(".input-test-rewrite").value;
		var $output=document.querySelector("#output-test-rewrite");
		var reMap=global.rewriteMaps;
		for (var i = 0; i < reMap.length; i++) {
			var reg=new RegExp(reMap[i].regstr);
			if(reg.test(inputUrl)){
				$output.innerHTML=[
					"匹配规则 ",
					"<span class='pink'>",
					i+1,
					"</span>",
					"&nbsp;&nbsp;&nbsp;&nbsp;",
					reMap[i].regstr,
					"<br/>",
					"重写后URL",
					"&nbsp;&nbsp;&nbsp;&nbsp;",
					"<span class='pink'>",
					inputUrl.replace(reg,reMap[i].dest),
					"</span>"
				].join("");
				return;
			}
		}
		$output.innerHTML="没有匹配到已添加的重写规则";
	})
})();
(function(){
	var dels=document.querySelectorAll(".btn-del");
	[].map.call(dels,function(el){
		el.addEventListener("click",function(){
			var path=this.dataset.path;
			sendRemote({
				method:"POST",
				url:"/_mtproxy_/delConfig",
				data:{"path":this.dataset.path}
			}).then(function(text){
				var res=JSON.parse(text);
				if(res.status!=0){
					alert(res.message);
				}else{
					window.location.reload();
				}
			})
		})
	})
})();
(function(){
	var mods=document.querySelectorAll(".btn-mod");
	[].map.call(mods,function(el){
		el.addEventListener("click",function(){
			var key=el.dataset.key,classList=el.classList;
			if(classList.contains("btn-rewrite-edit")){
				var obj=global.rewriteMaps[key];
				document.querySelector(".form-rewrite [name=regx]").value="/"+obj.regstr+"/"+obj.flag;
				document.querySelector(".form-rewrite [name=dest]").value=obj.dest;
			}else if(classList.contains("btn-mock-edit")){
				var obj=global.mockActions[key];
				document.querySelector(".form-mock [name=url]").value=obj.url;
				document.querySelector(".form-mock [name=method]").value=obj.method;
				document.querySelector(".form-mock [name=type]").value=obj.type;
				document.querySelector(".form-mock [name=data]").value=obj.oridata;
			}else if(classList.contains("btn-proxy-edit")){
				var obj=global.proxyMaps[key];
				document.querySelector(".form-proxy [name=from]").value=obj.from;
				document.querySelector(".form-proxy [name=dest]").value=obj.dest;
			}
		})
	})
})();
function sendRemote(opt){
	return new Promise((resolve, reject) => {
		var httpRequest = new XMLHttpRequest();
	    httpRequest.onreadystatechange = function(){
	    	if (httpRequest.readyState === XMLHttpRequest.DONE) {
		      if (httpRequest.status === 200) {
		        resolve(httpRequest.responseText);
		      } else {
		      	console.log("请求出错",httpRequest)
		        reject(httpRequest)
		      }
		    }
	    };
	    httpRequest.open(opt.method||'GET', opt.url||location.pathname);
	    if(Object.prototype.toString.call(opt.data)==="[object Object]"){
	    	var sendData="";
	    	for(var p in opt.data){
	    		sendData+=("&"+p+"="+opt.data[p])
	    	}
	    	httpRequest.setRequestHeader("Content-Type","application/x-www-form-urlencoded")
	    	opt.data=sendData.replace(/^\&/,"");
	    }
	    httpRequest.send(opt.data);
	});
};