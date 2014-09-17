
var Keys = new function() {
	this.funcs = [];
	this.checks = [];
	this.snapshots = [];
	
	this.META_NONE = 0;
	this.META_ALT = 1;
	this.META_CTRL = 2;
	this.META_SHIFT = 4;
	
	this.handler = function(e) {
		if (!Keys.isReady()) return false;
		
   		//var key  = (window.event) ? event.keyCode : e.keyCode;
   		var evt = (window.event) ? event : e;
   		var key = evt.keyCode;
   		
   		var meta = 0;
		if (evt.altKey) meta |= Keys.META_ALT;
		if (evt.ctrlKey) meta |= Keys.META_CTRL;
		if (evt.shiftKey) meta |= Keys.META_SHIFT;
   		
   		var notFound = true;
		if (Keys.funcs[key]) {
			try {
				for (var i=0;i<Keys.funcs[key].length;i++) {
					if (meta == Keys.funcs[key][i].meta) { 
						try {
							Keys.funcs[key][i].func();
						} catch(err) { /*alert(err);*/ }
						notFound = false;
					}
				}
			} catch(e) { }				
		}
		//else alert(key);
		return notFound;
	};
	this.register = function(key,func,meta) {
		if (meta == undefined) meta = Keys.META_NONE;
		if (!this.funcs[key]) this.funcs[key] = [];
		this.funcs[key].push(new KeyFunc(func,meta));
	};
	this.clear = function(key) {
		if (this.funcs[key]) this.funcs[key] = [];
	};
	this.clearAll = function() {
		this.funcs = [];
	};
	this.setPrereq = function(func) {
		this.checks.push(func);
		if (this.checks.length > 1) alert('You now have more than 1 key prereq!');
	};
	this.clearPrereqs = function() {
		this.checks = [];
	};	
	this.isReady = function() {
		for (var i=0;i<this.checks.length;i++)  {
			if (!(this.checks[i]())) return false;
		}
		return true;
	};
	this.snapshot = function() {
		this.snapshots.push(this.funcs);
	};
	this.revert = function() {
		if (this.snapshots.length > 0) this.funcs = this.snapshots.pop();
	};
};

var KeyFunc = Class.create({
	func: 0,
	meta: 0,
	initialize: function(f,m) {
		this.func = f;
		this.meta = m;
	}
});

document.onkeydown = Keys.handler;
