---
layout: post
date: "2012-11-20 22:22:PM"
weather: No record
title: "Linux中tty框架与uart框架之间的调用关系剖析"
description: "之前本人在从串口驱动的移植看linux2.6内核中的驱动模型一文中已经写到了移植的设备是如何通过platform总线来与对应的驱动挂载。在这期间有一个问题困扰着我，那就是来自用户空间的针对uart设备的操作意图是如何通过tty框架逐层调用到uart层的core驱动，进而又是如何调用到真实对应于设备的设备驱动的，本文中的对应设备驱动就是8250驱动，最近我想将这方面的内容搞清楚。"
category: kernel&driver
tags: [Linux_driver]
---
{% include JB/setup %}

之前本人在["从串口驱动的移植看linux2.6内核中的驱动模型"](../linux-uart-driver/)一文中已经写到了移植的设备是如何通过platform总线来与对应的驱动挂载。

在这期间有一个问题困扰着我，那就是来自用户空间的针对uart设备的操作意图是如何通过tty框架逐层调用到uart层的core驱动，进而又是如何调用到真实对应于设备的设备驱动的，本文中的对应设备驱动就是8250驱动，最近我想将这方面的内容搞清楚。

在说明这一方面问题之前我们先要大致了解两个基本的框架结构，tty框架和uart框架。

首先看看tty框架：

在linux系统中，tty表示各种终端。终端通常都跟硬件相对应。比如对应于输入设备键盘鼠标，输出设备显示器的控制终端和串口终端。

最上面的用户空间会有很多对底层硬件（在本文中就是8250uart设备）的操作，像read，write等。用户空间主要是通过设备文件同tty_core交互，tty_core根据用空间操作的类型再选择跟line discipline和tty_driver也就是serial_core交互，例如设置硬件的ioctl指令就直接交给serial_core处理。Read和write操作就会交给line discipline处理。Line discipline是线路规程的意思。正如它的名字一样，它表示的是这条终端”线程”的输入与输出规范设置，主要用来进行输入/输出数据的预处理。处理之后，就会将数据交给serial_core，最后serial_core会调用8250.c的操作。

一个uart_driver通常会注册一段设备号.即在用户空间会看到uart_driver对应有多个设备节点。例如:

/dev/ttyS0  /dev/ttyS1 每个设备节点是对应一个具体硬件的,这样就可做到对多个硬件设备的统一管理，而每个设备文件应该对应一个uart_port，也就是说:uart_device要和多个uart_port关系起来。并且每个uart_port对应一个circ_buf（用来接收数据）,所以uart_port必须要和这个缓存区关系起来。

###1 自底向上

接下来我们就来看看对设备的操作是怎样进行起来的，不过在此之前我们有必要从底层的uart驱动注册时开始说起，这样到后面才能更清晰。

这里我们讨论的是8250驱动，在驱动起来的时候调用了uart_register_driver(&serial8250_reg);函数将参数serial8250_reg注册进了tty层。具体代码如下所示：

    int uart_register_driver(struct uart_driver *drv)  
    {  
	struct tty_driver *normal = NULL;  
	int i, retval;  
      
	BUG_ON(drv->state);  
      
	/* 
	 * Maybe we should be using a slab cache for this, especially if  
	 * we have a large number of ports to handle. 
	 */  
	drv->state = kzalloc(sizeof(struct uart_state) * drv->nr, GFP_KERNEL);  
	retval = -ENOMEM;  
	if (!drv->state)  
	    goto out;  
      
	normal  = alloc_tty_driver(drv->nr);  
	if (!normal)  
	    goto out;  
      
	drv->tty_driver = normal;  
      
	normal->owner        = drv->owner;  
	normal->driver_name  = drv->driver_name;  
	normal->name     = drv->dev_name;  
	normal->major        = drv->major;  
	normal->minor_start  = drv->minor;  
	normal->type     = TTY_DRIVER_TYPE_SERIAL;  
	normal->subtype      = SERIAL_TYPE_NORMAL;  
	normal->init_termios = tty_std_termios;  
	normal->init_termios.c_cflag = B9600 | CS8 | CREAD | HUPCL | CLOCAL;  
	normal->init_termios.c_ispeed = normal->init_termios.c_ospeed = 9600;  
	normal->flags        = TTY_DRIVER_REAL_RAW | TTY_DRIVER_DYNAMIC_DEV;  
	normal->driver_state    = drv;  // here is important for me, ref uart_open function in this file   
	tty_set_operations(normal, &uart_ops);  
      
	/* 
	 * Initialise the UART state(s).  
	 */  
	for (i = 0; i < drv->nr; i++) {  
	    struct uart_state *state = drv->state + i;  
      
	    state->close_delay     = 500;    /* .5 seconds */  
	    state->closing_wait    = 30000;  /* 30 seconds */  
	    mutex_init(&state->mutex);  
      
	    tty_port_init(&state->info.port);  
	    init_waitqueue_head(&state->info.delta_msr_wait);  
	    tasklet_init(&state->info.tlet, uart_tasklet_action,  
		     (unsigned long)state);  
	}  
      
	retval = tty_register_driver(normal);  
     out:  
	if (retval < 0) {  
	    put_tty_driver(normal);  
	    kfree(drv->state);  
	}  
	return retval;  
    }  

