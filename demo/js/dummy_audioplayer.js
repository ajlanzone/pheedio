
function PlaylistItem(i,file,cover,artist,album,track) {
	this.index = i;
	this.file = file;
	this.cover = cover;
	this.artist = artist;
	this.album = album;
	this.track = track;
	this.rindex = Math.random();
}

var DummyAudioPlayer = Class.create({
	player: 0,
	playlist: [],
	nowplaying: 0,
	vlcInt: 0,
	repeat: 0,
	overlay: 0,
	random: 0,
	randList: [],
	randCtr: 1,
	dummyTimer: 0,
	initialize: function() {
		//this.player = new VLCPlayer();
		//this.player.embedAudio('static_div',undefined,1);
		this.overlay = new PlaylistOverlay('audioplayer_playlist_overlay');
		this.registerKeys();
		this.dummyTimer = new Date().getTime();
	},
	add: function(file,cover,artist,album,track) {
		// Add track to end of the playlist
		var item = new PlaylistItem(this.playlist.length,file,cover,artist,album,track);
		this.playlist.push(item);
		var idx = this.playlist.length-1;
		return idx;
	},
	remove: function(item) {
		if (typeof(item) == "number") item = this.playlist[item];
		else if (typeof(item) == "string") item = this.playlist[parseInt(item)];
		if (item == this.nowplaying) this.next();

		this.playlist.remove(item.index);
		//this.player.playlistRemoveItem(item.index);
		this.setIndices();
	},
	clear: function() {
		this.gotoTrack(0);
		this.stop();
		//this.player.playlistClear();
		this.playlist = [];
		this.nowplaying = 0;
		this.randList = [];
		this.randCtr = 1;
	},
	play: function() {
		if (this.playlist.length == 0) return;
		if (!this.vlcInt) this.vlcInt = setInterval('g_audio.update()',100);
		if (!this.nowplaying) this.nowplaying = this.playlist[0];
		
		this.randList[this.nowplaying.index] = this.randCtr;
		
		//this.player.playlistPlay();
	},
	stop: function() {
		if (this.vlcInt) clearInterval(this.vlcInt);
		this.vlcInt = 0;
		//this.player.playlistStop();
	},
	pause: function() {
		if (!this.vlcInt) this.vlcInt = setInterval('g_audio.update()',100);
		//this.player.togglePause();	
	},
	next: function() {
		if (this.isFinished()) return;
		if (!this.vlcInt) this.vlcInt = setInterval('g_audio.update()',100);
		if (this.random) {
			var n = -1;
			
			// Search for the next track
			for (var i=0; i<this.playlist.length; i++) {
				if (this.randList[i] == this.randCtr+1) {
					n = i;
					break;
				}
			}
		
			// Check if we found the next track
			if (n == -1) { // If not, pick a random track
				// Randomly pick a track and check if it's been randList.  This is a
				// terrible way to randomize, but it's simple.  For large playlists,
				// it will take a while to find the next track when near the end.
				var mod = this.playlist.length-1;
				do {
					n = Math.round(Math.random() * mod);
				} while (this.randList[n] != undefined)

				this.randList[n] = (this.randCtr+1);
			}
			this.randCtr++;
			this.gotoTrack(n);
		}
		else {
			// Go to the next track in the sequence
			var n = this.nowplaying.index+1;
			if (n < this.playlist.length) {
				this.nowplaying = this.playlist[n];		
				//this.player.playlistNext();
			}
		}
	},
	prev: function() {
		if (!this.vlcInt) this.vlcInt = setInterval('g_audio.update()',100);

		if (this.random) {
			if (this.randCtr <= 1) return;
			// Search for the previous track
			for (var i=0; i<this.playlist.length; i++) {
				if (this.randList[i] == this.randCtr-1) {
					// Found it
					this.randCtr--;
					this.gotoTrack(i);
					return;
				}
			}
		}
		else {
			// Go to the previous track in the sequence
			var n = this.nowplaying.index-1;
			if (n >= 0) {
				this.nowplaying = this.playlist[n];		
				//this.player.playlistPrev();
			}
		}
	},
	toggleRepeat: function() {
		if (this.repeat) this.repeat = 0;
		else this.repeat = 1;
	},
	toggleShuffle: function() {
		if (this.random) this.random = 0;
		else this.random = 1;
	},
	restart: function() {
		//this.player.playlistNext();
		//this.player.playlistPrev();
	},
	gotoTrack: function(t) {
		this.dummyTimer = new Date().getTime();
		if (t < 0 || t >= this.playlist.length || !this.nowplaying || this.nowplaying.index == t) return;
		else if (this.nowplaying.index > t) {
			this.nowplaying = this.playlist[this.nowplaying.index-1];
			//this.player.playlistPrev();
		}
		else {
			this.nowplaying = this.playlist[this.nowplaying.index+1];		
			//this.player.playlistNext()
		}
		this.gotoTrack(t);
	},
	isPlaying: function() {
		return this.playlist.length > 0;
	},
	registerKeys: function() {
		Keys.register(70, function() { g_audio.seek(30000); }); // f
		Keys.register(82, function() { g_audio.seek(-30000); }); // r
		
		Keys.register(32, function() { g_audio.pause(); }); // Space Pause (toggle)
		Keys.register(83, function() { g_audio.stop(); }); // s Stop
		//Keys.register(107, function() {  }); // + Play faster
		//Keys.register(109, function() {  }); // - Play Slower
		Keys.register(78, function() { g_audio.next(); }); // n Next Item
		Keys.register(80, function() { g_audio.prev(); }); // p Previous Item
		//Keys.register(70, g_audio.player.toggleFullscreen); // f Fullscreen
		//Keys.register(77, function() { g_audio.player.toggleMute(); }); // m Mute
	},	
	clearKeys: function() {
		Keys.clear(70); // f
		Keys.clear(82); // r
		
		Keys.clear(32); // Space Play/Pause
		Keys.clear(83); // s Stop
		//Keys.clear(107); // + Play faster
		//Keys.clear(109); // - Play Slower
		Keys.clear(78); // n Next Item
		Keys.clear(80); // p Previous Item
		//Keys.clear(70); // f Fullscreen
		//Keys.clear(77); // m Mute
	},
	loadPlaylist: function(commalist) {
		// Wait for vlc.playlist object to be ready
		//if (this.player.obj.playlist == undefined) {
		//	setTimeout('g_audio.loadPlaylist("' + commalist + '")',100);
		//	return;
		//}

		//var files = this.file.split(',');
		//var files = commalist.split(',');
		//for (var i=0; i<files.length; i++) this.player.playlistAdd(files[i]);
		//this.player.playlistPlay();
	},
	seek: function(ms) {
		//var t = parseInt(this.player.getInputTime());
		//var total = parseInt(this.player.getInputLength());
		
		//t += ms;
		//if (t < 0) t = 0;
		//else if (t > total) t = total;
		
		//this.player.setInputTime(t);
	},
	seekPercent: function(dec) {
		//this.player.setInputPosition(dec);
	},
	isFinished: function() {
		if (this.random) {
			for (var i=0; i<this.playlist.length; i++) {
				if (this.randList[i] == undefined) return false;
			}
			return (this.randCtr == this.playlist.length);
		}
		else return (this.nowplaying.index >= this.playlist.length-1);
	},
	getIndex: function(track) {
		track = track.toUpperCase();
		var list = this.playlist;
		for (var i=0; i<list.length; i++) {
			if (track == list[i].track.toUpperCase()) return i;
		}
		return -1;
	},
	setIndices: function() {
		var list = this.playlist;
		for (var i=0; i<list.length; i++) {
			list[i].index = i;
		}
	},
	update: function() {
		// Go to next file or stop playback when player is finished
		//if (this.player.getInputState() == 6) {
		if (this.dummyTimer + 30000 < new Date().getTime()) {
			if (this.isFinished()) {
				this.gotoTrack(0);
				this.randCtr = 1;
				if (!this.repeat) this.stop();
			}
			else this.next();
			
			// Update screen saver
			if (Screensaver) Screensaver.updateMusic(g_audio.nowplaying.track, g_audio.nowplaying.artist, g_audio.nowplaying.album, g_audio.nowplaying.cover);
		}
	}
});



