function defineReactive(data, key, val) {
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