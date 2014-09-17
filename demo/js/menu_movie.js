
var MovieModule = Class.create(Module, {
	bgImage: '',
	cover: '',
	description: '',
	subtitle: '',
	rating: '',
	ticker: 0,
	title: '',	
	video: '',
	year: '',
	initialize: function(parent,video) {
		this.parent = parent;
		this.video = video;
		this.children = [];
		//this.children[0] = new VideoModule(this,video);
		
		var ext = video.toLowerCase();
		ext = ext.replace(/\\/g,'/'); // Replace back slashes with forward slashes
		while (ext.indexOf('/') >= 0) ext = ext.substr(ext.indexOf('/')+1);
		if (ext.indexOf('/') >= 0) ext.substr(0,ext.indexOf('?')); // Remove ? and following
		while (ext.indexOf('.') >= 0) ext = ext.substr(ext.indexOf('.')+1);

		switch(ext) {
		case 'mp3':
		case 'wma':
		case 'm4a':
		case 'flac':
		case 'pls':
		case 'm3u':
			this.children[0] = new MusicFileModule(this,video);
			break;
		case 'avi':
		case 'mov':
		case 'flv':
		case 'm4v':
		case 'mp4':
		case 'wmv':
		case 'divx':
		case 'mpg':
		case 'mkv':
			this.children[0] = new DisabledModule(this,'Movie');
			break;
		default:
			this.children[0] = new HrefModule(this,video);
			break;
		}
	},
	open: function() {
		this.drawMenu();
		this.registerKeys();
	},	
	registerKeys: function() {
		Keys.register(38, function() { Cell.select(Cell.sel.up); }); // Up
		Keys.register(40, function() { Cell.select(Cell.sel.down); }); // Down
	
		Keys.register(13, function() { Cell.sel.activate(); }); // Enter
	
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
	},
	clearKeys: function() {
		Keys.clear(38); // Up
		Keys.clear(40); // Down
	
		Keys.clear(13); // Enter
		
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	drawSidebar: function() {
		// By default, the sidebar only has a back button
		//if (this.parent) this.addSidebarBtn(0,'Back','go-back.png',function() { g_module.goBack(); });
	},
	drawMenu: function() {
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
	
		$('content_div').hide();
		var html =  '<img id="content_bg" src="'+this.bgImage+'">';//<div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>';
		html += '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>';
		html += '<div id="movie_info">';
		if (this.cover) html += '<img id="movie_cover" src="'+this.cover+'" class="cover">';
		html += '<div>';
		html += '<span id="movie_title">'+this.title+'</span>';
		if (this.subtitle) html += ' <span id="movie_subtitle">'+this.subtitle+'</span>';
		if (this.year) html += ' <span id="movie_year">('+this.year+')</span>';
		html += '</div>';
		html += '<div id="movie_description">'+this.description+'</div>';
		html += '</div>'; // end of move_info
		html += '<div id="movie_buttons"></div>';
		$('content_div').innerHTML = html;

		Effect.Appear('content_div', { duration:0.5 });			
		
		// Play button
		var d = document.createElement('div');
		d.id = 'item0';
		$(d).addClassName('default_movie_btn_off');
		$(d).addClassName(this.prefix+'_movie_btn_off');
		Cell.setParameters(d);
		d.onclick = function() { g_module.goChild(0); }
		d.setAttribute("rel","1,0");
		d.innerHTML = '<img src="images/other/toolbar_flat/play.png" align="top" style="height:100%;float:left;margin-right:-60px;"> Play Movie';
		$('movie_buttons').appendChild(d);
		
		// Back button
		d = document.createElement('div');
		d.id = 'item1';
		$(d).addClassName('default_movie_btn_off');
		$(d).addClassName(this.prefix+'_movie_btn_off');
		Cell.setParameters(d);
		d.onclick = function() { g_module.goBack(); }
		d.setAttribute("rel","2,0");
		d.innerHTML = '<img src="images/other/toolbar_flat/go-back.png" align="top" style="height:100%;float:left;margin-right:-60px;"> Back';
		$('movie_buttons').appendChild(d);

		// Finalize page
		Cell.connectAll();
		Cell.select(Cell.grid[1][0]);

	}
});
