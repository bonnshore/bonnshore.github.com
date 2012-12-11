---
layout: post
date: "2012-11-20 22:22:PM"
weather: High wind
title: "简单的字符驱动demo实验"
description: "这是一个简单的字符驱动demo实验"
category: kernel&driver 
tags: [Linux_driver]
---
{% include JB/setup %}

1、实验目的：掌握简单字符设备驱动设计规范模式，设备节点创建方法，应用程序的设计和编写方法。

2、实验要求：

（A.）在S3C2440（以tq2440和mini2440为平台验证的）平台上编写实现了读，写，定位的字符设备驱动程序

（B.）编写应用程序，对所写的驱动程序进行测试

3、实验步骤：

（A.）创建实验目录,用mkdir命令来创建

    #mkdir /opt/FrinedlyARM/studydriver/5-1-1
    #cd /opt/FrinedlyARM/stduydriver/5-1-1

4、在实验目录写编写实现了读，写，定位的字符设备驱动程序memdev.c
（温馨提示：本实验并没有真正的去操控硬件设备，而是使用内存来模拟字符设备）

5、编写Makefile

    ifeq ($(KERNELRELEASE),)
    KERNELDIR ?=/opt/FriendlyARM/linux-2.6.32.2（按照你的linux-2.6.32.2内核实际的目录来改正）
    PWD := $(shell pwd)
    modules:
    $(MAKE) -C $(KERNELDIR) M=$(PWD) modules
    modules_install:
    $(MAKE) -C $(KERNELDIR) M=$(PWD) modules_install
    clean:
    rm -rf *.o *~ core .depend .*.cmd *.ko *.markers *.mod.c *.mod.o *.symvers .tmp_versions
    .PHONY: modules modules_install clean
    else
	obj-m := memdev.o
    endif

编译内核模块并拷贝内核模块到根文件系统（说明：memdev.ko为编译生成的内核模块）

实验源码mem_dev.c

    #include <linux/module.h>
    #include <linux/types.h>
    #include <linux/fs.h>
    #include <linux/errno.h>
    #include <linux/mm.h>
    #include <linux/sched.h>
    #include <linux/init.h>
    #include <linux/cdev.h>
    #include <asm/io.h>
    #include <asm/system.h>
    #include <asm/uaccess.h>
    #include "memdev.h"
    static mem_major = MEMDEV_MAJOR;
    module_param(mem_major, int, S_IRUGO);
    struct mem_dev *mem_devp; /*设备结构体指针*/
    struct cdev cdev; 
    /*文件打开函数*/
    int mem_open(struct inode *inode, struct file *filp)
    {
	struct mem_dev *dev;
	
	/*获取次设备号*/
	int num = MINOR(inode->i_rdev);
	if (num >= MEMDEV_NR_DEVS) 
		return -ENODEV;
	dev = &mem_devp[num];
	
	/*将设备描述结构指针赋值给文件私有数据指针*/
	filp->private_data = dev;
	
	return 0; 
    }
    /*文件释放函数*/
    int mem_release(struct inode *inode, struct file *filp)
    {
      return 0;
    }
    /*读函数*/
    static ssize_t mem_read(struct file *filp, char __user *buf, size_t size, loff_t *ppos)
    {
      unsigned long p =  *ppos;
      unsigned int count = size;
      int ret = 0;
      struct mem_dev *dev = filp->private_data; /*获得设备结构体指针*/
      /*判断读位置是否有效*/
      if (p >= MEMDEV_SIZE)
	return 0;
      if (count > MEMDEV_SIZE - p)
	count = MEMDEV_SIZE - p;
      /*读数据到用户空间*/
      if (copy_to_user(buf, (void*)(dev->data + p), count))
      {
	ret =  - EFAULT;
      }
      else
      {
	*ppos += count;
	ret = count;
	
	printk(KERN_INFO "read %d bytes(s) from %d\n", count, p);
      }
      return ret;
    }
    /*写函数*/
    static ssize_t mem_write(struct file *filp, const char __user *buf, size_t size, loff_t *ppos)
    {
      unsigned long p =  *ppos;
      unsigned int count = size;
      int ret = 0;
      struct mem_dev *dev = filp->private_data; /*获得设备结构体指针*/
      
      /*分析和获取有效的写长度*/
      if (p >= MEMDEV_SIZE)
	return 0;
      if (count > MEMDEV_SIZE - p)
	count = MEMDEV_SIZE - p;
	
      /*从用户空间写入数据*/
      if (copy_from_user(dev->data + p, buf, count))
	ret =  - EFAULT;
      else
      {
	*ppos += count;
	ret = count;
	
	printk(KERN_INFO "written %d bytes(s) from %d\n", count, p);
      }
      return ret;
    }
    /* seek文件定位函数 */
    static loff_t mem_llseek(struct file *filp, loff_t offset, int whence)
    { 
	loff_t newpos;
	switch(whence) {
	  case 0: /* SEEK_SET */
	    newpos = offset;
	    break;
	  case 1: /* SEEK_CUR */
	    newpos = filp->f_pos + offset;
	    break;
	  case 2: /* SEEK_END */
	    newpos = MEMDEV_SIZE -1 + offset;
	    break;
	  default: /* can't happen */
	    return -EINVAL;
	}
	if ((newpos<0) || (newpos>MEMDEV_SIZE))
	 return -EINVAL;
	
	filp->f_pos = newpos;
	return newpos;
    }
    /*文件操作结构体*/
    static const struct file_operations mem_fops =
    {
      .owner = THIS_MODULE,
      .llseek = mem_llseek,
      .read = mem_read,
      .write = mem_write,
      .open = mem_open,
      .release = mem_release,
    };
    /*设备驱动模块加载函数*/
    static int memdev_init(void)
    {
      int result;
      int i;
      dev_t devno = MKDEV(mem_major, 0);
      /* 静态申请设备号*/
      if (mem_major)
	result = register_chrdev_region(devno, 2, "memdev");
      else  /* 动态分配设备号 */
      {
	result = alloc_chrdev_region(&devno, 0, 2, "memdev");
	mem_major = MAJOR(devno);
      }  
      
      if (result < 0)
	return result;
      /*初始化cdev结构*/
      cdev_init(&cdev, &mem_fops);
      cdev.owner = THIS_MODULE;
      cdev.ops = &mem_fops;
      
      /* 注册字符设备 */
      cdev_add(&cdev, MKDEV(mem_major, 0), MEMDEV_NR_DEVS);
       
      /* 为设备描述结构分配内存*/
      mem_devp = kmalloc(MEMDEV_NR_DEVS * sizeof(struct mem_dev), GFP_KERNEL);
      if (!mem_devp)    /*申请失败*/
      {
	result =  - ENOMEM;
	goto fail_malloc;
      }
      memset(mem_devp, 0, sizeof(struct mem_dev));
      
      /*为设备分配内存*/
      for (i=0; i < MEMDEV_NR_DEVS; i++) 
      {
	    mem_devp[i].size = MEMDEV_SIZE;
	    mem_devp[i].data = kmalloc(MEMDEV_SIZE, GFP_KERNEL);
	    memset(mem_devp[i].data, 0, MEMDEV_SIZE);
      }
	
      return 0;
      fail_malloc: 
      unregister_chrdev_region(devno, 1);
      
      return result;
    }
    /*模块卸载函数*/
    static void memdev_exit(void)
    {
      cdev_del(&cdev);   /*注销设备*/
      kfree(mem_devp);     /*释放设备结构体内存*/
      unregister_chrdev_region(MKDEV(mem_major, 0), 2); /*释放设备号*/
    }
    MODULE_AUTHOR("KPBoy huang");
    MODULE_LICENSE("GPL");
    module_init(memdev_init);
    module_exit(memdev_exit);

