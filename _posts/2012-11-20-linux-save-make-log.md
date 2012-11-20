---
layout: post
title: "Linux终端下另存make的log信息"
description: "我们编译较大的工程项目时，总会遇到以下情况：输入make命令后，显示了很长的一段信息，但是只能显示下面的一部分，用Shift+PageUp也不行，看不到完整的make信息."
category: Linux_OS
tags: [LinuxOS,useful东东]
---
{% include JB/setup %}

我们编译较大的工程项目时，总会遇到以下情况：

输入make命令后，显示了很长的一段信息，但是只能显示下面的一部分，用Shift+PageUp也不行，看不到完整的make信息。

怎么办呢？

可以使用

    make >& makeinfo.txt 

命令进行make编译。

这样一来所有的make信息都会定向打印到makeinfo.txt（可随意起名）文件中。

还不快去试试，骚年！

