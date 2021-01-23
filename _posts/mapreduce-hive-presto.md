---
title: "เมื่อ Map reduce ไม่สนุกเท่า Hive และ Presto"
description: 'จากความพยายามที่ต้องการทำให้ MapReduce ใช้งานง่ายขึ้น จึงมีการนำภาษาอื่นที่ไม่ใช่การเขียน Java เข้ามาแทน ไม่ว่าจะเป็นการคิด Pig แต่หนึ่งในวิธีที่ได้รับการต้อนรับที่ดีกว่าวิธีอื่นคือการใช้ SQL'
date: '2019-02-12'
modified_date: '2019-02-12'
image: '/assets/images/posts/presto-architecture.png'
---

จากความพยายามที่ต้องการทำให้ MapReduce ใช้งานง่ายขึ้น จึงมีการนำภาษาอื่นที่ไม่ใช่การเขียน Java เข้ามาแทน ไม่ว่าจะเป็นการคิด [Pig](https://pig.apache.org/) เป็นต้น  แต่หนึ่งในวิธีที่ได้รับการต้อนรับที่ดีกว่าวิธีอื่นคือการใช้ SQL - ภาษาที่มีการวิจัยมายาวนานกว่า 40 ปีครับ 

## Hive
ทำไมเราต้องใช้ Java ด้วยในเมื่อทีม data ของเราทุกคนรู้ SQL กันอยู่แล้ว? นั้นคือวิธีการแก้ปัญหาของทีม Facebook ที่ต้องการจัดการกับข้อมูลขนาดใหญ่ด้วย SQL บน Hadoop เลยคิดค้น [Hive](https://hive.apache.org/) ขึ้นมาก่อนที่จะเข้าสู่โครงการ Apache เต็มตัวและกลายเป็น project ที่ได้รับความนิยมสูงมากในเวลาต่อมา

Hive ถูกสร้างมาเพื่อใช้งานแทนการเขียน MapReduce ที่มี productivity ต่ำแสนต่ำ โดยเปลี่ยนมาใช้ declarative language อย่าง SQL แทน imperative language อย่าง Java ทำให้ใครก็ตามในองค์กรที่มีความรู้ด้าน SQL สามารถหยิบจับใช้มันได้ทันที

<br/>

![hive-architecture](@@baseUrl@@/assets/images/posts/hive-architecture.png)
*https://cwiki.apache.org/confluence/display/Hive/Design*


### HiveQL

คือ execution engine โดยเบื้องหลังการทำงานของ SQL จริงๆแล้วคือ Map/Reduce เพียงแต่มันเขียนง่ายกว่าและยังทำ optimization ให้เราเองได้อีกด้วย

### Metastore 
มีหน้าทีเก็บ metadata ของ data เช่น schema, location, partition ของ table ที่เราสร้างโดยจะทำการเก็บอยู่ใน Apache Derby database (สามารถเปลี่ยนไปใช้ SQL database ตัวอื่นได้) เพื่อให้เราสามารถใช้ HiveQL ในการ query data บน HDFS ออกมาได้

### Table  
เนื่องจาก SQL คือการจัดการกับ Relational table,  Hive จึงจำเป็นต้องทำ data บน HDFS ให้อยู่ในรูปแบบ table เพื่อให้สามารถใช้ SQL ได้ โดยมี table 2 ประเภทคือ:

 1. Internal table: Hive จะเข้ามาดูแลส่วน table เอง เหมือนเป็น database ทั่วไปโดยจัดเก็บไว้ใน folder user/hive/warehouse แต่หาก drop table ทิ้ง data จะหายทันที   
 2. External table: เหมือนเป็น pointers ที่ชี้ไปยัง path จริงๆบน HDFS ทำให้เวลา drop table metadata จะโดนลบ แต่ data จริงยังคงอยู่


## Presto

![presto-architecture](@@baseUrl@@/assets/images/posts/presto-architecture.png)
*http://prestodb.github.io/overview.html*


Facebook ไม่หยุดแค่ที่ Hive เพราะ Facebook engineers มองเห็นว่าหากเราไปทำงานบน memory แทน disk ล่ะ? นั้นคือที่มาของ project ใหม่คือ [Presto](http://prestodb.github.io/) โดยได้รับแรงบันดาลใจจาก [Dremel](https://ai.google/research/pubs/pub36632) ของ Google (เบื้องหลังการทำงาน [BigQuery](https://cloud.google.com/bigquery/)) ซึ่งมี performance ที่ดีกว่า Hive แบบเดิมๆเป็นอย่างมาก

Presto เรียกตัวเองว่า Distributed SQL query engine for big data (MPP) ซึ่งสามารถ query อะไรก็ได้ที่มี connectors ให้แก่มัน เช่น Kafka, Hive, Postgresql หรือแม้แต่ S3, Google cloud storage ก็ทำได้ หมดปัญหาที่ Hive เผชิญ เพราะ Hive นั้นผูกติดกับ Map reduce ทำให้เก่งแต่บน HDFS ในขณะที่ Presto ไม่ได้ทำงานอยู่ในโลกของ Hadoop แล้ว 

อีกประเด็นที่ Presto เจ๋งกว่า Hive คือทำงานอยู่บน memory แทนที่จะทำ on disk ดังนั้นความเร็วจึงต่างกันอยู่พอควร

อย่างไรก็ตาม Presto ยังคงจำเป็นต้องพึ่งบริการ Hive metastore เพื่อเก็บ metadata อยู่ดี ซึ่งนับว่าเป็นข้อดีมากๆเพราะเท่ากับสามารถย้ายจาก Hive มา Presto ได้แบบชิลๆเลยครับ


## In summary

ในปัจจุบัน บริษัทยักษ์ใหญ่หลายๆเจ้าอย่าง Uber, Facebook, Netflix รวมไปถึง Amazon ต่างก็ contribute ให้กับ Presto เป็นอย่างมาก โดยเฉพาะ AWS ที่ภูมิใจกับ Athena และเรียกมันว่า serverless interactive query service ในขณะที่ Google นั้นไม่แคร์ เพราะมี BigQuery ที่พวกนายได้รับแรงบันดาลใจไงล่ะ 


จริงๆแล้วยังมีเครื่องไม้เครื่องมืออื่นอีกที่ไม่ได้กล่าวถึงอย่าง [Impala](https://www.cloudera.com/documentation/enterprise/5-3-x/topics/impala_intro.html) ของทาง Cloudera ซึ่งเปิดตัวในปี 2012 และดูเหมือนจะประสบความสำเร็จในช่วงระยะเวลาหนึ่ง (เท่าที่ผมทราบ น่าจะเป็นเครื่องมือเดียวเลยที่ Cloudera ปล่อยออกมาแล้ว community เห็นดีเห็นชอบด้วย) แต่ข้อเสียหลักของ Impala คือทำงานได้ดีกับ HDFS เท่านั้น ผิดกับ Presto ที่จะ query บน S3 หรือ Database อื่นๆได้ครับ

![impala-architecture](@@baseUrl@@/assets/images/posts/impala-architecture.jpeg)
*https://www.cloudera.com/documentation/enterprise/5-3-x/topics/impala_intro.html*


สำหรับหลายๆคนที่คุ้นเคยกับ Spark โดยเฉพาะ SparkSQL อาจสงสัยว่าทำไมมันดูคล้ายๆกันเลย แบบนี้ใช้แทนกันได้ไหม ผมว่ามันเหมาะกับงานคนละประเภท 

Spark จะเหมาะกับ ทำ ETL pipeline เพราะมี DAG ทำให้ฟื้นคืนชีพจาก fault torelance ได้ตลอด และยังทำ machine learning หรือ micro-batch ​processing ได้ ในขณะที่ Presto จะเหมาะกับ ad-hoc analysis มากกว่าและหาก query failed จะ return error มาตรงๆ ดังนั้นเลือกเครื่องมือให้ถูกงาน ชีวิตจะสบายครับ
