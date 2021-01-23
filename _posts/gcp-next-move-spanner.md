---
title: "ก้าวต่อไปกับ Google Spanner"
description: 'หากจะกล่าวว่า Google คืออันดับหนึ่งด้าน distributed system ก็คงเป็นคำกล่าวที่ไม่ได้เกินจริง เพราะด้วยตัวธุรกิจของ Google ที่ต้อง scale ได้ตั้งแต่วันแรก ประกอบกับผลงานที่ผ่านมาของ Google ทั้งในแวดวง academia และ cloud'
date:  '2019-04-02'
modified_date: '2019-04-02'
image: '/assets/images/posts/spanner-overview.jpg'
---

หากจะกล่าวว่า Google คืออันดับหนึ่งด้าน distributed system ก็คงเป็นคำกล่าวที่ไม่ได้เกินจริง เพราะด้วยตัวธุรกิจของ Google ที่ต้อง scale ได้ตั้งแต่วันแรก ประกอบกับผลงานที่ผ่านมาของ Google ทั้งในแวดวง academia และ cloud เช่น 

* Hadoop ที่เอามาจาก MapReduce paper 
* Hbase และ Cassandra จาก BigTable paper 
* Google Dremel ไปยัง Presto
* Kubernetes 

วันนี้ผมจะขอพูดอีกหนึ่ง project ที่หลายๆคนอาจเริ่มได้ยินกันมาบ้าง นั้นคือ Google Spanner ที่ Google สุดแสนจะภูมิใจ ถึงขั้นนำมาให้บริการบน Google Cloud และยังเป็น database ที่ไม่มีใครเหมือนได้อีกแล้ว แม้แต่ [open source](https://www.cockroachlabs.com/) ยังทำไม่ได้เหมือนเป๊ะแม้จะมี [Spanner paper](https://storage.googleapis.com/pub-tools-public-publication-data/pdf/65b514eda12d025585183a641b5a9e096a3c4be5.pdf) ให้อ่านก็ตาม 

เอาล่ะ น่าสนใจกันละครับว่าทำไมมันถึงไม่มีใครเหมือนได้อีกแล้ว อยากรู้ลองอ่านกันต่อเลย

## SQL & NoSQL databases

Consistency และ Scalability เป็นปัญหาโลกแตกใน relational database มาโดยตลอด เพราะเหมือนเราต้องเลือกสักอย่าง 

และด้วย CAP Theorem ที่กำเนิดทฤษฎีที่ต้องเลือกระหว่าง CP หรือ AP ขึ้นมา ทำให้เกิดการเลือกฝ่ายเกิดขึ้น อย่าง Google นั้นมักเลือก database แบบ CP เช่น BigTable  พูดอีกนัยหนึ่งคือ Google หมกมุ่นกับเรื่อง Consistency มากกว่า ในขณะที่ฝั่ง Amazon จะเลือก availiability และ eventual consistency เพื่อ low latency แทน

แต่เมื่อ Google เริ่มถือครองธุรกิจที่หลากหลาย และ applications หลายตัวก็มีความต้องการ database  ที่ตอบโจทย์ทั้ง ACID, transactions, high availiability และต้อง scale ระดับโลกได้ด้วยในเวลาเดียวกัน ย้ำอีกครั้งนะครับ ระดับโลก ไม่ใช่แค่ในประเทศหรือทวีป ! ทำให้คราวนี้ Google ต้องการสร้าง database ที่เหนือกว่า BigTable ไปอีกขั้นครับ

ลองสรุปกันก่อนนะครับว่าเรามีอะไรบ้าง

* เรามี SQL database ที่มี ACID, transaction และ strong serializability
* เรามี BigTable ที่มี architecture ที่ scale write และ read ได้ดีระดับหนึ่ง
* เรามี Cassandra ที่แสดงให้เห็นแล้วว่า eventual consistency ไม่ใช่คำตอบ

> Google มองว่าทางที่ Amazon เลือกอย่าง eventual consistency มันยังไม่ใช่คำตอบของพวกเขา เพราะ 1. eventual consistency คือเมื่อไหร่ล่ะ ? และ 2. last-write-wins timestamp เป็นการแก้แบบชุ่ยๆ เพราะมันไม่สามารถให้ consistency และ serializability ได้เลย 


> BigTable สามารถ scale write and read ได้ดีมากๆอยู่แล้วจากการทำ partition + Region server และ replication จาก GFS รวมไปถึงเรื่องการ auto sharding, auto-rebalancing และ automatic failure

เพราะงั้น Google จึงคิดว่า เราเอา BigTable ของเรามาปัดฝุ่นใหม่แล้วเสริมความสามารถให้ supports serializability, consistency และ ACID transaction ได้ก็น่าจะตอบโจทย์เรานะ

และนั้นคือจุดกำเนิดของ Spanner ครับ !


## Spanner architecture

![spanner-architecture](@@baseUrl@@/assets/images/posts/spanner-architecture.png)
*Spanner paper*

มีความคล้ายกับ BigTable มาก เนื่องจากทีมงานของ Spanner หลายๆคนก็มาจาก BigTable นี้แหละ และการที่ BigTable เป็น CP ไม่เหมือนกับ Cassandra ที่เป็น AP ตาม CAP theorem จึงเป็นอะไรที่เหมาะเหม็งกับการเป็น base architecture ของ Spanner อย่างมาก

* Universe master: แสดงผล zone status ทั้งหมดเพื่อ monitor zone ต่างๆ 
* Placement driver: ผู้ช่วยของ Universe master ในการทำ load balancing, moving data, auto-rebalancing ของ Zone
* Zone master: แต่ละ zone มีได้เพียงหนึ่งตัว/zone เท่านั้น ทำหน้าที่คล้ายๆ NameNode ของ HDFS
* Location proxy : ระบุตำแหน่งของ Span servers ที่ถูกต้องแก่ clients ใช้เพื่อลด bottlenecks ของ Zone master เหมือนที่ HBase ใช้ Zookeeper 
* Span server: ที่เก็บ tablets 
* Tablets/splits/partitions/shards = data ที่ผ่านการทำ partition แล้ว โดยจะถูกจัดเก็บอยู่ตาม Span server

### Tablets

> Note: Tablets จริงๆแล้วมันก็คือ partitions ที่เก็บ data ของเรานี้แหละครับ ผมขออนุญาตใช้คำว่า partitions แทนเพื่อให้เข้าใจง่ายขึ้นมาอีกนิดนะครับ_

โจทย์ที่ Google ต้องตีให้แตกคือ 1.ต้องเป็น strict consistency และ 2.replications เพื่อ high availability

การใช้ asynchronous replication นั้นอาจดีต่อ performance แต่ก็ก่อให้เกิด replication lag และ inconsistency ของ data ได้ ดังนั้น solution จึงเหลือเพียงแค่เลือกใช้ consensus algorithm เพื่อสร้าง unified group กัน

และสิ่งหนึ่งที่ Spanner ทำให้ผมต้องทึ่งคือการ implement [Paxos consensus algorithm](https://en.wikipedia.org/wiki/Paxos_(computer_science)) ใน partition level ครับ เพราะ Paxos เป็นอะไรที่มี cost สูงมากเมื่อเทียบกับ Raft แต่ก็นะ นี้คือ Google ที่มี private fibre network ของตัวเอง + data center ทั่วโลก 



![spanner-paxos](@@baseUrl@@/assets/images/posts/spanner-paxos.png)
*Spanner paper*


เมื่อ Google แปะ Paxos ลงไปใน partitions สิ่งที่เกิดขึ้นคือ:

1. High availability จาก election leader 
2. Paxos write ไม่จำเป็นต้องมาครบทุกคน แต่ใช้การทำ majority vote แทน 
3. มั่นใจได้ว่า partitions ของเรามี consistency 

![spanner-overview](@@baseUrl@@/assets/images/posts/spanner-overview.jpg)
*https://www.slideshare.net/BenjaminBengfort/an-overview-of-spanner-googles-globally-distributed-database*


อย่างไรก็ตามแต่ Spanner จำเป็นต้องใช้ pessimistic locking row ในขณะ write (two-phase-locking) กับ lead replicas เพื่อป้องกัน race conditions จาก transaction อื่นๆ เช่นหาก transaction ของเรา update record จากหลายๆ partitions พร้อมกัน อาจก่อให้เกิดปัญหา conflict และฝ่าฝืน strict serializability แบบ SQL ที่เราต้องการได้

นอกจากต้อง lock row แล้ว บางกรณีที่ transaction มี operation กับหลายๆ partitions  Spanner จำเป็นต้องใช้ two-phase-commit กับ partitions เหล่านั้นเพื่อการันตีว่าทุกๆ commit ของเราถูก distribute ไปยัง partitions เหล่านั้นจริงๆ 

### Time
เวลาเป็นเรื่องที่น่ารำคาญมากกับ distributed system คือ netowrk มันเชื่อไม่ได้ และ hardware แต่ละ node ดันมีเวลาที่คลาดเคลื่อนจากกันอีก 

ที่น่าเศร้ากว่านั้นและเป็นปัญหาใหญ่คือ หากเราต้องการ linearlizability เราจำเป็นต้องปรับจูนให้เวลาของทุกๆ node และทุกๆ zone ในโลกตรงกันให้ได้ เพื่อให้ transactions สามารถถูกจัดเรียงลงบนเส้น timeline เพียงเส้นเดียว 

> Linearizability (external consistency) คือปัญหาหลักของ distributed database เลย คือทำไงให้ query แล้วได้ข้อมูลเหมือนกัน พูดง่ายๆคือหลอก users ว่าเรามี single copy นะ

และพระเอกของงานคือ true time API ที่ Google คิดค้นขึ้นมาเองกับมือ โดยใช้ atomic clock และ GPS ติดตั้งในทุก datacenters ของ Google เพื่อใช้แทน NTP protocol ที่มีความคลาดเคลื่อนถึง 250 milliseconds ตรงกันข้าม true time API ของ Google ที่มี skew ที่ต่ำเพียงแค่ 7 milliseconds หรือพูดภาษาชาวบ้านคือมีความคลาดเคลื่อน + 7 miliseconds เท่านั้น 

หลักการทำงานของ true time API คือจะ report เวลาแบบ confident interval เช่น A = [ A earliest , A latest ] และ B = [ B earliest , B latest ] ซึ่งเวลาที่ได้มาจะไม่มีทางทับซ้อนกัน  หรือพูดอีกนัยหนึ่งคือ A earliest < A latest < B earliest < B latest  ซึ่งตัว Spanner เองจะรอให้พ้น maximum time skew ก่อนจะ commit เสมอ เพื่อการันตีว่า timestamp ของแต่ละ transaction จะไม่ overlap กันโดยเด็ดขาด


> [CockroachDB](https://www.cockroachlabs.com/) - Spanner open source version  ไม่สามารถการันตี linearlizability แบบที่ Spanner ทำได้เนื่องจากไม่มี hardware แบบที่ Google มี จึงการันตีได้เพียง serializability ของแต่ละ transaction เท่านั้น - [source](https://www.cockroachlabs.com/blog/living-without-atomic-clocks/)

และเมื่อ timestamp ของทุกๆ transaction ในทุกๆ zone เชื่อถือได้แล้ว ทีนี้ตัวระบบก็สามารถการันตี linearlizability ได้ละครับ

ผลพลอยได้อีกอย่างคือ read transaction แบบ snapshot isolation (read without locking) ซึ่งช่วยเพิ่ม performance โดยรวมของ database 



## Conclusion

* Spanner ถือได้ว่าเป็น database ที่น่าจับตามองตัวหนึ่งในขณะนี้สำหรับคนที่ต้องการ scale ระดับ global จริงๆ (นับหัวบริษัทในโลกได้เลย) 
* จุดอ่อนเดียวของ Spanner คือต้อง sync clock ให้เป๊ะที่สุด จึงมีคนนำเสนอไอเดียที่ไม่จำเป็นต้องใช้ clock และ partition consensus แบบ Google แต่ใช้ unified consensus preprocessing แทน และนั้นคือ [FaunaDB](https://fauna.com/) ซึ่งได้พื้นฐานมาจาก [Calvin paper](http://cs.yale.edu/homes/thomson/publications/calvin-sigmod12.pdf) ในปีเดียวกัน  หลักการของ FaunaDB คือใช้ global consensus ในการประมวลทุกๆ transaction ก่อนจะเรียงทุกๆ event ของ transaction ใน global log และทำการ batch เพื่อ distribute write ไปยังทุกคน 
* Spanner เป็น CP database ตามหลักของ CAP theorem ถึงแม้จะมี 99.999% availability SLA ทั้งจาก private network ของ Google และ Paxos ก็เถอะ
* สิ่งที่ Google ทำครั้งนี้ไม่สามารถ copy กันได้ง่ายๆเหมือนที่ผ่านมา เพราะ Google มี private fibre network เป็นของตัวเอง, atomic clock และทีมงานที่ต้อง sync clock ไว้ตลอดเวลา น่าจับตาดูว่า project นี้จะไปจบที่ใดกันแน่

&nbsp;
&nbsp;
&nbsp;

#### References

* [Spanner paper](https://storage.googleapis.com/pub-tools-public-publication-data/pdf/65b514eda12d025585183a641b5a9e096a3c4be5.pdf)
* [Google cloud documentation](https://cloud.google.com/spanner/docs/concepts)
* [Google Spanner vs. Calvin: Is There a Clear Winner in the Battle for Global Consistency at Scale?](https://blog.yugabyte.com/google-spanner-vs-calvin-global-consistency-at-scale/)
* [Webinar: Spanner vs. Calvin - Comparing consensus protocols in strongly consistent database systems](https://www.youtube.com/watch?v=5CKb8hmh9KU)
* [Distributed consistency at scale: Spanner vs. Calvin](http://dbmsmusings.blogspot.com/2017/04/distributed-consistency-at-scale.html)
* [ NewSQL database systems are failing to guarantee consistency, and I blame Spanner](http://dbmsmusings.blogspot.com/2018/09/newsql-database-systems-are-failing-to.html)
* [Spanner, TrueTime & The CAP Theorem](https://storage.googleapis.com/pub-tools-public-publication-data/pdf/45855.pdf)

