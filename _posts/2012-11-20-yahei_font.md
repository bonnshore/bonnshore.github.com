---
layout: post
date: "2012-11-20 22:22:PM"
weather: Thunder maybe
title: "微软雅黑在word中行距过宽问题"
description: "微软雅黑是MS在推出vista时一起推出的一种字体，字体很漂亮也很受大众喜欢。但是用这种字体在简体中文word中编辑文档，发现“行距”很宽，一页也排不了几行，不美观，当然是问题都是可以解决的，本文就是这样一篇文章。"
category: lessons 
tags: [funny, useful东东]
---
{% include JB/setup %}

    微软雅黑是MS在推出vista时一起推出的一种字体，字体很漂亮也很受大众喜欢。但是用这种字体在简体中文word中编辑文档，发现“行距”很宽，一页也排不了几行，不美观，当然是问题都是可以解决的，本文就是这样一篇文章。

想解决这个问题的直接方法就是在段落属性对话框中取消选中“如果定义了文档网格，则对齐网格”，或者直接在页面设置中“文档网格”tab页选择“无网格”，即不设置网格。但是不推荐大家这么做，因为:

1. “如果定义了文档网格，则对齐网格”是默认选中的，说明微软推荐大家通过对齐网格来进行文档排版.

2. 如果不对齐网格或者不定义网格，实际上并不美观，所有的行都挤在了一起.

所以如果希望彻底解决这个问题需要了解排版的一个规则，简单讲一下：

用自己做的样张可以算出来微软雅黑五号字是的高度是18.012磅，而简体中文word2003中A4纸张默认的设置是每页44行，每行15.85磅，这意味着在对齐网格的情况下，一行的高度容不下一个微软雅黑五号字的高度：15.8518.012，此时word就用两行来容纳一行的微软雅黑五号字。这也就是我们遇到的问题，因为这并不美观。

顺便说一下：为什么专门说是简体中文的word，因为页面设置中的每页xx行，每行xx磅是在模板中定义的，即在：

\Documents and Settings\user’s(这里是当前用户名)\Application Data\Microsoft\Templates\Normal.dot文件，而这个模板文件随着office的语言版本不同而不同，比如在office2003日文版中Normal.dot中定义的是每页36行，每行 19.35磅。

于是本文描述的问题在日文版office2003的word中是不存在的，因为19.35>18.012，也就是微软雅黑五号字可以在一行中排下，不会占用两行的高度。

所以我们就可以按照这种原理来解决这个问题，即只需要设置一个大于18.012磅的行跨度即可。

于是问题就解决了，这样做的好处是，不会因为没有对齐网格或着没有定义网格而导致挤压现象，而又调整好了“行距”，所以还是推荐这样去设置并解决。对于其他字体如果也出现这个现象那么同样可以考虑设置合适的行跨度来解决。 
 

