---
layout: post
date: "2013-10-25 12:25:PM"
title: "OSX更新后JRE6被删除后引发了问题"
description: "最近升级系统到最新的OS X Mavericks了，没有重做系统只是直接选择了升级，所以之前的App都没有受到什么大的影响，用起来都很正常，昨天无意间打开eclipse后发现弹出一对话框，意思大致是想要打开我必须要有JRE6，你现在没有，装一个不？我当时就不会了。"
weather: Sunny
category: tools
tags: [OSX]
---
{% include JB/setup %}

<br>
最近升级系统到最新的OS X Mavericks了，没有重做系统只是直接选择了升级，所以之前的App都没有受到什么大的影响，用起来都很正常，昨天无意间打开eclipse后发现弹出一对话框，意思大致是想要打开我必须要有JRE6，你现在没有，装一个不？我当时就不会了。

然后我就Google了一下发现苹果将自带的JRE删掉了，并告知以后不再提供JRE的更新，还建议从Oracle下载JRE7进行安装。好么，我就本着准求最新的版本的强迫症行为去Oracle下载了最新Mac版的JRE7，装好以后发现还是不能用呢，打开Eclipse弹出的效果是一模一样，我只能再去Google一圈儿。

造成这个的原因应该是Eclipse在启动的时候默认会从java6时代的特定的目录中查找jre，而在oracle提供的Java该路径发生了变化。于是呼找到了一篇博客，有人遇到了同样的问题，他给出的方案大致如下：

1、首先我们查看下/usr/libexec/java_home指向了哪里

2、在/System/Library/Frameworks/JavaVM.framework/Versions/下创建一个软连接CurrentJDK 指向/usr/libexec/java_home

3、创建目录/System/Library/Java/JavaVirtualMachines/，并在该目录下创建一个软连接1.6.0.jdk指向/usr/libexec/java_home

这个我试了一下，结果是不行的，他的OSX是10.8.3，我现在是10.9，貌似会有一些差别吧。

可以在上面的第三步，把要创建软链接的路径换成/Library/Java/JavaVirtualMachines/，这下应该就是可以了。

<br>
当然，如果你也跟我一样，升级了OSX以后遇到这个问题，但是没有去下载最新的JRE7也无所谓，还有一个更加简单的方案，那就是直接去[http://support.apple.com/downloads/#java](http://support.apple.com/downloads/#java) 下载最新的 JavaForOSX.dmg 安装后即可解决。
