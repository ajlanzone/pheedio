var Screensaver = {
// 
// User variables
//
	timeout: 60000, // Time (in ms) of inactivity after which screensaver starts
	delay:   5000,  // Time (in ms) to show each picture (should be at least 2x fade)
	fade:    2.0,   // Time (in seconds) to fade in/out each picture
//
// Internal variables
//
	div: 0,       // Handle to screensaver div
	img: 0,       // Handle to screensaver img

	pics: 0,      // Array of picture urls
	picCtr: 0,    // Index into pics array
	totCtr: 0,
	intNext: 0,   // Handle to timer interval in case we need to cancel it
	cache: 0,     // Next image to be shown
	
	keyfx: 0,     // "Cached" handle to the bindAsEventListener object for disable()
	mousefx: 0,   // "Cached" handle to the bindAsEventListener object for disable()
	intTimer: 0,  // Handle to timer interval in case we need to cancel it
	activity: 0,  // Time of last user activity
	
	loadUrl: function(url) {
		//url = "/php/get.php?s=" + encodeURIComponent(url) + '&refresh=' + (new Date).getTime();
		url = '/' + url + '?refresh=' + (new Date).getTime();
		new Ajax.Request(url, {
			method:'get',
			onSuccess: function(transport){ 
				var pics = transport.responseText.split(',');
				Screensaver.initialize(pics);
				Screensaver.enable();
			}
		});
	},
	initialize: function(p,to) {
		Screensaver.disable();
		
		Screensaver.pics = p;
		if (to != undefined) this.timeout = to;
		
		// Pick random position
		var w = window.innerWidth;
		var h = window.innerHeight;
		var t = Math.round(30*Math.random()) + '%';
		var l = Math.round(45*Math.random()) + '%';
		
		var d = document.createElement('div');
		d.id = 'ssaver_div';
		d.style.display = 'none';
		d.innerHTML = '<img id="ssaver_img" src="'+p[0]+'" style="top:'+t+';left:'+l+';">'
			+ '<div id="ssaver_music_div"><img id="ssaver_music_cover" src="/images/black75.png"><div id="ssaver_music_title"></div><div id="ssaver_music_artist"></div><div id="ssaver_music_album"></div></div>';

		var bod = document.getElementsByTagName('body')[0];
		bod.appendChild(d);
		$(d).hide();
		
		Screensaver.div = d;
		Screensaver.img = $('ssaver_img');
		Screensaver.cache = new Image();
		Screensaver.cache.src = Screensaver.nextImage();
	},
	enable: function() {
		// Listen for key strokes or mouse movement
		Screensaver.mousefx = Screensaver.activityMonitor.bindAsEventListener();
		Event.observe(document.body, 'mousemove', Screensaver.mousefx);
		Screensaver.keyfx = Screensaver.activityMonitor.bindAsEventListener();
		Event.observe(document, 'keydown', Screensaver.keyfx);
		
		Screensaver.activity = new Date().getTime();
		//if (!Screensaver.intTimer) Screensaver.intTimer = setInterval('Screensaver.check()',1000);
	},
	disable: function() {
		// Stop listening to keys and mouse presses
		if (Screensaver.keyfx) Event.stopObserving(document.body, 'keydown', Screensaver.keyfx);
		if (Screensaver.mousefx) Event.stopObserving(document.body, 'mousemove', Screensaver.mousefx);
		Screensaver.keyfx = 0;		
		Screensaver.mousefx = 0;
		
		// Stop screensaver timer
		if (Screensaver.intTimer) clearInterval(Screensaver.intTimer);
		Screensaver.intTimer = 0;
	},
	show: function() {
		// Stop counting idle time
		if (Screensaver.intTimer) clearInterval(Screensaver.intTimer);
		Screensaver.intTimer = 0;
		
		// Eventually, stop the screensaver
		Screensaver.totCtr = 0;
		
		// Show the current music track if one is playing
		if (g_audio && g_audio.player.getInputState() == 3) {
			Screensaver.updateMusic(g_audio.nowplaying.track, g_audio.nowplaying.artist, g_audio.nowplaying.album, g_audio.nowplaying.cover);
			$('ssaver_music_div').show();
		}
		else $('ssaver_music_div').hide();
		
		// Show slideshow and start timer
		Effect.Appear(Screensaver.div, { duration: Screensaver.fade, queue: { scope: 'ssaver' } });
		if (!Screensaver.intNext) Screensaver.intNext = setInterval('Screensaver.next()',Screensaver.delay);
	},
	hide: function() {
		// Stop updating images
		if (Screensaver.intNext) {
			clearInterval(Screensaver.intNext);
			Screensaver.intNext = 0;
	
			// Stop fades, if any
			var queue = Effect.Queues.get('ssaver');
			queue.each(function(fx) {
				fx.cancel();
			});

			// Hide screensaver
			$(Screensaver.div).hide();
			$(Screensaver.img).show();
			if (g_module.ticker) Ticker.start();
		}
		if (!Screensaver.intTimer) Screensaver.intTimer = setInterval('Screensaver.check()',1000);
	},
	next: function() {
		//Effect.Fade(Screensaver.img, { duration: Screensaver.fade, queue: { scope: 'ssaver' }, afterFinish: function (obj) { 
		//	$(Screensaver.img).src = Screensaver.cache.src;
		//	Screensaver.cache.src = Screensaver.nextImage();
		//	new Effect.Appear(Screensaver.img, { duration: Screensaver.fade, queue: { scope: 'ssaver' } });
		//}});
		Screensaver.img.hide();
		if (Screensaver.totCtr > 720) {
			if (Ticker.running) Ticker.stop();
			Screensaver.div.style.opacity = 0.75;
			return;
		}
		else Screensaver.div.style.opacity = 1.0;

		Screensaver.img.src = Screensaver.cache.src;

		// Pick random position
		var ar = Screensaver.img.width/Screensaver.img.height;
		if (isNaN(ar)) ar = 1;
		var w = window.innerWidth;
		var h = window.innerHeight;
		
		Screensaver.img.style.top = Math.round(30*Math.random()) + '%';
		Screensaver.img.style.left = Math.round((100-70*ar*h/w)*Math.random()) + '%';
		
		Screensaver.cache.src = Screensaver.nextImage();
		Screensaver.img.show();
		Screensaver.totCtr++;
	},
	nextImage: function() {
		Screensaver.picCtr++;
		if (Screensaver.picCtr >= Screensaver.pics.length) Screensaver.picCtr = 0;
		return Screensaver.pics[Screensaver.picCtr];
	},
	activityMonitor: function(e) {
		// User did something. Update timer and hide screensaver
		Screensaver.activity = new Date().getTime();
		Screensaver.hide();
	},
	check: function() {
		if (Screensaver.keyfx == 0) return;

		// Get current time and compare it to last user activity.  If it has been long
		// enough, start the screensaver
		var ms = new Date().getTime();
		if (ms - Screensaver.activity > Screensaver.timeout) {
			Screensaver.show();
		}
	},
	updateMusic: function(track,artist,album,cover) {
		var d = $('ssaver_music_title');
		if (d) d.innerHTML = track;
		d = $('ssaver_music_artist');
		if (d) d.innerHTML = artist;
		d = $('ssaver_music_album');
		if (d) d.innerHTML = album;
		d = $('ssaver_music_cover');
		if (d) d.src = cover;
	}
};
