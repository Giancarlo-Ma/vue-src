function defineReactive(data, key, val) {
	let dep = [];
	Object.defineProperty(data, key, {
		enumerable: true,
		configurable: true,
		get: function() {
			// window.target是一个依赖,为一个函数
			dep.push(window.target)
			return val
		},
		set: function(newVal) {
			if(val === newVal) {
				return
			}
			for(let i = 0; i < dep.length; i++) {
				// 调用window.target收集
				dep[i](newVal, val);
			}
			val = newVal;
		}
	})
}