代码相关理论知识说明：

《1》确定主设备号和次设备号

（1）主设备号：是内核识别一个设备属于哪一个驱动的标识。是一个整数，范围为0-（4096-1），但是一般使用1~255。

次设备号：是驱动程序自己用来区别多个设备的。是一个整数，范围为0~（1048576-1）,但是一般使用1~255。

预定义的设备号可以参考内核源码Documentation/devices.txt

（2）设备编号的内部表示。

内核用32bit表示设备号：

typedef unsigned long dev_t;
‚其中高12bit为主设备号，低20bit为次设备号。
要想获得一个dev_t类型的变量中包含的主或者次设备号，使用内核定义的宏：MAJOR（dev_t dev) ；和MINOR（dev_t dev）；

ƒ分配主设备号、次设备号的方法和内核API

    int register_chrdev_region（dev_t first,unsigned int count ,char * name）;

静态申请设备号：请求操作系统分配驱动程序要求的特定设备号。first 为要求分配的第一个设备号（包含主、次设备号），count为请求的设备号数量，name为驱动名称（出现在/proc/devices中），失败返回负数，成功则向操作系统将first到first+conut-1，总共count个设备号分配给驱动。例如：

 如果int  result = register_chrdev_region(devno, 2, "memdev")成功，则分配到第一个设备号为devno，2为请求的设备号数量，memdev为驱动的名称，失败就返回负数。

动态申请设备号： result = alloc_chrdev_region(&devno, 0, 2, "memdev");devno用于存放结果,其最终存放的是分配到的2个设备号中的第一个设备号，firstminor即0为期望分配到的第一个次设备号，name即为memdev为驱动的名称（出现在/proc/devices中），失败将返回负数，成功则操作系统将分配的第一个设备号存放到dev中，并将分配出去的设备号是从devno到devno + count - 1，共count个（在本例也就是2个），申请的时机应该在驱动程序的初始化函数中（本例的memdev_init(void)函数中）。

