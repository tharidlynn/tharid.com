---
title: 'สรุป SSTable & B-tree index'
date: '2019-01-10'
modified_date: '2019-01-10'
---

SSTable vs B-Tree
<!--more-->
## SSTable 
* การ write ที่เร็วที่สุดคือการทำ sequential write (append log) เนื่องจากมี disk seek operation ของ disk ที่ต่ำที่สุด
* นี้คือเหตุผลที่ Kafka Cassandra และ HBase write เร็ว 
* แต่ปัญหาคือตอน random read จะช้ามากเพราะต้อง scan จาก 0 ไป 100 หรือมี Big O Notation ที่ O(n)
* นั้นจึงที่มาของ index เพื่อช่วยให้สามารถเข้าถึง record ที่เราต้องการได้เร็วขึ้น
* การทำ hash index ดูจะเป็นทางออกที่ดี เพราะ hash map เป็น in-memory data strcuture ที่ทุกคนมีอยู่แล้ว และมี O(1) ในกรณีที่ no collusion หากเจอก็อาจต้อง traverse ไปเรื่อยๆ แต่โดยรวมก็ดูดีเลย (hash map = k:v เก็บค่า offset ของ record )
* แต่ๆๆๆ มันมีข้อเสียคือไม่สามารถเลือก range ที่จะ read ได้ เพราะต้องจิ้มหาเองทีละตัวจนครบ กลายเป็น O(n) แทนละ
* งั้นทำไมเราไม่ลอง sort table ก่อน save ล่ะ ? และนั้นคือที่มาของชื่อ Sorted Strings Table (SSTable) 
* Google BigTable เป็นคนใช้ SStable คนแรก ต่อมาก็มีคนนำไปใช้อีกเยอะ เช่น Hbase และ Cassandra
* นอกจาก SStable แล้ว ยังมีคำว่า Memtable อีกด้วย ซึ่งคือ SStable ที่อยู่บน memory ในขณะที่ SStable คือ table ที่อยู่บน storage แล้ว
* อย่างไรก็ตาม มันคือ key value นั้นแหละ ต่อให้มันจะเก็บได้หลาย column ก็ตาม บางคนเรียกเป็น advanced key value ก็มี
* ไม่จำเป็นต้องเก็บทุกตำแหน่งใน index แต่จะเก็บ sparse hash index แทน เพื่อประหยัดพื้นที่ 
* แค่นี้เราก็สามารถเดาและ fetch range scan เฉพาะได้แล้ว
* เวลา write เราจะ write ไปที่ Memtable ก่อน ซึ่งการ sort ใน Memtable ง่ายมาก เพราะมี tree data structures อย่าง red black trees or AVL trees 
* พอ write ถึงจุดหนึ่ง เราจำเป็นต้อง flush จาก memory ลงไปที่ disk (SSTable) ไม่งั้น Ram เต็มก่อน  
* เราจะเรียกแต่ละก้อน segment ที่โดน flush ว่า segment
* เท่ากับว่าตอนนี้ on disk มี sort table segments เยอะไปหมด
* เพื่อป้องกัน disk เต็ม เราจะทำการ compact (เรียกภาษาชาวบ้านว่า merge) segments ต่างๆเข้าด้วยกัน เพื่อคงไว้แต่ latest value ของแต่ละ key เท่านั้น
* และนี้คือที่มาของคำว่า Log-structured merge-tree (LSM tree) 
* การ compact นอกจากจะช่วยให้ประหยัดพื้นที่แล้ว ยังช่วยให้ read เร็วขึ้นอีกด้วย เพราะจะทำให้ segments มีขนาดเล็กลงและลดจำนวนของ segments ที่ต้อเสียเวลาหา
* เวลา read จะหาจาก Memtable => disk segments => older segments ตามลำดับ โดยแต่ละ database ก็อาจเพิ่ม cache layer หรือ bloom filter เข้ามาให้ read ได้เร็วขึ้นตามแต่ละเจ้าไป 
* bloom filter คือ probabilistic data structure แบบหนึ่งที่ช่วยเดาด้วยว่า key record ที่เรากำลังหาอยู่ มีอยู่ใน SStable นี้หรือไม่ ซึ่งช่วยให้ read เร็วขึ้นได้มากเลย เพราะไม่ต้องไปเสียเวลากับ SStable ที่ไม่ใช่
* ข้อดีของ bloom filter คือเป็น false positive algorithm คือเดาได้เพียงแค่ Maybe หรือ No เพราะงั้นเวลาที่ bloom filter บอก No ก็คือ No จริงๆ แต่หากบอก Maybe แล้วพลาดไม่มีขึ้นมา เราก็แค่เสียเวลา read นิดเดียวเท่านั้น ซึ่ง % การบอกผิดของ bloom filter ต่ำมาก
* มี WAL log เพื่อป้องกันการ crash flush/checkpoint และทำ archive ได้ หมดปัญหาเรื่อง crash recovery 
* ข้อเสียของการ compaction คือยากต่อการคำนวณเวลาของ process ที่แน่นอน
* และยิ่ง compaction นาน ก็ส่งผลโดยตรงไปยัง read/write ของ database อีกด้วย คล้ายๆ ในกรณีของ garbage collection บน Java 
* อีกเรื่องคือ compaction หากตั้งค่าไม่ดี จะทำให้มี segments เต็มไปหมดจน disk out of space ได้ และอาจทำให้ read ช้าเพราะกลายเป็นต้อง scan หาหลาย segments
* โดยรวมแล้ว SSTable เป็นวิธีการที่ดีกับ write throughput เป็นอย่างมาก แต่ก็มีข้อเสียที่ต้องจ่ายกลับไปคือเรื่องการ update, delete และ read ในบางกรณี
* เช่น หากเรา update record บ่อยๆ เท่ากับต้องหวังพึ่ง compaction กับ latest timestmap ซึ่งอย่างที่กล่าวไปข้างต้นว่า compaction มีปัญหาเรื่อง performance บ้างในบางครั้ง
* หรือการ delete ใน SSTable ก็ใช้หลักการ mark row ที่จะ delete ไว้ และต้องรอ compaction ในครั้งหน้าเท่านั้น ในบางกณีเกิดปัญหา record ไม่โดน delete หรือ delete ไม่เกลี้ยงก็มี
* ในบางกรณี read ก็อาจเลยเถิดไปเป็น O(n) ได้ในกรณีที่มี segments เยอะๆที่ยังไม่ได้ทำ compaction
* เพราะงั้นจึงไม่ได้ตอบทุกโจทย์ขนาดนั้น เพราะอิงกับ compaction ล้วนๆ 
* แต่หากต้องการ write throughput มากจริงๆ ไม่ว่าจะเป็น time series, IOT หรือ event log data เลือก SSTable ได้ ไม่ผิดหวังครับ

