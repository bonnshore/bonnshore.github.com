---
layout: post
date: "2014-01-15 15:47:PM"
title: "从Android使用JSON传递参数到后台中文编码问题"
description: "因为论文中的算法要应用在Android App中，所以不可避免的会牵扯到与后台服务器之间的交互，其中比较容易出现的问题就是大家早已熟悉的中文乱码问题虽然已经考虑到会出现这方面的问题，在代码里面已经提前考虑Encoding的问题，但还是经历了一些小曲折。"
weather: Fog & Haze
category: lessons
tags: [useful东东]
---
{% include JB/setup %}

因为论文中的算法要应用在Android App中，所以不可避免的会牵扯到与后台服务器之间的交互，其中比较容易出现的问题就是大家早已熟悉的中文乱码问题虽然已经考虑到会出现这方面的问题，在代码里面已经提前考虑Encoding的问题，但还是经历了一些小曲折。
<br>

起始客户端的代码如下：
<br>
	HttpClient client = new DefaultHttpClient();
	HttpPost post = new HttpPost(url);
	JSONObject obj = new JSONObject();
	obj.put("addr",XXX);
	obj.put("city", XXX);
	post.setEntity(new StringEntity(nameValuePairs.toString());
	StringEntity se = new StringEntity(obj.toString(),"UTF-8");
	se.setContentEncoding("UTF-8");
	se.setContentType("application/json");
	post.setEntity(se);
	HttpResponse response = client.execute(post);
<br>
以为在new StringEntity的时候加上了一个charset设置会避免出现问题，但是提交到server以后还是出现了乱码问题。中文全是问号，用Eclipse看了HttpRequest里面的Content的Encoding设定还是null。
<br>
于是Google了一圈后回来用了另一种封装JSON的方式：
<br>
	HttpClient client = new DefaultHttpClient();
	HttpPost post = new HttpPost(url);
	JSONObject obj = new JSONObject();
	obj.put("addr",XXX);
	obj.put("city", XXX);
	NameValuePair nameValuePair = new BasicNameValuePair("json",
				obj.toString());
	List<NameValuePair> nameValuePairs = new ArrayList<NameValuePair>();
	nameValuePairs.add(nameValuePair);
	UrlEncodedFormEntity encodedHE = new UrlEncodedFormEntity(nameValuePairs, HTTP.UTF_8);
	post.setEntity(encodedHE);
	HttpResponse response = client.execute(post);
<br>
没错，用了UrlEncodedFormEntity来直接生成一个本身就带有CharsetEncoding的对象，再用POST传到后台，不过问题依然存在，依然是问号，HttpRequest里面的Content的Encoding设定仍然还是null。
<br>

这时候猜想可能问题不是在这里，于是突然想到HttpClient也有可以设定CharsetEncoding的方法，于是又查阅了一圈资料发现了解决问题的方法：
<br>
	HttpPost post = new HttpPost(url);
	post.setHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
<br>
就是这样，使用setHeader方法重新写一个HttpHeader把Charset写进去就可以了。
<br>
哎，这么个小问题还是叫人弄了好久。









