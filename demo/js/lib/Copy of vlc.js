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

// vlc_embedVideo() : Add an instance of the VLC plugin to the DOM
//   w    : width of video area in pixels
//   h    : height of video area in pixels
//   vid  : url to audio/video file
//   auto : auto play [0 = no, 1 = yes]
//   loop : continuously loop track [0 = no, 1 = yes]
function vlc_embedVideo(id,w,h,vid,auto,loop) {
	var embed = document.createElement('embed');
	embed.id = 'vlc';
	embed.setAttribute('type','application/x-vlc-plugin');
	
	if (w != undefined) embed.setAttribute('width',w);
	if (h != undefined) embed.setAttribute('height',h);
	if (vid != undefined) embed.setAttribute('target',vid);
	
	if (auto != undefined) embed.setAttribute('autoplay',auto);
	else embed.setAttribute('autoplay','yes');
	
	if (loop != undefined) embed.setAttribute('loop',loop);
	else embed.setAttribute('loop','yes');
	
	//document.getElementsByTagName('body')[0].appendChild(embed);
	document.getElementById(id).appendChild(embed);
}

// vlc_embedAudio() : Add a video-less instance of the VLC plugin to the DOM
//   vid  : url to audio/video file
//   auto : auto play [0 = no, 1 = yes]
//   loop : continuously loop track [0 = no, 1 = yes]
function vlc_embedAudio(id,vid,auto,loop) {
	vlc_embedVideo(id,0,0,vid,auto,loop);
}


// vlc.audio.toggleMute() : boolean toggle that mutes and unmutes the audio based upon the previous state
function vlc_toggleMute() {
	$('vlc').audio.toggleMute();
}

// vlc.audio.mute : boolean value to mute and ummute the audio
function vlc_getAudioMute() {
	return $('vlc').audio.mute;
}
function vlc_setAudioMute(m) {
	if(m) $('vlc').audio.mute = true;
	else $('vlc').audio.mute = false;
}

// vlc.audio.volume : a value between [0-200] which indicates a percentage of the volume
function vlc_getAudioVolume() {
	return $('vlc').audio.volume;
}
function vlc_setAudioVolume(v) {
	if(v>200) v=200;
	else if (v<0) v=0;
	$('vlc').audio.volume = v;
}

// vlc.audio.track : a value between [0-65535] which indicates the audio track to play or that is playing (supported in vlc version > 0.8.6)
function vlc_getAudioTrack() {
	return $('vlc').audio.track;
}
function vlc_setAudioTrack(t) {
	if (t<0) t=0;
	else if (t>65535) t=65535;
	$('vlc').audio.track = t;
}

// vlc.audio.channel : an integer between 1 and 5 that indicates which audio channel mode is used, values can be: "1=stereo", "2=reverse stereo", "3=left", "4=right", "5=dolby". Use vlc.audio.channel to check if setting of the new audio channel has succeeded. (supported in vlc version > 0.8.6)
function vlc_getAudioChannel() {
	return $('vlc').audio.channel;
}
function vlc_setAudioChannel(c) {
	if (c<1) c=1;
	else if (c>5) c=5;
	$('vlc').audio.channel = c;
}

// vlc.input.length : length of the input file in number of milliseconds
function vlc_getInputLength() {
	return $('vlc').input.length;
}

// vlc.input.fps : frames per second returned as a float
function vlc_getInputFps() {
	return $('vlc').input.fps;
}

// vlc.input.hasVout : a boolean that returns true when the video is being displayed, it returns false when video is not displayed
function vlc_getInputHasVout() {
	return $('vlc').input.hasVout;
}

// vlc.input.position : normalized position in multimedia stream item given as a float value between [0.0 - 1.0]
function vlc_getInputPosition() {
	return $('vlc').input.position;
}
function vlc_setInputPosition(p) {
	if (p<0.00001) p=0.00001; // a value of 0 gives an error
	else if (p>0.99999) p=0.99999; // a value of 1 gives an error
	$('vlc').input.position = p;
}

// vlc.input.time : the absolute position in time given in milliseconds, this property can be used to seek through the stream
function vlc_getInputTime() {
	return $('vlc').input.time;
}
function vlc_setInputTime(t) {
	$('vlc').input.time = t;
}

// vlc.input.state : current state of the input chain given as enumeration
// (IDLE/CLOSE=0, OPENING=1, BUFFERING=2, PLAYING=3, PAUSED=4, STOPPING=5, ERROR=6)
function vlc_getInputState() {
	return $('vlc').input.state;
}
function vlc_setInputState(s) {
	$('vlc').input.state = s;
}

