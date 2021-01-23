---
title: 'Cassandra in a nutshell'
description: 'ย้อนกลับไปเมื่อปี 2007 Amazon ต้องการแก้ปัญหา relational database ของตัวเองที่ไม่สามารถ scale ได้ดั่งใจอยาก ทีมงานของ Amazon จึงตัดสินใจคิดค้น database ใหม่ขึ้นมา'
date: '2019-01-02'
modified_date: '2019-01-02'
image: '/assets/images/posts/cassandra-write.png'
---


ย้อนกลับไปเมื่อปี 2007 Amazon ต้องการแก้ปัญหา relational database ของตัวเองที่ไม่สามารถ scale ได้ดั่งใจอยาก ทีมงานของ Amazon จึงตัดสินใจคิดค้น database ใหม่ที่ไม่ใช้ consistency ของ SQL แต่นำเสนอการใช้ eventual consistency เข้ามาแทน พร้อมยังเผยแพร่ [Dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) เพื่ออธิบายหลักคิดทั้งหมดของแนวคิดนี้อีกด้วย  

ผ่านไปแค่ปีเดียวหลังจากที่ Dynamo paper ถูกเผยแพร่ Facebook ก็ดำเนินมาถึงจุดที่ Amazon เคยประสบปัญหาเช่นกัน คือต้องการ scale  Inbox Search ให้เร็วกว่าที่เป็นอยู่  Facebook จึงตัดสินใจคิดค้น Cassandra ขึ้นมาแก้ปัญหา โดยได้รับแรงบันดาลใจทั้งจาก  Dynamo และ [BigTable](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf)  

ดังนั้น Cassandra จึงมีวิธีการ distribute data ในแบบ Dynamo คือเชิดชู eventual consistency แต่กลับเลือกใช้ data model แบบ BigTable แทน

เนื่องจากเป็น database ประเภท AP ตาม CAP theorem - sacrifice consistency เพื่อ high availability - Cassandra จึงไม่เหมาะกับงานที่ต้องการ strong consistency แต่เหมาะกับงานที่ต้องการ write high throughput และ low latency สูงๆ เช่น Real time application, iot logs, หรือใช้เป็น time series database ก็ได้