从上面代码可以看出，uart_driver中很多数据结构其实就是tty_driver中的，将数据转换为tty_driver之后,注册tty_driver。然后初始化uart_driver->state的存储空间。

这里有两个地方我们需要特别关注：

第一个是

    normal->driver_state    = drv;   

为什么说重要呢，因为真实这一句将参数的ops关系都赋给了serial_core层。也就是说在后面serial_core会根据uart_ops关系找到我们的8250.c中所对应的操作，而我们参数中的ops是在哪被赋值的呢？这个一定是会在8250.c中不会错，所以我定位到了8250.c中的serial8250_ops结构体，初始化如下：

    static struct uart_ops serial8250_pops = {  
	.tx_empty   = serial8250_tx_empty,  
	.set_mctrl  = serial8250_set_mctrl,  
	.get_mctrl  = serial8250_get_mctrl,  
	.stop_tx    = serial8250_stop_tx,  
	.start_tx   = serial8250_start_tx,  
	.stop_rx    = serial8250_stop_rx,  
	.enable_ms  = serial8250_enable_ms,  
	.break_ctl  = serial8250_break_ctl,  
	.startup    = serial8250_startup,  
	.shutdown   = serial8250_shutdown,  
	.set_termios    = serial8250_set_termios,  
	.pm     = serial8250_pm,  
	.type       = serial8250_type,  
	.release_port   = serial8250_release_port,  
	.request_port   = serial8250_request_port,  
	.config_port    = serial8250_config_port,  
	.verify_port    = serial8250_verify_port,  
    #ifdef CONFIG_CONSOLE_POLL  
	.poll_get_char = serial8250_get_poll_char,  
	.poll_put_char = serial8250_put_poll_char,  
    #endif  
    };  

这样一来只要将serial8250_ops结构体成员的值赋给我们uart_dirver就可以了，那么这个过程在哪呢？就是在uart_add_one_port()函数中，这个函数是从serial8250_init->serial8250_register_ports()->uart_add_one_port()逐步调用过来的，这一步就将port和uart_driver联系起来了。

第二个需要关注的地方：

    tty_set_operations(normal, &uart_ops);  

此句之所以值得关注是因为.在这里将tty_driver的操作集统一设为了uart_ops.这样就使得从用户空间下来的操作可以找到正确的serial_core的操作函数，uart_ops是在serial_core.c中的：

    static const struct tty_operations uart_ops = {  
	.open       = uart_open,  
	.close      = uart_close,  
	.write      = uart_write,  
	.put_char   = uart_put_char,  
	.flush_chars    = uart_flush_chars,  
	.write_room = uart_write_room,  
	.chars_in_buffer= uart_chars_in_buffer,  
	.flush_buffer   = uart_flush_buffer,  
	.ioctl      = uart_ioctl,  
	.throttle   = uart_throttle,  
	.unthrottle = uart_unthrottle,  
	.send_xchar = uart_send_xchar,  
	.set_termios    = uart_set_termios,  
	.set_ldisc  = uart_set_ldisc,  
	.stop       = uart_stop,  
	.start      = uart_start,  
	.hangup     = uart_hangup,  
	.break_ctl  = uart_break_ctl,  
	.wait_until_sent= uart_wait_until_sent,  
    #ifdef CONFIG_PROC_FS  
	.read_proc  = uart_read_proc,  
    #endif  
	.tiocmget   = uart_tiocmget,  
	.tiocmset   = uart_tiocmset,  
    #ifdef CONFIG_CONSOLE_POLL  
	.poll_init  = uart_poll_init,  
	.poll_get_char  = uart_poll_get_char,  
	.poll_put_char  = uart_poll_put_char,  
    #endif  
    };  