// vlc.input.rate : input speed given as float
// (1.0 for normal speed, 0.5 for half speed, 2.0 for twice as fast, etc.)
function vlc_getInputRate() {
	return $('vlc').input.rate;
}
function vlc_setInputRate(r) {
	$('vlc').input.rate = r;
}

// vlc.playlist.itemCount : number that returns the amount of items currently in the playlist
function vlc_getPlaylistItemCount() {
	return $('vlc').playlist.itemCount;
}

// vlc.playlist.isPlaying : a boolean that returns true if the current playlist item is playing and false when it is not playing
function vlc_getPlaylistIsPlaying() {
	return $('vlc').playlist.isPlaying;
}

// vlc.playlist.add(mrl,name,options) : add a playlist item as MRL (Multimedia Resource Locator) with metaname 'name' and options 'options'. 
// All input values must be given as string.
function vlc_playlistAdd(mrl,name,options) {
	if (name != undefined && options != undefined) 
		$('vlc').playlist.add(mrl,name,options);
	else
		$('vlc').playlist.add(mrl);
}

// vlc.playlist.play() : start playing the current playlist item
function vlc_playlistPlay() {
	$('vlc').playlist.play();
}

// vlc.playlist.togglePause() : toggle the pause state for the current playlist item
function vlc_togglePause() {
	$('vlc').playlist.togglePause();
}

// vlc.playlist.stop() : stop playing the current playlist item
function vlc_playlistStop() {
	$('vlc').playlist.stop();
}

// vlc.playlist.next() : iterate to the next playlist item
function vlc_playlistNext() {
	$('vlc').playlist.next();
}

// vlc.playlist.prev() : iterate to the previous playlist item
function vlc_playlistPrev() {
	$('vlc').playlist.prev();
}

// vlc.playlist.clear() : empty the current playlist, all items will be deleted from the playlist
function vlc_playlistClear() {
	$('vlc').playlist.clear();
}

// vlc.playlist.removeItem(number) : remove the given item number (which cannot be greater then vlc.playlist.itemCount)
function vlc_playlistRemoveItem(n) {
	$('vlc').playlist.removeItem(n);
}

// vlc.video.width : returns the horizontal size of the video
function vlc_getVideoWidth() {
	return $('vlc').video.width;
}
// vlc.video.height : returns the vertical size of the video
function vlc_getVideoHeight() {
	return $('vlc').video.height;
}

// vlc.video.fullscreen : when set to true the video will be displayed in fullscreen mode, when set to false the video will be shown inside the video output size. The property takes a boolean as input.
function vlc_getVideoFullscreen() {
	return $('vlc').video.fullscreen;
}
function vlc_setVideoFullscreen(f) {
	$('vlc').video.fullscreen = f;
}

// vlc.video.aspectRatio : get and set the aspect ratio to use in the video screen. The property takes a string as input value.
// Valid values are: "1:1", "4:3", "16:9", "16:10", "221:100" and "5:4"
function vlc_getVideoAspectRatio() {
	return $('vlc').video.aspectRatio;
}
function vlc_setVideoAspectRatio(r) {
	$('vlc').video.aspectRatio = r;
}

// vlc.video.toggleFullscreen() : toggle the fullscreen mode based on the previous setting
function vlc_toggleFullscreen() {
	$('vlc').video.toggleFullscreen();
}

// vlc.log.messages : returns a messages object
function vlc_getLogMessages() {
	return $('vlc').log.messages;
}

// vlc.log.verbosity : write number [-1,0,1,2,3] for changing the verbosity level of the log messages.
// The numbers have the following meaning: -1 disable, 0 info, 1 error, 2 warning, 3 debug.
function vlc_getLogVerbosity() {
	return $('vlc').log.verbosity;
}
function vlc_setLogVerbosity(v) {
	if (v<-1) v=-1;
	else if(v>3) v=3;
	$('vlc').log.verbosity = v;
}

// messages.count : returns number of messages in the log
// messages.severity : number that indicates the severity of the log message (0 = info, 1 = error, 2 = warning, 3 = debug)
// message.name : name of VLC module that printed the log message (e.g: main, http, directx, etc...)
// message.type : type of VLC module that printed the log message (eg: input, access, vout, sout, etc...)
// message.message : the message text
// messages.clear() : clear the current log buffer. It should be called as frequently as possible to not overflow the plugins logging buffer. Call this method after the log messages of interest are read.
// messages.iterator() : returns a messages iterator object, which is used to iterate over the messages in the log. Don't clear the log buffer while holding an iterator object.
