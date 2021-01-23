---
title: 'Good old days, Hadoop'
description: 'Professors cant start the big data class without introducing Hadoop, and that makes sense because all big data stories have the same origin; Google'
date: '2019-01-01'
modified_date: '2019-01-01'
---

Professors can't start the big data class without introducing Hadoop, and that makes sense because all big data stories have the same origin; Google.  
 <!--more-->
Around 2000, Google had a huge scalable problem by the continuation of growing data volumes. The scale-up architecture they were using was already pushed to the limitation - the hardware didn't catch up what Google was doing. They want a new solution to solve Google web search indexes, [PageRank](https://en.wikipedia.org/wiki/PageRank). 

Finally, they found the answers and published [Google File System paper](https://static.googleusercontent.com/media/research.google.com/en//archive/gfs-sosp2003.pdf) in 2003 following by [MapReduce paper](https://research.google.com/archive/mapreduce-osdi04.pdf) in 2004, written by [Jeff Dean](https://ai.google/research/people/jeff), one of the greatest computer scientists of all time.

The main idea of these whitepapers is about distributed computing paradigm known as MapReduce. 

>In fact, distributed computing like Massively Parallel Processing (MPP) is not new at that time. there were several industries already leveraged this paradigm such as Oceanography, Earthquake, monitoring, and Space exploration. 

MapReduce did outclass other distributed computing tools at that time with advantages like easiness, generalization, and linear scaling. This looks really promising except only one thing - Google didn't share the source code !

Thankfully, around 2006, Doug Cutting and Mike Cafarella created [Apache Hadoop](https://hadoop.apache.org) based on both MapReduce and Google File System and made it fullly Open-source software (OSS).

> “The name my kid gave a stuffed yellow elephant. Short, relatively easy to spell and pronounce, meaningless, and not used elsewhere: those are my naming criteria. Kids are good at generating such.”

> -- Doug Cutting on the origin of the name Hadoop

<figure>
  <img src="/img/overview-hadoop.png" alt="overview-hadoop" title="overview-hadoop" style="max-width:90%;" />
  <figcaption>
      https://www.oreilly.com/library/view/apache-hive-essentials/9781788995092/e846ea02-6894-45c9-983a-03875076bb5b.xhtml
  </figcaption>
</figure>

Since 2006, Hadoop has become one of the fastest growing OSS in the history. Many engineers have started developing tools based on the Hadoop ecosystem since it was written in Java and run on JVM which is very popular; Hadoop tools are thriving and also have the higher rates of Enterprise adoption.

> For more history, read [this](https://medium.com/@markobonaci/the-history-of-hadoop-68984a11704) article written by Marko Bonaci or [this](http://www.balasubramanyamlanka.com/history-of-hadoop/) post.

Okay, no more history class and should learn the Hadoop then. In this article, I'm going to focus on only 2 Hadoop main components: 

1. HDFS - similiar to Google File System 
2. MapReduce

## HDFS
HDFS is a software **filesystem** written in Java sitting on top the native file system. HDFS has a master/slave architecture consisting of a single Name node and multiple Data nodes in the cluster.

The following is the HDFS architecture:

<figure>
  <img src="/img/hdfs-cluster.png" alt="hdfs-cluster" title="hdfs-cluster" style="max-width:80%;" />
  <figcaption>
      HDFS cluster
  </figcaption>
</figure>

1. Client sends the request to NameNode
2. NameNode responses back to Client allowing Client to talk with DataNode
3. Client writes/reads to that DataNode
4. DataNodes then create, update, delete or replicate the data based on the client's request


### Name node
Name node is the master node in the cluster. It can have only one name node running in the Hadoop cluster. The main jobs are:

* act as a middle man between clients who send the request to the cluster and data nodes where data is stored.
* keep metadata safe - the file system namespace.
* create the locations of data 
* send the locations of data to clients 

In another word, it is just the pointers pointing to the real data !


<figure>
  <img src="/img/hdfs-metadata.png" alt="hdfs-metadata" title="hdfs-metadata" style="max-width:60%;" />
  <figcaption>
      how metadata looks like
  </figcaption>
</figure>



<figure>
  <img src="/img/masternode.png" alt="masternode" title="masternode" style="max-width:60%;" />
  <figcaption>
      
  </figcaption>
</figure>

Step-by-step:

1. When clients want to do some operations, they send the requests to Name node. 
2. In case of reading, the Name node checks which data nodes stores the data and send the locations back to clients. If clients send write requests, the Name node is gonna determine where the data are going to be stored including the replications.
3. Clients successfully receive the locations.


At the early day of Hadoop, HDFS was seriously undergoing with a [single point of failure](https://en.wikipedia.org/wiki/Single_point_of_failure); if Name Node fails, it will stop the entire system from working. Luckily, nowadays, we can set up the high availability cluster with the secondary name node. It was introduced to prevent the cluster failure by promoting it to be the active name node whenever the first name node is out of connections. 

_Note: secondary name node is always up and running with the stand-by mode._

### Data node 
Data nodes, as its name would suggest, are locations where the data is actually stored. Data nodes are also responsible to perform block creation, deletion, and replication upon instruction from the name node.

#### Blocks
The main concept behind HDFS is that it divides a file into blocks instead of dealing with a file as a whole. This allows many features such as
distribution, replication, failure recovery, and later being the most  important part for distributed processing.

With this simple concept, it solves all the classic roadblocks found in traditonal architecture.


<figure>
  <img src="/img/hdfs-1.png" alt="hdfs-1" title="hdfs-1" style="max-width:60%;" />
  <figcaption>
      YARN
  </figcaption>
</figure>


<figure>
  <img src="/img/hdfs-2.png" alt="hdfs-2" title="hdfs-1" style="max-width:60%;" />
  <figcaption>
      YARN
  </figcaption>
</figure>


<figure>
  <img src="/img/hdfs-3.png" alt="hdfs-3" title="hdfs-3" style="max-width:60%;" />
  <figcaption>
      YARN
  </figcaption>
</figure>


<figure>
  <img src="/img/hdfs-4.png" alt="hdfs-4" title="hdfs-4" style="max-width:60%;" />
  <figcaption>
      YARN
  </figcaption>
</figure>

> Block sizes can be 64 MB, 128 MB, 256 MB, or 512 MB.

## YARN
YARN stands for Yet Another Resource Negotiator. Since we are dealing with the big cluster, orchestrator is a must have. It is responsible to negotiate with Node Managers in each DataNode, allocate the resources, distribute the jobs across nodes and also receive the client submit's request. You can think of it like another software layer sitting on top of JVM and handling every processing jobs in Hadoop, the brain part. 

<figure>
  <img src="/img/YARN.png" alt="YARN" title="YARN" style="max-width:60%;" />
  <figcaption>
      YARN
  </figcaption>
</figure>

Moving data to YARN is freaking slow. That's why YARN moves itself to target DataNodes and compute on top of that.
<figure>
  <img src="/img/anatomy-of-a-YARN-application-run.png" alt="anatomy-of-a-YARN-application-run" title="anatomy-of-a-YARN-application-run" style="max-width:60%;" />
  <figcaption>
      YARN running process - https://www.oreilly.com/library/view/hadoop-the-definitive/9781491901687/ch04.html
  </figcaption>
</figure>


## MapReduce
To process the data, Hadoop uses the technique called MapReduce which basically just send the jobs "map key and value" across nodes in the cluster. With the distributing of the HDFS, it's possible to submit the MapReduce function to achive the true [Parallelism](https://en.wikipedia.org/wiki/Parallel_computing).


<figure>
  <img src="/img/mapreduce.png" alt="mapreduce" title="mapreduce" style="max-width:80%;" />
  <figcaption>
      WordCounts Example - https://www.guru99.com/introduction-to-mapreduce.html
  </figcaption>
</figure>


<figure>
  <img src="/img/mapreduce-2.jpg" alt="mapreduce-2" title="mapreduce-2" style="max-width:100%;" />
  <figcaption>
      HDFS MapReduce - http://www.sunlab.org/teaching/cse6250/fall2018/hadoop/mapreduce-basic.html
  </figcaption>
</figure>


Hadoop seems like the perfect solution for computing massive amount of big data, however, as time progress, community has realized that there are some limitations and drawbacks:


* It's disk-based-processing - performance bottlenecks with Disk I/O.
* Batch processing is not sufficent in the business modern context.
* Java and MapReduce are verbose which kills  productivity.
* MapReduce and HDFS are tightly coupled, leading to horrible cost-effective and scalability.
* Hadoop-based MapReduce is a monolith framework which goes against the current trend of microservices: ability to plug in and plug out any tools engineers want.

______________________________________________________________________________

And community reacted to that really quick by inventing [Apache Spark](https://spark.apache.org/) to address MapReduce issues:

* Spark is in-memory computations; low latency, caching operations.
* Aside batch processing, Spark supports micro-batching which supports majority of usecases in organizations.
* It was written in Scala - less verbose and easier for data scientists to collaborate with Data engineers.
* Abstraction is better: RDD, Dataframe/Datasets and built-in transfrom/action programming model.
* Spark is able to compute on top of various technologies such as Kafka, Cassandra, S3, and even HDFS, making it fully decoupled system that is able to scale linearly and manage separately.

>When we talk about Hadoop, you should clarify what you are really talking about first, MapReduce or HDFS ? If you mean MapReduce, it is dead, and has been completely replaced by Spark. HDFS is far from death even though many new projects nowadays start with S3 or GFS instead. 

## In summary

Google always has the Google's problem - pretty unique to Google only. But, it turns out that Google tools are really useful and inspire a lot of open-source projects. Hadoop is one of that kind of projects that has started from a really small niche field and gradually moved to reach the massive audiences. Yes, it may have some flaws, but indeed, its drawbacks, lessons, and the attempt to decentralized big data tools have inspired many OSS to fill the missing puzzles in the Hadoop ecosystem. 

So now you understand why professors always start lecturing with Hadoop; we owe Hadoop for this amazingly invaluable lessons !
