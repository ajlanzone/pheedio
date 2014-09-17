
var MusicFileModule = Class.create(Module,{
	artist: '',
	album: '',
	file: '',
	cover: '',
	title: '',
	idx: -1,
	initialize: function(parent,file) {
		this.parent = parent;
		this.file = file;
	},
	open: function() {
		g_module.goBack();
		this.add(1);
	},
	add: function(playnow) {
		// Find track in playlist if it's there
		this.idx = g_audio.getIndex(this.title);

		if (!this.cover) this.cover = '/demo/images/nocover_audio.png';

		// Add track if it's not on the playlist
		if (this.idx < 0) this.idx = g_audio.add(this.file,this.cover,this.artist,this.album,this.title);
		
		g_audio.play();

		// Go to the track right now if necessary
		if (playnow) {
			g_audio.gotoTrack(this.idx);
			g_module.nowPlaying();
		}
	}
});
