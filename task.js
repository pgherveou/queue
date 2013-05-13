var ms = require('ms');

/**
 * expose Task
 */

module.exports = Task;

/**
 * create a new task
 * @param {String} name
 *
 * @api private
 */

function Task(name) {
  this.name = name;
  this_interval = ms('2s');
  this._lifetime = Infinity;
  this._retry = 0;
}

/**
 * Process a job
 * @param  {Object}
 *
 * @api private
 */

Task.prototype.process = function(job) {
  var self = this
    , timeout;

  if (this._online && !navigator.onLine) {
    job.emit('offline');
    replay(job);
    return;
  }

  // set job retry
  job.retry = (job.retry || 0) + 1;

  if (this._timeout) {
    job.timeout = false;
    timeout = setTimeout(function () {
      job.timeout = true;
      job.emit('timeout');
      self.replay(job);
    });
  }

 this._action(job, function(err) {
    if (job.timeout) return;
    clearTimeout(timeout);
    if (err) {
      job.emit('fail', err);
      self.replay(job);
    } else {
      job.emit('complete');
    }
  });
};

/**
 * set task action
 * @param  {[Function]}
 * @return {Task}
 *
 * @api public
 */

Task.prototype.action = function(action) {
  this._action = action;
  return this;
};

/**
 * replay a job
 *
 * @api private
 */

Task.prototype.replay = function(job) {
  var self = this
    , canReplay = ((job.retry || 0) <= this._retry)
               && (job.time + self._lifetime > new Date().getTime());

  if (canReplay)
    setTimeout(function() {self.process(job);}, this._interval);
  else
    job.emit('error');
};

/**
 * set interval between two tentatives (default is 2secs)
 * @param  {Number} interval
 * @return {Task}
 *
 * @api public
 */

Task.prototype.interval = function(interval) {
  this._interval = ms(interval);
  return this;
};

/**
 * set task lifetime
 * @param  {String} lifetime    (default is Infinity)
 * @return {Task}
 *
 * @api public
 */

Task.prototype.lifetime = function(lifetime) {
  this._lifetime = ms(lifetime);
  return this;
};

/**
 * set retry count
 * @param  {Number} retry   (default is 0)
 * @return {Task}
 *
 * @api public
 */

Task.prototype.retry = function(retry) {
  this._retry = retry;
  return this;
};

/**
 * set online flag, defines wether or not the task can be executed offline
 * @return {Task}
 *
 * @api public
 */

Task.prototype.online = function() {
  this._online = true;
  return this;
};

/**
 * set timeout
 * @param  {String} timeout
 * @return {Task}
 *
 * @api public
 */

Task.prototype.timeout = function(timeout) {
  this._timeout = timeout;
  return this;
};
