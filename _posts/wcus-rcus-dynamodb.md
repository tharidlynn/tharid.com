---
title: 'How to calculate WCUs/RCUs in DynamoDB'
description: "DynamoDB is a managed NoSQL database. The main selling point is that developers won't experience any operational overheads maintaining it"
date: '2018-04-26'
modified_date: '2018-04-26'
image: '/assets/images/posts/random-img.jpg'
---

[DynamoDB](https://aws.amazon.com/dynamodb/) is a managed NoSQL database. The main selling point is that developers won't experience any operational overheads maintaining it.

Nevertheless, since it's a proprietary database, the architecture is a real blackbox. AWS said that there are numerous differences from the [Dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) and every developer should strictly follows their documentations for the best practice.

One of the challeges in their documentation is to calculate and reserve the total numbers of RCUs/WCUs for tables. 

> Number of read capacity units (RCUs) – how many read requests can you send per second.<br/><br/>
> Number of write capacity units (WCUs) – how many write requests can you send per second.

## WCUs
### How to calcuate WCUs

* 1 WCU = 1kb data / second

### WCUs Formula
* x WCUs = round(item size kb / 1kb)

### Example of WCUs 
Requirement: write 5 kb data per second

* round(5kb / 1kb) = 5WCUs

## RCUs

There are 2 types of RCUs:

1. Strong consistency (read slower becuase of quorums) 
2. Eventual consistency (read faster + cheaper price)

### How to calcuate RCUs

* Strong consistency model: 1 RCU = 4kb of data / second 

* Eventual consistency model: 0.5 RCU = 4kb of data / second 

### RCUs Formula

* Formula of strong consistency: x RCUs = round(item size kb / 4kb)

* Formula of eventual consistency: x RCUs = (round(item size kb / 4kb)) / 2

### Example of RCUs 
Requirement: write 20 kb data per second

* Strong consistency: round( 20 / 4 ) = 5 RCUs

* Eventual consistency: ( round(20 / 4) ) / 2 = 2.5 RCUs

> Note: In this post, I'm  talking about reserved requests (provisioning). However, recently, there is a new pricing model, "On demand", which literally is not what I mean in this context