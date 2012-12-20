---
layout: post
date: "2012-11-26 20:22:PM"
weather: Sunny maybe
title: "Python实现简易shell,我的coding_kit"
description: "前一段时间突然想找一些脚本语言来了解，当时是确定了Python和Ruby两种脚本语言，对两者是大概的了解了一些，大家说法不一，各有各的好，于是就决定挨个儿来试试，于是就有了题目上这个蛋痛的东西。"
category: learning 
tags: [Python, 是熊么, funny]
---
{% include JB/setup %}

前一段时间突然想找一些脚本语言来了解，当时是确定了Python和Ruby两种脚本语言，对两者是大概的了解了一些，大家说法不一，各有各的好，于是就决定挨个儿来试试，于是就有了题目上这个蛋痛的东西。过一阵子兴许会用ruby搞一个什么东东出来，好了废话不多说了先看看正题吧。

其实萌生这个想法还是和李哥有关系的，那日调板子失败的次数太多一不留神把代码的版本全弄乱了,从文件的名称已经不能分辨出来版本的先后顺序了，最后只得靠文件的最后修改时间和beyondCompare来逐个确定，着实蛋痛了一把，那日下午当机立断要自己写一个管理这些用来调板子的小代码文件的工具。

确定了最初的需求后，决定用一种快速的方法的来实现，思来想去最后决定用python实现，其主要功能包括：备份(支持自定义路径和注释)、删除、移动、复制、重命名等基本的文件操作，最后又加上了使用vim编辑和Directory list的功能。

下面就把主要的操作功能的代码show一下吧，声明一下代码写的很乱，也没有心思再回去重构下，总之就是拿出来晒晒太阳，别哪天突然间想到了回去看看都搞不明白就行。其中大部分功能都是通过python强大的类库实现的，不过还是有一些很朴素的处理，看了下面的代码后也许你也会有同感吧。

首先来看看几个比较简单的。

1.DirectoryList(类似*nix下的ls)：

    import os
    import string

    class Dirlist:
	def __init__(self):
	    return

	def get_current_list(self):
	    current_path = os.getcwd()
	    print string.join(os.listdir(current_path)).replace(' ','  ')
	    return

	def get_path_list(self,arg):
	    print string.join(os.listdir(arg)).replace(' ','  ')
	    return

代码中可以看出主要的逻辑是使用了os.listdir()方法。实现也很简单，做了简单的现实效果处理。

2.重命名(rename)

    import os

    class Rename:
	def __init__(self,old,new):
	    self.old = old
	    self.new = new
	    return
	
	def re_name(self):
	    if not os.path.exists(self.old):
		print 'the file you want to rename is NOT exists!'
	    else:
		os.rename(self.old,self.new)
	    return

这个也是通过os.rename()方法，不多说啥了就。看了前面的预热下面就是一些稍微复杂一些些的操作了，其实也完全算不上有难度。

3.复制(copy)

    import os
    import mkdir
    import glob
    import star_ops

    class Copy:
	def __init__(self,old,new):
	    self.old = old
	    self.new = new
	    return

	def copydirs(self,sourceDir,targetDir):
	    targetDir = targetDir + os.path.split(sourceDir[:-1])[1]
	    for f in os.listdir(sourceDir):
		sourceF = os.path.join(sourceDir, f) 
		targetF = os.path.join(targetDir, f)
		if os.path.isfile(sourceF):
		    if not os.path.exists(targetDir):
			 os.makedirs(targetDir)
		    if not os.path.exists(targetF) or (os.path.exists(targetF) and (os.path.getsize(targetF) != os.path.getsize(sourceF))):
			open(targetF, "wb").write(open(sourceF, "rb").read())
		    else:
			print '%s EXISTS Already!' % (sourceF)
		elif os.path.isdir(sourceF):
		    self.copydirs(sourceF,targetF)
		else:
		    pass
	    return 
		
	def copyfile(self,old):
	    sourceF = old
	    targetF = self.new + os.path.split(old)[1]
	    if not os.path.exists(targetF) or (os.path.exists(targetF) and (os.path.getsize(targetF) != os.path.getsize(sourceF))):
		open(targetF, "wb").write(open(sourceF, "rb").read())
	    else:
		print '%s EXISTS Already!' % (sourceF)
	    return

	def real_copy(self,old,new):
	    if os.path.isdir(old):
		self.copydirs(old,new)
	    elif os.path.isfile(old):
		self.copyfile(old)
	    else:
		pass
	    return

	def is_destination_exists(self,old,new):
	    if not os.path.exists(new):
		print 'The destination not exists, we will Create the shit!'
		mkd = mkdir.Mkdir(new)
		mkd.make_dir()
	    self.real_copy(old,new)
	    return
	    
	def copy_func(self): 
	    if not os.path.exists(self.old):
		if star_ops.is_star_cmd(self.old):
		    cp_list = glob.glob(self.old)
		    for item in cp_list:
			self.is_destination_exists(item,self.new)
		else:
		    print 'Target NOT EXISTS!'
	    else:
		self.is_destination_exists(self.old,self.new)
	    return

