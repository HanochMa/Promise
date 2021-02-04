let MyPromise = require('./index.js');
let p1 = new MyPromise(function (resolve, reject) {
  setTimeout(() => {
    let num = Math.random();
    if (num < .5) {
      resolve(num)
    } else {
      reject('error')
    }
  });
});
p1.then(function (data) {
  console.log(data);
}, function (reason) {
    console.log(reason);
})