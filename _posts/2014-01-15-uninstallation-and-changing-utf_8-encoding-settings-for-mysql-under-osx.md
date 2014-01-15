---
layout: post
date: "2014-01-15 16:28:PM"
title: "OSX下完全删除MySQL和怎样使MySQL支持中文"
description: "最近在OSX下装了个最新版的MySQL，研究了一下，比如以前经常出现的中文乱码问题和完全卸载问题也遇到了，于是趁着今天闲着没事情干脆就把这些都写写，以后要用了查起来也方便，虽然我也已经放到我的Evernote里面了。"
weather: Fog & Haze
category: lessons
tags: [useful东东]
---
{% include JB/setup %}

最近在OSX下装了个最新版的MySQL，研究了一下，比如以前经常出现的中文乱码问题和完全卸载问题也遇到了，于是趁着今天闲着没事情干就把这些都谢谢，以后要用了查起来也方便，虽然我也已经放到我的Evernote里面了。
<br>
###完全卸载MySQL For OSX
<br>
先停止所有MySQL有关进程:
	sudo rm /usr/local/mysql
	sudo rm -rf /usr/local/mysql*
	sudo rm -rf /Library/StartupItems/MySQLCOM
	sudo rm -rf /Library/PreferencePanes/My*
	vim /etc/hostconfig and removed the line MYSQLCOM=-YES-
	rm -rf ~/Library/PreferencePanes/My*
	sudo rm -rf /Library/Receipts/mysql*
	sudo rm -rf /Library/Receipts/MySQL*
	sudo rm -rf /var/db/receipts/com.mysql.*
<br>
Over.
<br>

###设置中文支持
<br>
配制方法如下：
<br>
1. 拷贝/usr/local/mysql/support-files下的任意一个*.cnf文件到/etc/my.cnf

2. 在my.cnf文件的［client］后面添加一句default-character-set=utf8

3. 在［mysqld］后面添加如下三句：
		default-storage-engine=INNODB
		character-set-server=utf8
		collation-server=utf8_general_ci
4. 保存退出,reboot MySQL就可以了
<br>
以上。