说实话这段代码绝对是要重构一下的(改天有兴致了再说吧)，传进来的参数new和old想必大家也猜到代表啥意思了，就是所复制文件的新旧路径了。逻辑入口自然是copy_func()函数了，在判断路劲是否存在之余做了一个判断是否是star的情况，这个应该解释一下的就是判断该命令是否是以'*'结尾的，就是通配符的意思了。下面给上is_star_cmd()的代码：

    import re
    import os

    def is_star_cmd(args):
	argv = os.path.split(args)[1]
	reg = '^\*'
	pattern = re.compile(reg)
	match = pattern.search(argv)
	return match

此段代码也是很初级的样子就不多说了，就是使用re的库函数。

接着上面的copy说，第二个有点意思的地方无非是copydirs函数了(copyfile就是简单的调用了库函数了)，此函数与复制单一文件不同，这里要考虑路径的情况即路径下还有子目录的情况，在Linux中会提示你使用'-r'参数来选择迭代处理，我就没有搞得那么麻烦了，直接就给迭代处理了，管你下面有几个子目录只要不是一样一样的文件就全给你复制过去并且覆盖，霸气吧，我也觉着，不过这也就经常会造成一些误操作，就相当于linux下的root管理员了，能力大责任也大，所以采取行动的时候头脑一定要清醒。记着搞复制这条功能就是这点儿还有些意思了，后面的删除和移动操作都会面临这个问题，我也是采用了同样的处理方式。

4.删除(remove) 

    import os
    import star_ops

    class Remove:
	def __init__(self,args):
	    self.args = args
	    return

	def recursion_rm(self,dirpath):
	    for item in os.listdir(dirpath):
		tempath = os.path.join(dirpath,item)
		if os.path.isfile(tempath):
		    os.remove(tempath)
		elif os.path.isdir(tempath):
		    self.recursion_rm(tempath)
		else:
		    print 'Remove ERROR!'
	    os.rmdir(dirpath)
	    return
		    
	def rm_the_shit(self):
	    if os.path.isfile(self.args):
		os.remove(self.args)
	    else:
		dirpath = self.args
		self.recursion_rm(dirpath)
	
	def is_that_exists(self):
	    if not os.path.exists(self.args):
		if star_ops.is_star_cmd(self.args):
		    star_ops.star_rm(self.args)
		else:
		    print 'WRONG path!'
	    else:
		self.rm_the_shit() 

这个操作最大的亮点其实和copy差不多，从move_dir开始的逻辑入口，进而判断一步步判断各种可能遇到的情况并且避免出错，和上面不同的还有就是用到了一些粗俗的字眼，相信大家不会介意的。对各种库函数也是很初级的使用，就算没有注释的这些代码，明眼人还是很容易看清楚的(对不起我没针对任何人哦:)~)。

此功能中同样的支持了通配符的使用，可以使我很方便的进行快速删除操作，其中针对通配符情况的删除被抽离到了另一个class中，下面为star_rm的源码：

    def star_rm(args):
	rm_list = glob.glob(args)
	for item in rm_list:
	    os.remove(item)
	return

这实在是有些拿不出手的赶脚啊，有木有。。。其实吧，我个人以为吧看了上面那个copy的情况remove的迭代删除也已经不显得不怎么亮了，但好歹也把recursion_rm()函数说一说吧，要不实在是不知道写啥，这个函数看着没有copy里的迭代，copy长是因为已经有了上好的os.remove()函数来供我们调用了，罢了罢了也不说啥了，估计耐心能看到这儿的也不用我做什么多的解释了。

