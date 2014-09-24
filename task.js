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
  this._retry = 0;
}

/**
 * Process a job
 * @param  {Object}
 *
 * @api private
 */

Task.prototype.process = function(job) {
  var _this = this,
      timeout, death, delay;

  if (this._online && !navigator.onLine) {
    job.emit('offline');
    replay(job);
    return;
  }

  // set job retry
  job.retry = (job.retry || 0) + 1;

  // get delay
  delay = (this._delay && job.retry === 1) ? this._delay : 0;

  setTimeout(function () {
    // check timeout
    if (_this._timeout) {
      job.timeout = false;
      timeout = setTimeout(function () {
        job.timeout = true;
        job.emit('timeout');
        _this.replay(job);
      }, _this._timeout);
    }

    // check lifetime
    if (_this._lifetime) {
      job.death = false;
      death = setTimeout(function () {
        job.death = true;
        job.emit('error');
      }, _this.timeToLive(job));
    }

    // start action
    _this._action(job, function(err) {
      if (job.timeout || job.death) return;
      clearTimeout(timeout);
      clearTimeout(death);
      if (err) {
        job.emit('fail', err);
        _this.replay(job);
      } else {
        job.emit('complete');
      }
    });

  }, delay);
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
  var _this = this,
      canReplay = ((job.retry || 0) <= this._retry) &&
                  (this.timeToLive(job) > 0);

  if (canReplay)
    setTimeout(function() {_this.process(job);}, this._interval);
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
 * get time to live
 * @param {Object} job
 * @return {Number} time to live in ms
 *
 * @api private
 */

Task.prototype.timeToLive = function (job) {
  if (!this._lifetime) return Infinity;
  Math.max(0, job.time + this._lifetime - new Date().getTime());
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
  this._timeout = ms(timeout);
  return this;
};

/**
 * set delay
 * @param  {String} delay
 * @return {Task}
 *
 * @api public
 */

Task.prototype.delay = function(delay) {
  this._delay  = ms(delay);
  return this;
};
