

var MouseHider = {
// 
// User variables
//
	delay: 2000,       // Delay after which mouse is hidden
	imgurl: '/images/', // Path to the cursor files, should end with '/'
//
// Internal variables
//
	bfx: 0,      // "Cached" handle to the bindAsEventListener object for stop()
	to: 0,       // Handle to setTimeout event in case we need to cancel it
//
// User functions
//
	start: function(ms) {
		if (ms != undefined && !isNaN(parseInt(ms))) MouseHider.delay = parseInt(ms);
		if (MouseHider.bfx) MouseHider.stop();
		MouseHider.bfx = MouseHider.mouseHandler.bindAsEventListener();
		Event.observe(document.body, 'mousemove', MouseHider.bfx);
	},
	stop: function () {
		Event.stopObserving(document.body, 'mousemove', MouseHider.bfx);
		MouseHider.bfx = 0;
	},
//
// Internal member functions
//
	mouseHide: function() {
		document.body.style.cursor = 'url('+MouseHider.imgurl+'nocursor.png),url('+MouseHider.imgurl+'nocursor.cur),auto';
		//alert('hide ' + document.body.style.cursor);
	},
	mouseShow: function() {
		document.body.style.cursor = 'auto';
	},
	mouseHandler: function(e) {
		if (MouseHider.to) clearTimeout(MouseHider.to);
		MouseHider.to = setTimeout("MouseHider.mouseHide()", MouseHider.delay);
		MouseHider.mouseShow();
	}
};


