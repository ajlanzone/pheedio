
var YouTubeModule = Class.create(Module, {
	title:'YouTube',
	url:'',
	ticker:0,
	player:0,
	initialize: function(parent,url) {
		this.parent = parent;
		this.url = url; // url to YouTube page, video id is extracted
	},
	registerKeys: function() {
		Keys.snapshot();
		Keys.clearAll();
		
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back

		Keys.register(37, function() { g_module.seek(-5,false); }); // Left
		Keys.register(39, function() { g_module.seek(5,false); }); // Right
		Keys.register(70, function() { g_module.seek(10,false); }); // f
		Keys.register(82, function() { g_module.seek(-10,false); }); // r

		Keys.register(32, function() { g_module.player.pauseVideo(); }); // Space Pause
		Keys.register(13, function() { g_module.player.playVideo(); }); // Enter Play
		Keys.register(83, function() { g_module.player.stopVideo(); }); // s Stop

		Keys.register(80, function() { g_module.seekTo(0,false); }); // p Previous Item
		
		Keys.register(48, function() { g_module.seekPercent(0); }); // 0 0%
		Keys.register(49, function() { g_module.seekPercent(0.1); }); // 1 10%
		Keys.register(50, function() { g_module.seekPercent(0.2); }); // 2 20%
		Keys.register(51, function() { g_module.seekPercent(0.3); }); // 3 30%
		Keys.register(52, function() { g_module.seekPercent(0.4); }); // 4 40%
		Keys.register(53, function() { g_module.seekPercent(0.5); }); // 5 50%
		Keys.register(54, function() { g_module.seekPercent(0.6); }); // 6 60%
		Keys.register(55, function() { g_module.seekPercent(0.7); }); // 7 70%
		Keys.register(56, function() { g_module.seekPercent(0.8); }); // 8 80%
		Keys.register(57, function() { g_module.seekPercent(0.9); }); // 9 90%
	},
	clearKeys: function() {
		//Keys.clear(27); // Esc
		//Keys.clear(8); // Backspace
		//Keys.clear(166); // Remote Back
		
		Keys.revert();		
	},
	open: function() {
		var width = parseInt(getStyle($('content_div'),'width'));
		var height = parseInt(getStyle($('content_div'),'height'));
		$('content_div').hide();
		
		// Parse URL to build link to movie
		var args = (this.url.split('?'))[1].split('&');
		for(var i=0; i<args.length; i++) {
			if (args[i].charAt(0) == 'v' && args[i].charAt(1) == '=') {
				id = args[i].substr(2);
				break;
			}
		}
		
		// Make sure the URL contained a valid YouTube id
		if (id == undefined) {
			this.errorScreen('Cannot find YouTube id from URL "'+this.url+'"');
			return;
		}

		var movie = 'http://www.youtube.com/v/'+id+'&hl=en&fs=1&autoplay=1&color1=0x333333&color2=0x666666&hd=1&enablejsapi=1&iv_load_policy=3&ap=%2526fmt%3D18';
		//$('content_div').innerHTML = '<object id="youtubeObj" width="'+width+'" height="'+height+'"><param name="movie" value="'+movie+'"></param><param name="wmode" value="transparent"></param><param name="allowFullScreen" value="true"></param><param name="allowScriptAccess" value="always"></param><embed src="'+movie+'" type="application/x-shockwave-flash" allowScriptAccess="always" wmode="transparent" allowfullscreen="true" width="'+width+'" height="'+height+'"></embed></object>';
		$('content_div').innerHTML = '<object id="youtubeObj" width="'+width+'" height="'+height+'" data="'+movie+'" type="application/x-shockwave-flash"><param name="movie" value="'+movie+'"></param><param name="wmode" value="transparent"></param><param name="allowFullScreen" value="true"></param><param name="allowScriptAccess" value="always"></param></object>';
		
		this.player = $('youtubeObj');
		
		Effect.Appear('content_div', {duration:0.5, queue: { scope: 'waitfx' }});
		this.registerKeys();
		Screensaver.disable();
	},
	close: function($super) {
		Screensaver.enable();
		$super();
	},
	seek: function(delta,allowSeekAhead) {
		var t = g_module.player.getCurrentTime() + delta;
		if (t < 0) t = 0;
		g_module.player.seekTo(t,allowSeekAhead);
	},	
	seekPercent: function(percent) {
		var total = g_module.player.getDuration();
		var p2 = Math.round(percent*total);
		g_module.player.seekTo(p2,true);
	},
	seekTo: function(secs,allowSeekAhead) {
		g_module.player.seekTo(secs,allowSeekAhead);
	}
});



