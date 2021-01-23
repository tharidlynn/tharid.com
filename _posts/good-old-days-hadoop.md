---
title: 'Good old days, Hadoop'
description: 'Professors cant start the big data class without introducing Hadoop, and that makes sense because all big data stories have the same origin; Google'
date: '2019-01-01'
modified_date: '2019-01-01'
image: '/assets/images/posts/hdfs-4.png'
---

Professors can't start the big data class without introducing Hadoop, and that makes sense because all big data stories have the same origin; Google.  

Around 2000, Google had a huge scalable problem by the continuation of growing data volumes. The scale-up architecture they were using was already pushed to the limitation - the hardware didn't catch up what Google was doing. They want a new solution to solve Google web search indexes, [PageRank](https://en.wikipedia.org/wiki/PageRank). 

Finally, they found the answers and published [Google File System paper](https://static.googleusercontent.com/media/research.google.com/en//archive/gfs-sosp2003.pdf) in 2003 following by [MapReduce paper](https://research.google.com/archive/mapreduce-osdi04.pdf) in 2004, written by [Jeff Dean](https://ai.google/research/people/jeff), one of the greatest computer scientists of all time.

The main idea of these whitepapers is about distributed computing paradigm known as MapReduce. 

>In fact, distributed computing like Massively Parallel Processing (MPP) is not new at that time. there were several industries already leveraged this paradigm such as Oceanography, Earthquake, monitoring, and Space exploration. 

MapReduce did outclass other distributed computing tools at that time with advantages like easiness, generalization, and linear scaling. This looks really promising except only one thing - Google didn't share the source code !

Thankfully, around 2006, Doug Cutting and Mike Cafarella created [Apache Hadoop](https://hadoop.apache.org) based on both MapReduce and Google File System and made it fullly Open-source software (OSS).

> “The name my kid gave a stuffed yellow elephant. Short, relatively easy to spell and pronounce, meaningless, and not used elsewhere: those are my naming criteria. Kids are good at generating such.”

> -- Doug Cutting on the origin of the name Hadoop

![overview-hadoop](@@baseUrl@@/assets/images/posts/overview-hadoop.png)
*https://www.oreilly.com/library/view/apache-hive-essentials/9781788995092/e846ea02-6894-45c9-983a-03875076bb5b.xhtml*


Since 2006, Hadoop has become one of the fastest growing OSS in the history. Many engineers have started developing tools based on the Hadoop ecosystem since it was written in Java and run on JVM which is very popular; Hadoop tools are thriving and also have the higher rates of Enterprise adoption.

> For more history, read [this](https://medium.com/@markobonaci/the-history-of-hadoop-68984a11704) article written by Marko Bonaci or [this](http://www.balasubramanyamlanka.com/history-of-hadoop/) post.

Okay, no more history class and should learn the Hadoop then. In this article, I'm going to focus on only 2 Hadoop main components: 

1. HDFS - similiar to Google File System 
2. MapReduce

## HDFS
HDFS is a software **filesystem** written in Java sitting on top the native file system. HDFS has a master/slave architecture consisting of a single Name node and multiple Data nodes in the cluster.

The following is the HDFS architecture:

![hdfs-cluster](@@baseUrl@@/assets/images/posts/hdfs-cluster.png)
*HDFS cluster*

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

![hdfs-metadata](@@baseUrl@@/assets/images/posts/hdfs-metadata.png)
*how metadata looks like*


![masternode](@@baseUrl@@/assets/images/posts/masternode.png)


Step-by-step:

1. When clients want to do some operations, they send the requests to Name node. 
2. In case of reading, the Name node checks which data nodes stores the data and send the locations back to clients. If clients send write requests, the Name node is gonna determine where the data are going to be stored including the replications.
3. Clients successfully receive the locations.


At the early day of Hadoop, HDFS was seriously undergoing with a [single point of failure](https://en.wikipedia.org/wiki/Single_point_of_failure); if Name Node fails, it will stop the entire system from working. Luckily, nowadays, we can set up the high availability cluster with the secondary name node. It was introduced to prevent the cluster failure by promoting it to be the active name node whenever the first name node is out of connections. 

**Note: secondary name node is always up and running with the stand-by mode.**

### Data node 
Data nodes, as its name would suggest, are locations where the data is actually stored. Data nodes are also responsible to perform block creation, deletion, and replication upon instruction from the name node.

#### Blocks
The main concept behind HDFS is that it divides a file into blocks instead of dealing with a file as a whole. This allows many features such as
distribution, replication, failure recovery, and later being the most  important part for distributed processing.

With this simple concept, it solves all the classic roadblocks found in traditonal architecture.


![hdfs-1](@@baseUrl@@/assets/images/posts/hdfs-1.png)
*YARN*

![hdfs-2](@@baseUrl@@/assets/images/posts/hdfs-2.png)
*YARN*
![hdfs-3](@@baseUrl@@/assets/images/posts/hdfs-3.png)
*YARN*
![hdfs-4](@@baseUrl@@/assets/images/posts/hdfs-4.png)
*YARN*



> Block sizes can be 64 MB, 128 MB, 256 MB, or 512 MB.

## YARN
YARN stands for Yet Another Resource Negotiator. Since we are dealing with the big cluster, orchestrator is a must have. It is responsible to negotiate with Node Managers in each DataNode, allocate the resources, distribute the jobs across nodes and also receive the client submit's request. You can think of it like another software layer sitting on top of JVM and handling every processing jobs in Hadoop, the brain part. 

![YARN](@@baseUrl@@/assets/images/posts/YARN.png)
*YARN*


Moving data to YARN is freaking slow. That's why YARN moves itself to target DataNodes and compute on top of that.

![anatomy-of-a-YARN-application-run](@@baseUrl@@/assets/images/posts/anatomy-of-a-YARN-application-run.png)
*YARN running process - https://www.oreilly.com/library/view/hadoop-the-definitive/9781491901687/ch04.html*


## MapReduce
To process the data, Hadoop uses the technique called MapReduce which basically just send the jobs "map key and value" across nodes in the cluster. With the distributing of the HDFS, it's possible to submit the MapReduce function to achive the true [Parallelism](https://en.wikipedia.org/wiki/Parallel_computing).


![mapreduce](@@baseUrl@@/assets/images/posts/mapreduce.png)
*WordCounts Example - https://www.guru99.com/introduction-to-mapreduce.html*

![mapreduce-2](@@baseUrl@@/assets/images/posts/mapreduce-2.jpg)
*HDFS MapReduce - http://www.sunlab.org/teaching/cse6250/fall2018/hadoop/mapreduce-basic.html*


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

> When we talk about Hadoop, you should clarify what you are really talking about first, MapReduce or HDFS ? If you mean MapReduce, it is dead, and has been completely replaced by Spark. HDFS is far from death even though many new projects nowadays start with S3 or GFS instead. 

## In summary

Google always has the Google's problem - pretty unique to Google only. But, it turns out that Google tools are really useful and inspire a lot of open-source projects. Hadoop is one of that kind of projects that has started from a really small niche field and gradually moved to reach the massive audiences. Yes, it may have some flaws, but indeed, its drawbacks, lessons, and the attempt to decentralized big data tools have inspired many OSS to fill the missing puzzles in the Hadoop ecosystem. 

So now you understand why professors always start lecturing with Hadoop; we owe Hadoop for this amazingly invaluable lessons !
