---
title: 'ก้าวต่อไปกับ Amazon Aurora'
description: 'ย้อนกลับไปเมื่อปี 2007 Amazon ต้องการแก้ปัญหาในบริษัทที่มีปัญหากับ relational database แบบเดิมๆ เนื่องจากการ scale write ของ SQL ทำได้ลำบาก'
date: '2019-04-02'
modified_date: '2019-04-02'
image: '/assets/images/posts/aurora-mysql.webp'
---


ย้อนกลับไปเมื่อปี 2007 Amazon ต้องการแก้ปัญหาในบริษัทที่มีปัญหากับ relational database แบบเดิมๆ เนื่องจากการ scale write ของ SQL ทำได้ลำบาก จึงเริ่มวิจัย data model แบบใหม่ที่สามารถแก้ปัญหาเรื่องนี้ได้ สิ่งที่ Amazon ค้นพบคือ:

1. join เป็น operation ที่ expensive มาก
2. Developers แทบไม่ใช่ Join เลย 
3. Denormalization ช่วยเพิ่ม productivity ของ users และ performace ของ database

หากเราลดการ join ลง ปัญหา scale ก็น่าจะจบ แต่ไม่มีอะไรในโลกที่ได้มาฟรีๆ สิ่งที่ Amazon ต้องจ่ายคือการละทิ้ง consistency ของ database ไป

