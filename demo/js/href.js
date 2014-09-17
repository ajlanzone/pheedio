
var HrefModule = Class.create(Module, {
	href: 'http://www.google.com',
	title: 'No Title',
	ticker: 0,
	initialize: function(parent,href) {
		this.parent = parent;
		this.href = unescape(href);
	},
	open: function() {
		g_module.goBack();
		$('content_div').innerHTML = '<div style="width:100%;height:100%;background:transparent url(images/exec.gif) 50% 50% no-repeat;"></div>';
		window.location.href = this.href;
	},
	toHash: function() {
		if (this.parent) return this.parent.toHash();
		else return '0';
	}
});
