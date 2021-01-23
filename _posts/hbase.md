---
title: 'HBase'
description: 'HBase เป็น database ที่สร้างโดยอ้างอิงจาก BigTable paper ของ Google (ในความจริงแล้ว Google contribute และช่วย HBase engineers เยอะมาก)'
date: '2019-01-01'
modified_date: '2019-01-01'
image: '/assets/images/posts/hbase-architecture.png'
---

HBase เป็น database ที่สร้างโดยอ้างอิงจาก [BigTable paper](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf
) ของ Google (ในความจริงแล้ว Google contribute และช่วย HBase engineers เยอะมาก) จึงไม่ต้องแปลกใจที่ในปัจจุบัน เราสามารถใช้ HBase API ในการทำงานร่วมกับ [Google Cloud BigTable](https://cloud.google.com/bigtable) ได้สบายๆ 

และเนื่องจากทั้ง Cassandra และ HBase ต่างได้รับอิทธิพลมาจาก BigTable เหมือนกัน จึงทำให้มีลักษณะบางอย่างคล้ายคลึงกันเช่น เป็น model แบบ [column family](https://en.wikipedia.org/wiki/Column_family) เป็นต้น แต่ก็มีสิ่งที่แตกต่างกันอย่างเห็นได้ชัด เช่น HBase เป็น CP ใน CAP theorem แต่ Cassandra นั้นกลับเป็น AP แทน

> แนะนำให้อ่าน post นี้ควบคู่ไปกับ [สรุป SSTable & B-tree index](https://tharid.com/posts/sstable-b-tree-index/) และ [Cassandra in a nutshell](https://tharid.com/posts/cassandra-in-a-nutshell/) ครับ

## ลักษณะเฉพาะของ HBase
* เป็น Column family database ( key-value แบบพิเศษ)
* CP ใน CAP theorem 
* เก็บข้อมูลอยู่บน HDFS 
* สามารถทำ random read/write ได้เร็วกว่า HDFS เนื่องจากลดขนาด block sizes และ index 
* data ในแต่ละ cell มี timestamp และ version
* ทำ replications โดยนำความสามารถของ HDFS มาใช้

## คำศัพท์ในโลกของ HBase

![hbase-architecture](@@baseUrl@@/assets/images/posts/hbase-architecture.png)
*https://mapr.com/blog/in-depth-look-hbase-architecture/*


* Namespace: กลุ่มของ tables หลายๆอัน เหมือน database ใน MySQL
* Column family: กลุ่ม columns หลายๆแถว หรือ table
* HMaster: เป็นคนกลางเชื่อมระหว่าง client กับ server เพื่อส่ง metadata ให้กับ client และยังทำหน้าที่คุยกับ Zookeeper 
> Note: ควรมี stanby HMaster ให้ failover เนื่องจากอาจเกิดปัญหา HMaster crash ได้
* Region server: คอยจัดการ data ที่เข้ามา
* Region: partition (data in some range of rows) หรือ column family/table
* Zookeeper: เป็นเหมือนผู้ช่วยของ HMaster ในการจัดการ configuration ของทุก node, เก็บตำแหน่งของ node ใน meta table, track state และยัง monitor region server ต่างๆให้ทำงานร่วมกันได้
* Memstore: data ที่เก็บอยู่ใน memory ของ Region server
* HFile: data ที่ถูก flush แล้วจาก memstore
* Bloom filter: probabilistic data structure ที่สามารถเดาแบบฉลาดว่า row อยู่ที่ block ใดของ HFile ช่วยเพิ่มความเร็วในการ read

## วิธีการทำงานของ HBase


### General
1. HMaster จะตรวจสอบ metadata กับ Zookeeper ให้เพื่อชี้ตำแหน่ง region ที่ write/read ต้องการไป 
2. Client ฉลาดพอที่จะเก็บ cache ของ metadata ไว้ ในกรณีที่ไม่มีตำแหน่งค่อยไปขอจาก HMaster เช่นการ create region เป็นต้น
3. HBase จะใช้ row key ในการเลือกว่าจะ distribute record ไปไว้ที่ region ใด โดยเราสามารถเลือกได้ว่าจะให้ 1.salting (add random prefix) 2. Hashing 3. monotonically increasing rowkeys นี้คือกุญแจสำคัญเลยในการกระจาย node ไม่ให้เกิด hotspotting 
4. Region server มี WAL (write ahead log) เพื่อ append commit log ทั้งหมดของ data ที่ยังไม่ได้ write ลงใน persistent disk เพื่อกรณีฉุกเฉินที่ node ล่ม จะได้ recovery กลับมาได้
5. เหตุผลที่ต้องมี WAL เนื่องจาก data จะถูก write ลงใน memstore (in-memory) ก่อน เพื่อความเร็วในการ write 
6. Memstore sort key-value ใน column family รอไว้อยู่แล้ว
7. เมื่อถึงจุด threshold ที่เราตั้งไว้ memstore จะถูก flush หรือ  write ลง disk แบบ sequential ทำให้เร็วมากเนื่องจาก disk ไม่จำเป็นต้องหมุนอะไรเยอะเลย เราเรียกว่า Memstore ที่อยู่ใน disk ว่า HFile (SSTable ประเภทหนึ่ง)
8. HFile จะจัดทำ multi-layered index แบบ B+tree ไว้เพื่อให้เข้าถึง data ได้เร็ว รวมไปถึงยังมี Blockcache เพื่อเก็บ data cache ที่ read บ่อยๆอีกด้วย
9. อย่าลืมว่าการ write ทุกอย่างจะผ่าน Primary Region เท่านั้น replications ของ HBase มีหน้าที่ในการ read เท่านั้น 

### Merge
* Scenario โดยทั่วไปคือ region server จะมี HFile ที่มากองรวมกันเยอะมาก 
* HBase จึงใช้วิธี Compaction หรือการรวม HFile หลายๆอันเข้าด้วยกัน โดยใช้ merge sort algorithm แต่ compaction มี I/O ที่สูง จึงจำเป็นต้องเลือกใช้ให้ถูกเวลาด้วย


### Rebalance
เราจะทำการ rebalance ในกรณีที่:

1. Region servers พังและจำเป็นต้องหา node ใหม่เพื่อให้สามารถกลับมา read/write ใหม่ได้
2. เมื่อบาง Region servers ประสบปัญหา hot spot และไม่ scale evenly เท่าที่ควร

หลักการคือ node ใหม่จะทำการ remote read จากสิ่งที่ RegionServer เก่ามีให้มากที่สุด เช่นจาก WAL, HFile หรือในกรณีต้องการ Scale out ก็จะทำการแบ่ง partition range บางส่วนย้ายไปที่ Region server ใหม่แทน

## ความแตกต่างของ HBase และ Google cloud BigTable 


| HBase         | Big table     |
| ------------- |:-------------:|
| Region     | Tablet |
| RegionServer      | Tablet server     |
| Flush | Minor compaction      |
| Minor compaction     | Merging compaction |
| Major compaction      | Major compaction      |
| Write ahead log | Commit log      | 
| HDFS     | GFS |
| Hadoop MapReduce      | MapReduce     |
| MemStore | Memtable      | 
| HFile     | SSTable |
| Zookeeper      | Chubby      |
| Flush | are neat      | 

ปัญหาหนึ่งของ Hadoop คือการที่ compute layer อย่าง MapReduce และ data layer อย่าง HDFS อยู่ติดกันเพราะ data locality performance เร็วกว่า ซึ่งก็เป็นดาบสองคมในเวลาเดียวกัน เพราะทำให้การ scale นั้น**แพง**กว่ามาก 

ไม่นานหลังจากที่ปล่อย BigTable paper ออกมา, Google จึงตัดสินใจคิดค้น file-system แบบใหม่ขึ้นมาใช้แทน GFS (ต้นฉบับของ HDFS) เพื่อให้การ scale ทำได้ง่ายขึ้น นั้นจึงเป็นที่มาของ [Colossus](https://cloud.google.com/files/storage_architecture_and_challenges.pdf) (Google cloud storage built on top of Colossus)  

ดังนั้น architecture ของ Google cloud BigTable จะแตกต่างกับ BigTable เดิมๆของ Google ตรงที่ compute node ของ Google cloud BigTable จะใช้หลักการ pointers ไปยัง Colossus ด้วยวิธีนี้การ rebalance จึงทำได้ง่ายกว่าแต่เดิมเยอะ

![bigtable](@@baseUrl@@/assets/images/posts/bigtable.png)
*processing สามารถ rebalance ด้วยการ เปลี่ยน pointers แทนการ move data แบบเดิมๆ*