Amazon จึงตัดสินใจไม่รับ consistency ของ relational model แล้วนำเสนอ [eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency) เข้ามาแทน และยังได้เผยแพร่ [Dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) ซึ่งภายหลังกลายเป็นแรงบันดาลใจสำคัญของ NoSQL ยักษ์ใหญ่อย่าง [Cassandra](http://cassandra.apache.org/) 

เราเรียก semantics ที่ Amazon เลือกแบบง่ายๆนี้ว่า [BASE](https://en.wikipedia.org/wiki/Eventual_consistency) หรือ Basically available, soft state, eventual consistency ซึ่งตรงข้ามกับ [ACID](https://en.wikipedia.org/wiki/ACID) ใน traditional database โดยสิ้นเชิง

> Strong consistency ไม่จำเป็นสำหรับงานบางประเภท ตัวอย่างเช่นยอด like บน social media หรือภาพ profile picture ซึ่งไม่มีความจำเป็นต้องให้คนทั้งโลกเห็นยอด like เหมือนกัน ณ​ เวลาใดเวลาหนึ่ง



> ในระยะหลังมานี้  NoSQL และ SQL ต่างเรียนรู้ซึ่งกันและกันและนำข้อดีของอีกฝ่ายมาปรับใช้ เช่น SQL สามารถเก็บ unstructured data อย่าง JSON ได้ หรือ DynamoDB ที่มี transaction ให้ใช้งานได้ เป็นต้น

จากวันนั้นจนถึงวันนี้ SQL และ NoSQL ต่างมีจุดประสงค์การใช้งานที่แตกต่างกัน อย่างไรก็ตามแต่ การที่ NoSQL ไม่มี concept อย่าง ACID transaction และภาษาอย่าง SQL ก็สร้างความลำบากใจให้กับ users เป็นอย่างมาก เห็นได้ชัดจากบริการ AWS ที่ได้รับเสียงเรียกร้องในความต้องการของ database ที่เป็น relational database แต่มี performance ที่ดีกว่าแบบเก่ามาโดยตลอด แบบนี้ยิ่งตอกย้ำความคิดในการสร้าง database ใหม่ที่ไม่ใช่ Dynamo เข้าไปอีก   

โจทย์ของ Amazon ในครั้งนี้จึงมีเงื่อนไขหลักๆเพียงแค่ 2 ข้อ: 

1. ต้องเป็น SQL ที่ลูกค้า AWS คุ้นเคยดี
2. เป็น distributed database ที่มี performance ดีพอกับงาน scale

และนั้นคือที่มาของ [Amazon Aurora](https://aws.amazon.com/rds/aurora) ครับ

ในบทนี้ ผมจึงขอสรุปวิธีคิดใหม่และลักษณะเฉพาะที่น่าสนใจกัน

## Seperating compute and storage
Core idea หลักของ Aurora คือการ seperating compute and storage ออกจากกัน ซึ่งเป็น trend ที่ได้รับความนิยมอย่างมากในช่วงหลัง ตัวอย่างเช่น การใช้ HDFS เป็น storage และ Apache Spark เป็น compute, microservice architecture ต่างๆ, CQRS event sourcing, หรือแม้กระทั่ง modern data warehouse อย่าง Snowflake ที่ใช้ S3 เป็น storage เป็นต้น

เหตุผลหลักเนื่องจากการผูกเป็นก้อนใหญ่ๆแบบ monolith นั้นยากต่อการ scale เพราะเวลา scale ต้อง scale  ทั้งก้อนใหญ่ๆ และต่อให้ scale ได้ก็มี cost-effective ที่แย่ ตัวอย่างเช่น เพิ่ม node มาเติมใน Hadoop cluster เพียงเพราะเนื้อที่ไม่พอ แต่กลายเป็นว่าเราต้องซื้อ compute ที่เราไม่จำเป็นตาม MapReduce ด้วย และยังช่วยให้เวลาระบบล่ม ไม่ล่มทั้งหมด ง่ายต่อการ recover มากขึ้น

![aurora-monolith](@@baseUrl@@/assets/images/posts/aurora-monolith.png)
*https://www.allthingsdistributed.com/2019/03/Amazon-Aurora-design-cloud-native-relational-database.html*


Amazon Aurora จึงคิดใหม่ทำใหม่ โดยเก็บ compute จาก MySQL และ PostgreSQL ไว้  แต่ทำการสร้าง shared disk distributed storage ขึ้นมาใหม่แทนที่ storage เก่าของ MySQL และ PostgreSQL 

พอเป็นแบบนี้ query layer หรือ ส่วนของ compute ก็จะยังคงอยู่ ทำให้ยังสามารถใช้ภาษา SQL ได้ และที่สำคัญยัง compatible กับ MySQL และ PostgreSQL ด้วย เรียกได้ว่ายิงปืนนัดเดียวได้นกสองตัวเลย

ประโยชน์ที่เห็นได้ชัดจากวิธีนี้คือสามารถ spin new instance ของ Aurora ได้ง่าย เพียงแค่ launch new SQL แล้วให้ point ไปที่ Aurora storage ก็จบ

## Redo log

หนึ่งในเหตุผลที่ SQL database อย่าง MySQL และ PostgreSQL มีปัญหาในการ scale เนื่องจากการ write ของ SQL นั้นต้องแคร์หลายอย่าง ทั้งการสร้าง Index, WAL (Write Ahead Log) เป็นต้น  อย่างเรื่อง WAL ที่สร้างขึ้นมาเพื่อ durability ใน ACID  แค่เพียงส่วนนี้ส่วนเดียว ก็ทำให้ DBA หลายคนปวดหัวตายละ


![aurora-mysql](@@baseUrl@@/assets/images/posts/aurora-mysql.webp)
*จากภาพ จะเห็นเลยว่า write 1 ครั้ง ต้องทำหลายอย่างมาก - https://blog.acolyer.org/2019/03/25/amazon-aurora-design-considerations-for-high-throughput-cloud-native-relational-databases*


ผมขอยกตัวอย่างเช่น PostgreSQL ละกันครับ

PostgreSQL จะใช้ Write Ahead Log (WAL) เพื่อ write ลงใน WAL buffer และทุกๆ commit จึง write ลง WAL disk ควบคู่ไปกับการ write ลง page memory เหตุผลคือความเร็วจาก sequential write และยังสามารถนำไปใช้ recovery ภายหลังได้

เมื่อถึงจุดๆหนึ่งตามที่เราตั้งค่า checkpoints ใน configs  ตัวระบบจะทำการ fsync หรือ flush buffer ใน memory ลงไปยัง durable storage และ archive log ใน WAL disk พร้อมทั้ง mark checkpoint ใหม่

Architecture ที่ผมว่ามาทั้งหมดใช้งานได้ดีเลยครับ แต่เมื่อต้องเจอกับการ write หนักๆ มักจะเกิดอาการที่เรียกว่า write amplification ขึ้นมา สาเหตุมีดังต่อไปนี้:

1. สังเกตเห็นว่า WAL log + write durable storage/blocks มี operation ในการ write เยอะมาก อย่าง MySQL ที่จำเป็นต้อง write ทั้ง tablespaces, redo log, double-write buffer, และ binary log
2. มักทำ full write ทั้ง page เพื่อป้องกันการ crash ระหว่างทาง write ของ buffer ไปยัง durable storage ซึ่งอาจก่อให้เกิด partial write ได้ ซึ่งกระบวนการ full write ใช้ resources ค่อนข้างเยอะ
3. เมื่อเรา write เยอะมากถึงจุดหนึ่ง จะมี queued work ต่อคิวรอยาวไปเรื่อยๆ ส่งผลให้ในกรณีที่ write/second สูง ระบบจะช้าลงเพราะ record ต้องมาต่อแถวยาวเหยียด
4. Insert/update/delete ทำ random write ค่อนข้างเยอะ เพราะต้องวิ่งหา pages/blocks ที่ใช่ รวมไปถึงมี disk seek ที่สูงมาก

ทีนี้มาดูวิธีที่ Aurora แก้ปัญหาเหล่านี้กัน

1. เริ่มจากยุบทุกอย่างให้เหลืออยู่ในรูปแบบของ redo log stream (WAL) แทน ซึ่งลดการ write ได้มหาศาล
2. พอเป็นแบบนี้ Aurora จึงพึ่งบริการ buffer และ page cache เยอะ เพื่อสร้าง page ที่จำเป็นมารอใน in-memory


## Storage

เนื่องจาก Amazon พยายามลดภาระของ compute ให้มีหน้าที่แค่เป็น query layer เพียงอย่างเดียว พอเป็นแบบนี้แล้วภาระทั้งหมดทั้งการทำ replication, durability และ consistency จึงมาตกอยู่ที่ Aurora storage ทั้งหมด 

### Replication
Aurora ใช้ asynchronous replications และ  majority quorum-based voting protocol เพื่อประสิทธิภาพความเร็วในการ write

เป้าหมายของ Aurora คือต้อง tolerate การล่มของทั้ง Availability Zone + 1 node ได้ดังที่เห็นในภาพ

![aurora-quorum](@@baseUrl@@/assets/images/posts/aurora-quorum.png)

จะเห็นได้ว่าในกรณีที่ใช้ 1 replica/zone  และ quorum write ที่ 2/3 หากมี zone ใด zone หนึ่งล่มไป + 1 extra node เท่ากับ Aurora ไม่สามารถการันตี availability และ durability ได้เลย

แต่หากปรับเปลี่ยนมาเป็น 2 replicas/zone และ quorum write ที่ 4/6 แทน ทีนี้ทุกครั้งที่เรา commit เราก็มั่นใจได้เลยว่า data เราอยู่ขั้นต่ำ 2 zone แล้ว 

> ในกรณีที่ Aurora replicas ล่ม หลังจาก restart ใหม่แล้วสามารถทำ recovery ได้เร็วมาก เพราะใช้ Peer-to-peer gossip protocol และ quorum read
ที่ถามหา Log Sequence Number ของ log ล่าสุดและที่เราขาดหายไป

อีกหนึ่งอย่างที่ผมรู้สึกว่า Aurora ทำได้ดีเลยคือการไม่ใช่ quorum read ในการ read data เนื่องจาก quorum read มี cost ที่สูงและก่อให้เกิด latency  Amazon จึงเลือกใช้ไอเดียที่เรียกว่า state ในการ track write ที่สำเร็จ และเก็บ state นั้นๆไว้เพื่อให้ read เข้าถึงได้ทันที และ ยังฉลาดพอที่จะ read จาก storage ที่มี latency ต่ำที่สุดได้อีกด้วย

### Durability
ตัวของ Aurora storage นั้นมัน durable โดยกำเนิดอยู่แล้ว เพราะทุกครั้งที่ commit log จะถูกส่งไปยัง Aurora storage ทันที แถมยังขยันทำ backup logs เราไปยัง Amazon S3 อีกด้วย มันยอดเยี่ยมจริงๆ !


![aurora-az](@@baseUrl@@/assets/images/posts/aurora-az.png)
*amazon aurora paper - https://www.allthingsdistributed.com/files/p1041-verbitski.pdf*


## Multi-master write
ผมคิดว่านี้คือจุดอ่อนที่สุดของ Aurora ละ

Aurora ไม่ได้ใช้ consensus เหมือนกับที่ Google Spanner เลือกใช้ แต่ใช้หลัก last write win strategy (Last writers win (highest timestamp)) ซึ่งเป็น optimistic conflict resolution ที่ใช้มาแก้ปัญหา conflict จาก multi-writers หรือ concurrent updates โดยเฉพาะ

> Amazon ใช้กลยุทธ์นี้มาตั้งแต่ครั้ง DynamoDB แล้ว เหตุผลเพื่อต้องการ latency ที่ต่ำ แต่ราคาที่ต้องจ่ายคือ inconsistent ของ data แบบเต็มๆ 

ตรงนี้แหละครับที่ก่อให้ data ไม่มี serializability เลยแม้แต่นิดเดียว และไม่เหมาะกับงานที่ต้องการ consistency แบบจริงจัง ดังนั้นข้อแนะนำส่วนตัวของผมคือ หากต้องการจะ scale write จริงๆ ควรใช้การ scaling up ไปก่อนครับ


## Conclusion

* Write เร็วกว่า SQL ทั่วไปเยอะ
* ใช้การ asynchronous replications ทำให้มี latency ที่ต่ำ
* Durability by default
* Multi-master ไม่ได้ดี และควรใช้การ scale แบบ vertical ไปก่อน แต่การ write transactions ได้ high throughput ดีขนาดนี้ถือว่าน่าสนใจและเพียงพอต่อการใช้งานของบริษัททั่วไป
* Master อาจต้องใช้เวลา fail over สักหน่อย แต่ใช้เวลาน้อยมาก
* ยังมี replication lags อยู่สำหรับ read replicas  แต่ก็เข้าใจว่าเป็นเรื่องปกติของ SQL ธรรมดา โดย AWS อ้างไว้ว่ามี lags ที่ต่ำกว่า 10ms เสียอีก


#### References

* [Amazon Aurora ascendant: How we designed a cloud-native relational database](https://www.allthingsdistributed.com/2019/03/Amazon-Aurora-design-cloud-native-relational-database.html)
* [Amazon Aurora paper](https://www.allthingsdistributed.com/files/p1041-verbitski.pdf)
* [On Avoiding Distributed Consensus for I/Os, Commits, and Membership Changes](https://dl.acm.org/citation.cfm?id=3183713.3196937)
* [Amazon Aurora: design considerations for high throughput cloud-native relational databases](https://blog.acolyer.org/2019/03/25/amazon-aurora-design-considerations-for-high-throughput-cloud-native-relational-databases/)
* [Deep Dive on Amazon Aurora with PostgreSQL](https://www.youtube.com/watch?v=3PshvYmTv9M)
* [Deep Dive on Amazon Aurora with MySQL](https://www.youtube.com/watch?v=U42mC_iKSBg)
* [Amazon Aurora Under the Hood: Quorum Reads and Mutating State](https://aws.amazon.com/blogs/database/amazon-aurora-under-the-hood-quorum-reads-and-mutating-state/)



