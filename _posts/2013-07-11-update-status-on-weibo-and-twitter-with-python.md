---
layout: post
date: "2013-07-11 23:38:PM"
title: "Python脚本同时发布新浪微博和twitter"
description: "下课或者下班回家以后，你挺累的不想打开浏览器桌面应用什么的，但是又有点话想说，有点牢骚想发，一不留神的功夫Terminal被打开了，这时候你完全可以在你ls以后随手写上一段心情发布到你的微博和Twitter上，这么完美的geek体验怎么能错过。"
weather: Fine day
category: tools
tags: [Python, funny]
---
{% include JB/setup %}

<br>
下课或者下班回家以后，你挺累的不想打开浏览器桌面应用什么的，但是又有点话想说，有点牢骚想发，一不留神的功夫Terminal被打开了，这时候你完全可以在你ls以后随手写上一段心情发布到你的微博和Twitter上，这么完美的geek体验怎么能错过。

这篇文章我在写第二遍，第一遍写的很详细，可惜因为我很久没用vim了，它生气了，我不小心按错了键，写的好几百行的都没了，这肯定是上天嫌我懒得太久没写了故意来给我这么一下的，好了，不说废话了，下面就是将怎么使用python脚本来在terminal同时更新你在微博和twitter的状态了。

<br>
###先说微博

<br>
首先第一步我们都是要先申请一个开发者的帐号的，关于具体的一些细节可以看看[这里](http://open.weibo.com/wiki/%E6%8E%88%E6%9D%83%E6%9C%BA%E5%88%B6%E8%AF%B4%E6%98%8E)，里面讲了授权使用的方式和原理，像我使用的是第三方的SDK，就只是简单的看了一下，没有太深入的了解，不过想要开发SDK的同学还是可以好好研究的。

<br>
下面就是代码了：

		from weibo import APIClient
		from re import split
		import urllib,httplib
		 
		APP_KEY = '1******671' #youre app key 
		APP_SECRET = 'e623c*************bfa30b23' #youre app secret  
		CALLBACK_URL = 'http://ww****shore.com'
		ACCOUNT = 'bo******@gmail.com'#your email address
		PASSWORD = '*********'     #your pw
		       
		#for getting the code contained in the callback url
		def get_code(url):
			conn = httplib.HTTPSConnection('api.weibo.com')
			postdata = urllib.urlencode     ({'client_id':APP_KEY,'response_type':'code','redirect_uri':CALLBACK_URL,'action':'submit','userId':ACCOUNT,'passwd':PASSWORD,'isLoginSina':0,'from':'','regCallback':'','state':'','ticket':'','withOfficalFlag':0})
			conn.request('POST','/oauth2/authorize',postdata,{'Referer':url,'Content-Type': 'application/x-www-form-urlencoded'})
			res = conn.getresponse()
			location = res.getheader('location')
			code = location.split('=')[1]
			conn.close()
			return code
										     
		def post_weibo(post_contents):
		    print "weibo posting..."
		    #for getting the authorize url
		    client = APIClient(app_key=APP_KEY, app_secret=APP_SECRET, redirect_uri=CALLBACK_URL)
		    url = client.get_authorize_url()
		    code = get_code(url)
		    r = client.request_access_token(code)
		    access_token = r.access_token # The token return by sina
		    expires_in = r.expires_in 
		    #save the access token
		    client.set_access_token(access_token, expires_in)
		    results = client.post.statuses__update(status=post_contents)
		    return results


从上面的代码中，有一点需要注意一下那就是，get_code(),这个函数是获取了授权码，在本来的SDK中是没有这一步的，但是少了这一步我们就需要人工的在浏览区的网页上点击连接授权，而我却只想在命令行里面完成所有的事情，所以才有了这个函数，函数中是使用了httplib包模拟了web请求，并且处理了返回的信息，从而获取到了授权码。

<br>
之所以没有实现人人网，也是因为授权码的问题，可以看看人人网的[开发者文档](http://wiki.dev.renren.com/wiki/Authentication)，授权方式和微博相似，不同就在于不能够我们自己通过代码发送请求来获取授权码，这也就解释了为什么人人网推荐的python SDK都是挂在GAE上的，应该就是因为这个原因，需要我们亲自在网页上进行授权，也正式因为此，我才放弃了人人。其实他们有一个用户名密码端的服务，不过需要填表申请，表我是填了，不过后面就没有消息了，我相信如果我申请成功了，那么就可以使用和微博相同的方式了获取授权码从而获取调用API的tokens了。

<br>

###再说Twitter

<br>
看了推特的文档才知道美帝的东西就是好，他们用授权方式要更加先进，减少了授权了步骤，使用REST API也使开发者更方便的开发SDK，所以推特的SDK明显要好很多。最受欢迎的tweepy是我的第一次尝试，失败原因至今不是很明确，但因该和我使用的代理有关系，也就是说在国内使用代理上推特和Fb的要注意下，使用tweepy可能会带来的失败。除此之外，还有一点提醒大家需要注意，就是申请的twitter的App是有访问级别的限制的，默认是read only，可以自己改成 read&write 或者 read, write & direct message 都是可以的。

<br>
后来我选择的[bear的python－twitter包](https://github.com/bear/python-twitter)，安装好以后特别好用，使我的代码变的很少了，而且也兼容代理的网络条件，下面是代码：

		import twitter
		def post_twitter(tweets):
		    print "tweets posting..."
		    tw_api = twitter.Api(consumer_key='95otEcQ***********xDQQ',
				     consumer_secret='1jUeoOHa********************RducGal1iA',
				     access_token_key='3171230***********************LQZevkJD5spEi94',
				     access_token_secret='2QjrDux***********************VRb7JBKaDGMtmI')
		    results = tw_api.PostUpdate(tweets)
		    return results


从上面的代码可以看出，这个SDK多么的省事儿，除了让使用者显得没有水平之外再没有别的缺点了。
<br>
至于为什么不弄一个Fb版本的，是因为Fb和tw的关系实在是比较暧昧，我绑定了从推特自动同步状态到Fb的服务，所以我的推特一有更新Fb就会跟上，我也就没有必要再做没意义的事情了。

<br>
其实我也想把这篇文章好好写写，不过写第二遍确实是有很多不想说了，以后尽量上点干货弥补一下吧。
