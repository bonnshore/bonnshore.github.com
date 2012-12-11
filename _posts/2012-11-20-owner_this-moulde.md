---
layout: post
date: "2012-11-20 22:22:PM"
weather: No record
title: "linux内核结构体中的.owner = THIS_MODULE是什么"
description: "如题 ：在阅读Linux内核源码时候经常会遇到一种神秘的结构体初始化情况,像这种.owner = THIS_MODULE,这到底是怎么回事呢？其实这是Linux内核代码中一种特殊的结构体初始化方式---指定初始化..."
category: kernel&driver
tags: [Linux_driver]
---
{% include JB/setup %}

如题 ：在阅读Linux内核源码时候经常会遇到一种神秘的结构体初始化情况  像这种  .owner = THIS_MODULE  这到底是怎么回事呢？

其实这是Linux内核代码中一种特殊的结构体初始化方式---指定初始化。

因为才谭浩强的书上也没有提到过，看过了一些C语言书也没有提到过。今天一查，原来这个是C99标准，这个目前也是最新的标准，之前我也清楚这件事，但是没意识到这是一个差别。

在阅读GNU/Linux内核代码时，我们会遇到一种特殊的结构初始化方式。该方式是某些C教材（如谭二版、K&R二版）中没有介绍过的。这种方式称为指定初始化（designated initializer）。下面我们看一个例子，Linux-2.6.x/drivers/usb/storage/usb.c中有这样一个结构体初始化 项目：

    static struct usb_driver usb_storage_driver = { 
    .owner = THIS_MODULE, 
    .name = \"usb-storage\", 
    .probe = storage_probe, 
    .disconnect = storage_disconnect, 
    .id_table = storage_usb_ids, }; 

乍一看，这与我们之前学过的结构体初始化差距甚远。其实这就是前面所说的指定初始化在Linux设备驱动程序中的一个应用，它源自ISO C99标准。以下我摘录了C Primer Plus第五版中相关章节的内容，从而就可以很好的理解2.6版内核采用这种方式的优势就在于由此初始化不必严格按照定义时的顺序。这带来了极大的灵活 性，其更大的益处还有待大家在开发中结合自身的应用慢慢体会。 已知一个结构，定义如下 

    struct book { 
    char title[MAXTITL]; 
    char author[MAXAUTL]; 
    float value; }; 

C99支持结构的指定初始化项目，其语法与数组的指定初始化项目近似。只是，结构的指定初始化项目使用点运算符和成员名（而不是方括号和索引值）来标识具体的元素。例如，只初始化book结构的成员value，可以这样做： 
    struct book surprise = { .value = 10.99 }; 

可以按照任意的顺序使用指定初始化项目： 

    struct book gift = { 
    .value = 25.99, 
    .author = \"James Broadfool\", 
    .title = \"Rue for the Toad\"}; 

正像数组一样，跟在一个指定初始化项目之后的常规初始化项目为跟在指定成员后的成员提供了初始值。

