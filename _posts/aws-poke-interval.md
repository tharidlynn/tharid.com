---
title: 'Poke AWS in terminal'
description: 'My terminal always automatically closes the session whenever I log in to the AWS EC2 instance and stay idle for a few minutes'
date: '2018-06-22'
modified_date: '2019-04-02'
---

My terminal always automatically closes the session whenever I log in to the AWS EC2 instance and stay idle for a few minutes.
 <!--more-->
Adding `ServerAliveInterval 50` in `~/.ssh/config` solves this issue because it tells my terminal to poke AWS server every 50 seconds. 