---
title: "อนาคตของ Star schema"
description: "สาเหตุที่ผมตัดสินใจเขียน post นี้ขึ้นมานั้น เนื่องจากผมได้มีโอกาสอ่าน Fivetran's post ซึ่งว่าด้วยเรื่องการทำ Star schema vs full denormalization จึงรู้สึกว่าการทำ star schema กับ modern data warehouse นั้นไม่จำเป็นเท่าไรแล้ว"
date: "2019-06-25"
modified_date: '2019-06-25'
image: '/assets/images/posts/star-schema.png'
---

สาเหตุที่ผมตัดสินใจเขียน post นี้ขึ้นมานั้น เนื่องจากผมได้มีโอกาสอ่าน [Fivetran's post](https://fivetran.com/blog/obt-star-schema) ซึ่งว่าด้วยเรื่องการทำ Star schema vs full denormalization จึงรู้สึกว่าการทำ star schema กับ modern data warehouse นั้นไม่จำเป็นเท่าไรแล้ว รวมทั้งยังไปนั่งไล่ดู video ทั้งจากทาง [AWS](http://www.youtube.com/watch?v=EvDicFx9StE&t=34m20s
) และ [Google](http://www.youtube.com/watch?v=ZVgt1-LfWW4&t=14m15s
) รวมไปถึง [BigQuery Documentation](https://cloud.google.com/solutions/bigquery-data-warehouse#designing_schema) และ [Vertica on Big Flat Fact Tables](https://www.vertica.com/blog/big-flat-fact-tables/) เลยอยากลองสรุปสิ่งที่ผมได้เรียนรู้มาทั้งหมดใน post เดียว


> “A data warehouse is a copy of transaction data specifically structured for query and analysis.” — Ralph Kimball


## Star schema

### จุดเริ่มต้นของ star schema
Star schema เป็นเรื่องของ analytic database หรือจะเรียกให้เท่ๆว่า data warehouse ก็ได้ครับ จุดประสงค์หลักของ data warehouse คือสร้างขึ้นมาเพื่อให้คนภายในองค์กรสามารถวิเคราะห์ data ได้อย่างมีประสิทธิภาพเพื่อความได้เปรียบทางธุรกิจ 

หากเราใช้ production database ของเราเป็น data warehouse ด้วย จะเกิดปัญหาหลักๆ 2 ข้อคือ:

1. [Third normal form](https://en.wikipedia.org/wiki/Third_normal_form) ที่นิยมใช้ใน [OLTP](https://en.wikipedia.org/wiki/Online_transaction_processing) ถูกสร้างขึ้นมาเพื่อเพิ่ม performance ของ update และ delete จึงไม่เหมาะกับการทำ data warehouse เนื่องจากกลายเป็นว่าต้อง join tables เยอะมาก 
2. ในกรณีที่ใช้ database ตัวเดียว อาจเกิดปัญหาเรื่อง performance กับ production ได้

ปัญหาของข้อ 2 นั้นแก้ง่ายมากครับ คือแยก database ออกมาอีกตัวเพื่อใช้สำหรับ analytic queries โดยเฉพาะก็เรียบร้อยแล้ว

แต่สำหรับข้อ 1 วิธีแก้ที่ทั้ง Kimball หรือ Inmon ใช้คือการคิดค้น model แบบใหม่ที่ดีกว่า 3NF และต้องให้ end users ใช้งานและเข้าใจได้ง่ายที่สุด 

เรารู้จัก model ใหม่นี้ว่า dimensional modelling หรือ star schema นั้นเอง

### หลักการของ Star schema
* ทำ denormarlization เพื่อลดการ join
* แต่ในขณะเดียวกันก็สลับกับการทำ normalization ให้พอเหมาะด้วยเพื่อ save storage และ query (ไม่จำเป็นต้อง query ทุกๆ columns แต่ใช้การ join เฉพาะเมื่อจำเป็นต้องใช้ ) และยังง่ายต่อ end users ในการใช้งาน
* ผลลัพธ์ที่ได้คือ Fact และ dimension table โดยใช้การ join ผ่าน foreign key

- แนะนำ[วิดีโอสั้นๆตัวนี้](https://www.youtube.com/watch?v=q77B-G8CA24) สำหรับคนที่ไม่เข้าใจ


> Note: หากเรา denormalize data ทั้งหมด จะทำให้มี performance ที่แย่ เนื่องจากต้อง fetch data เอา column ที่ไม่เกี่ยวมาด้วย นี่คือข้อจำกัดของ row-oriented store และเราจะมาเจาะลึกกันอีกทีในตอนหลังของ post ครับ

![star-schema](@@baseUrl@@/assets/images/posts/star-schema.png)
*star schema model*


ผมจะไม่ขอลงรายอะเอียดเชิงลึกในเรื่อง star schema เนื่องจากแต่ละคน ต่างขยันผลิตคำศัพท์ใหม่ๆเฉพาะทางออกมามากมาย เช่น hierachy / slice/ dice หรือ additive/ semi-additive เยอะถึงขั้นสามารถประกอบเป็นอาชีพและกอบโกยเงินเป็นกอบเป็นกำ ผมจึงเลือกนำเสนอ concept บางอย่างที่สำคัญ เช่น Slowly Changing Dimension และ OLAP ครับ

#### Slowly Changing Dimension
Kimball ตั้งสมมติฐานว่า data สำหรับธุรกิจนั้นมีการปรับเปลี่ยนรูปแบบช้าหรือแทบไม่เปลี่ยนเลย ตัวอย่างเช่นที่อยู่อาศัยของลูกค้า เป็นต้น จึงเสนอวิธีรับมือกับการเปลี่ยนแปลงใน data warehouse ของเรา ที่เรียกว่า [Slowly Changing Dimension](https://en.wikipedia.org/wiki/Slowly_changing_dimension) โดยแบ่งออกได้เป็นหลาย type ตามความเหมาะสม:

Type 0: ไม่มีการ update ใดๆทั้งสิ้น

Type 1: overwrite value เก่าด้วย value ใหม่ไปเลย เช่นหากลูกค้าย้ายที่อยู่หรือผู้จัดการสาขาร้านเปลี่ยนก็ทำการ update ให้เป็นอันใหม่ล่าสุด

Type 2: เป็น type ที่ได้รับความนิยมสูงสุด หลักคือสร้าง new row(surrogate key) เพื่อแสดงถึง record ใหม่  แต่ยังเก็บ record เก่าไว้ในระบบ จุดสำคัญคือต้องมี attributes start_date และ end_date เพื่อแสดงถึงสถานะของ record นั้นๆว่ายังคง active อยู่หรือไม่

สามารถอ่านหรือศึกษาเพิ่มเติมได้ที่ [Wiki](https://en.wikipedia.org/wiki/Slowly_changing_dimension#Type_0:_retain_original) (ดีเกินคาดมาก) และ [video](https://www.youtube.com/watch?v=1FZ7et0pN4c) สั้นๆนี้ครับ

#### OLAP cube
เป็นการนำ star schema/dimensional modelling มาใช้โดยการ pre-aggregated mesaures ใน fact table กับทุกๆ dimensions ทั้งหมดเพื่อเพิ่มความเร็วในการ query ผลลัพธ์ที่ได้คือ report ที่ใช้งานง่ายสำหรับ end users 

> OLAP cube จริงๆแล้วคือ materialized view กับ CUBE function ใน database ธรรมดาทั่วไปนี้แหละ

อย่างไรก็ตามแต่ ในปัจจุบันไม่ค่อยได้รับความนิยมมากนักแล้วโดยเหตุผลหลายๆปัจจัย:

1. มีการเพิ่ม  ROLLUP, CUBE function เข้ามาในภาษา SQL ทำให้ไม่จำเป็นต้องใช้ vendor locked-in tools อย่าง OLAP cube อีกต่อไป
2. database ในปัจจุบันสามารถ query ได้เร็วกว่าแต่ก่อนแล้ว จึงไม่จำเป็นต้อง pre-aggregated ทั้งหมด

แม้กระทั่งตัวของ Microsoft เองก็ทำการเปลี่ยนชื่อเป็น Multi-dimensional model และยังเสนอ Tabular model ให้ users ทั่วไปใช้แทนหากเป็นไปได้ เนื่องจากเร็วและเข้าใจได้ง่ายกว่าเยอะ

## Flat/wide table
อย่างที่ได้เกริ่นไปในตอนบทนำว่าเริ่มมี movement ในการทำ full denormalization หรือการยัดทุกอย่างไว้ใน table เดียวแทนการปั้น model แบบ star schema ในส่วนนี้จึงขออนุญาตอธิบายถึงสาเหตุที่ทำให้ modern data warehouse หลายๆเจ้าตีตัวออกห่างมากขึ้นเรื่อยๆกันครับ

### Row-oriented store 
สมัยก่อนนั้น database ส่วนใหญ่เกือบทั้งหมดทำงานแบบ row-based store จึงทำให้การเก็บ record ลงใน tuple บน block เป็นไปตาม row ของ data ตัวอย่างเช่น

```markup
# https://en.wikipedia.org/wiki/Column-oriented_DBMS

001:10,Smith,Joe,80000;
002:12,Jones,Mary,50000;
003:11,Johnson,Cathy,44000;
004:22,Jones,Bob,55000;
```

ซึ่งการเก็บแบบนี้ จะเหมาะกับ OLTP แต่ไม่เหมาะสมกับการทำ analytic queries เท่าใดนัก เช่นเราต้องการ select first_name แต่ต้องวิ่งหา 001 - 004 ทั้งหมด ซึ่งเสีย disk operation ค่อนข้างมาก ประกอบกับ database แบบ row-oriented store ถูกออกแบบมาให้ return ทั้ง row เพื่อนำไปใช้แสดงผล 

โดยเหตุผลทางข้างต้น ทำให้ Kimball เลือกที่จะไม่ full denormalization ทั้งหมด แต่เลือก normalize เท่าที่จำเป็นเพื่อลด disk operation มากที่สุดจะเป็นไปได้ แต่มันก็ยังไม่พอครับเพราะ data ในปัจจุบันเยอะขึ้นกว่าแต่ก่อนเยอะ เพราะฉะนั้นการ join/shuffle ไม่ว่าจะน้อยหรือมากไม่ได้เป็นสิ่งที่ดีกับ performance เลย นั้นคือสาเหตุที่ใน modern data warehouse ไม่ว่าจะเป็น [BigQuery](https://cloud.google.com/bigquery/), [Redshift](https://aws.amazon.com/redshift/), และ [Snowflake](https://www.snowflake.com/) ใช้ column-oriented store แทน


ก่อนจะเข้าไปเรื่องของ column-oriented store ผมขอพูดถึงสาเหตุบางส่วนที่ทำให้ column-oriented store เป็นไปได้และใช้งานได้ดีในปัจจุบันก่อนครับ

* Storage ถูกกว่าแต่ก่อนมาก ทำให้ full denormalization และการเอา join ออกจาก model จึงกลายเป็นสิ่งที่ทำได้
* มี function ดีๆของภาษา SQL ที่ช่วยให้การทำ analytic queries บน denormalization ง่ายขึ้น เช่น window functions 

### column-oriented store

เราลองมาดูฟากฝั่งของ column-oriented store กันบ้างครับ

```markup
# https://en.wikipedia.org/wiki/Column-oriented_DBMS

001:10,Smith,Joe,80000;
002:12,Jones,Mary,50000;
003:11,Johnson,Cathy,44000;
004:22,Jones,Bob,55000;
```

การเก็บ data แบบนี้ช่วยในเรื่อง Disk I/O ที่เป็น bottleneck หลักมาตลอด

* data แบบ column-oriented นั้นช่วยให้การทำ analytic queries เช่น group by, min, max มีประสิทธิภาพมากยิ่งขึ้น เนื่องจาก database นั้นเก็บ data ที่อยู่ใน column เดียวกันไว้ที่เดียวกัน ทำให้ไม่จำเป็นที่ต้องเสีย disk seek โดยใช่เหตุกับ data ที่ไม่เกี่ยวข้องกับ queries ของเรา

* นอกจากนี้เรายังสามารถทำ full denormalization ได้ เนื่องจากทุก seek เราการันตีว่าจะได้แต่ data ที่เกี่ยวข้องมาเท่านั้น หรืออีกนัยนึงคือเราทำการ pre-joined data ทั้งหมดไว้แล้ว ทำให้ไม่ต้องใช้ join อีกต่อไป (อย่าลืมว่าเมื่อนำ join มาใช้กับ big data นั้น มักจะมี time complexity ที่สูงขึ้นตามไปมาก)

* ผลพลอยได้อีกอย่างของการเก็บแบบ column-wise คือสามารถใช้ compressed algorithms ในการบีบอัด data ให้เล็กลงได้เพราะมีการเก็บ data type แบบเดียวกันไว้ใน blocks ซึ่งเพิ่มความเร็วในการ query และ save storage ได้มากโขเลยทีเดียว

และทั้งหมดนี้คือสาเหตุที่ทั้ง BigQuery, Redshift และ open-source column-oriented data storage format ทั้ง [Apache Parquet](https://parquet.apache.org/) และ [ORC](https://orc.apache.org/) ล้วนแล้วแต่ใช้ columnar storage ทั้งสิ้น

> Note:ระวังเรื่อง optimization และ tuning ให้ดี เพราะ modern data warehouse ส่วนใหญ่เป็น distributed system ที่ต้องเข้าใจ architecture บ้างในระดับหนึ่ง แต่จะไม่ขอพูดถึงในส่วนนี้เพราะแต่ละ database มีวิธีการ tune ที่แตกต่างกันและไม่ใช่ประเด็นของ post นี้_


## Star schema ตายแล้ว ?

ไม่ครับ ผมไม่ได้จะบอกว่ามันตาย ถึงแม้ว่าหลายๆบริษัทในปัจจุบันเลือกทำ flat/wide table แทน dimnesional model มากขึ้นก็ตาม ไม่ว่าจะเป็นเพราะว่าง่ายกว่าหรือต้องการ performance จาก column-oriented แบบเต็มสูบ แต่ก็ไม่ได้ทำให้ star schema ตายได้เลย กลับกันต่างหาก star schmea กลายเป็นหนึ่งใน**ทางเลือก**ของคุณต่างหาก  

ต่อไปนี้คือข้อแนะนำบางประการที่สามารถหยิบไปขบคิดและปรับใช้ตามสถานการณ์ได้ครับ

* หาก data warehouse คุณไม่ได้เป็น column-oriented store ก็ลืมเรื่อง flat/wide table ไปได้เลย และเลือก dimensinal modelling อย่าง star schema เสมอ (อาจเลือกใช้ [snowflake schema](https://en.wikipedia.org/wiki/Snowflake_schema) ก็ได้)

* ในกรณีที่คนทำ Transformation ขาดความเชี่ยวชาญในธุรกิจนั้นๆ fact และ dim table ใน star schema อาจไม่ตอบโจทย์กับสิ่งที่เราต้องการจริงๆ คำแนะนำส่วนตัวคือให้ใช้ flat/wide table ก่อนเสมอ

* ไม่จำเป็นที่จะต้องทำ flat/wide table เสมอ แต่สามารถนำ idea อย่าง slowly changing dimensions ไปประกอบใช้ควบคู่กันได้ ตัวอย่างเช่นมี attributes ที่จำเป็นต้อง update ตลอดเวลา หรือใช้เป็น table lookup ในบางกรณี เป็นต้น

*  star schema ไม่ได้ถูกใช้เพื่อแก้ปัญหาทาง technical อีกต่อไป แต่ถูกใช้สำหรับเอาใจ users และ organizations ที่มีความคุ้นเคยกับ dimensional modelling ให้ทำงานสะดวกและรวดเร็วกว่าการใช้ flat/wide table




