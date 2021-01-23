---
title: 'PACELC theorem'
description: ''
date: '2019-02-17'
modified_date: '2019-02-17'
---


[PACELC theorem](https://en.wikipedia.org/wiki/PACELC_theorem) is the theory purposing the importance of latency and consistency in the distributed systems when they are in the absence of network partitions.
 <!--more-->
> if network **P**artitions: **A**vailiability or **C**onsistency **E**lse: **L**atency or **C**onsistency 

For example, in the normal situation without network partitions, Cassandra (AP database according to CAP theorem) has to pick between consistency and low latency, which Cassandra chooses low latency and introduces the new paradigm, eventual consistency to deal with the consistency. 

However, "eventual" is quite vague and not reliable. We don't know the exact time of the syncronizing process between the nodes leading to huge risks for our data such as inconsistent, corrupt, lost and conflicting data.

In contrast to Cassandra, BigTable and HBase (both are CP database according to CAP theorem) always pick the consistency/higher latency over the low latency. High latency is common because of strong serializability such as two-phase commits, locking guaranteeing the external consistency based on ACID properties.