<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>MTProxy</title>
	<link rel="stylesheet" href="/_mtproxy_/client/index.css">
</head>
<body>
	<div class="left-nav">
		<h2><a href="https://github.com/hsz1990/mtproxy.git">MTProxy</a></h2>
		<ul>
			<li data-tabindex="0" class="active">运行状态</li>
			<li data-tabindex="1">域名转发</li>
			<li data-tabindex="2">URL重写</li>
			<li data-tabindex="3">MOCK</li>
			<li data-tabindex="4">设置</li>
		</ul>
	</div>
	<div class="right-content">
		<div class="tab-content active" content-index="0">
			<ul class="pills container">
				<li>
					<h2>端口</h2>
					<p>
						已监听http端口:<var class="pink">{{_readonly.port_http}}</var><br/>
						已监听https端口:<var class="pink">{{_readonly.port_https}}</var>
					</p>
				</li>
				<li>
					<h2>静态托管</h2>
					<p>
						本地静态文件服务器已
						{{if static_path}}
							<var class="pink">开启</var>:<br/>
							{{each static_path path index}}
								托管路径{{index}}:<var class="pink">{{path}}</var><br/>
							{{/each}}
						{{else}}
							<var class="pink">关闭</var>
						{{/if}}
					</p>
				</li>
			</ul>
		</div>
		<div class="tab-content" content-index="1">
			<form action="/_mtproxy_/addproxy" class="form-inline form-proxy" method="POST">
				<div class="form-group">
					<label>匹配规则:</label>
					<input required type="text" name="from" placeholder="*号可匹配任意字符">
				</div>
				<div class="form-group">
					<label>转发域名:</label>
					<input required type="text" name="dest" placeholder="目标域名">
				</div>
				<div class="form-group">
					<input type="submit" value="添加" class="btn">
				</div>
			</form>
			<table class="table-proxy">
				<thead>
					<tr>
						<th>编号</th>
						<th>匹配规则</th>
						<th>转发域名</th>
						<th>备注</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{{if proxyMaps.length < 1}}
						<tr>
							<td colspan="5">暂无数据</td>
						</tr>
					{{/if}}
					{{each proxyMaps item index}}
						<tr>
							<td>{{index+1}}</td>	
							<td>{{item.from}}</td>
							<td>{{item.dest}}</td>
							<td>已命中次数{{item.count}}</td>
							<td>
								<a href="javascript:;" data-key="{{index}}" class="btn-mod btn-proxy-edit">修改</a>
								<a href="javascript:;" data-path="global.proxyMaps[{{index}}]" class="btn-del btn-proxy-del">删除</a>
							</td>
						</tr>
					{{/each}}
				</tbody>
			</table>
		</div>
		<div class="tab-content" content-index="2">
			<form action="/_mtproxy_/addrewrite" class="form-inline form-rewrite" method="POST">
				<div class="form-group">
					<label>匹配规则:</label>
					<input required type="text" name="regx" placeholder="将被编译成正则表达式" data-dtype="regexp">
				</div>
				<div class="form-group">
					<label>替换结果:</label>
					<input required type="text" name="dest" placeholder="允许使用$n等特殊变量名">
				</div>
				<div class="form-group">
					<input type="submit" value="添加" class="btn">
				</div>
			</form>
			<div class="testbox-rewrite">
				<input type="text" class="input-test-rewrite" placeholder="请输入要测试的url,例如:http://www.baidu.com">
				<span class="btn btn-test-rewrite">测试url</span>
				<p id="output-test-rewrite"></p>
			</div>
			<table class="table-rewrite">
				<thead>
					<tr>
						<th>编号</th>
						<th>正则规则</th>
						<th>替换结果</th>
						<th>备注</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{{if rewriteMaps.length < 1}}
						<tr>
							<td colspan="5">暂无数据</td>
						</tr>
					{{/if}}
					{{each rewriteMaps item index}}
						<tr>
							<td>{{index+1}}</td>	
							<td>/{{item.regstr}}/{{item.flag}}</td>
							<td>{{item.dest}}</td>
							<td>已命中次数{{item.count}}</td>
							<td>
								<a href="javascript:;" data-key="{{index}}" class="btn-mod btn-rewrite-edit">修改</a>
								<a href="javascript:;" data-path="global.rewriteMaps[{{index}}]" class="btn-del btn-rewrite-del">删除</a>
							</td>
						</tr>
					{{/each}}
				</tbody>
			</table>
		</div>
		<div class="tab-content" content-index="3">
			<form action="/_mtproxy_/addmock" class="form-vertical form-mock" method="POST">
				<div class="form-group">
					<label>接口url:</label>
					<input required type="text" name="url" placeholder="以‘/’开头,不带参数,例如'/_mtproxy_/addmock'">
				</div>
				<div class="form-group">
					<label>访问方式:</label>
					<select required name="method">
						<option value="GET" checked>GET</option>
						<option value="POST">POST</option>
						<option value="PUT">PUT</option>
						<option value="OPTION">OPTION</option>
						<option value="DELETE">DELETE</option>
					</select>
				</div>
				<div class="form-group">
					<label>数据类型:</label>
					<select required name="type" id="placehoder_changer" for="input_mock_data">
						<option value="">请选择</option>
						<option value="json">JSON</option>
						<option value="html">HTML</option>
						<option value="file">FILE</option>
						<option value="basic">BASIC</option>
					</select>
				</div>
				<div class="form-group">
					<label class="vertical-top">data:</label>
					<textarea required name="data" rows="20" placeholder="根据数据类型不同,data含义不同,请先选择数据类型" id="input_mock_data"></textarea>
				</div>
				<div class="form-group text-right">
					<input type="submit" value="添加" class="btn">
				</div>
			</form>
			<table>
				<thead>
					<tr>
						<th>接口url</th>
						<th>访问方式</th>
						<th>数据类型</th>
						<th>data</th>
						<th>备注</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{{if mockActions.length < 1}}
						<tr>
							<td colspan="6">暂无数据</td>
						</tr>
					{{/if}}
					{{each mockActions item index}}
						<tr>
							<td>{{item.action}}</td>
							<td>{{item.method}}</td>
							<td>{{item.type}}</td>
							<td data-index="{{index}}">
								{{if (typeof item.data === "object")}}
									{{item.data|JSON.stringify}}
								{{else}}
									{{item.data}}
								{{/if}}
							</td>
							<td>已命中次数{{item.count}}</td>
							<td>
								<a href="javascript:;" class="btn-mod btn-mock-edit" data-key="{{index}}">修改</a>
								<a href="javascript:;" class="btn-del btn-mock-del"  data-path="global.mockActions[{{index}}]">删除</a>
							</td>
						</tr>
					{{/each}}
				</tbody>
			</table>
		</div>
		<div class="tab-content" content-index="4">
			<div class="title">全局设置</div>
			<form class="form-vertical" action="/_mtproxy_/setConfig" method="POST">
				<div class="form-group">
					<label>路径:</label>
					<input required type="text" placeholder="必须以global开头,例如:global.abc['ddd']" name="key">
				</div>
				<div class="form-group">
					<label class="vertical-top">值:</label>
					<textarea required name="value" rows="10" placeholder="任何js对象,使用不能被JSON.stringify处理的特殊类型(如Symbol)时,不能被正确显示,但设值有效"></textarea>
				</div>
				<div class="form-group text-right">
					<input class="btn" type="submit" value="修改">
				</div>
			</form>
			<div class="title">目前global</div>
			<pre>{{@$data|JSON.stringify null "\t"|String.prototype.replace.call /\\\\/g "\\"}}</pre>
		</div>
	</div>
	<script type="text/javascript">window.global={{@$data|JSON.stringify}}</script>
	<script type="text/javascript" src="/_mtproxy_/client/index.js"></script>
</body>
</html>