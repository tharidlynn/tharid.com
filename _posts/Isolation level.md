---
title: "Isolation level"
description: 'Isolation level มีเพื่อจัดการ 3 ปัญหาของ race conditions ของ I ใน ACID โดยสามารถตั้งค่าเพื่อให้เหมาะสมกับการใช้งานของเรา'
date: "2019-02-23"
modified_date: "2019-02-23"
image: '/assets/images/posts/random-img.jpg'

---

Isolation level มีเพื่อจัดการ 3 ปัญหาของ [race conditions](https://en.wikipedia.org/wiki/Race_condition) ของ I ใน [ACID](https://en.wikipedia.org/wiki/ACID) โดยสามารถตั้งค่าเพื่อให้เหมาะสมกับการใช้งานของเรา


> หากไม่ได้มี transaction ที่ modify อยู่บน data ที่เกี่ยวข้องกัน ปัญหาของ race conditions ก็จะไม่เกิด และอาจไม่จำเป็นต้องมาแคร์เรื่อง isolation level เลยก็ได้


## Problems

### Read dirty 

คือการอนุญาตให้ read uncommited ได้ ซึ่งเป็นสิ่งที่ไม่ดีแน่ๆเพราะเราไม่รู้ว่าที่เรา read อยู่จะโดน rollback หรือ abort หรือไม่

### Non-repeatable read  

คือการ read ครั้งแรกและครั้งสองให้ผลลัพธ์ไม่เหมือนกัน ตัวอย่างเช่น select ครั้งแรกได้ 8 ครั้งสองได้ 10 ซึ่งสร้างความสับสนกับ users อย่างมาก สาเหตุหลักๆเกิดจากในระหว่างการทำ transaction มีการ commited update row ที่เรากำลัง read อยู่จาก transaction อื่นเข้ามา ทำให้ได้ record ใหม่มาเชยชมแทนหลังจากทำการ select อีกครั้ง ตัวอย่างเช่นโอนเงินแล้วเช็คยอดทันที ปรากฎว่าเงินยังไม่เข้า แต่ query อีกทีแล้วเข้าเป็นต้น พูดง่ายๆคือไม่มี consistency ของ data 

### Phantom read 

คือการ read ครั้งแรกและครั้งสองให้ผลลัพธ์ไม่เหมือนกัน ฟังดูจะคล้ายกับ Unrepeatable read มาก แต่ต่างกันตรงที่ปัญหาของ Unrepeatable read เกิดจากคนอื่น update record ที่เรากำลัง read อยู่  ในขณะที่ Phatom read หาก select ครั้งที่สองจะ return row ใหม่ที่เราไม่เคยเจอจากครั้งแรก หรือบาง row จากครั้งแรกหายไป ซึ่งเกิดจากมีการ insert หรือ delete record จาก transaction อื่นนั้นเอง

## Isolation level

สืบเนื่องจากปัญหาข้างบนที่ได้กล่าวมา RDBMS จึงให้สิทธิ์แก่ admin ในการกำหนด level เพื่อกำจัดปัญหาข้างต้นให้สิ้นซาก อนึ่ง ยิ่งเป็น Level สูงๆ ยิ่งสามารถถอนรากถอนโคนทุกปัญหาได้ แต่อาจต้องแลกมากับการโดน locking และส่งผลต่อ concurrency performance ด้วย

> Note: SQL database แต่ละเจ้ามีวิธีการ implement ต่างกัน บทนี้ผมจะพูดอะไรที่กว้างๆและสามารถนำไปปรับใช้กับแต่ละ database ครับ_

| Isolation level   |   Dirty read   |  Non-repeatable read   |  Phantom Read|
|-------------------|----------------|------------------------|--------------|
| Read uncommitted  |  Yes           |      Yes               |      Yes     |
| Read committed    |   No           |      Yes               |  	Yes      | 
| Repeatable read   |  No            |       No           	  |      Yes     |
| Serializable      |   No           |       No               |       No     |


### Read uncommitted 

เป็น level ที่ห่วยที่สุด เนื่องจากปัญหา 3 ข้อข้างบนมาครบหมด พูดอีกนัยคือไม่ได้แก้ปัญหาใดๆทั้งสิ้น ผมยังคิด scenario ที่ต้องใช้ level นี้ในชีวิตจริงไม่ค่อยออก

###  Read committed 

เป็น default level ส่วนใหญ่ของ database  สามารถจัดการปัญหา dirty read ได้เท่านั้น 

### Repeatable read 

เป็น level ที่แก้ปัญหาทั้ง Read dirty และ Unrepeatable read โดยมักทำการ lock ไม่ให้ transaction อื่น write record ที่กำลังมีคน read อยู่ (ถือ exclusive lock เฉพาะ select data แต่ไม่ได้ range-locks ทั้งหมด) 

### Serializable 

เป็น isolation level ที่สูงที่สุด เนื่องจากสามารถจัดการปัญหาข้างต้นทั้ง 3 ปัญหาได้อย่างสิ้นซาก คร่าวๆคือการ lock write โดยใช้ [two-phase-locking protocol](https://en.wikipedia.org/wiki/Two-phase_locking) คู่กับการ lock range row ทั้งหมดที่กำลัง read

> writers don’t just block other writers; they also block readers - two-phase-locking

ปัญหาหนึ่งของการใช้ serializable คือทำให้ concurrency มี performance ที่แย่มากเนื่องจาก two-phase-locking มักเกิดปัญหา dead lock (exclusive locks รอกันไปมา จนสุดท้ายพันกันเองเหมือนงูกินหาง), lock เร็วไป รวมทั้งยัง block read เต็มๆด้วย  

และด้วยเหตุผลดังกล่าว จึงทำให้ database ส่วนใหญ่ไม่นำ serializability แท้ๆมาใช้ อย่าง Oracle ใช้เทคนิค snapshot isolation ใน serializable level แทนการ lock  

### Snapshot isolation 

ต้องบอกก่อนเลยว่า snapshot isolation ถูกคิดค้นขึ้นมาภายหลังและไม่ได้จัดอยู่ใน isolation level ตามมาตรฐานของ [ANSI](https://en.wikipedia.org/wiki/American_National_Standards_Institute)/[ISO](https://en.wikipedia.org/wiki/International_Organization_for_Standardization) SQL

Snapshot isolation เป็นเทคนิคเพื่อจัดการปัญหา Read dirty, Phantom read และ Unrepeatable read  โดยหลักการคือการ clone read ที่ commited latest version ออกมาเพื่อใช้เป็น value สำหรับ read (read point in timestamp) นั้นตลอดจนจบ transaction แทนการ read ใน data โดยตรง 

ด้วยวิธีนี้ เราจึงมั่นใจได้ว่า read committed data เท่านั้น และยังไม่มีปัญหาเรื่อง unrepeatable read อีก เพราะเรายึด value นั้นไปจนจบ transaction

> "readers never block writers, and writers never block readers" - snapshot isolation

สิ่งที่สำคัญอีกเรื่องของ snapshot isolation คือมักใช้คู่กับ [MVCC](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) หรือการเก็บ record ในรูปแบบ insert new immutable record แทนการ update value โดยตรง ด้วยเหตุนี้จึงทำให้ record มีหลาย version และ transaction id ที่ process มัน

อย่างไรก็ตาม snapshot จะมีปัญหาเวลา update เนื่องจากมีความเสี่ยงที่จะไปชนกับ transaction อื่นที่ read data แบบเดียวกับที่ transaction เรา read อยู่ แต่ update data ที่ไม่ได้ก่อให้เกิด conflict ใดๆกับ transaction เรา เราเรียกปัญหานี้ว่า write skew (ดูตัวอย่าง [Classic whites and black marbles problems](https://blogs.msdn.microsoft.com/craigfr/2007/05/16/serializable-vs-snapshot-isolation-level/)) เนื่องจาก snapshot isolation ไม่รับรู้ว่า transaction อื่นกำลังทำไรอยู่  ในขณะที่ตัวมันเองอาจกำลัง read stale data อยู่ก็ได้ (โลกภายนอกจริงๆเค้า commited และ update data ที่เรา read ไปแล้ว)เพราะงั้นจึงไม่เป็น serializability โดยแท้จริง (ไม่ได้ read value จาก transaction ก่อนหน้าจริงๆ) หลายๆคนจึงนิยมใช้ snapshot isolation สำหรับ read only เท่านั้น

> Note: Snapshot isolation ของหลายๆ database สามารถ detect lost update ได้ด้วยตัวมันเอง เช่น PostgreSQL, Oracle และ SQL server และสามารถ run คำสั่งให้ database lock update ตามใจเราได้อีกด้วย_

> Note2: ย้ำอีกทีว่า Oracle database เรียก snapshot isolation ของตัวเองว่าเป็น serializable level_


### Serializable snapshot isolation

เป็นเทคนิคใหม่สุดซึ่งใช้โดย Postgresql ในระดับ serializable level เพื่อแก้ปัญหา write skew ในเมื่อโอกาสเกิดปัญหา write snapshot isolation มันน้อย เราก็ปล่อยให้มันทำไปแหละ ถ้าเกิดอะไรก็แค่ abort ในวินาทีสุดท้ายตอน commit  

ความเจ๋งของมันคือสามารถ detect write conflict ได้ด้วยตัวมันเอง เพราะมี algorithm ที่คอย detect transactions ทั้งหมดและคอยเตือน transactions อื่นตลอดให้ระวังว่าข้อมูลนายเก่าไปแล้วนะหรือกำลังมี transactions อื่น read อยู่เหมือนกัน 

```markup
ERROR:  could not serialize access
        due to read/write dependencies
        among transactions
DETAIL:  Cancelled on identification
         as a pivot, during commit attempt.
HINT:  The transaction might succeed if retried.
```

พูดง่ายๆคือ serializable snapshot isolation ไม่ได้จมปลักอยู่กับแค่ snapshot ในโลกของมัน แต่ยังแง้มออกมามองโลกจริงด้วยว่าคนอื่นเค้าไปถึงไหนแล้ว และจะไม่ block write แต่เลือกที่จะ abort ในวินาทีสุดท้ายเท่านั้นเพื่อ maximize performace ครับ

> Serializable snapshot isolation จัดเป็นวิธีหนึ่งใน optimistic locking ในขณะที่ two-phase-locking นั้นเป็น pessimistic locking












