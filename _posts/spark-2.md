---
title: 'มีอะไรใหม่ใน Spark 2.X+'
description: 'สิ่งที่เปลี่ยนไปหลักๆของ version 2.x+ คือการใช้ Dataframe/Dataset แทน ​RDD แบบเก่าๆที่ยากกว่า:'
date: '2019-02-27'
modified_date: '2019-02-27'
image: '/assets/images/posts/spark-structured-streaming-watermark.png'
---

1. SparkSession เป็น entrypoint ของ Spark API's ทั้งหมด (SparkContext และ SqlContext อยู่ใต้ร่มเงาของ SparkSession)  
2. SqlContext รวมร่างกับ HiveContext แล้ว 
3. Default datatype ของ SparkSession คือ Dataframe และ Dataset
4. Spark Structured Streaming - built on top of Spark SQL engine และใช้ Dataframe/Dataset เป็นหลักในการทำ Streaming แทน Spark Streaming !
5. Dataset[Row] คือ type แบบใหม่ที่ใช้ได้กับ Java และ Scala เท่านั้น ช่วยในเรื่อง check compile error time ที่ Dataframe และ Python ให้ไม่ได้

สิ่งที่เปลี่ยนไปหลักๆของ version 2.x+ คือการใช้ Dataframe/Dataset แทน ​RDD แบบเก่าๆที่ยากกว่า:

![catalyst-optimizer-diagram](@@baseUrl@@/assets/images/posts/catalyst-optimizer-diagram.png)
*https://databricks.com/blog/2016/06/22/apache-spark-key-terms-explained.html*


