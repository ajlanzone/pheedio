
var PlaylistModule = Class.create(Module,{
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
		// Fetch playlist file
		var u = this.file;

		if (u.indexOf('http://') == 0) u = "/demo/php/get.php?s=" + encodeURIComponent(u);
		else if (u.indexOf(':') == 1) u = "/demo/php/local.php?s=" + encodeURIComponent(u); // Windows drive
		else if (u.indexOf('file:') != 0) { 
			// Add timestamp to url
			if (u.indexOf('?') > 0) u += '&refresh=' + (new Date).getTime();
			else u += '?refresh=' + (new Date).getTime();
		}
//alert(u);
		this.ajaxRequest = new Ajax.Request(u, {
			method:'get',
			onSuccess: function(transport){ g_module.parsePlaylist(transport.responseText); },
			onFailure: function(){ g_module.errorScreen('Ajax request failed'); }
		});
	},
	parsePlaylist: function(playlist) {
//alert(playlist);
		try {
			g_audio.clear();

			// Find file extension
			var ext = this.file.toLowerCase();
			ext = ext.replace(/\\/g,'/'); // Replace back slashes with forward slashes
			while (ext.indexOf('/') >= 0) ext = ext.substr(ext.indexOf('/')+1);
			if (ext.indexOf('/') >= 0) ext.substr(0,ext.indexOf('?')); // Remove ? and following
			while (ext.indexOf('.') >= 0) ext = ext.substr(ext.indexOf('.')+1);

			// M3U Playlist
			if (ext == 'm3u') {
				var lines = playlist.split('\n');
				lines.each(function(l) { 
					l = l.trim();
					if (l.charAt(0) == '#') return;
					var idx = g_audio.add(l,g_module.cover,g_module.artist,g_module.album,g_module.title);
				});
			}
			// PLS Playlist
			else if (ext == 'pls') {
				var lines = playlist.split('\n');
				lines.each(function(l) { 
					l = l.trim();

					// Only parse lines that start 'FileX=...'
					if (l.substr(0,4).toLowerCase() == 'file') {
						// Split line at '='
						var i1 = l.indexOf('=');
						if (i1 <= 0) return;
						var link = l.substr(i1+1);

						var idx = g_audio.add(link,g_module.cover,g_module.artist,g_module.album,g_module.title);
					}
				});		
			}
			// ASX Playlist
			else if (ext == 'asx') {
				var tags = playlist.split('<');
				tags.each(function(item) { 
					item = item.trim();
					var litem = item.toLowerCase();

					var i1 = item.indexOf('>');
					var i2 = item.indexOf(' ');
					if (i1 <= 0) i1 = item.length;
					if (i2 <= 0) i2 = item.length;
					var tag = litem.substr(0,Math.min(i1,i2));

					// Skip some tags
					if (tag == 'ref') {
						// Find href
						var h1 = litem.indexOf('href');
						if (h1 <= 0) return;
						var h2 = litem.indexOf('"', h1);
						if (h2 <= 0) return;
						else h2++;
						var h3 = litem.indexOf('"', h2);
						if (h3 <= 0) return;
						var link = item.substring(h2,h3);

						var idx = g_audio.add(link,g_module.cover,g_module.artist,g_module.album,g_module.title);
					}	
				});		
			}
			else g_module.errorScreen('Unknown playlist format: ' + ext);

			g_audio.play();
			g_module.goBack();
			g_module.nowPlaying();
		} catch(e) { g_module.errorScreen('parsePlaylist: ' + e); }
	}
});
