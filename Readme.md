
# queue

  task queue for the browser

## Installation

    $ component install pgherveou/queue


## Get started

```js
var queue = require('queue')
	.on('error', function(job) {}) // queue error handler
	.on('complete', function(job) {}); // queue success handler

// define a new task
queue
	.define('my-task')
	.online() // check that navigator is online before attempting to process job
	.interval('10s') // attempt to replay a failed job every 10sec (default is 2sec)
	.retry(5) // retry up to 5 times
	.timeout('10ms') // task fail if it last more than 10ms
	.lifetime('5m') // stop retrying if job is more than 5min old
	.action(function(done) {
		// do some work here
		done(err); // pass an error to the callback if task failed
	});

// process a task
job = queue
	.create('my-task', data)
	.on('error', function() {}) // job error handler
	.on('complete', function() {}) // job success handler


```

## Queue API

### require("queue")

get the default queue instance

### .createQueue(id)

create a new queue with specific id
localstorage keys will be prefixed with queue id

### .define(name)

create a new Task with name

### .on([error complete], function(job) {})

Queue is an event emitter, whenever a job fail or complete
an error or complete event is triggered

## Task Api

### .online()

check that navigator is online before attempting to process job

### .interval(time)

define the interval between two retries (default is '2sec')

### .retry(n)

define max number of retries

### .timeout(time)

define timeout for a task

### .lifetime(time)

job expires if its exceed crationtime + time

### .action(function(job, done))

action to execute receive a job and a callback

## License

  MIT
