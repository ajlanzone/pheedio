// Copyright (c) 2009 Andrew Lanzone
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var VLCPlayer = Class.create({
	obj: 0,
	
	// embedVideo() : Add an instance of the VLC plugin to the DOM
	//   w    :  width of video area in pixels
	//   h    :  height of video area in pixels
	//   vid  :  url to audio/video file
	//   auto :  auto play [0 = no, 1 = yes]
	//   loop :  continuously loop track [0 = no, 1 = yes]
	embedVideo: function(id,w,h,file,auto,loop) {
		var embed = document.createElement('embed');
		embed.id = id+'_embed';
		embed.setAttribute('type','application/x-vlc-plugin');

		if (w != undefined) embed.setAttribute('width',w);
		if (h != undefined) embed.setAttribute('height',h);
		if (file != undefined) embed.setAttribute('target',file.replace(/\s/g,'%20'));

		if (auto != undefined) embed.setAttribute('autoplay',auto);
		else embed.setAttribute('autoplay','yes');

		if (loop != undefined) embed.setAttribute('loop',loop);
		else embed.setAttribute('loop','yes');

		//document.getElementsByTagName('body')[0].appendChild(embed);
		document.getElementById(id).appendChild(embed);
		this.obj = embed;
	},

	// embedAudio() : Add a video-less instance of the VLC plugin to the DOM
	//   vid  :  url to audio/video file
	//   auto :  auto play [0 = no, 1 = yes]
	//   loop :  continuously loop track [0 = no, 1 = yes]
	embedAudio: function(id,file,auto,loop) {
		this.embedVideo(id,0,0,file,auto,loop);
	},


	// vlc.audio.toggleMute() : boolean toggle that mutes and unmutes the audio based upon the previous state
	toggleMute: function() {
		this.obj.audio.toggleMute();
	},

	// vlc.audio.mute : boolean value to mute and ummute the audio
	getAudioMute: function() {
		return this.obj.audio.mute;
	},
	setAudioMute: function(m) {
		if(m) this.obj.audio.mute = true;
		else this.obj.audio.mute = false;
	},

	// vlc.audio.volume : a value between [0-200] which indicates a percentage of the volume
	getAudioVolume: function() {
		return this.obj.audio.volume;
	},
	setAudioVolume: function(v) {
		if(v>200) v=200;
		else if (v<0) v=0;
		this.obj.audio.volume = v;
	},

	// vlc.audio.track : a value between [0-65535] which indicates the audio track to play or that is playing (supported in vlc version > 0.8.6)
	getAudioTrack: function() {
		return this.obj.audio.track;
	},
	setAudioTrack: function(t) {
		if (t<0) t=0;
		else if (t>65535) t=65535;
		this.obj.audio.track = t;
	},

	// vlc.audio.channel : an integer between 1 and 5 that indicates which audio channel mode is used, values can be: "1=stereo", "2=reverse stereo", "3=left", "4=right", "5=dolby". Use vlc.audio.channel to check if setting of the new audio channel has succeeded. (supported in vlc version > 0.8.6)
	getAudioChannel: function() {
		return this.obj.audio.channel;
	},
	setAudioChannel: function(c) {
		if (c<1) c=1;
		else if (c>5) c=5;
		this.obj.audio.channel = c;
	},

	// vlc.input.length : length of the input file in number of milliseconds
	getInputLength: function() {
		return this.obj.input.length;
	},

	// vlc.input.fps : frames per second returned as a float
	getInputFps: function() {
		return this.obj.input.fps;
	},

	// vlc.input.hasVout : a boolean that returns true when the video is being displayed, it returns false when video is not displayed
	getInputHasVout: function() {
		return this.obj.input.hasVout;
	},

	// vlc.input.position : normalized position in multimedia stream item given as a float value between [0.0 - 1.0]
	getInputPosition: function() {
		return this.obj.input.position;
	},
	setInputPosition: function(p) {
		if (p<0.00001) p=0.00001; // a value of 0 gives an error
		else if (p>0.99999) p=0.99999; // a value of 1 gives an error
		this.obj.input.position = p;
	},

	// vlc.input.time : the absolute position in time given in milliseconds, this property can be used to seek through the stream
	getInputTime: function() {
		return this.obj.input.time;
	},
	setInputTime: function(t) {
		this.obj.input.time = t;
	},

	// vlc.input.state : current state of the input chain given as enumeration
	// (IDLE/CLOSE=0, OPENING=1, BUFFERING=2, PLAYING=3, PAUSED=4, STOPPING=5, ENDED=6, ERROR=7)
	getInputState: function() {
		return this.obj.input.state;
	},
	setInputState: function(s) {
		this.obj.input.state = s;
	},

	// vlc.input.rate : input speed given as float
	// (1.0 for normal speed, 0.5 for half speed, 2.0 for twice as fast, etc.)
	getInputRate: function() {
		return this.obj.input.rate;
	},
	setInputRate: function(r) {
		this.obj.input.rate = r;
	},

	// vlc.playlist.itemCount : number that returns the amount of items currently in the playlist
	getPlaylistItemCount: function() {
		return this.obj.playlist.itemCount;
	},

	// vlc.playlist.isPlaying : a boolean that returns true if the current playlist item is playing and false when it is not playing
	getPlaylistIsPlaying: function() {
		return this.obj.playlist.isPlaying;
	},

	// vlc.playlist.add(mrl,name,options) : add a playlist item as MRL (Multimedia Resource Locator) with metaname 'name' and options 'options'. 
	// All input values must be given as string.
	playlistAdd: function(mrl,name,options) {
		mrl = mrl.replace(/\s/g,'%20');
		if (name != undefined && options != undefined) 
			this.obj.playlist.add(mrl,name,options);
		else
			this.obj.playlist.add(mrl);
	},

	// vlc.playlist.play() : start playing the current playlist item
	playlistPlay: function() {
		this.obj.playlist.play();
	},

	// vlc.playlist.togglePause() : toggle the pause state for the current playlist item
	togglePause: function() {
		this.obj.playlist.togglePause();
	},

	// vlc.playlist.stop() : stop playing the current playlist item
	playlistStop: function() {
		this.obj.playlist.stop();
	},

	// vlc.playlist.next() : iterate to the next playlist item
	playlistNext: function() {
		this.obj.playlist.next();
	},

	// vlc.playlist.prev() : iterate to the previous playlist item
	playlistPrev: function() {
		this.obj.playlist.prev();
	},

	// vlc.playlist.clear() : empty the current playlist, all items will be deleted from the playlist
	playlistClear: function() {
		this.obj.playlist.clear();
	},

	// vlc.playlist.removeItem(number) : remove the given item number (which cannot be greater then vlc.playlist.itemCount)
	playlistRemoveItem: function(n) {
		this.obj.playlist.removeItem(n);
	},

	// vlc.video.width : returns the horizontal size of the video
	getVideoWidth: function() {
		return this.obj.video.width;
	},
	// vlc.video.height : returns the vertical size of the video
	getVideoHeight: function() {
		return this.obj.video.height;
	},

	// vlc.video.fullscreen : when set to true the video will be displayed in fullscreen mode, when set to false the video will be shown inside the video output size. The property takes a boolean as input.
	getVideoFullscreen: function() {
		return this.obj.video.fullscreen;
	},
	setVideoFullscreen: function(f) {
		this.obj.video.fullscreen = f;
	},

	// vlc.video.aspectRatio : get and set the aspect ratio to use in the video screen. The property takes a string as input value.
	// Valid values are: "1:1", "4:3", "16:9", "16:10", "221:100" and "5:4"
	getVideoAspectRatio: function() {
		return this.obj.video.aspectRatio;
	},
	setVideoAspectRatio: function(r) {
		this.obj.video.aspectRatio = r;
	},
	
	// vlc.video.toggleFullscreen() : toggle the fullscreen mode based on the previous setting
	toggleFullscreen: function() {
		this.obj.video.toggleFullscreen();
	},

	// vlc.log.messages : returns a messages object
	getLogMessages: function() {
		return this.obj.log.messages;
	},

	// vlc.log.verbosity : write number [-1,0,1,2,3] for changing the verbosity level of the log messages.
	// The numbers have the following meaning: -1 disable, 0 info, 1 error, 2 warning, 3 debug.
	getLogVerbosity: function() {
		return this.obj.log.verbosity;
	},
	setLogVerbosity: function(v) {
		if (v<-1) v=-1;
		else if(v>3) v=3;
		this.obj.log.verbosity = v;
	}

	// messages.count : returns number of messages in the log
	// messages.severity : number that indicates the severity of the log message (0 = info, 1 = error, 2 = warning, 3 = debug)
	// message.name : name of VLC module that printed the log message (e.g: main, http, directx, etc...)
	// message.type : type of VLC module that printed the log message (eg: input, access, vout, sout, etc...)
	// message.message : the message text
	// messages.clear() : clear the current log buffer. It should be called as frequently as possible to not overflow the plugins logging buffer. Call this method after the log messages of interest are read.
	// messages.iterator() : returns a messages iterator object, which is used to iterate over the messages in the log. Don't clear the log buffer while holding an iterator object.
});