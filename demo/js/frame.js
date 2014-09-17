
var FrameModule = Class.create(Module, {
	title: 'No Title',
	ticker: 1,
	a: 0,
	width: 800,
	height: 500,
	initialize: function(parent,href) {
		this.parent = parent;
		if (parent) this.ticker = parent.ticker;
		var a = document.createElement('a');
		//a.href = '/php/get.php?s=' + escape(unescape(href));
		a.href = unescape(href);
		$(a).addClassName('lfOn');
			
		this.a = a;
	},
	open: function() {
		this.a.setAttribute('rel','width='+this.width+',height='+this.height);
		new LFLink(this.a);		
		LFrame.addLightframeMarkup();

		g_module.goBack();
		this.registerKeys();
		this.a.onclick();
	},
	//close: function() {
	//	LFLink.prototype.deactivate();
	//	Keys.revert();
	//	
	//},
/*	
	registerKeys: function() {
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
				
		Keys.clear(37); // Left
		Keys.clear(38); // Up
		Keys.clear(39); // Right
		Keys.clear(40); // Down
		Keys.clear(33); // PgUp
		Keys.clear(34); // PgDn	
	
		Keys.register(27, function() { // Esc
			// Close Lightframe, else go back
			if ($('lightframediv') && $('lightframediv').style.display == 'block'){
				LFLink.prototype.deactivate();
				Keys.clear(27); // Esc
				Keys.clear(8); // Backspace
				Keys.clear(166); // Remote Back
				
				Keys.clear(37); // Left
				Keys.clear(38); // Up
				Keys.clear(39); // Right
				Keys.clear(40); // Down
				Keys.clear(33); // PgUp
				Keys.clear(34); // PgDn
			}
			else g_module.goBack(); // Go back
			//g_module.goBack(); // Go back
			g_module.refresh();
		});
		Keys.register(8, function() { // Backspace
			// Close Lightframe, else go back
			if ($('lightframediv') && $('lightframediv').style.display == 'block'){
				LFLink.prototype.deactivate();  
				Keys.clear(27); // Esc
				Keys.clear(8); // Backspace
				Keys.clear(166); // Remote Back
				
				Keys.clear(37); // Left
				Keys.clear(38); // Up
				Keys.clear(39); // Right
				Keys.clear(40); // Down
				Keys.clear(33); // PgUp
				Keys.clear(34); // PgDn
			}
			else g_module.goBack(); // Go back
			//g_module.goBack(); // Go back
			g_module.refresh();
		});
		Keys.register(166, function() { // Remote back
			// Close Lightframe, else go back
			if ($('lightframediv') && $('lightframediv').style.display == 'block'){
				LFLink.prototype.deactivate();  
				Keys.clear(27); // Esc
				Keys.clear(8); // Backspace
				Keys.clear(166); // Remote Back
				
				Keys.clear(37); // Left
				Keys.clear(38); // Up
				Keys.clear(39); // Right
				Keys.clear(40); // Down
				Keys.clear(33); // PgUp
				Keys.clear(34); // PgDn
			}
			else g_module.goBack(); // Go back
			//g_module.goBack(); // Go back
			g_module.refresh();
		});
		
		Keys.register(37, function() { $('lightframe').contentWindow.scrollBy(-64,0) }); // Left
		Keys.register(38, function() { $('lightframe').contentWindow.scrollBy(0,-64) }); // Up
		Keys.register(39, function() { $('lightframe').contentWindow.scrollBy(64,0) }); // Right
		Keys.register(40, function() { $('lightframe').contentWindow.scrollBy(0,64) }); // Down
		
		Keys.register(33, function() { $('lightframe').contentWindow.scrollBy(0,-500) }); // PgUp
		Keys.register(34, function() { $('lightframe').contentWindow.scrollBy(0,500) }); // PgDn
	}*/
	registerKeys: function() {
		Keys.snapshot();
		Keys.clearAll();
		Keys.register(27, function() { // Esc
			LFLink.prototype.deactivate();  
			//Keys.revert(); // Done in deactivate()
			//g_module.goBack();
		});
		Keys.register(8, function() { // Backspace
			LFLink.prototype.deactivate();  
			//Keys.revert(); // Done in deactivate()
			//g_module.refresh();
		});
		Keys.register(166, function() { // Remote back
			LFLink.prototype.deactivate();  
			//Keys.revert(); // Done in deactivate()
			//g_module.refresh();
		});
		
		Keys.register(37, function() { $('lightframe').contentWindow.scrollBy(-64,0) }); // Left
		Keys.register(38, function() { $('lightframe').contentWindow.scrollBy(0,-64) }); // Up
		Keys.register(39, function() { $('lightframe').contentWindow.scrollBy(64,0) }); // Right
		Keys.register(40, function() { $('lightframe').contentWindow.scrollBy(0,64) }); // Down
		
		Keys.register(33, function() { $('lightframe').contentWindow.scrollBy(0,-500) }); // PgUp
		Keys.register(34, function() { $('lightframe').contentWindow.scrollBy(0,500) }); // PgDn
	}
	
});
