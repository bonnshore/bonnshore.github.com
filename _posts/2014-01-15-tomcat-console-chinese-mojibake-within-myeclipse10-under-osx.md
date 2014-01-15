---
layout: post
date: "2014-01-15 16:11:PM"
title: "OSX下MyEclipse10里Tomcat控制台输出中文字符乱码问题"
description: "OSX下安装MyEclipse10里面内置的Tomcat和Apache Tomcat7.0均在控制台输出中文字符时候出现乱码问题，所有的中文都变成了问号，刚开始还以为是我JDK有问题，不过我写了一个Main函数在本地输出了一下中文是没有问题的，于是把焦点集中在了Tomcat上。"
weather: Fog & Haze
category: lessons
tags: [useful东东]
---
{% include JB/setup %}


OSX下安装MyEclipse10里面内置的的Tomcat和Apache Tomcat7.0均在控制台输出中文字符时候出现乱码问题，所有的中文都变成了问号，刚开始还以为是我JDK有问题，不过我写了一个Main函数在本地输出了一下中文是没有问题的，于是把焦点集中在了Tomcat上。
<br>
我按照网上的很多方法都试了一下，发现均不能解决问题，这些方法包括了：修改Eclipse里面的页面字符编码设置、修改Tomcat配置文件里面的参数、修改MyEclipse Server Configure里面的字符编码，恩基本上就这些了，统统不行。
<br>
最后发现每次只要在Tomcat启动的时候在Launch里面新建一个server，在Create Launch Configuration里面的VMarguments里面的设置参数的最后面加上`-Dfile.encoding=UTF-8`就可以了。
<br>
目前没有发现其他简易的方法可以解决这个问题的，包括在MyEclipse里的Server Configuration里面设置Optional program arguments一栏里面加上`-Dfile.encoding=UTF-8`也不行。