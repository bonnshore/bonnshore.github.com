---
layout: post
date: "2013-03-17 23:22:PM"
title: "使用Python脚本来收发Gmail, Say no to GFW"
description: "学校里面的网络环境一直令人不快，天天喊着要建立国际一流大学，就校园网这质量只能是下辈子的事了，再加上国内目前对Google方面的不友好，我会经常性的不能正常通过浏览器连接到我的Gmail邮箱，捉急的时候真是很后悔当初选择了Gmail，虽然它看起来又高端又时尚又有Geek风范。对Outlook和Mac自带Mail客户端的失望让我有了这一想法，本文里面说到这个版本还处于初级阶段，不过应急看邮件回复紧急事情肯定是够用了。"
weather: Sunday
category: tools 
tags: [Python, jekyll, 胡说]
---
{% include JB/setup %}
<br>
学校里面的网络环境一直令人不快，天天喊着要建立国际一流大学，就校园网这质量只能是下辈子的事了，再加上国内目前对Google方面的不友好，我会经常性的不能正常通过浏览器连接到我的Gmail邮箱，捉急的时候真是很后悔当初选择了Gmail，虽然它看起来又高端又时尚又有Geek风范。对Outlook和Mac上自带Mail软件的失望让我有了这一想法，本文里面说到这个版本还处于初级阶段，不过应应急看邮件回复紧急事情肯定是够用了。
<br>
废话不多说直接进入正题了，本文将要告诉你的事情是，如果你也想我一样需要一个应急的接收Gmail的小插件，这篇文章可以帮助你在数分钟之内搭建一个收发Gmail的小平台，当然前提是你也和我一样喜欢使用CLI的形式与你的计算机交互。

<br>
###首先我们先来看看接收邮件的part

<br>
如果你想敲几个命令就连上你的邮箱大致需要下面的几个步骤：第一，你要与你的邮箱服务器建立一个成功的连接，当然我使用的是IMAP的协议，个人觉着比POP更好，当然人人都有自己的喜好，这也不是啥关键的事情。第二，在连接成功建立的基础上你要使用自己的帐号和口令成功登陆，也就是去的认证获取对该用户邮箱的操作权。第三，在前两者都OK的基础上你可以开始搞一些事情了，例如获取目前的邮箱一些基本情况(邮件总数，未读数量，已读数量，容量情况)，在此基础上你就可以读取某一封邮件了(目前在带有附件，HTML元素，图片的邮件上还比较无力)。

<br>
虽然看起来功能弱爆了，但是对我来讲已经足够了，想象一下一个焦急等待面试结果或者等待女朋友是否同意求婚而苦守在邮箱门前却因为GFW的缘故无法得知结果的可怜人的痛苦心情吧！代码的实现大概是这样子的(只贴上关键部分，对于怎么组织所有代码是个太灵活的事情，谁让咱们有那么多模式呢)。

<br>
	def __init__(self): 
		self.IMAP_SERVER='imap.gmail.com'
		self.IMAP_PORT=993
		self.M = None
		self.respons
		self.mailboxes = [] 
	def login(self, username, password): 
		self.M = imaplib.IMAP4_SSL(self.IMAP_SERVER, self.IMAP_PORT) 
		rc, self.response = self.M.login(username, password) 
		return rc 
<br>
这部分就是第一步和第二步所做到事情。
<br>
	def receive_mail(self):       
		recvMail = receiveMail.ReceiveMail(self.M) 
		mailCounts = recvMail.get_mail_count()
		print 'A total of '+ mailCounts +' mails in your input mailbox.'
		print 'A total of '+recvMail.get_unread_count()+ ' UNREAD mails in your input mailbox.'
		recvMail.get_imap_quota()
		mailBody = recvMail.check_simpleInfo(mailCounts)
		if mailBody != 0:
			recvMail.check_detailInfo(mailBody)
		return

<br>
上面的这些代码是出现在调用层的。
<br>
下面的这些则在receiveMail.py文件中。
<br>
    def get_first_text_block(self,email_message_instance):
        maintype = email_message_instance.get_content_maintype()
        if maintype == 'multipart':
            for part in email_message_instance.get_payload():
                if part.get_content_maintype() == 'text':
                    return part.get_payload(decode=True).strip()
        elif maintype == 'text':
            return email_message_instance.get_payload(decode=True).strip()

    def get_mail_simpleInfo_from_id(self, id): 
        status, response = self.M.fetch(id,"(RFC822)")
        mailText = response[0][1]
        mail_message = email.message_from_string(mailText)
        subject = mail_message['subject']
        dh = email.Header.decode_header(subject)  
        subject = dh[0][0]
        mail_from = email.utils.parseaddr(mail_message["from"])[1]
        mail_to = email.utils.parseaddr(mail_message["to"])[1]
	print '['+mail_message['Date']+']'+'\n'+'From:'+mail_from+ ' To:'+mail_to+'\n'+'Subject:'+subject+'\n'
        return self.get_first_text_block(mail_message)

    def get_mail_content(self, content):
    	print 'MailContent:'+'\n'+content
    
    def check_simpleInfo(self, mailCounts):
    	print "Input 'y' to check the lasted UNread mail. Other cmds to abandon!"
    	while True:
		argv = string.split(raw_input('$====>'))
		if len(argv)!=0:
			if argv[0] == 'y':
				mailBody = self.get_mail_simpleInfo_from_id(mailCounts)
				return mailBody
			else:
				return 0
		else:
			pass
	else:
		pass

    def check_detailInfo(self, mailBody):
    	print "Input 'y' to check the detailInfo. Other cmds to abandon!"
	while True:
    		args = string.split(raw_input('$====>'))
		if len(args)!=0:
			if args[0] == 'y':
				self.get_mail_content(mailBody)
				return
			else:
				break
		else:
			pass
    	else:
    		pass	

