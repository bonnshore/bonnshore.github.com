---
layout: post
title: "把自己的驱动编译进内核或模块"
description: "2.6内核的源码树目录下一般都会有两个文文：Kconfig和Makefile。分布在各目录下的Kconfig构成了一个分布式的内核配置数据库，每个Kconfig分别描述了所属目录源文件相关的内核配置菜单。"
category: kernel&driver
tags: [Linux_driver, useful东东]
---
{% include JB/setup %}

    2.6内核的源码树目录下一般都会有两个文文：Kconfig和Makefile。分布在各目录下的Kconfig构成了一个分布式的内核配置数据库，每个Kconfig分别描述了所属目录源文件相关的内核配置菜单。在内核配置make menuconfig(或xconfig等)时，从Kconfig中读出配置菜单，用户配置完后保存到.config(在顶层目录下生成)中。在内核编译时，主Makefile调用这个.config，就知道了用户对内核的配置情况。

上面的内容说明：Kconfig就是对应着内核的配置菜单。假如要想添加新的驱动到内核的源码中，可以通过修改Kconfig来增加对我们驱动的配置菜单，这样就有途径选择我们的驱动，假如想使这个驱动被编译，还要修改该驱动所在目录下的Makefile。

因此，一般添加新的驱动时需要修改的文件有两种（注意不只是两个）:

     *Kconfig
     *Makefile

要想知道怎么修改这两种文件，就要知道两种文档的语法结构.

###First: Kconfig

Kconfig的作用就是为了让用户配置内核，在Kconfig中定义了一些变量，用户通过设置变量的值来选择如何个性化自己的系统内核。定义的变量将在每个菜单项都有一个关键字标识，最常见的就是config。

语法：

    config symbol
    options
    <!--[if !supportLineBreakNewLine]-->
    <!--[endif]-->

symbol就是新的菜单项，options是在这个新的菜单项下的属性和选项

其中options部分有：

1、类型定义：

每个config菜单项都要有类型定义，bool：布尔类型， tristate三态：内建、模块、移除， string：字符串， hex：十六进制， integer：整型

    例如config HELLO_MODULE
    bool "hello test module"

bool类型的只能选中或不选中，tristate类型的菜单项多了编译成内核模块的选项，假如选择编译成内核模块，则会在.config中生成一个CONFIG_HELLO_MODULE=m的配置，假如选择内建，就是直接编译成内核影响，就会在.config中生成一个CONFIG_HELLO_MODULE=y的配置.

2、依赖型定义depends on或requires

指此菜单的出现是否依赖于另一个定义

   config HELLO_MODULE
   bool "hello test module"
   depends on ARCH_PXA

这个例子表明HELLO_MODULE这个菜单项只对XScale处理器有效，即只有在选择了ARCH_PXA， 该菜单才可见(可配置)。

3、帮助性定义

只是增加帮助用关键字help或---help---

.config文件：上面提到了利用内核配置工具自动生成名为.config的内核配置文件，这是编译内核的第一步。

.config文件中选项的位置根据它们在内核配置工具中的位置进行排序，注释部分说明该选项位于哪个菜单下。我们来看看一个.config文件的节选:

    1  #
    2  # Automatically generated make config: don’t edit
    3  #
    4  CONFIG_X86=y
    5  CONFIG_MMU=y
    6  CONFIG_UID16=y
    7  CONFIG_GENERIC_ISA_DMA=y
    8
    9  #
    10  # Code maturity level options
    11  #
    12  CONFIG_EXPERIMENTAL=y
    13  CONFIG_CLEAN_COMPILE=
    14  CONFIG_STANDALONE=y
    15  CONFIG_BROKEN_ON_SMP=y
    16
    17  #
    18  # General setup
    19  #
    20  CONFIG_SWAP=y
    21  CONFIG_SYSVIPC=y
    22  #CONFIG_POSIX_MQUEUE is not set
    23  CONFIG_BSD_PROCESS_ACCT=y

上述.config文件指出第4到第7行的选项位于顶层菜单中，第12到第15行的选项位于代码成熟度选项菜单中，第20行到第23行的选项位于通用设置选项菜单中。

所有配置工具都会产生上述菜单，并且已经看到前几个选项、代码成熟度选项、及通用设置选项都位于顶层。后面两个选项被扩展为包含多个选项的子菜单。这些菜单都是在调用xconfig命令时，由qconf配置工具提供的。配置工具显示的菜单都默认用于X86体系结构。 

