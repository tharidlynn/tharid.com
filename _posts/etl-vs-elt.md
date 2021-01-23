---
title: "ETL vs ELT?"
date: '2019-07-01'
modified_date: '2019-07-01'
---

ในช่วงระยะสองสามปีมานี้ คำว่า ELT เริ่มเป็นที่พูดถึงในวงการ data แทนคำว่า ETL ที่ใช้กันมานาน ครั้งแรกที่ผมได้ยินก็สงสัยเหมือนกันว่ามันดียังไง รู้แค่ว่า database หลายๆเจ้าอย่าง [Redshift](https://www.youtube.com/watch?v=EvDicFx9StE&t=36m00s), [BigQuery](http://www.youtube.com/watch?v=ZVgt1-LfWW4&t=9m20s) หรือ [Snowflake](https://docs.snowflake.net/manuals/user-guide/ecosystem-etl.html) ดูจะพร้อมหน้าพร้อมตาเชียร์กันมาก <!--more-->
วันนี้ผมจึงถือโอกาสสรุปเรื่องราวความเป็นมาทั้งหมดว่าอันไหนดีกว่ากันและเราควรจะใช้มันหรือไม่ครับ 
## Extract Transform Load

ETL ย่อมาจาก Extract Transform Load หรืออธิบายง่ายๆคือย้าย (Extract) data จากที่หนึ่งไปใส่อีกที่หนึ่ง โดยจะทำการ transform data ให้อยู่ในรูปแบบที่เหมาะสมกับ target ที่จะทำการ Load เช่น denormalization, clean หรือ mask anonymous data เป็นต้น

<figure>
<img src="/img/etl.png" alt="etl" title="etl" style="max-width:80%;" />
<figcaption>
https://docs.microsoft.com/en-us/azure/architecture/data-guide/relational-data/etl
</figcaption>
</figure>

จะว่าไปนั้น จุดกำเนิดของ ETL น่าจะมาพร้อมๆกับ data warehouse และการทำ data analytics นี้แหล่ะ คือการใช้ database ตัวเดียวเป็นทั้ง OLTP และ OLAP ส่งผลกระทบต่อ perfomance แน่ๆ เขาจึงคิดค้นวิธีการย้าย data ไปยัง database ควบคู่ไปกับ transform ให้อยู่ในรูปแบบที่ Analysts สามารถใช้งานได้ง่ายขึ้น เช่น Kimball Dimensional Modelling แทน

และเนื่องจากบริษัทส่วนใหญ่ใช้บริการของ Microsoft, หรือ Oracle อยู่แล้ว Vendor จึงมักขาย tools ที่ทำ ETL แบบ drag and drop ง่ายๆพร้อมกันไปเลย อย่าง [Microsoft SSIS](https://docs.microsoft.com/en-us/sql/integration-services/sql-server-integration-services?view=sql-server-2017) เป็นต้น

ตัวอย่าง tools สำเร็จรูปเช่น [Informatica](https://www.informatica.com/), [Matillion](https://www.matillion.com), [Alooma](https://www.alooma.com/), หรือ [Talend](https://www.talend.com/)

## Extract Load Transform
ELT คือการ transform ในตัว database เองเลยหลังจาก Load แทนที่จะ transform ข้างนอกก่อนจะ Load เข้ามาใน target

<figure>
<img src="/img/elt.jpg" alt="elt" title="elt" style="max-width:100%;" />
<figcaption>
https://www.matillion.com/events/etl-vs-elt-whats-big-difference/
</figcaption>
</figure>


เหตุผลสำคัญที่ทำให้ ELT paradigm เป็นที่สนใจมากในขณะนี้ มีด้วยกันหลักๆ 2 ประการ

1. เนื่องจาก big data ที่หลั่งไหลเข้ามามากขึ้น จึงเริ่มมีการใช้ data lake เข้ามาเสริม ทำให้ architecture แบบเดิมๆอย่างการใช้ data warehouse เพียงอย่างเดียวไม่ตอบโจทย์และจำเป็นต้องคิดวิธีใหม่ๆที่เหมาะสมแทน
2. Hardware และ Network บน cloud ดีขึ้นอย่างมาก และยังสามารถ spawn transient nodes เข้ามาช่วยเฉพาะกิจได้ด้วย ทำให้ data warehouse บน cloud ทรงพลังมากๆ

ทีนี้ หากเรายังคงใช้ ETL อยู่จะเกิดเหตุการณ์ดังต่อไปนี้

* ช้า เพราะมี data เยอะกว่าแต่ก่อน จึงเสียเวลาไปกับการทำ transform มากๆ
* พอเรามี data source มากขึ้น ก็เท่ากับ infrastructure และ pipeline ที่ซับซ้อนมากขึ้นตามไปด้วย ส่งผลต่อความยากในการดูแลเป็นอย่างมาก 
* Scientists และ Analysts มักต้องการ raw data มากกว่า ซึ่ง ETL ให้ไม่ได้
* มักมี data model หรือ tool ที่ผูกติดกับ vendor นั้นๆ ทำให้ยากต่อการ integrate เข้ากับ tool อื่นๆของบริษัท
* ทำลายหลัก single source of truth ของ data lake เพราะอาจเกิดปัญหา data out of sync กับ data warehouse ได้

ลองมาเทียบในมองมุมของ ELT ดู

* เร็ว เพราะเราไม่ได้ทำ transform ก่อน load อีกต่อไป และการ transform ก็เร็วกว่าด้วย เพราะเรา transform ในตัว data warehouse เลย เข้าหลักการที่ว่า "Moving data to compute not compute to data"
* ลดความซับซ้อนของ pipelines และผลักภาระทั้งหมดไปยัง data scientists/analysts แต่ละคน แทน global pipeline
* คาดหวังว่าทุกคนสามารถเขียน SQL เพื่อทำ transform ได้ด้วยตัวเอง
* data models และ tools ที่อิสระกว่า + ปัญหาเรื่อง vendor lock-in ที่น้อยกว่ามาก
* Data lake และ modern data warehouse มี consistency ที่ตรงกันเสมอ หรือมอง data lake และ data warehouse ให้เป็นเรื่องเดียวกัน ซึ่งทุกวันนี้เป็นไปได้แล้วกับเทคนิค "Separating compute and storage"

> "Separating compute and storage" คือแยกการเก็บ data ออกจากการ compute ตัวอย่างเช่น HDFS หรือ AWS S3 เป็น storage และใช้ Presto หรือ SparkSQL เป็น compute  ซึ่ง modern data warehouse หลายๆตัวทำตัวเองเป็นส่วนของ compute เท่านั้น และใช้การสร้าง metadata เพื่อเป็น pointers (schema on read) ระบุไปยัง storage จริงๆแทน ตัวอย่างเช่น BigQuery, Redshift Spectrum และ Snowflake เป็นต้น


เราจะเห็นการเกิดของ ELT stack ใหม่เยอะมากๆ ตัวอย่างเช่นใช้ [StitchData](https://www.stitchdata.com/) (ล่าสุดโดน Talend ซื้อไปแล้ว) หรือ [Fivetran](https://fivetran.com/) ทำ EL และ [dbt](https://www.getdbt.com/) ทำ transform ใน data warehouse อย่าง BigQuery, Redshift  และ Snowflake เป็นต้น

<div class="youtube-video">
{{< youtube id="mcgeYd1WhaM" autoplay="false" >}}
</div>

โดยสรุปแล้ว จะเห็นเลยว่าฟาก ETL ให้ความสำคัญกับ tools และพิธีรีตองต่างๆมากกว่า ในขณะที่ ELT จะให้สิทธิทั้งหมดในการทำ analytics กับ users เต็ม 100 %

อย่างไรก็ตาม ELT ก็มีข้อเสียครับ คืออาจ expose sensitive data ที่ violence rules บางอย่างให้กับ analysts ได้ เนื่องจากเรา Load raw data เข้ามาโดยปราศจากการทำ masking sensitive data ดังนั้นหลายๆคนจึงแก้โดยการทำ ETLT แทนครับ
