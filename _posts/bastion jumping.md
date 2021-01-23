---
title: "Bastion jumping on aws"
description: 'In the production environment, database security should always be the top priority. Deploying any database on a public subnet is totally insecured and could be attacked by the hackers.'
date: '2019-03-15'
modified_date: '2019-03-15'
image: '/assets/images/posts/private-rds.jpg'
---

In the production environment, database security should always be the top priority. Deploying any database on a public subnet is totally insecured and could be attacked by the hackers.


![public-rds](@@baseUrl@@/assets/images/posts/public-rds.jpg)
*Bad practice, seen only in development.*


In VPC, instances are able to communicate to each other by default because of route table target `<local>`. Adding a bastion host acting as the proxy between client and database  and also moving databases from the public to private subnet make the environment invincible.


![private-rds](@@baseUrl@@/assets/images/posts/private-rds.jpg)



Now, I am going to give you 2 scenarios which have some different settings: EC2 and RDS.

## EC2 in the private subnet
To access EC2 sitting in the private subnet, the bastion instance has to allow access TCP port 22 from client's ip , and the private EC2 instance has to allow access TCP port 22 from bastion's ip.

Then, configure `~/.ssh/config` in a client machine.

```markup
Host bastion
   Hostname 13.228.248.250
   IdentityFile ~/test_key.pem
   User ubuntu
   ForwardAgent yes

# EC2 instance with private ip
Host 10.0.2.99
   IdentityFile ~/test_key.pem
   User ubuntu
   ProxyCommand ssh bastion -W %h:%p
```

After that, execute ```$ ssh 10.0.2.99``` to land on your private instance!

## RDS in the private subnet

The bastion's security group has to allow access of TCP port 22 from client's IP, and the RDS's security group has to allow access of TCP port 5432 (postgresql's port) from bastion's IP.

To access RDS in the private subnet, we use the method called **local forward port** by securely connecting through ssh tunnel.
Thus, you have to manually instantiate that from your client machine using this command:

```markup
$ ssh -i test_key.pem -N -L 5555:mydb.cs12ojd8itky.ap-southeast-1.rds.amazonaws.com:5432 ubuntu@54.169.109.170
```

Now, you can use any favorite GUI tools and CLI to connect to private db instance via localhost:5555 such as: 
```markup
$ psql -d mydb -h localhost -p 5555 -U pgadmin -W
```
