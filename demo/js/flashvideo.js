
var FlashVideoModule = Class.create(Module, {
	url:'',
	ticker:0,
	player:0,
	initialize: function(parent,url) {
		this.parent = parent;
		this.url = url; // url to video
	},
	registerKeys: function() {
		Keys.snapshot();
		Keys.clearAll();
		
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back

		Keys.register(37, function() { g_module.seek(-10); }); // Left
		Keys.register(39, function() { g_module.seek(10); }); // Right
		Keys.register(70, function() { g_module.seek(10); }); // f
		Keys.register(82, function() { g_module.seek(-10); }); // r

		Keys.register(32, function() { g_module.player.fp_toggle(); }); // Space Pause
		Keys.register(13, function() { g_module.player.fp_toggle(); }); // Enter Play
		Keys.register(83, function() { g_module.player.fp_stop(); }); // s Stop

		Keys.register(80, function() { g_module.seekTo(0); }); // p Previous Item
		
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
		Keys.revert();		
	},
	open: function() {
		$('content_div').hide();
		$('content_div').innerHTML = '<object id="player_api" data="/demo/images/flowplayer/flowplayer-3.1.5.swf" type="application/x-shockwave-flash" height="100%" width="100%"><param name="movie" value="/demo/images/flowplayer/flowplayer-3.1.5.swf" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="quality" value="high" /><param name="bgcolor" value="#000000" /><param name="wmode" value="transparent" /><param name="flashvars" value=\'config={"playerId":"player","plugins":{"controls":{"autoHide":"always"}},"clip":{"url":"'+this.url+'"},"playlist":[{"url":"'+this.url+'"}]}\' /></object>';

		// Maintain aspect ratio
		//var width = parseInt(getStyle($('static_div'),'width'),10);
		//var height = parseInt(getStyle($('static_div'),'height'),10);
		//width = Math.ceil(width*(height - 32)/height); // Height of progress bar is 32 pixels
		//$('content_div').innerHTML = '<div style="background:black;text-align:center;"><object id="player_api" data="/images/flowplayer/flowplayer-3.1.4.swf" type="application/x-shockwave-flash" height="'+height+'" width="'+width+'"><param name="allowfullscreen" value="true"></param><param name="allowscriptaccess" value="always"></param><param name="quality" value="high"></param><param name="cachebusting" value="false"></param><param name="bgcolor" value="#000000"></param><param name="wmode" value="transparent"></param><param name="flashvars" value="config={&quot;playerId&quot;:&quot;player&quot;,&quot;plugins&quot;:{&quot;controls&quot;:{&quot;autoHide&quot;:&quot;always&quot;}},&quot;clip&quot;:{&quot;url&quot;:&quot;'+this.url+'&quot;},&quot;playlist&quot;:[{&quot;url&quot;:&quot;'+this.url+'&quot;}]}"></param></object></div>';

		this.player = $('player_api');
		
		Effect.Appear('content_div', {duration:0.5, queue: { scope: 'waitfx' }});
		this.registerKeys();
		g_audio.stop();
		Screensaver.disable();
	},
	close: function($super) {
		Screensaver.enable();
		$super();
	},
	seek: function(delta) {
		var t = g_module.player.fp_getTime() + delta;
		if (t < 0) t = 0;
		g_module.player.fp_seek(t);
	},	
	seekPercent: function(percent) {
		var total = g_module.player.fp_getStatus().bufferEnd;
		var p2 = Math.round(percent*total);
		g_module.player.fp_seek(p2);
	},
	seekTo: function(secs) {
		g_module.player.fp_seek(secs);
	}
});

FlashVideoModule.configVars = function() {
	return [
		{ variable:'primary', type:'url', name:'.FLV file URL' }
	];
};

//Config.register({FlashVideoModule:FlashVideoModule},'Flash Video');
