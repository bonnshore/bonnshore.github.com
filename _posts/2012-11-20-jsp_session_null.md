---
layout: post
title: "web开发中文字符乱码解决集合文"
description: "相信每个人再刚刚开始学习接触web开发时都会遇到一个问题，没错那就是中文字符乱码的问题，其实我们都知道只要统一设置了字符的编码就不会出现这种问题，但往往在一些细节上我们还是容易忽视因此产生了这样的问题，此文的诞生就是为了解决此问题。"
category: web 
tags: [jsp]
---
{% include JB/setup %}

    相信每个人再刚刚开始学习接触web开发时都会遇到一个问题，没错那就是中文字符乱码的问题，其实我们都知道只要统一设置了字符的编码就不会出现这种问题，但往往在一些细节上我们还是容易忽视因此产生了这样的问题，此文的诞生就是为了解决此问题。

##后台方案
转码

    str= new String(str.getBytes("iso8859-1"),"gb2312");
    str= new String(str.getBytes("iso8859-1"),"GBK");

servlet中

    response.setContentType("text/html; charset=GBK");

##前台方案
JSP中需要

    < %@ page language="java" contentType="text/html;charset=GBK" pageEncoding="GBK" %>

##服务器 Tomcat中

更改 Tomcat\conf\server.xml，指定浏览器的编码格式为“简体中文”，把

    <Connector port="8080" protocol="HTTP/1.1" connectionTimeout="20000" redirectPort="8443" />

改成

    <Connector port="8080" protocol="HTTP/1.1" connectionTimeout="20000" redirectPort="8443" URIEncoding="GBK"/>

##web.xml添加过滤器

filter源码：

    package com.web0248.filter;
    import java.io.IOException;
    import javax.servlet.Filter;
    import javax.servlet.FilterChain;
    import javax.servlet.FilterConfig;
    import javax.servlet.ServletException;
    import javax.servlet.ServletRequest;
    import javax.servlet.ServletResponse;
    public class SetCharacterEncodingFilter implements Filter {
     protected String encoding = null;
     protected FilterConfig filterConfig = null;
     protected boolean ignore = true;
     public void destroy() {
     this.encoding = null;
     this.filterConfig = null;
     }
     public void doFilter(ServletRequest request, ServletResponse response,
     FilterChain chain) throws IOException, ServletException {
     // 有条件地选择设置字符编码使用
     if (ignore || (request.getCharacterEncoding() == null)) {
     String encoding = this.encoding;
     if (encoding != null)
     request.setCharacterEncoding(encoding);
     }
     chain.doFilter(request, response);
     }
     public void init(FilterConfig filterConfig) throws ServletException {
     this.filterConfig = filterConfig;
     this.encoding = filterConfig.getInitParameter("encoding");
     String value = filterConfig.getInitParameter("ignore");
     if (value == null)
     this.ignore = true;
     else if (value.equalsIgnoreCase("true"))
     this.ignore = true;
     else if (value.equalsIgnoreCase("yes"))
     this.ignore = true;
     else
     this.ignore = false;
     }
    }
   
然后在web.xml中配置过滤器

    <filter>
     <filter-name>SetCharacterEncodingFilter</filter-name>
     <filter-class>com.web0248.filter.SetCharacterEncodingFilter</filter-class>
     <init-param>
     <!-- 定义编码格式，我用的是utf-8 -->
     <param-name>encoding</param-name>
     <param-value>utf-8</param-value>
     </init-param>
     <init-param>
     <!-- ignore参数是在过滤器类定义的 -->
     <param-name>ignore</param-name>
     <param-value>true</param-value>
     </init-param>
    </filter>
    <filter-mapping>
     <filter-name>SetCharacterEncodingFilter</filter-name>
     <servlet-name>action</servlet-name>
    </filter-mapping>
    <filter-mapping>
     <filter-name>SetCharacterEncodingFilter</filter-name>
     <servlet-name>*.jsp</servlet-name>
    </filter-mapping>

如果将上面的步骤都弄完了，我相信中文乱码的问题应该不会再困扰你了。

    