这样就保证了调用关系的通畅。

###2 自顶向下

说完了从底层注册时所需要注意的地方，现在我们来看看正常的从上到下的调用关系。tty_core是所有tty类型的驱动的顶层构架，向用户应用层提供了统一的接口，应用层的read/write等调用首先会到达这里。此层由内核实现，代码主要分布在drivers/char目录下的n_tty.c，tty_io.c等文件中，下面的代码：

    static const struct file_operations tty_fops = {  
	.llseek        = no_llseek,  
	.read        = tty_read,  
	.write        = tty_write,  
	.poll        = tty_poll,  
	.unlocked_ioctl    = tty_ioctl,  
	.compat_ioctl    = tty_compat_ioctl,  
	.open        = tty_open,  
	.release    = tty_release,  
	.fasync        = tty_fasync,  
    };  

就是定义了此层调用函数的结构体，在uart_register_driver()函数中我们调用了每个tty类型的驱动注册时都会调用的tty_register_driver函数，代码如下：

    int tty_register_driver(struct tty_driver * driver)  
    {  
	...  
	cdev_init(&driver->cdev, &tty_fops);  
	...  
    }  

我们可以看到，此句就已经将指针调用关系赋给了cdev，以用于完成调用。在前面我们已经说过了，Read和write操作就会交给line discipline处理，我们在下面的代码可以看出调用的就是线路规程的函数：

    static ssize_t tty_read(struct file *file, char __user *buf, size_t count,  
		loff_t *ppos)  
    {  
	...  
	ld = tty_ldisc_ref_wait(tty);  
	if (ld->ops->read)  
	    i = (ld->ops->read)(tty, file, buf, count);  
	    //调用到了ldisc层（线路规程）的read函数  
	else  
	    i = -EIO;  
	tty_ldisc_deref(ld);  
	...  
    }  
    static ssize_t tty_write(struct file *file, const char __user *buf,  
			    size_t count, loff_t *ppos)  
    {  
	...  
	ld = tty_ldisc_ref_wait(tty);  
	if (!ld->ops->write)  
	    ret = -EIO;  
	else  
	    ret = do_tty_write(ld->ops->write, tty, file, buf, count);  
	tty_ldisc_deref(ld);  
	return ret;  
    }  
    static inline ssize_t do_tty_write(  
	ssize_t (*write)(struct tty_struct *, struct file *, const unsigned char *, size_t),  
	struct tty_struct *tty,  
	struct file *file,  
	const char __user *buf,  
	size_t count)  
    {  
	...  
	for (;;) {  
	    size_t size = count;  
	    if (size > chunk)  
		size = chunk;  
	    ret = -EFAULT;  
	    if (copy_from_user(tty->write_buf, buf, size))  
		break;  
	    ret = write(tty, file, tty->write_buf, size);  
	    //调用到了ldisc层的write函数  
	    if (ret <= 0)  
		break;  
	...  
    }  

那我们就去看看线路规程调用的是又是谁，代码目录在drivers/char/n_tty.c文件中，下面的代码是线路规程中的write函数：

    static ssize_t n_tty_write(struct tty_struct *tty, struct file *file,  
		   const unsigned char *buf, size_t nr)  
    {  
	...  
	add_wait_queue(&tty->write_wait, &wait);//将当前进程放到等待队列中  
	while (1) {  
	    set_current_state(TASK_INTERRUPTIBLE);  
	    if (signal_pending(current)) {  
		retval = -ERESTARTSYS;  
		break;  
	    }  
	    //进入此处继续执行的原因可能是被信号打断，而不是条件得到了满足。  
	    //只有条件得到了满足，我们才会继续，否则，直接返回！  
	    if (tty_hung_up_p(file) || (tty->link && !tty->link->count)) {  
		retval = -EIO;  
		break;  
	    }  
	    if (O_OPOST(tty) && !(test_bit(TTY_HW_COOK_OUT, &tty->flags))) {  
		while (nr > 0) {  
		    ssize_t num = process_output_block(tty, b, nr);  
		    if (num < 0) {  
			if (num == -EAGAIN)  
			    break;  
			retval = num;  
			goto break_out;  
		    }  
		    b += num;  
		    nr -= num;  
		    if (nr == 0)  
			break;  
		    c = *b;  
		    if (process_output(c, tty) < 0)  
			break;  
		    b++; nr--;  
		}  
		if (tty->ops->flush_chars)  
		    tty->ops->flush_chars(tty);  
	    } else {  
		while (nr > 0) {  
		    c = tty->ops->write(tty, b, nr);  
		    //调用到具体的驱动中的write函数  
		    if (c < 0) {  
			retval = c;  
			goto break_out;  
		    }  
		    if (!c)  
			break;  
		    b += c;  
		    nr -= c;  
		}  
	    }  
	    if (!nr)  
		break;  
	    //全部写入，返回  
	    if (file->f_flags & O_NONBLOCK) {  
		retval = -EAGAIN;  
		break;  
	    }  
	    /*  
	    假如是以非阻塞的方式打开的，那么也直接返回。否则，让出cpu，等条件满足以后再继续执行。 
	    */          
      
	    schedule();//执行到这里，当前进程才会真正让出cpu！！！  
	}  
    break_out:  
	__set_current_state(TASK_RUNNING);  
	remove_wait_queue(&tty->write_wait, &wait);  
	...  
    }  

在上面我们可以看到此句：           

    c = tty->ops->write(tty, b, nr);  

此句很明显告诉我们这是调用了serial_core的write()函数，可是这些调用关系指针是在哪赋值的，刚开始我也是郁闷了一段时间，不过好在我最后还是找到了一些蛛丝马迹。其实就是在tty_core进行open的时候悄悄把tty->ops指针给赋值了。具体的代码就在driver/char/tty_io.c中，调用关系如下所示：

tty_open -> tty_init_dev -> initialize_tty_struct，initialize_tty_struct()函数的代码在下面：

    void initialize_tty_struct(struct tty_struct *tty,  
	    struct tty_driver *driver, int idx)  
    {  
	...  
	tty->ops = driver->ops;  
	...  
    }  

可以看到啦，这里就将serial_core层的操作调用关系指针值付给了tty_core层，这样tty->ops->write()其实调用到了具体的驱动的write函数，在这里就是我们前面说到的8250驱动中的write函数没问题了。从这就可以看出其实在操作指针值得层层传递上open操作还是功不可没的，这么讲不仅仅是因为上面的赋值过程，还有下面这个，在open操作调用到serial_core层的时候有下面的代码：

    static int uart_open(struct tty_struct *tty, struct file *filp)  
    {  
	struct uart_driver *drv = (struct uart_driver *)tty->driver->driver_state; // here just tell me why uart_open can call 8250  
	struct uart_state *state;  
	int retval, line = tty->index;  
      
	……  
      
	    uart_update_termios(state);  
	}  
      
     fail:  
	return retval;  
    }  

在此函数的第一句我们就看到了似曾相识的东西了，没错就是我们在uart_register_driver()的时候所做的一些事情，那时我们是放进去，现在是拿出来而已。

这样一来，我们先从底层向上层分析上来后，又由顶层向底层分析下去，两头总算是接上头了，我很高兴，不是因为我花了近两个小时的时间终于写完了这篇博客，而是我是第一次通过这篇博客的写作过程弄清楚了这个有点小复杂的环节，当然有谬误的地方还是希望大家能慷慨指出。

分享知识，共同进步~