> แนะนำให้อ่าน post นี้ควบคู่ไปกับ [สรุป SSTable & B-tree index](https://tharid.com/posts/sstable-b-tree-index/) และ [Hbase](https://tharid.com/posts/hbase/) ครับ



## ลักษณะเฉพาะ
* เป็น database ประเภท [column family](https://en.wikipedia.org/wiki/Column_family) (จริงๆมันคือ key value store แบบพิเศษ) ไม่เหมือน columnar storage/column oriented store ของ Redshift, Druid, หรือ BigQuery
* Scales nearly linearly (doubling the size of a cluster doubles your throughput)
* Eventual consistency ผ่าน Gossip Protocol คือต้องให้เวลาแต่ละ node คุยกันก่อนที่ data ของทุก node ใน cluster จะ sync ตรงกัน
* No ACID transactions
* ไม่มี master หรือ slave ทุกคนมีตำแหน่งเท่ากันหมดใน cluster หมดปัญหาเรื่อง Single Point of failure
* สามารถทำ replication ได้ เพื่อ redundancy และเพิ่มประสิทธิภาพในการ read
* ไม่เหมาะกับงานแบบ OLAP เนื่องจาก cql ไม่มี join
* Support secondary index
* ทำ range scan ได้ดีมาก


## คำศัพท์พื้นฐาน

เนื่องจากการอธิบาย Cassandra ในบทเดียวเป็นไปได้ยากมาก สำหรับคนที่ยังงงๆอยู่ ให้ข้ามไปอ่านวิธีการทำงานได้เลยครับ

![cassandra-token-ring](@@baseUrl@@/assets/images/posts/cassandra-token-ring.png)
*Spanner paper*


* Node: เครื่องคอมใน cluster หลายๆ nodes รวมกันเป็น cluster
* Token ring: แต่ละ node ใน cluster จะได้รับหน้าที่ในการดูแล token ไม่เหมือนกัน เรียกว่า token range
* Virtual node: ใช้เวลาที่เราต้องการแจกจ่าย token ให้แต่ละ node ดูแลมากขึ้นโดยไม่ต้องสร้าง physical node จริงๆขึ้นมาถือ
* Primary key, row key, partition key: ใช้เพื่อเป็นตัวบอกว่า row นี้จะถูกจัดเก็บที่ partition ใดใน cluster โดย Cassandra จะทำการ hash primary key ของเราให้อยู่ในรูป 128 bits value ก่อนตรวจสอบกับ token ในแต่ละ node เพื่อหาที่ที่เก็บdata เพราะฉะนั้น หาก data เรามี primary key เดียวกัน ก็จะถูกจัดเก็บอยู่ใน node เดียวกัน
* Clustering key: ใช้เพื่อกำหนดว่า column ใดจะถูกใช้ในการ sorts data ใน partiiton นั้นๆ
* Keyspace: เหมือน database ใน Mysql, Postgresql
* Column family: กลุ่ม columns มองให้คล้ายๆ table ใน mysql ก็ได้
* Compound key: ใช้เรียกเวลาเราสร้างทั้ง partition key และ clustering key
* Composition key: ใช้เรียกเวลาเราใช้หลายๆ columns มาสร้าง partition key หรือ clustering key
* Tomestone: เนื่องจาก Cassandra ใช้หลัก eventual consistency model เราจึงไม่สามารถสุ่มสี่สุ่มห้า delete data ได้ Tomestone จึงเข้ามาแก้ปัญหานี้โดยการ mark deletion ไว้ก่อน แล้วค่อยมาลบทีหลัง (คล้ายๆ vaccum ใน PostgreSQL)
* Bloom filter: probabilistic data structure ที่สามารถเดาแบบฉลาดว่า record อยู่ที่ SStable หรือไม่ ทำให้เพิ่มความเร็วในการเข้าถึง data  ข้อดีคือเป็น false positive algorithm อาจเดาว่ามีแต่จริงๆไม่มี , ทำให้การันตีว่าหาเจอแน่นอน เพราะเราแค่เสียเวลาไปดู ถ้าไม่มีก็ออกไปหาที่อื่นต่อ
* Consistent Hash Rings: เทคนิคการทำ hashing ที่ Cassandra ใข้
* Compaction: merge หลายๆ SSTables segments เข้าด้วยกันและใช้ timestamp เป็นตัวดูว่า record ใน SSTable ไหนใหม่กว่ากัน และจะ return data ที่ใหม่ที่สุดตาม timestamp (last-write-wins) 
* Seed node: ตั้งค่า node ที่เป็นผู้คุยกับ new node ที่เพิ่งมา joinใน cluster  คิดภาพเหมือนกับหัวโจ้กในแก้งค์ที่จะพาเพื่อนใหม่ทัวร์ทำความรู้จักกับ node ต่างๆเพื่อเก็บ data metadata ทั้งหมด มีประโยชน์แค่ตอนมี new node เท่านั้น
* Segment เพื่อให้เล็กลง เราเข้าใจหลักการของ divide and conquer เพื่อเวลา merge หรือ operation อื่นๆใช้เวลาน้อยลง 


## หลักการทำงาน
Cassandra ใช้หลักการทำงานที่เรียกว่า SSTables และ LSMTree ซึ่งเจ้าสองเทคนิคนี้แหละที่เป็นเคล็ดลับความเร็วในการ write ของมัน

> แนะนำให้อ่านควบคู่ไปกับ [สรุป SSTable & B-tree index](https://tharid.com/posts/sstable-b-tree-index/)

### Write

![cassandra-write](@@baseUrl@@/assets/images/posts/cassandra-write.png)
*https://docs.datastax.com/en/archived/cassandra/3.0/cassandra/dml/dmlHowDataWritten.html*


1. เลือก node ที่จะ write โดยทำการ hash primary key เพื่อหา token value ที่เหมาะสมและหา node ที่ดูแล token range นั้นๆอยู่
2. Cassandra writes data แบบ sequential write หรือ append log ไปเรื่อยๆ ทำให้ write ได้เร็ว
3. ทุกๆครั้งที่ Cassandra writes, จะทำการ commit log (Write Ahead Log/ WAL) ลงใน disk ไปพร้อมกัน โดยใน WAL นั้นจะเก็บ record ทั้งหมดไว้ก่อนที่ data จะโดน memtable flush ลง disk เพื่อป้องกัน data สูญหายก่อนทำการ flush
4. ต่อจากข้อ 3 Cassandra จะยังไม่ write ลง disk ในทันที เนื่องจากมันช้า จึงใช้การ write ลงใน Memtable (in-memory) ก่อน ซึ่งตัว memtable จะเหมือนกับ SSTable (on disk) เลย เพียงแค่ทำงานอยู่ใน memory เท่านั้น เมื่อถึงจุด threshold ที่เราตั้งไว้ จึง flush หรือการ write ลง persistent disk
5. ก่อน flush จะทำการสร้าง Index ไปในตัวโดย sort string ของ Primary key ไว้ (hash แล้วนะครับ) และนั้นคือที่มาของชื่อ SSTable
6. SSTable บน disk เป็น immutable data จะไม่มีการทำ update หรือ delete row ตรงๆเนื่องจาก operation เหล่านี้ต้องการ I/O ที่สูง
7. เพื่อแก้ปัญหา update/delete และเป็นการ save พื้นที่ใน disk ด้วยไปในตัว Cassandra จะใช้เทคนิคที่เรียกว่า Compaction - merge หลายๆ SSTable เล็กเข้าด้วยกันและใช้ timestamp เป็นตัวดูว่า record ใน SSTable ไหนใหม่กว่ากัน และจะ return SSTable ที่มี data ใหม่ที่สุดตาม timestamp (last-write-wins) 
8. หลักการลบก็คล้ายๆกัน โดยใช้ Tomestone mark row ที่จะ delete ไว้แล้วค่อยมาทำ Batch deletion ทีเดียวตอน compact segement file เลย

![cassandra-compaction](@@baseUrl@@/assets/images/posts/cassandra-compaction.png)
*https://docs.datastax.com/en/archived/cassandra/3.0/cassandra/dml/dmlHowDataMaintain.html*




### Read


![cassandra-read](@@baseUrl@@/assets/images/posts/cassandra-read.png)
*https://docs.datastax.com/en/archived/cassandra/3.0/cassandra/dml/dmlAboutReads.html*


1. Client สามารถเริ่มอ่านจาก nodeใดก็ได้ โดยตัว Cassandra เองจะเลือกให้เราตาม closest location, non-busy node หรือ random 
2. Node ที่ Client connect จะเรียกว่า  'Coordinator' หาก ​data ไม่ได้อยู่ใน Coordinator node, ตัว Coordinator จะทำการถาม node อื่นให้ผ่าน Gossip protocol ว่า node ใดกันแน่ที่มีจริงๆ
3. จะเริ่มหาจาก Memtable ก่อนเนื่องจากเข้าถึงได้เร็วสุด, ตามด้วย row cache (หากมี), Bloom filter, partition key cache และ ​SSTable ตามลำดับ 
4. เราสามารถปรับแต่ง consistency ได้ โดยตัว node จะทำการ check กับ node อื่นที่ทำ replicas ไว้เพื่อตรวจสอบ consistency ให้เรา: ANY (ใครก็ได้), ONE (one node ของ replicas ที่ดูแล key นั้นๆ), QUORUM (ส่วนใหญ่ของ replicas), LOCAL_QUORUM (ส่วนใหญ่ของ replicas ใน data center เดียวกัน), ALL (ทุก replicas)