稍微解读一下，调用`check_simpleInfo()`函数查阅某邮件的简略信息，包括邮件来自谁，发送时间，主题等。
调用`check_detailInfo()`函数来查看邮件的详细信息也就是邮件内容。当然都看得出来`get_mail_simpleInfo_from_id()`才是主要进行了获取内容的工作。`get_first_text_block()`函数用来判断这个作为参数传进来的邮件实体的主体类型是哪个？如果还是multipart类型还需要继续分解一下最后的目标就是将他们全部分解为text类型。
由于我们在工作中会使用到中文，所以在这里我们还需要关注两个有可能产生乱码的地方，一个是邮件头部分在代码中使用了`email.Header`对其进行解码。`email.Header.decode_header(subject)`对邮件主体可能出现的乱码进行了处理。`part.get_payload(decode=True)`函数对解析的邮件主要内容进行了解码，避免将一些乱七八糟的mojibake直接显示在你的终端里。说到这里不能不再啰嗦一件事，虽然很不起眼但是却很容易再这里出问题，那就是你terminal的编码格式，如果你的编码格式不支持中文或者utf-8的画python会报错的，没错你没有看错，terminal的编码错误会造成python的崩溃，我就遇到了此问题，虽说Mac的terminal是支持各种编码的但是正巧我做这一部分的时候是在使用公司的Thinkpad，于是在window的CMD下就果断悲剧了，直接报了python的编码不能找到定义字符集(UnicodeDecodeError),所以有人要尝试的话此处是需要注意的。
上面的代码就是在接受邮件时用到的主要函数，当然还有其他的一些像修改、新增、删除收件箱，按照发送者筛选查询等功能就没有贴上来了。
<br>
###下面看看创建一个邮件并发送给一个收件列表的主要实现吧
<br>
首先我要告诉你的是，想要发一封邮件也需要几个步骤。第一，同样你要成功的连接到邮箱的服务器(我使用的是SMTP协议，这个协议地球人都知道啦估计)。第二，同样要使用自己的信息成功登陆取得权限，在这要多说一点，Gmail的安全验证做的更为完善，普通的SSL不能满足它了，在你连通server之后必须要使用STARTTSL协议来将之前取得连接的SSL来升级为更加安全的加密通道，只有这样才能登陆成功，否则会提示你server的AUTH授权失败。具体的原因有兴趣的还可以参看[这篇文章](https://www.fastmail.fm/help/technology_ssl_vs_tls_starttls.html)，老外都把事情讲得很详细。第三，此后你就可以畅快的发送邮件了。
<br>
    def send_new_mail(self):
	send_to_str = raw_input("Input Email address that you want send your mail to,"+'\n'+\
	"if you have multiple address, seperate them with comma."+'\n'+\
	'$===>')
	send_list = send_to_str.split(',')
	send_subject  = raw_input('The Subject of new mail:')
	send_content  = raw_input('The Content of new mail:')
    	sendMailInstance = sendMail.SendMail(send_list, send_subject, send_content)
	if sendMailInstance.send_mail():
		print 'New mail send success!'
	else:
		print 'New mail send failed!'
    	return
<br>
同样上面的代码出现在调用层。实现出现在sendMail.py文件中。
<br>
    def send_mail(self):  
	me="hello"+"<"+self.mail_user+"@"+self.mail_postfix+">"  
	msg = MIMEText(self.content,'plain','utf-8')  
	msg['Subject'] = Header(self.subject, 'utf-8')
	msg['From'] = me      
	msg['To'] = ";".join(self.send_list)  
	msg['Date'] = email.Utils.formatdate()
	try:  
		smtpServer = smtplib.SMTP()  
		smtpServer.connect(self.mail_host)  
		smtpServer.starttls()
		smtpServer.login(self.mail_user,self.mail_pass)  
		smtpServer.sendmail(me, self.send_list, msg.as_string())  
		smtpServer.close()  
		return True 
	except Exception, e:  
		print str(e)  
		return False  
<br>
代码中`smtpServer.starttls()`此句就是我上提到过的升级安全加密策略的语句，刚知道仅用一句代码就实现的时候还是被Python强大的库惊呆了。其中，不加`msg['Date'] = email.Utils.formatdate()`这句的话发送出的邮件默认时间为：UTC-07:00 休斯顿、底特律时间，加上之后恢复正常，此问题的原因我还没有详细追究。
<br>
从上面的代码不难看出这是能够单纯的发送文本信息的情况，其实其他的像包含HTML和附件和图片的代码也不是很复杂，只是我觉着我现在暂时还用不到，也就没有着急实现。
<br>
代码的基本情况大致就是这样了，当然没有逐句的解释这些代码，我觉着逻辑简单命名还算完整，其中有些库函数大家感兴趣的可以Google之，丰富的类库和充足的资料的保证下总体感觉代码开发工作量很小，只能说以后要是再有什么需求就决定继续用Python了，就一个字，方便！快捷！现在下面贴两张我运行的效果图。
<br>
选择获取最新的一封邮件：
<br>
![pymail01](/assets/themes/twitter/img/blogpic/pymail01.png)
<br>
选择发送一封新的邮件：
<br>
![pymail02](/assets/themes/twitter/img/blogpic/pymail02.png)
<br>
你能相信一个菜鸟屌丝学生程序员在一段很短的时间内就从完全没概念到完成编码加debug么？你以为屌丝逆袭了，错，是Python太Powerful了！当然还有更加Powerful的Google在帮我，虽然它时不时上不去还得在.hk .sg .com/ncr之间来回换着用，但Google的存在至少对程序员来说就是个太美好的存在了！又跑题了。。。
