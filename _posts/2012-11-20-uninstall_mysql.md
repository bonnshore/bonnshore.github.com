---
layout: post
date: "2012-11-20 22:22:PM"
weather: Fine maybe
title: "如何完全卸载Mysql"
description: "由于安装MySQL的时候，疏忽没有选择底层编码方式，采用默认的ASCII的编码格式，于是接二连三的中文转换问题随之而来，就想卸载了重新安装MySQL，这一卸载倒是出了问题，导致安装的时候安装不上，在网上找了一个多小时总结一下解决方案。"
category: lessons 
tags: [useful东东]
---
{% include JB/setup %}

    由于安装MySQL的时候，疏忽没有选择底层编码方式，采用默认的ASCII的编码格式，于是接二连三的中文转换问题随之而来，就想卸载了重新安装MySQL，这一卸载倒是出了问题，导致安装的时候安装不上，在网上找了一个多小时总结一下解决方案。

重装系统永远是个好办法，但有谁喜欢这么做呀:(

后来无意发现是卸载的时候没有卸载完全导致，下面给出完整的卸载MySQL 5.1的卸载方法：

控制面板里的增加删除程序内进行删除

删除MySQL文件夹下的my.ini文件，如果备份好，可以直接将文件夹全部删除

开始->运行-> regedit 看看注册表里这几个地方删除没有

    HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\Eventlog\Application\MySQL 目录删除

    HKEY_LOCAL_MACHINE\SYSTEM\ControlSet002\Services\Eventlog\Application\MySQL 目录删除

    HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Eventlog\Application\MySQL 目录删除（我卸载的时候没有找到，略过后仍达到完全卸载的目的。）

这一条是很关键的

    C:\Documents and Settings\All Users\Application Data\MySQL

这里还有MySQL的文件，必须要删除

注意：Application Data这个文件夹是隐藏的，需要打开个文件夹选择菜单栏 工具→文件夹选项→查看→隐藏文件和文件夹一项选上 显示所有文件和文件夹 确定

以上4步完成，重启 OK！再次安装吧