5.备份(bak)

    import os
    import fnmatch
    import mkdir
    import glob
    import time


    class Backup:
	dirlist = []

	def __init__(self):
	    return

	def get_target_dir(self):
	    target_dir = raw_input('Enter the dir you want to backup to:')
	    if not os.path.exists(target_dir):
		print 'The path you input is NOT exists!\nwe will create the shit!'
		mk = mkdir.Mkdir(target_dir)
		mk.make_dir()
	    return target_dir
	
	def star_file(self,path_to_backup):
	    file_list = glob.glob(path_to_backup)
	    for item in file_list:
		Backup.dirlist.append(item)
	    return

	def Is_a_file(self): 
	    path_to_backup = raw_input('Enter the file path you want to backup:')
	    if fnmatch.fnmatch(path_to_backup,'*'):
		self.star_file(path_to_backup)
	    else:
		while not(os.path.exists(path_to_backup)):
		    print 'File Path WRONG!'
		    path_to_backup = raw_input('Enter the file path you want to backup:')
		else:
		    Backup.dirlist.append(path_to_backup)
	    return
	
	def Is_a_dir(self):
	    path_to_backup = raw_input('Enter the dir you want to backup:')
	    while not(os.path.exists(path_to_backup)):
		print 'dir path WRONG!'
		path_to_backup = raw_input('Enter the dir you want to backup:')
	    else:
		bk_list = os.listdir(path_to_backup)
		for item in bk_list:
		    item = path_to_backup + item
		    Backup.dirlist.append(item)
	    return

	def run_backup(self, target_dir):
	    today = target_dir + time.strftime('%Y%m%d')
	    now = time.strftime('%H%M%S')
	    comment = raw_input('Enter your comment:')
	    if len(comment) == 0:
		target = today + os.sep + now + '.zip'
	    else:
		target = today + os.sep + now + '_' + comment.replace(' ', '_') + '.zip'
	    if not os.path.exists(today):
		os.mkdir(today)
		print 'Create ' + today + ' successfully!'
	    zip_cmd = "zip -qr %s %s" % (target,' '.join(Backup.dirlist))
	    if os.system(zip_cmd) == 0:
		print 'BACKUP SUCCESSFULLY TO', target
	    else:
		print 'BACKUP FAILED!'
	    return

    if __name__ == "__main__":
	command = raw_input('IF you want to backup one file input f.\n'
		'IF you have a directory to backup input d.\n'
		'Nothing to do input OTHER keys.\n'
		'$--backup-->')
	back = Backup()
	if command == 'f':
	    back.Is_a_file()
	    back.run_backup(back.get_target_dir())
	elif command == 'd':
	    back.Is_a_dir()
	    back.run_backup(back.get_target_dir())
	else:
	    exit()

这个功能看起来有80多行的代码，貌似挺复杂的，其实没啥意思的，连个迭代也没用(我承认是我自己水平有限，大牛绕行吧)，之所以多，是因为它做了很多琐碎的事情，譬如说获取系统时间，又譬如说获取备份路劲并判断是否合法，又譬如说调用zip进行压缩，其实都是一些流程化的东西。看在代码没有注释的情况我还是大致讲一些业务逻辑的事情。

首先选择你要备份的是一个文件还是一个目录，这里有两种情况。单个文件好说直接压缩备份到你要求的地方，如果是目录的话就进去把里面的东东挨个儿加到一张表里，再把表里的全压缩备份了。上面不管是哪一种情况都还会在执行压缩前问问你要不要加什么备注之类的，加上的备注中空格自动给您弄成下划线。大致就是个这了，别的还真没有。

总结：

上边给出了几个基本的功能，还有一些像移动啊，新建啊，使唤vim啊都没写了，因为实在是有些简单了。再再说一遍吧，上边的代码可重构的余地非常的大，就代码而言是这样的，而且我也丝毫没有用到什么模式，其实我还是很希望哪天兴致好给重新弄弄的。关于主函数的设计就不在这提了，大家完全可以按照自己的想法去发散一下自己的main应该是啥比较好，可以用args获取cmd参数（因为这是跑在命令行里的自然是要获得参数的喽），自然也可以raw_input，仁者见仁啊，我两者都试了试，挺好的。

最后下面附一张我的效果图吧：

![python](/assets/themes/twitter/img/blogpic/python.png)

再废话两句，这是我学python后做的第一个demo，让我感觉这个语言确实非常的简单，简单的语言往往并不好掌握，因为她们太灵活了，在不同人的手里她们可以千姿百态，想要用她写出好的代码绝对不是说来就来的事情。。。不知道Ruby是个啥情况啊，还是那句不负责任的到时候再说。。。
