
var NowPlayingModule = Class.create(Module, {
	ticker: 1,
	vlcInt: 0,
	vlcSlider: 0,
	seekTO: 0,
	initialize: function(parent,dummy) {
		this.parent = parent;
		//this.append = append;
	},
	open: function() {
		var w = parseInt(getStyle($('static_div'),'width'));
		var h = parseInt(getStyle($('static_div'),'height'));
		this.registerKeys();

		var title = g_audio.nowplaying.title;
		if (!title) {
			title = 'The playlist is stopped';
			artist = '';
			album = '';			
		}
		else {
			var artist = g_audio.nowplaying.artist;
			if (!artist) artist = '';
			var album = g_audio.nowplaying.album;
			if (!album) album = '';
		}

		$('content_div').hide();
		$('content_div').innerHTML = 
			'<div id="vlc_audio_div"></div>'
			+ '<div class="default_page_title '+this.prefix+'_page_title" id="page_title">Now Playing</div>'
			+ '<table id="flip_container" cellpadding="0" cellspacing="0" style="width:86%;height:' + g_size + 'px;margin:0px auto;"><tr><td id="flip1" width="55%">'
			+ '<object style="margin-bottom:-5px;" id="cover_obj" type="application/x-shockwave-flash" data="/demo/images/Flip.swf" width="100%" height="' + g_size + '">'
			+ '<param name="movie" value="/demo/images/Flip.swf">'
			+ '<param name="wmode" value="transparent">'
			+ '<param name="quality" value="high">'
			+ '<param name="bgcolor" value="#000000">'
			+ '<param id="cover_vars" name="flashvars" value="xmlfile=' + encodeURIComponent('/demo/php/flipxml.php?img='+encodeURIComponent(g_audio.nowplaying.cover)+'&size='+Math.round(g_size*0.6)) + '&loaderColor=0x333333">'
			+ '</object>'
			+ '</td>'
			+ '<td width="45%">'
			+ '<div id="vlc_audio_title">'+title+'</div><div id="vlc_audio_artist">'+artist+'</div><div id="vlc_audio_album">'+album+'</div>'
			+ '<div id="vlc_audio_progress">'
			+ ' <div id="vlc_audio_elapsed" style="padding-right:'+(w/100)+'px;"></div>'
			+ ' <div id="vlc_audio_wrap" style="width:'+(w/4)+'px;">'
			+ '  <div id="vlc_audio_status" style="width:'+(w/4)+'px;"></div>'
			+ '  <div id="vlc_audio_trackfill">'
			+ '   <div id="vlc_track" style="width:'+(w/4)+'px;">'
			+ '    <div id="vlc_audio_handle"></div>'
			+ '   </div>'
			+ '  </div>'
			+ ' </div>'
			+ ' <div id="vlc_audio_remaining" style="padding-left:'+(w/100)+'px;"></div>'
			+ '<div>'

			//+ '<div id="vlc_timer2"></span> / <span id="vlc_audio_remaining"></span></div>'
			+ '</td></tr></table>';

		Effect.Appear('content_div', {duration:0.5, queue: { scope: 'waitfx' }});

		this.updateUI();
		this.vlcInt = setInterval('g_module.updateUI()',200);		

		// horizontal slider control
		this.vlcSlider = new Control.Slider('vlc_audio_handle', 'vlc_track', {
			onSlide: function(v) { g_audio.player.setInputPosition(v); },
			startSpan: 'vlc_audio_trackfill',
		});
	},
	close: function($super) {
		if (this.vlcInt) clearInterval(this.vlcInt);
		this.vlcInt = 0;
		$super();
	},
	registerKeys: function() {
		this.clearKeys();
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
		
		Keys.register(37, function() { g_audio.seek(-5000); }); // Left
		Keys.register(39, function() { g_audio.seek(5000); }); // Right
		
		//Keys.register(70, function() { g_audio.seek(30000); }); // f
		//Keys.register(82, function() { g_audio.seek(-30000); }); // r
		Keys.register(33, function() { g_audio.seek(300000); }); // PgUp
		Keys.register(34, function() { g_audio.seek(-300000); }); // PgDn
		
		//Keys.register(32, function() { g_audio.pause(); }); // Space Pause (toggle)
		Keys.register(13, function() { g_audio.play(); }); // Enter Play
		//Keys.register(83, function() { g_audio.stop(); }); // s Stop
		//Keys.register(78, function() { g_audio.next(); }); // n Next Item
		//Keys.register(80, function() { g_audio.prev(); }); // p Previous Item
		//Keys.register(77, function() { g_audio.player.toggleMute(); }); // m Mute
		
		Keys.register(48, function() { g_audio.seekPercent(0); }); // 0 0%
		Keys.register(49, function() { g_audio.seekPercent(0.1); }); // 1 10%
		Keys.register(50, function() { g_audio.seekPercent(0.2); }); // 2 20%
		Keys.register(51, function() { g_audio.seekPercent(0.3); }); // 3 30%
		Keys.register(52, function() { g_audio.seekPercent(0.4); }); // 4 40%
		Keys.register(53, function() { g_audio.seekPercent(0.5); }); // 5 50%
		Keys.register(54, function() { g_audio.seekPercent(0.6); }); // 6 60%
		Keys.register(55, function() { g_audio.seekPercent(0.7); }); // 7 70%
		Keys.register(56, function() { g_audio.seekPercent(0.8); }); // 8 80%
		Keys.register(57, function() { g_audio.seekPercent(0.9); }); // 9 90%
	},	
	clearKeys: function() {
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
		
		Keys.clear(37); // Left
		Keys.clear(39); // Right
		
		Keys.clear(33); // PgUp
		Keys.clear(34); // PgDn
		//Keys.clear(70); // f
		//Keys.clear(82); // r		
		
		//Keys.clear(32); // Space Play/Pause
		Keys.clear(13); // Enter Play
		//Keys.clear(83); // s Stop
		//Keys.clear(78); // n Next Item
		//Keys.clear(80); // p Previous Item
		//Keys.clear(77); // m Mute
		
		Keys.clear(48); // 0 0%
		Keys.clear(49); // 1 10%
		Keys.clear(50); // 2 20%
		Keys.clear(51); // 3 30%
		Keys.clear(52); // 4 40%
		Keys.clear(53); // 5 50%
		Keys.clear(54); // 6 60%
		Keys.clear(55); // 7 70%
		Keys.clear(56); // 8 80%
		Keys.clear(57); // 9 90%		
	},
	nowPlaying: function() {
		g_module.goBack();
	},
	msToTime: function(ms) {
		var seconds = Math.floor(ms/1000) % 60;
		if (seconds < 10) seconds = '0' + seconds;
		var minutes = Math.floor(ms/60000) % 60;
		var hours = Math.floor(ms/3600000);
	
		if (hours > 0) {
			if (minutes < 10) minutes = '0' + minutes;
			return hours + ':' + minutes + ':' + seconds;
		}
		else return minutes + ':' + seconds;
	},
	update: function(id,value) {
		var d = $(id);
		if (d && d.innerHTML != value) d.innerHTML = value;
	},
	updateUI: function() {
		try {
			var elapsed = g_audio.player.getInputTime();
			if (elapsed == undefined) return;
			var total = g_audio.player.getInputLength();
			if (total == 0) {
				total = elapsed;
				var progress = (elapsed) ? 0.99 : 0;
			}
			else var progress = g_audio.player.getInputPosition();
			var remaining = (Math.ceil(total/1000) - Math.ceil(elapsed/1000))*1000;

			this.update('vlc_audio_elapsed', this.msToTime(elapsed));
			this.update('vlc_audio_remaining', '&minus;'+this.msToTime(remaining));
			//this.update('vlc_audio_track', (g_audio.nowplaying.index+1) + ' (' + g_audio.randCtr + ')');
			this.update('vlc_audio_title', g_audio.nowplaying.track);
			this.update('vlc_audio_artist', g_audio.nowplaying.artist);
			this.update('vlc_audio_album', g_audio.nowplaying.album);
			//this.update('vlc_audio_cover', '<img src="'+this.nowplaying.cover+'">');

			if (this.vlcSlider) this.vlcSlider.setValue(progress);

			// Update cover if necessary
			var cvars = $('cover_vars');
			if (cvars) {
				var cover = cvars.getAttribute('value');
				var newcover = 'xmlfile=' + encodeURIComponent('http://pheedio.com/demo/php/flipxml.php?img='+encodeURIComponent(g_audio.nowplaying.cover)+'&size='+Math.round(g_size*0.6)) + '&loaderColor=0x333333';
				if (cover != newcover) {
					cvars.setAttribute('value',newcover);
					$('cover_obj').setAttribute('data',"/demo/images/Flip.swf");
				}
			}

			switch(g_audio.player.getInputState()) {
			case 0: //IDLE/CLOSE=0
				$('vlc_audio_status').innerHTML = 'Idle';
				break;
			case 1: //OPENING=1
				$('vlc_audio_status').innerHTML = 'Opening';
				break;
			case 2: //BUFFERING=2
				$('vlc_audio_status').innerHTML = 'Buffering';
				break;
			case 3: //PLAYING=3
				$('vlc_audio_status').innerHTML = '';
				$('vlc_audio_trackfill').style.backgroundImage = 'url(/demo/images/progress.gif)';
				break;
			case 4: //PAUSED=4
			case 5: //STOPPING=5
			case 6: //ENDED=6
				$('vlc_audio_status').innerHTML = '';
				$('vlc_audio_trackfill').style.backgroundImage = 'url(/demo/images/progress-stopped.gif)';
				break;
			case 7: //ERROR=7
				$('vlc_audio_status').innerHTML = 'Error';
				break;
			}
		} catch(e) { }
	}
});