DIY：向内核添加自己的程序

A.在Linux内核中增加自己的程序步骤（注意这里只是程序文件）：

1.将编写的源代码复制到Linux内核源代码的相应目录中。

2.在目录的Kconfig文件中增加新源代码对应项目的编译配置选项

3.在目录的Makefile文件中增加对新源代码的编译条目。

B.在Linux内核drivers/目录中增加目录和子目录步骤：

1.所加目录为myDriver，文件如下:

myDriver$ tree

|– Kconfig

|– Makefile

|– key

|   |– Kconfig

|   |– Makefile

|   `– key.c

|– led

|   |– Kconfig

|   |– Makefile

|   `– led.c

`— test.c

注意此时各个目录中的Makefile和Kconfig文件是空的

2.在新增的相应目录添加Kconfig和Makefile文件，上面的目录中已经添加。

3.修改新增目录的父目录的Kconfig和Makefile文件，以便新增的Kconfig和

Makefile能被引用。向父目录中的Makefile添加：

    obj-y+= myDriver/ 
表示在编译过程中包含子目录myDriver目录。然后修改Kconfig文件，添加：

    source “drivers/myDriver/Kconfig”

表示在配置时引用子目录myDriver中的配置文件Kconfig。

4.经过上面一步，父目录就可以找到所加的目录myDriver了，然后就是编辑各个目 录中的Makefile和Kconfig文件，在你添加的目录myDriver中的Makefile加入：

    obj-$(CONFIG_TEST) += test.o #因为在myDriver目录中要编译test.c文件

     #所以会根据CONFIG_TEST来决定编译选项
    obj-y += led/#编译myDriver目录中的子目录led
    obj-y += key/#编译myDriver目录中的子目录key

然后Kconfig文件是：

    menu “TEST MyDriver”      #在make menuconfig时要显示的菜单入口
    comment “Test myDriver” #menu title
    config TEST
	    tristate “MyDriver test”
    source “drivers/myDriver/led/Kconfig”#将led目录下的Kconfig添加进来
    source “drivers/myDriver/key/Kconfig”
    endmenu

再看led目录下的Makefile和Kconfig：

Makefile为文件：

    obj-$(CONFIG_LED)+=led.o 
    Kconfig文件：
     config LED
	  tristate “led support” 

key目录下的Makefile和Kconfig类似。

5.现在可以make menuconfig来配置添加自己目录myDriver的内核了！
 
###Second:  内核的Makefile

内核的Makefile分为5个组成部分：

    Makefile     最顶层的Makefile
    .config        内核的当前配置文档，编译时成为顶层Makefile的一部分
    arch/$(ARCH)/Makefile 和体系结构相关的Makefile
    s/ Makefile.*    一些Makefile的通用规则
    kbuild Makefile      各级目录下的大概约500个文档，编译时根据上层Makefile传下来的宏定义和其他编译规则，将源代码编译成模块或编入内核。

顶层的Makefile文档读取 .config文档的内容，并总体上负责build内核和模块。Arch Makefile则提供补充体系结构相关的信息。 s目录下的Makefile文档包含了任何用来根据kbuild Makefile 构建内核所需的定义和规则。

（其中.config的内容是在make menuconfig的时候，通过Kconfig文档配置的结果

在linux2.6.x/Documentation/kbuild目录下有详细的介绍有关kernel makefile的知识。

最后举个例子：

假设想把自己写的一个flash的驱动程式加载到工程中，而且能够通过menuconfig配置内核时选择该驱动该怎么办呢？能够分三步：

第一：将您写的flashtest.c 文档添加到/driver/mtd/maps/ 目录下。

第二：修改/driver/mtd/maps目录下的kconfig文档：

    config MTD_flashtest
    tristate “ap71 flash"
这样当make menuconfig时 ，将会出现 ap71 flash选项。

第三：修改该目录下makefile文档。

添加如下内容：

    obj-$(CONFIG_MTD_flashtest)    += flashtest.o

这样，当您运行make menucofnig时，您将发现ap71 flash选项，假如您选择了此项。该选择就会保存在.config文档中。当您编译内核时，将会读取.config文档，当发现ap71 flash 选项为yes 时，系统在调用/driver/mtd/maps/下的makefile 时，将会把 flashtest.o 加入到内核中。即可达到您的目的。