* Spark RDD เจอปัญหาเรื่อง optimization เนื่องจากมัน low level, ผลักภาระทุกอย่างให้ users เป็นคนทำ optimize เอง และ serialization overhead ในการ communicate ระหว่าง node
* Spark Dataframe/Dataset จึงใช้ [Catalyst](https://databricks.com/glossary/catalyst-optimizer) + SQL optimizing logical and physical query plan แทนการทำ serialization เพราะเรามีการทำ research และเข้าใจโลก SQL มากว่า 40 ปีแล้ว ควบคู่ไปกับการใช้ [Tungsten](https://databricks.com/glossary/tungsten) ที่ทำ optimize ล้วงลึกไปถึงระดับ off heap และ binary level เลยทีเดียว


## Kafka และ Spark Streaming

ปัญหาหนึ่งที่ Kafka ต้องปวดหัวมาตลอด คือ delivery semantics อย่างไรให้โดนใจผู้ใช้ และยิ่งต้องมาผสมปนกับ Spark streaming แล้วละก็ทำให้ยิ่งยากเข้าไปใหญ่ เนื่องจากหาก pipeline ของเราไม่สามารถ handle fault tolerance และ exactly once processing ได้ อาจส่งผลเสียต่องานบางประเภทที่ต้องการความแม่นยำสูง

แต่เดิม Kafka + Spark streaming นั้นใช้ วิธี Receiver แต่ปัจจุบันนั้นเลิกใช้แล้ว หันไปใช้ [Kafka direct](https://spark.apache.org/docs/latest/streaming-kafka-0-10-integration.html#storing-offsets
) แทน โดยการมองให้ Kafka buffer = File system ธรรมดาๆ 

บทนี้ผมจึงพูดเรื่องของ [Kafka กับ Spark Streaming](https://spark.apache.org/docs/latest/streaming-kafka-0-10-integration.html
) แบบใหม่กัน

1. Driver มีหน้าที่ fetch offsets จาก Kafka topics เท่านั้น
2. หลังจากที่ได้ค่า range offsets ที่จะคิดแล้ว Driver จะทำการ write ahead logs ก่อนเผื่อกรณี driver ตายกลางทาง
3. ทำการคิดว่าจะสร้าง RDD กระจายไปให้ workers ใน cluster ยังไง จุดสำคัญอยู่ที่ 1 task สามารถดูแลได้เพียง 1 partition เท่านั้น เพื่อ keep exact order จาก partition ไว้
4. Executor nodes เริ่มทำงาน โดยการ pull offsets ตามที่ driver สั่งไว้
5. จำเป็นต้องตั้ง `enable.auto.commit = false` เนื่องจากโดยธรรมชาติ Kafka จะ auto commit  เมื่อได้ records จาก Kafka แต่เพราะเราไม่รู้ว่า executor nodes เราจะตายระหว่างการคิดหรือไม่ เราจึงจะทำการ commit manually เอง
6. ทำการ commit ด้วย `commitAsync`

เราลองมาดูกรณีที่เกิด failures กันครับ

* หาก Driver fails เท่ากับ executor nodes ไปด้วย ในกรณีนี้ Driver จะทำการ read WAL (checkpointing) จาก HDFS เพื่อกลับมายัง state ที่เคยเป็น
* หาก Executor fails ก็เพียงแค่ recompute task ใหม่ตามหลักทั่วไปของ Spark

## Spark Structured Streaming

Spark Streaming ถูกอออกแบบมาบนพื้นฐานของ batch processing ทำให้โดนวิจารณ์ว่ามันไม่ใช่ true streaming engine (1.x) มาตลอดเพราะ

1. ทำได้แต่ processing window time และไม่มีความสามารถในการจัดการ event time และ late data ได้ ซึ่งสำคัญมากๆในโลกปัจจุบัน
2. ยังคงอิงอยู่บนพื้นฐานของ batch processing ทำให้ latency แย่กว่า Flink 

>ลองแอบมองไปที่ stream processing ตัวอื่นๆกันว่าเค้าไปไกลกันขนาดไหน

>* Flink ไปไกลถึงขั้นทำ end-to-end exactly once + strong consistency via snapshots and savepoints (ใช้ทั้ง Rockdb + snapshots + HDFS + Kafka ช่วย) 
>* ในขณะที่ Kafka Streams ก็เทพเหมือนกัน เนื่องจากพี่แกมี Kafka อยู่แล้ว แกเลย commit changelog จาก Rockdb ไปยัง topic เลย กรณีพังก็แค่ให้ rockdb replay changelog ใน topic เราใหม่


และนั้นคือเหตุผลที่ Spark streaming ถูกชุบชีวิตใหม่ด้วย Spark Structured Streaming 

Spark Structured Streaming  ถูกสร้างอยู่บนพื้นฐานของ Dataframe โดยการมอง unbounded data streams ให้เป็น virtual tables ใหญ่ๆที่ทุกๆ records จะมา append ต่อท้ายไปเรื่อยๆเพื่อความเร็วในการคิดและดึงประสิทธิภาพจาก Dataframe/Dataset  ให้สูงที่สุด

![spark-structured-streaming-table](@@baseUrl@@/assets/images/posts/spark-structured-streaming-table.png)
*https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html#programming-model*


เนื่องจากงานบางประเภทจำเป็นต้องเก็บ intermediate value เพื่อใช้ในการทำ stateful processing เช่น groupby, count, sum 
Spark structured streaming จำเป็นต้องหาวิธีจัดการ save ค่า state ชั่วคราวไว้สำหรับ trigger ในรอบต่อๆไป จึงต้องทำการ dump ค่าใน internal memory ลงไปใน persistent store อย่าง HDFS

![spark-structured-streaming-checkpoint](@@baseUrl@@/assets/images/posts/spark-structured-streaming-checkpoint.png)
*https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html#programming-model*



อย่าสับสนกันครับ เพราะจริงๆ Checkpoints มี 2 แบบ (อ่านต่อเพิ่มเติมได้ที่ [Spark streaming doc](http://spark.apache.org/docs/latest/streaming-programming-guide.html#checkpointing))

1. Metadata of stream processing เพื่อจุดประสงค์ fault tolerance หลักๆแล้วเก็บว่าทำไรไปบ้างอันไหนยังไม่เสร็จและ dump ลงไปใน HDFS เพื่อป้องกัน failure ของ driver node และสามารถรักษาสถานะของ cluster ว่าทำไปถึงส่วนไหนแล้ว ตัวอย่างเช่น consumer offsets ของ Kafka เป็นต้น
2. State checkpointing คือเก็บค่า stateful processing ไว้ใน persistent storage HashMap อย่าง HDFS เพื่อใช้กับ micro batching รอบต่อไป ในแต่ละ state จะทำการ read ค่าจาก state ก่อนและนำมาคิดกับค่าที่ได้ใน state ปัจจุบัน ก่อนจะโยนต่อไปยัง state ถัดไป 


อีกเรื่องที่ Spark เพิ่มเข้ามาคือ concept ของ event time เพื่อใช้จัดการกับ late data ได้ ซึ่งมีประโยชน์มากๆในการทำ aggregation เพราะเพิ่มความแม่นยำกว่าการใช้ processing time แบบเดิมๆเพียงอย่างเดียว

![spark-structured-streaming-late-data](@@baseUrl@@/assets/images/posts/spark-structured-streaming-late-data.png)
*https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html#handling-late-data-and-watermarking*


> Event time คือ timestamp ของ event ที่เกิดขึ้นจริงๆบนโลก เช่น หากเราเล่นเกมบนมือถือแล้วชนะ ตัวเกมก็จะสร้าง event time ขึ้นมาและส่งไปยัง server เพื่อบอกว่าเราชนะเกมนี้แล้วนะ เอาไปขึ้น leaderboard เลย แต่หากแบตดันหมดกระทันหัน ตัว event นี้ก็จะถูก delay ออกไป และกว่าเราจะหาที่ชาร์ตแบตเจอ ก็อาจช้าไปเป็นชั่วโมง หากเป็น Spark แบบเก่าจะมองแค่ Processing time หรือเวลาที่ event ถูก process ในระบบ เมื่อเป็นแบบนี้มันก็คงไม่แฟร์กับคนเล่นเกมเพราะแทนที่เราจะได้เป็นที่ 1 ของ leaderboard กลับกลายเป็นช้าไปเป็นชั่วโมง

เนื่องจากเราต้องวุ่นวายกับทั้ง Event time และ Processing time คำถามคือจะทำยังไงให้ Spark รู้ว่า window ใดควรจะหยุดการ compute แล้ว ซึ่งนั้นคือประโยชน์ของ Watermark คือเป็นตัวบอกว่า เห้ย นายควรปิด window รอบนี้แล้วเพราะ late event time มันเกินค่า threshold ที่เรารับได้ 

วิธีคิด Watermark คือ max(event time) - your watermark time จะได้ range ที่เรายอมรับ late data นั้นให้ยังคงอยู่ใน windows นั้นๆได้

![spark-structured-streaming-watermark](@@baseUrl@@/assets/images/posts/spark-structured-streaming-watermark.png)
*https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html#handling-late-data-and-watermarking*


โจทย์ใหญ่อีกโจทย์ที่ Spark ต้องแก้คือการให้ Spark หลุดออกจาก Micro-batching ให้ได้เพื่อเป็น native continuous streaming เหมือนที่ Flink และ Kafka Streams เป็น เพื่อประสิทธิภาพที่ดีขึ้น และช่วย resources ให้ดีขึ้นเพราะไม่จำเป็นต้อง schedule และ trigger Spark jobs ทุกๆครั้ง แต่ใช้การ submit long running job  ทิ้งไว้นานๆครั้งเดียวเลย 

ข่าวดีคือ Spark มี Spark continuous streaming แล้วครับ ส่วนข่าวร้ายคือยังเป็น Experiment mode อยู่เอง




