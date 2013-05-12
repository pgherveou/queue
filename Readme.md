
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
	.lifetime('5m') // up to 5min to complete a task
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

## API



## License

  MIT
