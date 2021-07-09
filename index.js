function defineReactive(data, key, val) {
	if(typeof val === 'object') {
		new Observer(val);
	}
	let dep = new Dep();
	Object.defineProperty(data, key, {
		enumerable: true,
		configurable: true,
		get: function() {
			dep.depend();
			return val
		},
		set: function(newVal) {
			if(val === newVal) {
				return
			}
			val = newVal;
			dep.notify();
		}
	})
}

// 依赖收集到Dep
class Dep {
	constructor() {
		this.subs = [];
	}

	addSub(sub) {
		this.subs.push(sub)
	}

	removeSub(sub) {
		remove(this.subs, sub)
	}

	depend() {
		if(window.target) {
			this.addSub(window.target);
		}
	}

	notify() {
		// 浅拷贝原数组
		const subs = this.subs.slice();
		for(let i = 0; i < subs.length; i++) subs[i].update()
	}
}

function remove(arr, item) {
	if(arr.length) {
		const index = arr.indexOf(item);
		if(index > -1) {
			return arr.splice(index, 1);
		}
	}
}

// 属性变化通知window.target, 是一个watcher, 状态变化后通知watcher, 再通过watcher通知其他地方
class Watcher {
	constructor(vm, expOrFun, cb) {
		this.vm = vm;
		// 是一个函数,
		this.getter = parsePath(expOrFun);
		this.cb = cb;
		this.value = this.get();
	}

	get() {
		// 赋值给target,在reactive data的getter中可以添加这个依赖
		window.target = this;
		let value = this.getter.call(this.vm, this.vm);
		// 避免单纯获取状态重复添加该watcher
		window.target = undefined;
		return value;
	}

	update() {
		const oldValue = this.value;
		// 再一次添加这个watcher
		this.value = this.get();
		this.cb.call(this.vm, this.value, oldValue);
	}
}

const bailRE = /[^\w.$]/;
function parsePath(path) {
	if(!bailRE.test(path)) return;
	const segments = path.split('.');
	return function(obj) {
		for(let i = 0; i < segments.length; i++) {
			if(!obj) return;
			obj = obj[segments[i]];
		}
		return obj;
	}
}

// 实例化一个watcher,触发get方法->getter方法获取状态数据->触发reactive data的getter,向dep中添加依赖window.target
// 当reactive data的状态变化,触发setter -> dep的notify -> watcher的update -> 回调被调用

const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);;

['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(function (method) {
	const originalMethod = arrayProto[method];
	Object.defineProperty(arrayMethods, method, {
		value: function mutator(...param) {
			console.log(this);
			return originalMethod.apply(this, param)
		},
		enumerable: false,
		writable: true,
		configurable: true
	})
})

function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}

const hasProto = '__proto__' in {};
const arrayKeys = Object.getOwnPropertyNames(arrayMethods);
function protoAugment(target, src) {
	target.__proto__ = src;
}
function copyArgument(target, src, keys) {
	for(let i = 0; i < target.length; i++) {
		const key = keys[i];
		def(target, key, src[key])
	}
}
class Observer {
	constructor(value) {
		this.value = value;
		if(Array.isArray(value)) {
			const augment = hasProto ? protoAugment : copyArgument;
			augment(value, arrayMethods, arrayKeys);
		}
		else this.walk(value)
	}

	walk(obj) {
		const keys = Object.keys(obj);
		for(let i = 0; i < keys.length; i++) defineReactive(obj, keys[i], obj[keys[i]]);
	}
}

// data通过observer转换成getter/setter的形式追踪变化.
// 外界通过watcher读取数据时,会触发getter将watcher添加到数据的依赖中
// 数据发生变化,触发setter,进而触发dep的notify, 进而触发watcher的update方法,
// 通过update方法触发响应的回调 或更新视图.