---
title: 'sbt command cheat sheet'
description: ''
date: '2018-08-10'
modified_date: '2018-08-10'
---


You can chain several commands together using space as the delimeter e.g.```sbt clean reload compile run``` .
 <!--more-->
| Command         | Action    |
| ------------- |-------------|
| ```clean```     | Deletes all generated files (in the target directory).|
| ```reload```     | Tell sbt to check the build.sbt and plugins file and reload the build definition. |
| ```compile```      | Generate the bytecode.    |
| ```run``` | Execute the bytecode.   |
| ```package```    | Build JAR file. It may have the dependecies problem running with java. |
| ```assembly```      | Build fat JAR file fully compatible with java external dependencies. Need to add sbt-assembly plugins before running. |
| ```console```| Launch repl console. | 
| ```test```  | Run test. |