## B-tree 
* พบเจอได้ใน relational database ทั่วไปเช่น MySQL หรือ PostgreSQL
* เนื่องจาก relational database มีการทำ update เยอะ ทำให้เกิด random read เยอะมาก
* เพราะงั้นเราจึงจำเป็นต้องมี index ที่สามารถทำ random access และทำ range scan ได้ดี และนั้นคือที่มาของ B-tree
* หลักการคือใช้ linked list and tree search โดยต้องสามารถ swap จาก memory และ disk ได้ตามความเหมาะสม
* B-tree data structure มันเจ๋งด้วยตัวมันอยู่แล้ว ทั้งการทำ search และ research ที่มีมานาน
* ไม่ได้เป็น binary tree แต่คือ self balanced tree (จะเรียกว่า binary tree เป็น subset ของ B-tree ก็ได้)
* มี O(log n) ทำให้สามารถทำ read ได้ดี 
* node ใน tree คือ page ใน database
* m order tree : m - 1 คือจำนวน key ใน leaf node และ internal node ที่สามารถมีได้มากที่สุดในแต่ละ node
* ในขณะที่ m คือจำนวน children ของ node แต่ละตัวที่จะมีได้
* minimum depth of trees เสมอ เพื่อป้องกัน depth ที่มาก ซึ่งจะส่งผลต่อ performance อย่างมาก
* ใช้หลักการ bottom-up คือทุกครั้งที่ insert data หาก node มีที่เต็มแล้ว จะทำการ push value ใน node ขึ้นไปชั้นก่อนหน้าเสมอ
* https://www.cs.usfca.edu/~galles/visualization/BTree.html
* นอกจาก B-tree แล้ว ยังมี tree อีกแบบที่เรียกว่า B+tree โดยอาจมีรายละเอียดปลีกย่อยต่างกันเล็กน้อย
* B+tree ทำ range queries ได้ดีมาก เนื่องจาก leaf nodes มี linked-list และ pointers ที่เชื่อมต่อ leaf nodes ตัวที่ติดกันเข้าด้วยกัน ทำให้สามารถเข้าถึง value ตัวต่อไปได้ทันที
* ในขณะที่ B-tree pointer สามารถอยู่ที่ node ใดก็ได้ B+tree pointer ต้องอยู่ที่ leaf nodes เท่านั้น (เพราะต้องใช้ pointers เชื่อม leaf nodes ตามที่ได้อธิบายไว้ในข้อข้างบน)
* เพราะงั้นเวลาเรา write ทุกครั้ง เราต้อง update b-tree ของเราด้วย พอเป็นงี้จะเกิด random read เพื่อ สร้าง index  (write on disk เป็น sequential) หาก write เยอะๆ จะเกิด bottleneck ทั้งส่วนของ queue work ใน buffer, flush checkpoint และสร้าง swap index จาก disk สู่ ram
* ตรงนี้แหละที่ต่างกับ SSTable ที่ write sequential จริงๆ ไม่มี random read ใดๆทั้งสิ้น แต่ตอน read อาจต้อง access หลายที่เฉยๆ
* การสร้างตัว B-tree index เป็นสาเหตุหนึ่งที่ทำให้ SQL write ช้าเพราะมีการ lock เกิดขึ้นเพื่อป้องกัน race condition และยังกินเนื้อที่ storage อีกด้วย ไม่ควรสร้างพร่ำเพรื่อ
* หากเป็นไปได้ ควรที่จะ index unique value อย่าง Primary key เนื่องจาก index จะได้ scan เร็วขึ้น; ไม่ต้องเสียเวลา traverse value ซ้ำ
* ข้อเสียคือ every index after inserting, deleting has to change structure thus use it only when you need. It might make your system slower.


References

* [Designing Data-Intensive Applications](https://dataintensive.net/)
* [Flavors of IO](https://medium.com/databasss/on-disk-io-part-1-flavours-of-io-8e1ace1de017)
* [Algorithms Behind Modern Storage Systems](https://queue.acm.org/detail.cfm?id=3220266)
* [B Trees and B+ Trees. How they are useful in Databases](https://www.youtube.com/watch?v=aZjYr87r1b8)
* [PostgreSQL B-Tree Index Explained](https://www.qwertee.io/blog/postgresql-b-tree-index-explained-part-1/)
* [Log Structured Merge Trees](http://www.benstopford.com/2015/02/14/log-structured-merge-trees/)