m释放主设备号、次设备号的方法和内核API

释放的时机应该在驱动程序的销毁函数中。
    unregister_chrdev_region(MKDEV(mem_major, 0), 2); /*释放设备号*/

《2》确定设备文件名程并创建设备文件作为用户程序和驱动的接口界面

设备文件名称是一个合法的文件名称即可。一般是“设备名称”，或者是“设备名称 + 数字” （本例中是mem_dev）

设备类型主要有c（字符设备类型），b（块设备类型）

创建设备文件 mknod /dev/memdev0 c 251 0(使用命令mknod 来创建设备文件)

《3》将字符设备注册进操作系统

字符设备的注册时机是在驱动程序的初始化函数中，注销的时机是在驱动程序的销毁函数中：

    /* 为设备描述结构分配内存*/
      mem_devp = kmalloc(MEMDEV_NR_DEVS * sizeof(struct mem_dev), GFP_KERNEL);
（相当于应用程序中的malloc）

    memset(mem_devp, 0, sizeof(struct mem_dev));

字符设备是如何在操作系统中被注册和注销的？（参看LDD3 3.1和3.6节）

详细解析参阅《深入浅出嵌入式底层软件开发》P428-429的8.2.2实现字符设备驱动的工作

Mem_dev.h实验源码

    #ifndef _MEMDEV_H_
    #define _MEMDEV_H_
    #ifndef MEMDEV_MAJOR
    #define MEMDEV_MAJOR 251   /*预设的mem的主设备号*/
    #endif
    #ifndef MEMDEV_NR_DEVS
    #define MEMDEV_NR_DEVS 2    /*设备数*/
    #endif
    #ifndef MEMDEV_SIZE
    #define MEMDEV_SIZE 4096
    #endif
    /*mem设备描述结构体*/
    struct mem_dev                                     
    {                                                        
      char *data;                      
      unsigned long size;       
    };
    #endif /* _MEMDEV_H_ */

6、通过NFS方式起根文件系统

7、加载内核模块

    #insmod memdev.ko
    #lsmod
说明：在加载内核模块时，模块初始化函数memdev_init被调用，函数完成了设备号申请，字符设备注册等操作。

8、查看设备名字和设备号

    #cat /proc/devices

9、手工创建设备节点

    #mknod       /dev/memdev0       c        251   0（用命令mknod创建设备文件）

（A）、/dev/memdev0 ==》 设备文件名字为“memdev0”，当然这里的名字是可以修改的

（B）、c ==》 设备类型，c：为字符设备，b，块设备

（C）、251 ==》 主设备号

（D）、0  ==》  次设备号

（E）[root@FriendlyARM 2.6.32.2-FriendlyARM]# ls -l /dev/memdev0

    crw-r--r--    1 root     root     251,   0 Feb  8 15:23 /dev/memdev0

11、编写应用程序

用于测试驱动的应用程序app-mem.c

    #include <stdio.h>
    int main()
    {
    FILE *fp0 = NULL;
    char Buf[4096];
    /*初始化Buf*/
    strcpy(Buf,"Mem is char dev!");
    printf("BUF: %s\n",Buf);
    /*打开设备文件*/
    fp0 = fopen("/dev/memdev0","r+");
    if (fp0 == NULL)
    {
    printf("Open Memdev0 Error!\n");
    return -1;
    }
    /*写入设备*/
    fwrite(Buf, sizeof(Buf), 1, fp0);
    /*重新定位文件位置（思考没有该指令，会有何后果)*/
    fseek(fp0,0,SEEK_SET);
    /*清除Buf*/
    strcpy(Buf,"Buf is NULL!");
    printf("BUF: %s\n",Buf);
    /*读出设备*/
    fread(Buf, sizeof(Buf), 1, fp0);
    /*检测结果*/
    printf("BUF: %s\n",Buf);
    return 0;
    }

实验解析：

当应用程序调用open打开一个设备时，操作系统做了什么？

由于操作系统内部已经建立了“设备号—cdev— mem_fops” 三者之间的关联关系，所以当用户程序调用 fp0 = fopen("/dev/memdev0","r+")打开设备文件的时候。操作系统就可以根据设备文件名得到设备号，再根据设备号找到cedv，进而找到fops，从而为该设备在内核空间中建立3张表：文件描述符（file descriptor table）,文件表（file table）,i节点表（i-node table）,关于3张表的关系和作用，请参看LDD3的3.3节

i节点表中含有：

①、i_rdev:字段代表实际的设备号（open调用中设备文件对应的设备号）

②、i_cdev:字段指向字符设备cdev.

文件表中含有：

f_op :字段指向fops.

f_ops:字段表示设备当前读写位置。

f_flags:字段标识文件打开是可读或可写？

private_data:字段指向私有数据指针，驱动程序可以将这个成员用于任何目的或者忽视这个成员。

