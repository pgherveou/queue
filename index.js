var map = require('map')
  , Emitter = require('emitter')
  , ms = require('ms')
  , store = require('store')
  , Task = require('./task')
  , noop = function() {};

/**
 * expose new queue
 */

module.exports = new Queue();

/**
 * generate job id
 * @return {String}
 *
 * @api private
 */

var idCounter = 0;
function nextId() {
  return 'job-' + (++idCounter) + '' + (new Date()).getTime();
}

/**
 * create a new queue
 * @param {[String]} id queue id
 */

function Queue(id) {
  // memory store
  this.jobs = [];

  // persistent store
  this.store = store.prefix('queue' + (id || ''));
}

/**
 * mixin Emitter
 */

Emitter(Queue.prototype);

/**
 * define a new task
 * @param  {String}   type task type
 * @return {Task}
 *
 * @api public
 */

Queue.prototype.tasks = {};
Queue.prototype.define = function(type) {
  var task = new Task(type);
  this.tasks[type] = task;
  return task;
};

/**
 * process a job
 * @param  {Object}   job
 *
 * @api private
 */

Queue.prototype.process = function(job) {
  var self = this
    , task = this.tasks[job.type]
    , remove = function (state) {
        job.off();
        self.remove(job.id);
        if (state) self.emit(state, job);
      };

  if (!task) {
    remove();
    throw new Error("unknown " + job.type);
  }

  job.on('complete', function () {remove('complete');});
  job.on('error', function () {remove('error');});
  task.process(job);
};

/**
 * execute all jobs in queue
 *
 * @private
 */

Queue.prototype.start = function() {
  var ids = this.store.get()
    , job, jobId, i;

  if(!ids) return;

  // load existing jobs
  for (i = 0; i < ids.length; i++) {
    jobId = ids[i];
    job = this.store.get(jobId);

    if (job) {
      Emitter(job);
      this.jobs.push(job);
    }
  }

  // process jobs
  for (i = 0; i < this.jobs.length; i++) {
    job = this.jobs[i];
    this.process(job);
  }
};

/**
 * create a new job
 *
 * @param  {String} type
 * @param  {Object} data
 * @return {Object} job
 *
 * @api public
 */

Queue.prototype.create = function(type, data) {
  var self = this
    , job = {
        type: type,
        data: data,
        id: nextId(),
        time: new Date().getTime()
      };

  this.jobs.push(job);
  this.store.save(map(this.jobs, 'id'));
  this.store.set(job.id, job);

  Emitter(job);

  setTimeout(function() {
    self.process(job);
  }, 0);

  return job;
};

/**
 * remove a job
 * @param  {String} id
 *
 * @api public
 */

Queue.prototype.remove = function(id) {
  var ids = map(this.jobs, 'id')
    , index = ids.indexOf(id);

  if (!~index) return;

  this.jobs.splice(index, 1);
  ids.splice(index, 1);

  this.store.save(ids);
  this.store.unset(id);
};

/**
 * stop queue
 *
 * @api public
 */

Queue.prototype.stop = function() {
  for (var i = 0; i < this.jobs.length; i++) {
    var job = this.jobs[i];
    job.active = false;
    job.off();
  }
};

/**
 * clear queue
 *
 * @api public
 */

Queue.prototype.clear = function() {
  this.queue = [];
  this.store.clear();
};

/**
 * destroy queue
 *
 * @api public
 */

Queue.prototype.destroy = function() {
  this.stop();
  this.clear();
};

/**
 * create a new queue
 * @param {String} id queue id
 * @api public
 */

Queue.prototype.createQueue = function(id) {
  return new Queue(id);
};
