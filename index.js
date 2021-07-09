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

class Observer {
	constructor(value) {
		this.value = value;
		if(!Array.isArray(value)) this.walk(value)
	}

	walk(obj) {
		const keys = Object.keys(obj);
		for(let i = 0; i < keys.length; i++) defineReactive(obj, keys[i], obj[keys[i]]);
	}
}