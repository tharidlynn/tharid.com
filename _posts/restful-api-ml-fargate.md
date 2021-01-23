---
title: "Restful API + ML model with fargate"
description: 'Machine Learning on Fargate is easy if you know how to use docker'
date: '2019-01-11'
modified_date: '2019-01-11'
image: '/assets/images/posts/create-cluster.gif'
---

## Training a model
```python
# train.py

from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.externals import joblib

iris = load_iris()
X_iris = iris.data
y_iris = iris.target
X_train, X_test, y_train, y_test = train_test_split(X_iris, y_iris)

clf = LogisticRegression()
clf.fit(X_train, y_train)

joblib.dump(clf, 'model.pkl')
```
We use the joblib module to serialize the model so that we can load it back during prediction.

## Restful API
In this post, I'm going to use [Flask](http://flask.pocoo.org/) as our web framework. You can pick whatever frameworks you're most comfortable with as long as they are able to return the **json** to  clients.

```python
# app.py

import numpy as np
from flask import Flask, request, abort, jsonify
from sklearn.externals import joblib

app = Flask(__name__)

@app.route('/predict', methods=['GET'])
def predict():
    if request.method == 'GET':
        try:
            model = joblib.load('model.pkl')
            data = request.get_json()
            
            if data is None:
                abort(400)
            X = np.array(data['payload']).reshape(1,-1)
            # numpy array is not JSON serializable, casting to list
            pred = model.predict(X).tolist()
            
            return jsonify({'prediction': pred})

        except (ValueError, TypeError) as e:
            return jsonify('Error with - {}'.format(e))

if __name__ == '__main__':
    app.run()
```

According to the code above, we tell Flask to load our training model, predict the incoming data from the request and return the result back to the client.

To run that, follow these 3 easy steps:

1. Start the Flask web server by running `python app.py`
2. Send some data to the server. For example, `curl` 

```bash
curl -H "Content-Type: application/json" -X GET -d '{"payload": [3,2,1,4]}' http://localhost:5000/predict
```

3. The result is neat. 

```bash
{
  "prediction": [
    2
  ]
}
```

## Docker
We're gonna wrap everything we've written as a container and push it to [Amazon Elastic Container Registry](https://aws.amazon.com/ecr/) so that [Amazon Fargate](https://aws.amazon.com/fargate/) could pull it. But, before that, we need to ensure that our container also works in the local development.

### Local development

> Gunicorn has better performance than Flask server.

```docker
# Dockerfile

FROM python:3.7.2-slim

COPY . /app

WORKDIR /app

RUN pip install numpy && \
    pip install flask && \
    pip install gunicorn && \
    pip install scikit-learn
    
ENTRYPOINT [ "gunicorn" ]
CMD ["-w 4", "-b :5000", "app:app"]
```

Let's test that !

```bash
$ docker build -t flask-api .
$ docker run -it -p 5000:5000 --rm flask-api
$ curl -H "Content-Type: application/json" -X GET -d '{"payload": [3,2,1,4]}' http://localhost:5000/predict
 
{
  "prediction": [
    2
  ]
}
```

### ECR

**Note: If you still do not have aws-cli, the installation guide is [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)**

We can now push our container to Amazon ECR. The whole process here is to create new repository on ECR and push our local container to it.

Firstly, go to your ECR console and create a new repository for your container. You can also use these command if you prefer: 

```bash
$ AWS_DEFAULT_REGION=ap-southeast-1

$ eval $(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)

$ aws ecr create-repository --repository-name flask-api
```

Then we tag, 

```bash
$ docker tag flask-api 123523539192.dkr.ecr.ap-southeast-1.amazonaws.com/flask-api
```

and push it with:

```bash
$ docker push 123523539192.dkr.ecr.ap-southeast-1.amazonaws.com/flask-api
```

### Fargate 

Managing docker in the production is difficult and complicated some time. Fortunately, There are a plenty of services helping and reducing the complexity of operation. The most popular one nowadays is [Kubernetes](https://kubernetes.io/), made by Google. 

Nonetheless, our container is quite simple and no need to plug with a heavy-weight tool like Kubernetes. Thus, Fargate is a better candidate for this small app. 

> For people who don't know what Fargate is; it is the AWS service which can run containers without having to manage servers or clusters. In another word, zero operation comparing to other tools.

You need only 3 mininum things to make Fargate works:

1. Amazon ECS cluster
2. Task definition
3. Task

#### Amazon ECS cluster
Let's create the ECS cluster first by heading to ECS cluster and click create cluster with fargate template.

![fargate-cluster](@@baseUrl@@/assets/images/posts/create-cluster.gif)
*How to create the cluster*


Hooray! Now you have the running cluster. But, without any tasks, it's completely futile.

#### Task definition
Task definitions are like a blueprint. ECS cluster (Fargate) will initiate their own tasks based on the task definitions we've manifested.

![task-definitions](@@baseUrl@@/assets/images/posts/create-task-def.gif)
*>How to create a task definition*

#### Run new task
After manifesting our task's blueprint (task definition), just go to your cluster, select Tasks's tab and Run new task. 

The most critical part is to allow port `5000` in your security group and also assign a public ip to your task.

![run-task](@@baseUrl@@/assets/images/posts/create-task.gif)
*>How to create a new task<*

And as always, you can test your container using the old trick you did

```bash
$ curl -H "Content-Type: application/json" -X GET -d '{"payload": [3,2,1,4]}' 18.138.225.173:5000/predict

{"prediction":[2]}
```

Yes, finally, we made it !!! Now, we do understand the entire process of deploying machine learning model as a microservice.

## Bonus

### How to improve this pipeline?

1. Get rid of aws console and use cli instead. Read more on [documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-cli-tutorial-fargate.html).
2. Implement CI/CD philosophy.
3. Use Fargate services to manage your tasks instead of running manually.

### What is Fargate service in ECS cluster?
Basically, service is just a group of tasks deploying together. It makes developers manage tasks easier and can add more logics to the tasks, for instance, desired number of tasks, auto scaling workloads, or even rolling update.
