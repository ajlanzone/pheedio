
var DisabledModule = Class.create(Module, {
	title: '',
	ticker: 0,
	initialize: function(parent,title) {
		this.parent = parent;
		this.title = title;
	},
	clearKeys: function() {
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	open: function() {
		$('content_div').hide();
		$('content_div').innerHTML = '<div style="width:400px; height: 300px; margin: 0 auto; padding: 100px;"><div style="text-align:center;color:#aaa;text-shadow:1px 1px 0 black;">Sorry, the ' + this.title + ' module is not available in the demo.<br><br>Press <b>Escape</b> to go back.</div></div>';
		Effect.Appear('content_div', {duration:0.5, queue: { scope: 'waitfx' }});
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
	}
});
