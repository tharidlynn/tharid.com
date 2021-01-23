---
title: 'Lambda และ Kappa architecture'
description: 'Nathan Marz ได้เขียนบทความอธิบายเกี่ยวกับ [Lambda architecture](http://nathanmarz.com/blog/how-to-beat-the-cap-theorem.html) ไว้อย่างละเอียดยิบ ในบทนี้ผมขอสรุปเท่าที่ผมเข้าใจละกันครับ'
date: '2019-01-24'
modified_date: '2019-01-24'
---



Nathan Marz ได้เขียนบทความอธิบายเกี่ยวกับ [Lambda architecture](http://nathanmarz.com/blog/how-to-beat-the-cap-theorem.html) ไว้อย่างละเอียดยิบ ในบทนี้ผมขอสรุปเท่าที่ผมเข้าใจละกันครับ
 

## Lambda architecture 
เนื่องจากเรากำลังพูดถึง data ที่เยอะมากๆ เราจึงไม่สามารถทิ้ง P ใน CAP theorem ได้ จึงเหลือแค่ต้องเลือกระหว่าง CP กับ AP  ถ้างั้นทำไมเราไม่ลองเอาทั้ง C และ A เลยล่ะ ? 

นั้นคือที่มาของ 2 layer, Batch layer และ Realtime layer ตัวหนึ่งเน้นความถูกต้องแบบ batching ขณะที่อีกตัวเน้นความเร็วแบบ streaming

Data ในมุมมองของ Marz คือ record ที่เราไม่ควรจะไปแก้ไขมัน ควรทำให้มันเป็น immutable record เพราะ record เหล่านั้นคือความจริงของช่วงระยะเวลาหนึ่ง เช่น นาย ก ซื้อของเล่น X เวลา 15.00 ต่อมา นาย ก ขอคืนสินค้า X เวลา 22.00 เพราะห่วย ยังไงซะครั้งหนึ่งนาย ก ก็เคยมีของเล่น X อยู่และเราก็ไม่ควรไป update/delete ตอน 15.00 (หลักการนี้คือ event sourcing นั้นแหละครับ)

> "Business is a series of events and the reactions to those events"

อีกข้อดีของการเก็บ raw อีกอย่างคือเราสามารถนำมาแก้ไขในภายหลังได้ง่ายตาม business requirement เช่นโยนลง batch processing เพื่อคำนวณใหม่ เป็นต้น
  
Question: ใช้อะไรเก็บ immutable record ดี 

Answer: Kafka เนื่องจากทำ Replay ได้ + write high throughput + low latency

### Batch layer (Batch processing)
คือการทำ MapReduce/ batch processing/ ETL เพื่อเก็บใน data warehouse เป็นต้น ในส่วนตรงนี้นั้นไม่ได้มีอะไรแตกต่างกับที่เราใช้กันอยู่ในทุกวันนี้มากนัก แต่แทนที่เราจะ extract data จาก source โดยตรง เราจะเปลี่ยนมา extract จาก Kafka หรือ message bus แทน 

### Realtime layer (Stream processing)
นี้คือสิ่งที่ Marz เน้นมากๆใน Lambda architecture เนื่องจาก business requirement ในปัจจุบันต้องการความเร็วในการ query หรือเข้าถึงแบบ real time มากขึ้น เพราะงั้นจึงต้องมี layer นี้เข้ามาเสริม โดยจะเน้น low latency, high availability และ high throughput เพื่อรับ data ได้ดีและส่งต่อไปยัง Serving layer ได้ในทันที ตัวอย่างใน layer นี้เช่นการใช้ Storm subscribe Kafka topics ก่อนทำ stream processing และส่งต่อไปยัง Cassandra เพื่อให้ end-user สามารถ query ได้ทันทีแบบ real time

> จริงๆแล้วเราทำของพวกนี้มานานละ ทั้ง transactions, monitor-system fraud, web analytics, หรือแม้แต่ ETL เพียงแค่มันช้า ไม่ทันใจ เพราะมันเป็นแบบ batch แต่ถ้ามันเร็ว มันสามารถสร้าง application แนว Customer feedback loops ใหม่ๆได้อีกเยอะ นึกภาพพวก google search, credit scoring, fraud detection, news feeds, และ recommender system ทำให้ในปัจจุบัน คนเริ่มให้ความสนใจมากขึ้น จนกลายเป็น data driven model ที่เน้น real-time stream แทน batch แบบเก่าๆ

และเนื่องจากมัน real time และมี data หลั่งไหลเข้ามาเยอะ จึงจำเป็นต้อง sacrifice accuracy ทิ้ง ตัวอย่างเช่น ​Storm ใช้ model แบบ at least once processing จึงทำให้อาจมี data บางตัวโดนคิดซ้ำเป็นต้น หรืออาจใช้ approximate, incremental algorithm เข้ามาช่วยคิด นี้ยังไม่นับรวมถึง Cassandra ที่เป็น eventual consistency อีก

ด้วยเหตุนี้ จึงจำเป็นต้อง merge Real time view เข้ากับ Batch view เพื่อให้ Batch layer มาแก้ไขข้อผิดพลาดจาก real time layer และทำให้ data เรากลับมาถูกต้อง 100% ครับ

> เวลาพูดถึงการ stream data อยากให้คำนึงถึงสิ่งเหล่านี้:
> * Immutability
> * Idempotence
> * Reproducibility
> * Timestamp 
> * Completeness
> * Correctness
> * Consistency


## Kappa architecture
แต่ Jay kreps, หนึ่งในผู้สร้าง Kafka ไม่ได้เห็นด้วยกับ Lambda architecture ไปซะทั้งหมด เขามองว่าปัญหาใหญ่ที่สุดของ Lambda architecture คือการที่เราต้องดูแล data pipeline ที่เขียน code ก็ไม่เหมือนกันถึง 2 pipelines คงพอนึกภาพออกว่า ต้องใช้ทั้ง Spark, Storm, Samza, Storm, MapReduce มั่วกันไปหมด วิธีแก้คือทำยังไงให้เอา Batch layer ออกไปจากสมการ เพราะยังไงทุกวันนี้ก็ต้องทำ Realtime layer อยู่แล้ว และนั้นคือที่มาของ [Kappa architecture](https://www.oreilly.com/ideas/questioning-the-lambda-architecture)


ทางแก้ที่ 1: ใช้ [Apache Beam](https://beam.apache.org/) - project ที่ถือกำเนิดมาจาก [Dataflow](https://cloud.google.com/dataflow/) บน Google cloud วิธีคือ unified model ของ batch และ stream processing เข้าด้วยกัน พูดง่ายๆคือเขียน code ครั้งเดียวได้ 2 pipeline โดยตัว Beam จะเหมือนเป็น higher API มาครอบอยู่บน Spark, Flink อีกทีครับ 

_Note: Spark และ Flink ในปัจจุบันเขียนง่ายกว่าแต่ก่อนมากเนื่องจากใช้ SQL และ Dataframe เป็น API หลัก แถมยังสามารถโยกย้ายจาก batch และ stream ด้วย API เดิมๆ โดยส่วนตัวแล้วจึงไม่ค่อยเห็นประโยชน์ของ Apache Beam เท่าไรเนื่องจากเหมือนไปเพิ่ม complexity เพิ่มอีก layer ยกเว้นในกรณีใช้ Google Dataflow บน Google cloud_

ทางแก้ที่ 2: ใช้ exactly once stream processing - ในอดีต การทำ exactly once processing ยากมาก แต่วันนี้เรามีหลายๆ tools ที่ทำได้แล้ว เช่น Kafka streams, Flink on Kafka, Storm with Trident หรือแม้แต่การใช้ Spark เป็นต้น เพราะงั้นปัญหาที่เราเจอเรื่อง accuracy ก็ไม่มีอีกต่อไป พอไม่มีก็ยุบมันให้เหลือ layer เดียวคือ Real time layer ก็จบ

