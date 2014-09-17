
var PlaylistOverlay = Class.create(Overlay, {
	rows: 8,
	to: 0,
	selected: 0,
	initialize: function($super,id) {
		$super(id);

		var d = document.createElement('div');
		d.id = id;
		d.overlay = this;
		//d.style.display = 'none';
		
		var bod = document.getElementsByTagName('body')[0];
		bod.appendChild(d);
		
		$(d).hide();
	},
	show: function() {
		this.idSwap('page_up');
		this.idSwap('page_down');
		this.idSwap('page_num');
		this.idSwap('page_up_img');
		this.idSwap('page_down_img');
		
		$(this.id).innerHTML = '<div id="audioplayer_playlist_header">'
			+ '<div style="position:absolute;top:32px;left:32px;color:#666;font-family:Zekton,ZektonBoldWeb,Tahoma,Verdana,Geneva,sans-serif;font-size:250%;text-transform:lowercase;text-shadow:#444 1px 1px 3px;">playlist</div>'
			+ '<img id="audioplayer_playlist_cover_bg" src="/demo/images/cover-CD.png">'
			+ '<img id="audioplayer_playlist_cover" src="/demo/images/nocover_audio.png">'
			+ '<div id="audioplayer_playlist_title"></div>'
			+ '<div id="audioplayer_playlist_artist"></div>'
			+ '<div id="audioplayer_playlist_album"></div>'
			+ '</div>'
			+ '<div id="audioplayer_playlist_sidebar" class="default_sidebar"></div>'
			+ '<div id="page_up"><img id="page_up_img" style="visibility:hidden;" src="images/other/arrow_u.png" onclick="Pages.prevPage();return false;"></div>'
			+ '<div id="audioplayer_playlist_page_div"></div>'
			+ '<div id="page_down"><span id="page_num"></span><img style="display:none;" id="page_down_img" align="top" src="images/other/arrow_d.png"  onclick="Pages.nextPage();return false;"></div>';

	
		Cell.grid = [];

		try {this.drawPlaylist();}catch(e) { alert('drawPlayist failed: ' + e);}

		Effect.BlindDown(this.id, { scaleX: false, queue: { scope: 'waitfx' } });
		//Effect.Appear(this.id, { scaleX: false, queue: { scope: 'waitfx' } });
		this.to = setInterval(this.updatePlaylist,500);
	},
	hide: function() {
		Effect.BlindUp(this.id, { scaleX: false, queue: { scope: 'waitfx' } });
		//Effect.Fade(this.id, { scaleX: false, queue: { scope: 'waitfx' } });
		if (Cell.sel && Cell.sel.div) this.selected = Cell.sel.div.id;
		if (this.to) clearInterval(this.to);
		this.to = 0;

		this.idSwap('page_up');
		this.idSwap('page_down');
		this.idSwap('page_num');
		this.idSwap('page_up_img');
		this.idSwap('page_down_img');
	},
	registerKeys: function(id) {
		Cell.registerKeys();
		g_audio.registerKeys();
		Keys.register(27, function()  { $(id).overlay.close(); }); // Esc
		Keys.register(8, function()   { $(id).overlay.close(); }); // Backspace
		Keys.register(166, function() { $(id).overlay.close(); }); // Remote Back
		Keys.register(76, function()  { $(id).overlay.close(); }); // L
	},
	addSidebarBtn: function(i,name,icon,func) {
		var d = document.createElement('div');
		d.id = 'pls_side'+i;
		$(d).addClassName('sidebar_off');
		d.onclick = func;
		d.overlay = this;
		d.innerHTML = '<img src="/demo/images/other/toolbar/'+icon+'" style="width:100%;height:100%;position:relative;z-index:9050;">'
			+ '<span class="subtitle" style="line-height:60px;">'+name+'</span>';
		d.style.height = '60px';
				
		d.setAttribute("plrel",(i+1)+",0");
		Cell.setParameters(d);		
	
		$('audioplayer_playlist_sidebar').appendChild(d);
	},
	drawPlaylist: function() {
		$('audioplayer_playlist_page_div').innerHTML = '';
		//if (g_audio.playlist.length < 1) return;
	
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var totWidth = parseInt(getStyle($('audioplayer_playlist_page_div'),'width'));
		var totHeight = parseInt(getStyle($('audioplayer_playlist_page_div'),'height'));

		var border = 2;   // 2px border
		var height = Math.floor(totHeight/this.rows - 2*border);
		var width = Math.floor(totWidth - 2*border - 2*(height+8));
		
		var pwidth = Math.floor(90*scale);
		var qwidth = Math.floor(110*scale);

		// Draw grid divs
		var divs = [];
		for (var i = 0; i < g_audio.playlist.length; i++) {
			// Primary artist item
			var d = document.createElement('div');
			d.id = 'playlist'+i;
			$(d).addClassName('audioplayer_playlist_off');
			d.setAttribute('tindex',i);
			//d.title = this.items[i].tag('title').toUpperCase(); // for sorting
			d.onclick = function() { g_audio.gotoTrack(this.getAttribute('tindex')); }
			
			Cell.setParameters(d);

			var str = '';
			var track = g_audio.playlist[i].track;
			var artist = g_audio.playlist[i].artist;
			var cover = g_audio.playlist[i].cover;
			if (!cover) cover = '/demo/images/nocover_audio.png';
			str += '<img src="'+cover+'" class="cover">';
			str += '<span id="playlist_item'+i+'" style="height:'+height+'px;line-height:'+height+'px;">'+track+' <span class="subtitle"> by '+artist+'</span></span>';
			
			if (g_audio.nowplaying.index == i) str += '<img id="playnow'+i+'" class="playnow" src="/demo/images/eq.gif">';
			else str += '<img id="playnow'+i+'" class="playnow" src="/demo/images/other/toolbar/play-now.png">';
			d.innerHTML = str;

			d.style.width = width+'px';
			d.style.height = height+'px';

			// Move button
			var p = document.createElement('div');
			p.id = 'playlist_move'+i;
			$(p).addClassName('audioplayer_playlist_btn_off');
			p.setAttribute('tindex',i);
			p.onclick = function() { alert('Move does not work yet'); }
			Cell.setParameters(p);
			p.style.width = height+'px';
			p.style.height = height+'px';
			p.style.lineHeight = height+'px';
			
			p.innerHTML =  '<span class="subtitle" style="line-height:'+height+'px;width:'+pwidth+'px;margin-left:-'+(pwidth+height-15)+'px;">Move Track</span>'
				+'<img src="/demo/images/other/toolbar/triangles2.png" style="width:100%;height:100%;">';
	
			// Remove button
			var q = document.createElement('div');
			q.id = 'playlist_remove'+i;
			$(q).addClassName('audioplayer_playlist_btn_off');
			q.setAttribute('tindex',i);
			q.overlay = this;
			q.onclick = function() { 
				g_audio.remove(this.getAttribute('tindex'));
				if (Cell.sel && Cell.sel.div) this.overlay.selected = Cell.sel.div.id;
				this.overlay.drawPlaylist();
			}
			Cell.setParameters(q);
			q.style.width = height+'px';
			q.style.height = height+'px';
			q.style.lineHeight = height+'px';
			
			q.innerHTML = '<span class="subtitle" style="line-height:'+height+'px;width:'+qwidth+'px;margin-left:-'+(qwidth+height-15)+'px;">Remove Track</span>'
				+'<img src="/demo/images/other/toolbar/close.png" style="width:100%;height:100%;">';

			//d.title = d.title + '0';
			divs.push(d);
			divs.push(p);
			divs.push(q);			
		}

		$('audioplayer_playlist_sidebar').innerHTML = '';
		this.addSidebarBtn(0,'Pause','sub_b_pause.png',function() { g_audio.pause(); });
		this.addSidebarBtn(1,'Shuffle','shuffle-OFF.png',function() { g_audio.toggleShuffle(); });
		this.addSidebarBtn(2,'Repeat','repeat-OFF.png',function() { g_audio.toggleRepeat(); });
		this.addSidebarBtn(3,'Clear Playlist','playlist-clear.png',function() { 
			g_audio.clear();
			if (Cell.sel && Cell.sel.div) this.overlay.selected = Cell.sel.div.id;
			this.overlay.drawPlaylist();
		});
		this.addSidebarBtn(4,'Close Playlist','asc.png', function() { this.overlay.close(); });

		// Finalize page
		//if (this.sorted) 
		//divs = divs.sort(function(a,b) {
  		//	if (a.title<b.title) return -1;
  		//	if (a.title>b.title) return 1;
  		//	return 0;
		//});

		Pages.write(divs,this.rows,3,'audioplayer_playlist_page_div','plrel');
		Cell.connectAll('plrel');
		$('page_num').innerHTML = 'Page ' + (Pages.currentpage+1) + ' of ' + Pages.pages.length;
		if (this.selected && $(this.selected)) Cell.select($(this.selected).cell,1);
		else if (Cell.grid[1][1]) Cell.select(Cell.grid[1][1],1);
		else Cell.select(Cell.grid[5][0],1);
		
		this.updatePlaylist();
	},
	//update: function(id,value) {
	//	var d = $(id);
	//	if (d && d.innerHTML != value) d.innerHTML = value;
	//},
	updatePlaylist: function() {
		this.update = function(id,value) {
			var d = $(id);
			if (d && d.innerHTML != value) d.innerHTML = value;
		};
	
		try {
			this.update('audioplayer_playlist_title',(g_audio.nowplaying.track) ? g_audio.nowplaying.track : 'The Playlist is Stopped');
			this.update('audioplayer_playlist_artist',(g_audio.nowplaying.track) ? g_audio.nowplaying.artist : '');
			this.update('audioplayer_playlist_album',(g_audio.nowplaying.track) ? g_audio.nowplaying.album : '');
			$('audioplayer_playlist_cover').src = (g_audio.nowplaying.track) ? g_audio.nowplaying.cover : '/demo/images/nocover_audio.png';
			
			var np = g_audio.nowplaying.index;
			for (var i=0; i<g_audio.playlist.length; i++) {
				if (np == i) {
					if (g_audio.isPlaying()) $('playnow'+i).src = "/demo/images/eq.gif";
					else $('playnow'+i).src = "/demo/images/eq_paused.gif";
				}
				else $('playnow'+i).src = "/demo/images/other/toolbar/play-now.png";
			}
			
			// Sidebar - Play button
			if (g_audio.isPlaying()) this.update('pls_side0', '<img src="/demo/images/other/toolbar/sub_b_pause.png" style="width:100%;height:100%;position:relative;z-index:9050;"><span class="subtitle" style="line-height:60px;">Pause</span>');
			else this.update('pls_side0', '<img src="/demo/images/other/toolbar/sub_b_play.png" style="width:100%;height:100%;position:relative;z-index:9050;"><span class="subtitle" style="line-height:60px;">Play</span>');
			
			// Sidebar - Shuffle button
			if (g_audio.random) this.update('pls_side1', '<img src="/demo/images/other/toolbar/shuffle-ON.png" style="width:100%;height:100%;position:relative;z-index:9050;"><span class="subtitle" style="line-height:60px;">Shuffle</span>');
			else this.update('pls_side1', '<img src="/demo/images/other/toolbar/shuffle-OFF.png" style="width:100%;height:100%;position:relative;z-index:9050;"><span class="subtitle" style="line-height:60px;">Shuffle</span>');
			
			// Sidebar - Repeat button
			if (g_audio.repeat) this.update('pls_side2', '<img src="/demo/images/other/toolbar/repeat-ON.png" style="width:100%;height:100%;position:relative;z-index:9050;"><span class="subtitle" style="line-height:60px;">Repeat</span>');
			else this.update('pls_side2', '<img src="/demo/images/other/toolbar/repeat-OFF.png" style="width:100%;height:100%;position:relative;z-index:9050;"><span class="subtitle" style="line-height:60px;">Repeat</span>');
		} catch(e) { alert('overlay_playlist::updatePlaylist Exception: ' + e); }
	}
});
