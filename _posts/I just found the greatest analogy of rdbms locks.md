---
title: "I just found the greatest analogy of rdbms locks"
description: ''
date: '2019-02-01'
modified_date: '2019-02-01'

---


I had looked for a great analogy of an exclusive lock and a shared lock for a long time and today I just found this impressive analogy on the Stackoverflow answered by ArjunShankar ! 
 <!--more-->
For people who don't understand why it's really useful to understand a locked mechanism, you are going to see this topic  in various database topics such as Serializability, Consistency, Linearizability and two phased commits. 

> I wrote this answer down because I thought this would be a fun (and fitting) analogy:

> Think of a lockable object as a blackboard (lockable) in a class room containing a teacher (writer) and many students (readers).

> While a teacher is writing something (exclusive lock) on the board:

> 1. Nobody can read it, because it's still being written, and she's blocking your view => If an object is exclusively locked, shared locks cannot be obtained.

> 2. Other teachers won't come up and start writing either, or the board becomes unreadable, and confuses students => If an object is exclusively locked, other exclusive locks cannot be obtained.

> When the students are reading (shared locks) what is on the board:

> 1. They all can read what is on it, together => Multiple shared locks can co-exist.

> 2. The teacher waits for them to finish reading before she clears the board to write more => If one or more shared locks already exist, exclusive locks cannot be obtained.


_[Source] (https://stackoverflow.com/questions/11837428/whats-the-difference-between-an-exclusive-lock-and-a-shared-lock)_
