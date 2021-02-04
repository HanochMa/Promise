const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';
function Promise(executor) {
  let self = this; // 缓存当前实例
  self.status = PENDING;
  
  self.onResolvedCallbacks = [];
  self.onRejectCallbacks = [];
  //调用时如果为pending，则转为fulfilled,如果已经是成功或失败，则什么都不做
  function resolve(value) {
    if (self.status === PENDING) {
      self.status = FULFILLED;
      self.value = value; //成功后会得到一个值，这个值不能改
      self.onResolvedCallbacks.forEach(cb => cb(self.value)); // 成功后调用所有成功的回调
    }
  }

  function reject(reason) {
    if (self.status === PENDING) {
      self.status = REJECTED;
      self.value = reason;
      self.onRejectCallbacks.forEach(cb => cb(self.value));
    }
  }

  try {
    executor(resolve, reject); // 执行
  } catch (e) {
    reject(e)
  }
}
function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('循环引用'))
  }
  if (x instanceof Promise) {
    if (x.status === PENDING) { // 如果x为pending，需要等待x resolve或reject
      x.then(function (y) {
        resolvePromise(promise2, y, resolve, reject); //递归调用
      },reject)
    } else { // 如果x为成功或失败状态，直接把resolve和reject传进去
      x.then(resolve,reject)
    }
  } else if (x !== null && (typeof x === 'object') || (typeof x === 'function')) { // x是一个thenable对象或函数(有then方法)
    try {
      let then = x.then;
      if (typeof then === 'function') {
        then.call(x, function (y) {
          resolvePromise(promise2, y, resolve, reject); //递归调用 y还是一个promise
          // resolve(y)
        }, function (err) {
            reject(err)
        });
      } else { //x.then不是一个方法，只是有then属性
        resolve(x);
      }
    } catch (e) {
      reject(e);
    }
  } else { // x为普通值
    resolve(x);
  }
}
//then方法,onFulfilled用来接收promise成功的值或者失败的原因
Promise.prototype.then = function (onFulfilled, onRejected) {
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value; //如果没有传回调函数，把值传给下一个then
  onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };
  let self = this;
  let promise2;
  if (self.status === FULFILLED) {
    return promise2 = new Promise(function (resolve, reject) {
      try {
        let x = onFulfilled(self.value); //接收回调函数的返回值
        resolvePromise(promise2, x, resolve, reject); //promise需要返回一个promise
      } catch (e) {
        // 执行成功的回调过程中出错了，用错误原因把promise2 reject掉
        reject(e);
      }
    })
  }
  if (self.status === REJECTED) {
    return promise2 = new Promise(function (resolve, reject) {
      try {
        let x = onRejected(self.value); //接收回调函数的返回值
        resolvePromise(promise2, x, resolve, reject); //promise需要返回一个promise
      } catch(e) {
        reject(e);
      }
      
    })
  }
  if (self.status === PENDING) { // 还处于pending态
    self.onResolvedCallbacks.push(function () { //等待有一天成功了就调用成功的回调
      let x = onFulfilled(self.value);
    })
    self.onRejectCallbacks.push(function () {
      let x = onRejected(self.value);
    })
  }
}

module.exports = Promise