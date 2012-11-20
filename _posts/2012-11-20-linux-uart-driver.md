---
layout: post
title: "从串口驱动的移植看linux2.6内核中的驱动模型"
description: "本文是博主学习linux驱动移植整整两周后通过查阅资料并结合自己的一些观察所做的一些记录，旨在作为日后温习材料，由于博主尚无太多经验文中内可能会出现一些谬误，希望看到的热心朋友能拍砖指正。"
category: kernel&driver 
tags: [Linux_driver]
---
{% include JB/setup %}

本文是博主学习linux驱动移植整整两周后通过查阅资料并结合自己的一些观察所做的一些记录，旨在作为日后温习材料，由于博主尚无太多经验文中内可能会出现一些谬误，希望看到的热心朋友能拍砖指正。

在我前面的[blog](http://blog.csdn.net/bonnshore/article/details/7955265)中已经提到了我所做的SC16C550的串口移植，本来是没有什么技术难度，但对于新人来讲了解内核代码的结构和移植的原理是首要的，于是在工作中就做了一些记录。

***

在串口驱动移植中static struct platform_device sc16550_device结构体在配置好以后，使用了linux内核模型的platform总线机制中设备注册接口函数：platform_device_register(&sc16550_device);将 sc16550_device 设备挂载到了platform bus上。上文已经提到驱动所使用的正是 8250来进行驱动，所以在8250.c驱动init时，调用的platform_driver_register(&serial8250_isa_driver);函数正是加载该驱动到platform bus上，

下面是关于sc16550_device的重要的结构体的配置具体情况：

    static struct plat_serial8250_port sc16550_data[] = {
    .mapbase  = sc16550_UART_BASE, //flags使用IOREMAP，8250驱动会自动映射mapbase
    .irq = sc16550_UART_IRQ,
    .uartclk  = sc16550_UART_BAUD * 16, 
    .iotype  = UPIO_MEM, 
    .flags  = UPF_BOOT_AUTOCONF | 
			      UPF_SKIP_TEST | UPF_IOREMAP,
	    .regshift       = 0,
    };
    static struct platform_device sc16550_device = {
    .name = "serial8250",
    .id = PLAT8250_DEV_PLATFORM,
    .dev = { .platform_data = sc16550_data, },
    };

而serial8250_isa_driver结构体的定义为：

    static struct platform_driver serial8250_isa_driver = {
    .probe = serial8250_probe,
    .remove = __devexit_p(serial8250_remove),
    .suspend = serial8250_suspend,
    .resume = serial8250_resume,
    .driver = {
    .name = "serial8250",
    .owner = THIS_MODULE,
    },
    };

那么在sc16550_device设备和serial8250_isa_driver驱动具体是怎样加载到总线中，而两者之间又是如何匹配相认的呢？从而团结一心一致对外的呢？

今天我们就一起深究一下吧……

当设备挂接到总线上时，与总线上的所有驱动进行匹配(用bus_type.match进行匹配)，如果匹配成功,则调用bus_type.probe或者driver.probe初始化该设备，挂接到总线上如果匹配失败，则只是将该设备挂接到总线上。

驱动挂接到总线上时，与总线上的所有设备进行匹配(用bus_type.match进行匹配)， 如果匹配成功,则调用bus_type.probe或者driver.probe初始化该设备；挂接到总线上如果匹配失败，则只是将该驱动挂接到总线上。

那么现在我们无法判断到底我们的sc16550_device和serial8250_isa_driver是哪一个先挂载到总线上的。不过这也并不影响我们理解剖析整个linux设备模型。

因为实际上platform_bus_type总线先被kenrel注册，有必要对platform_bus_type 的定义作一番注释，其 定义如下： 

    struct bus_type platform_bus_type = { 
       .name         = "platform",       // bus 的名字，将会生成/sys/bus/platform  目录 

       /* 该属性文件将产生在所有 platform_bus_type 类型的设备目录下，文件名为"modalias” */ 
       .dev_attrs    = platform_dev_attrs,   
       .match        = platform_match,   // 用于drive 与device 匹配的例程 
       .uevent       = platform_uevent,  //  用于输出环境变量，与属性文件“uevent”相关 
       .pm           = PLATFORM_PM_OPS_PTR, //  电源管理方面 
    }; 

代码中， 通过bus_register(&platform_bus_type)将platform_bus_type 注册到总线模块。

我们继续，系统初始化过程中调用platform_add_devices或者platform_device_register，将平台设备(platform devices)注册到平台总线中(platform_bus_type)，平台驱动(platform driver)与平台设备(platform device)的关联是在platform device或者driver_register中实现，一般这个函数在驱动的初始化过程调用。通过这三步，就将平台总线，设备，驱动关联起来。

下面我们就具体的来看看这整个过程吧。

首先，我们先来看看platform_device_register……

我们知道在系统boot up的时候，系统初始化会调用platform_device_register()，而其又先后调用了 device_initialize()和platform_device_add()。下面解析device_initialize()和platform_device_add()两个例程，它们分别定义在drivers/ base/core.c 和drivers/base/platform.c 中。

device_initialize的代码如下： 

    void device_initialize(struct device *dev) 
    { 
	   dev->kobj.kset = devices_kset;    // 设置其指向的kset 容器 

	   kobject_init(&dev->kobj, &device_ktype); // 初始化 kobj，将 device_ktype 传递给它 

	   klist_init(&dev->klist_children, klist_children_get, 

		     klist_children_put);    // 初试化klist 

	   INIT_LIST_HEAD(&dev->dma_pools); 

	   init_MUTEX(&dev->sem); 

	   spin_lock_init(&dev->devres_lock); 

	   INIT_LIST_HEAD(&dev->devres_head); 

	   device_init_wakeup(dev, 0); 

	   device_pm_init(dev);       // 初试化电源管理 

	   set_dev_node(dev, -1); 
    }

代码中：

1. devices_kset 是所有dev 的kset，也就是所有dev 都被链接在该kset 下，其在初试化例程 devices_init()中通过调kset_create_and_add("devices", &device_uevent_ops, NULL)来创建。由于参数parent=NULL ，所以生成/sys/devices  目录。这里说明下kobj，kset 结构体中包含有一个 kobj，一个kobj 生成一个目录，在这里就是”devices " 目录，通过调用kobject_add_internal()例程 生成。所以从dev->kobj.kset = devices_kset 可以看出，该dev.kobj 添加到了devices_kset 容器 中，所的kobj 都归属于一个特定的kset 。关于kset，kobj，ktype，kref 的关系可以参考书LDD3的第十四章，在第370 页有一张说明kobj 和kset 关系的图（英文版）。 

2. kobject_init(&dev->kobj, &device_ktype)用于初始化 dev->kobj 中变量的参数，如ktype、 kref、entry 和state*等。初试化例程devices_init()还会调用kobject_create_and_add()例程生成/sys/ dev、/sys/dev/block 和/sys/dev/char  目录。 

3. 其他初始化。 

下面分析platform_device_add：

    int platform_device_add(struct platform_device *pdev)
    　　{
    　　int i, ret = 0;
    　　if (!pdev)
    　　return -EINVAL;
    　　if (!pdev->dev.parent)
    　　pdev->dev.parent = &platform_bus;
    　　//可以看出，platform设备的父设备一般都是platform_bus，所以注册后的platform设备都出现在/sys/devices/platform_bus下
    　　pdev->dev.bus = &platform_bus_type;
    　　//挂到platform总线上
    　　if (pdev->id != -1)
    　　dev_set_name(&pdev->dev, "%s.%d", pdev->name, pdev->id);
    　　else
    　　dev_set_name(&pdev->dev, "%s", pdev->name);
    　　//设置设备名字，这个名字与/sys/devices/platform_bus下的名字对应
    　　for (i = 0; i < pdev->num_resources; i++) { //下面操作设备所占用的系统资源
    　　struct resource *p, *r = &pdev->resource[i];
    　　if (r->name == NULL)
    　　r->name = dev_name(&pdev->dev);
    　　p = r->parent;
    　　if (!p) {
    　　if (resource_type(r) == IORESOURCE_MEM)
    　　p = &iomem_resource;
    　　else if (resource_type(r) == IORESOURCE_IO)
    　　p = &ioport_resource;
    　　}
    　　if (p && insert_resource(p, r)) {
    　　printk(KERN_ERR
    　　"%s: failed to claim resource %d\n",
    　　dev_name(&pdev->dev)， i);
    　　ret = -EBUSY;
    　　goto failed;
    　　}
    　　}
    　　//上面主要是遍历设备所占用的资源，找到对应的父资源，如果没有定义，那么根据资源的类型，分别赋予iomem_resource和ioport_resource，然后调用insert_resource插入资源。
    　　//这样系统的资源就形成了一个树形的数据结构，便于系统的管理
    　　pr_debug("Registering platform device '%s'. Parent at %s\n",
    　　dev_name(&pdev->dev)， dev_name(pdev->dev.parent));
    　　ret = device_add(&pdev->dev);
    　　//注册到设备模型中
    　　if (ret == 0)
    　　return ret;
    　　failed:
    　　while (--i >= 0) {
    　　struct resource *r = &pdev->resource[i];
    　　unsigned long type = resource_type(r);
    　　if (type == IORESOURCE_MEM || type == IORESOURCE_IO)
    　　release_resource(r);
    　　}
    　　return ret;
    　　}

以上就完成了device的到总线上的注册。接下来我就来看driver到总线上的挂载过程

该过程是一个非常复杂繁琐的过程，期间牵扯到了层层函数的调用，下面就给出了具体的过程：

platform_driver_register()->driver_register()->bus_add_driver()->driver_attach()->bus_for_each_dev()对每个挂在虚拟的platform bus的设备作__driver_attach()->driver_probe_device()->drv->bus->match()==platform_match()->比较strncmp(pdev->name, drv->name, BUS_ID_SIZE)，如果相符就调用platform_drv_probe()->driver->probe()，如果probe成功则绑定该设备到该驱动.

这整个过程中有两个地方我们需要注意，相信大家心里已经很有数了，就是match()和probe(),一个负责匹配一个负责对成功绑定的设备进行port的赋值。

先来看match的过程吧：

前面也大致提到了所谓的match就是驱动成功注册到总线中后逐个与总线上已挂载的设配进行匹配，具体的实现就在driver_attach()里面了bus_for_each_dev()函数负责将驱动与设备们逐个匹配，这个函数中有一个参数函数最终调到了__driver_attach来实现具体的匹配过程，其中指针指向的match成员就是调用了paltform_match(), 当然这是要有根据的，大家不要忘记了platform_bus_type总线被kenrel注册的时候的那platform_bus_type结构体，里面的成员有一项为 .match=platform_match,对，paltform_match()函数就是定义在drivers/base/platform.c中。有兴趣的朋友可以check一下源码，很简单只有3行，值得一提的是有一个container_of的宏定义函数，在内核代码中此函数用的很多，可以着重了解一下，此函数可以返回传至函数内部参数所在的结构体的地址；初次之外就是一个简单的strcmp函数用来对比驱动与设备中所存的name是否一致。匹配成功后以后继续往下执行就会执行到probe。

为什么要执行probe呢，这是因为驱动好不容易找到了对的设备，就要把我们对该设备进行的一些初始化信息加入到驱动的标准处理过程中，当然这之后的行为就和我们的驱动模型没有多大的关系了。当然，继续关注我的朋友在以后应该会看到后续部分。那系统怎么知道probe函数到底调用的是哪一个驱动里的probe呢？就在下面……

probe具体调用的过程，大家先看下面的这个结构体：

    static struct platform_driver serial8250_isa_driver = {
    .probe  = serial8250_probe,
    .remove  = __devexit_p(serial8250_remove),
    .suspend  = serial8250_suspend,
    .resume  = serial8250_resume,
    .driver  = {
    .name = "serial8250",
    .owner  = THIS_MODULE,
    },
    };

.probe= serial8250_probe这一句就是重点了，从这一句我们可以很明显的看出我们在将驱动注册挂载到总线时的调用的platform_driver_register()所传的参数就是serial8250_isa_driver 结构体，所以当系统执行到driver->probe()时就会调用serial8250_probe()了。

到此为止，串口设备驱动加载过程中的系统驱动模型方面platform总线的行为就已经结束了，接下来的行为就是具体驱动的事情了。在后面我还会在后面的博客中写一些用户空间对驱动进行的读写等操作时，这些操作是如何层层调用，如何落实到驱动的底层操作。

