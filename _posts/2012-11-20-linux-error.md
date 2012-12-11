---
layout: post
date: "2012-11-20 22:22:PM"
weather: No record
title: "linux内核编译错误:include/asm is a directory but a symlink was expected"
description: "拿到一个内核包，在编译时出现错误提示:include/asm is a directory but a symlink was expected,解决方法进来看。"
category: kernel&driver
tags: [Linux_driver]
---
{% include JB/setup %}

拿到一个内核包，在编译时出现错误提示：

include/asm is a directory but a symlink was expected

解决方法：

删除源码根目录下的include/asm，文件夹，问题解决。

分析：

原因：linux/include/asm 文件夹是内核编译过程中创建的，创建结果就是一个指向文件夹asm-arm的链接，表明该系统的平台是arm架构的，而编译系统内核之前，是没有asm这个链接的，所以，在编译过程中，创建该链接时文件名字与asm文件夹的名字发生冲突...

