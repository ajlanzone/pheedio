// Global module pointer -- everything uses this guy!
var g_module;
var g_size = '668';

function loadjscssfile(filename, filetype){
	if (filetype=="js"){ //if filename is a external JavaScript file
		var fileref=document.createElement("script");
		fileref.setAttribute("type","text/javascript");
		fileref.setAttribute("src", filename);
	}
	else if (filetype=="css"){ //if filename is an external CSS file
		var fileref=document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", filename);
	}
	if (typeof fileref!="undefined")
		document.getElementsByTagName("head")[0].appendChild(fileref);
}

// CSS
//loadjscssfile("css/base_" + g_size + ".css", "css");
//Loadjscssfile("css/lightframe.css", "css");

function initMenu(href) {
	g_module = new DockModule(0,href);
	//g_audio = new AudioPlayer();
	g_audio = new DummyAudioPlayer();

	Keys.register(76, function() { g_audio.overlay.open(); }); // L
	Keys.register(84, function() { g_module.nowPlaying(); }); // T

	if ($('history').value) {
		//alert('Loading history'); // + $('history').value);
		g_module.loadHistory($('history').value);

		var r = window.location.href;
		var i = r.indexOf("#");
		if (i >= 0) {
			var hash = r.substr(i+1).split(',');
			for(var j=1; j<hash.length; j++) { 
				if (g_module.children && g_module.children[hash[j]] != undefined) g_module = g_module.children[hash[j]];
			}
		}
	}
	//else alert('No history');

	g_module.open();
	MouseHider.start();
	Ticker.start();
	Screensaver.loadUrl('demo/pics.txt');
}

//
// Module
// Basic class from which all other modules derive.  Every page in the 
// interface is a module that is opened and closed dynamically.
//
// Modules are expected to implement these functions:
// Required:
//  * open() - called to draw markup
//
// Optional:
//  * clearKeys - called at end to clear any keyboard handlers
//  * registerKeys - called at startup to register keyboard handlers
//
// Note: if an extending class uses an array defined in its parent class, the
// array is shared between all other instances that use that array.  For this
// reason, child classes should re-declare array objects (e.g. children = []) 
// if they are used.
//
var Module = Class.create({
	parent: 0,
	children: [],
	errors: 0, 
	ticker: 1,
	history: '',
	ajaxRequest: 0, // Handle to the Ajax.Request object (used for cancelling request)	
	initialize: function(parent) {
		this.parent = parent;
	},
	close: function() {
		$('content_div').hide();
		$('content_div').childElements().each(function(e) { e.remove(); i++; });
		if(this.clearKeys) this.clearKeys();
		
		// Close error screen (if necessary)
		if(this.errors) {
			this.errors = 0;
			Cell.clearKeys();
			Keys.clear(27); // Esc
			Keys.clear(166); // Remote back
		}
	},
	go: function(module) {
		try {
			// Close current page
			this.close();
		
			// Cancel previous request
			if (this.ajaxRequest) {
				// prevent and state change callbacks from being issued
				this.ajaxRequest.transport.onreadystatechange = Prototype.emptyFunction;
				// abort the XHR
				this.ajaxRequest.transport.abort();
				// update the request counter
				Ajax.activeRequestCount--;
				// clear the pointer
				this.ajaxRequest = 0;
			}
			$('content_div').style.backgroundImage = '';
			$('content_div').innerHTML = '<div style="width:100%;height:100%;background:50% 50% url(images/exec.gif) no-repeat"></div>';
			$('content_div').show();

			// Update location hash (for history)
			//window.location.href = "#" + module.toHash();
			window.location.href = "#" + module.toHash();

			// Save history
			var m = this;
			while (m.parent != 0) m = m.parent;
			$('history').value = m.toXml();
			//if (typeof window.opera !== "undefined") {
			//	$('history').focus(); // Opera needs to focus this element before persisting values in it
			//}

			// Load next page
			g_module = module;
			g_module.open();

			// Start or stop ticker if necessary
			if (parseInt(g_module.ticker,10) == 0) Ticker.stop();
			else Ticker.start();
		} catch(e) { alert('Module.go: ' + e); }
	},
	goBack: function() {
		if(this.parent) this.go(this.parent);
	},
	goChild: function(i) {
		if (this.children[i] != undefined) this.go(this.children[i]);
	},
	loadHistory: function(xml) {
		// Only reload pages that use an external xml feed
		if (this.parseXml) {
			var strs = xml.split('&');
			var needle = this.toHash() + '=';
		
			for (var i=1; i<strs.length; i++) {
				if (strs[i].indexOf(needle) == 0) {
					var x = strs[i].substr(strs[i].indexOf('=')+1);
					this.parseXml(decodeURIComponent(x),0);
					break;
				}
			}
		}
		// Reload children
		this.children.each(function(c) {
			c.loadHistory(xml);
		});
	},	
	refresh: function() {
		this.close(); 
		this.open();
	},	
	toHash: function() {
		if (this.parent == 0) return '0';
		
		var cs = this.parent.children;
		for (var i=0; i<cs.length; i++) {
			if (cs[i] == this) break;
		}
		
		return (this.parent.toHash() + ',' + i);
	},
	toXml: function() {
		var s = '';
		if (this.history) s = '&' + this.toHash() + '=' + encodeURIComponent(this.history);
		this.children.each(function(c) {
  			s += c.toXml();
		});
		return s;			
	},	
	errorScreen: function(text) {
		this.errors = 1; // Flag to clean up error key handlers

		// Set key handlers
		this.clearKeys();
		Cell.registerKeys();
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
		
		// Draw error message
		$('content_div').style.backgroundImage = '';
		$('content_div').innerHTML = 
			'<div class="default_page_title" id="page_title">Error: '+text+'</div>'
			+ '<div id="sidebar" + class="default_sidebar"></div>'
		$('content_div').show();
		
		// Draw sidebar
		this.addSidebarBtn(0,'Retry','rright.png',function() { g_module.refresh(); });
		this.addSidebarBtn(1,'Back','go-back.png',function() { g_module.goBack(); });
		Cell.connectAll();
		Cell.select(Cell.grid[2][0]); // Start with 'Back' selected
	},
	nowPlaying: function() {
		var npm = new NowPlayingModule(this,0);
		this.go(npm);
	},
	addSidebarBtn: function(i,name,icon,func) {
		var d = document.createElement('div');
		d.id = 'side'+i;
		$(d).addClassName('sidebar_off');
		d.onclick = func;
		d.innerHTML = 
			'<img src="/demo/images/other/toolbar/'+icon+'" style="width:100%;height:100%;position:relative;z-index:50;">'
			+ '<span class="subtitle" style="line-height:60px;">'+name+'</span>';
		d.style.height = '60px';
				
		d.setAttribute("rel",(i+1)+",0");
		Cell.setParameters(d);		
	
		$('sidebar').appendChild(d);
	},
	/* These dummy functions are simply for preventing spurious errors */
	shiftDock: function() { /* Do nothing */ },
	drawReflection: function() { /* Do nothing */ },
	formatLink: function(u) { return u; }
});

//
// Menu abstract base class
//
// New menu modules can be created by extending this class.  
//
// Modules are expected to implement these functions:
// Required:
//  * drawMenu() - draws menu markup after the xml config file has loaded
//
// Optional:
//  * clearKeys - called at end to clear any keyboard handlers
//  * registerKeys - called at startup to register keyboard handlers
//  * parseMenuTags - called during xml parsing to load any additional menu parameters
//
var Menu = Class.create(Module,{
	bgImage: '',  //images/bg/'+g_size+'/background.jpg', // Background image of this menu
	children:[],  // Array of child Modules 
	cover: '',    // Cover image for whole menu
	items: 0,     // Array of info on the items in this menu
	prefix: '',   // String prefixed to CSS styles for custom skinning
	selected: 0,  // Reference to the currently selected object 
	sorted: 0,    // Whether or not to sort the items by title
	subtitle: '', // Subtitle -- contains additional info such as description or artist
	title: '',    // Title displayed at top of this menu
	url: '',
	initialize: function(parent,url) {
		this.parent = parent;
		this.url = url;
	},
	open: function() {
		if (this.items) {
			// Use xml feed we already got
			this.drawMenu();
			//if (parseInt(this.ticker)) Ticker.start();
		}
		else {
			// Draw menu for the first time
			var u = this.url;

			if (u.indexOf('http://') == 0) u = "/demo/php/get2.php?s=" + encodeURIComponent(u);
			else if (u.indexOf(':') == 1) u = "/demo/php/local.php?s=" + encodeURIComponent(u); // Windows drive
			else if (u.indexOf('file:') != 0) { 
				// Add timestamp to url
				if (u.indexOf('?') > 0) u += '&refresh=' + (new Date).getTime();
				else u += '?refresh=' + (new Date).getTime();
			}
//alert(u);
			this.ajaxRequest = new Ajax.Request(u, {
				method:'get',
				onSuccess: function(transport){ g_module.parseXml(transport.responseText); },
				onFailure: function(){ g_module.errorScreen('Ajax request failed'); }
			});
		}

		this.registerKeys();
	},
	goBack: function() {
		if(this.parent) {
			this.items = 0; // Force page to reload everytime parent (not child) opens it
			this.go(this.parent);
		}
	},	
	refresh: function($super) {
		this.items = 0;
		$super(); 
	},
	formatLink: function(url) {
		var out = url.replace(/\s/g,'%20'); // Replace spaces with %20
		out = out.replace(/\\/g,'/');       // Replace back slashes with forward slashes
		out = out.replace(/%SIZE%/g,g_size);// Replace %SIZE% with global size variable
		if (out.indexOf(':') == 1) out = '/demo/php/local.php?s=' + out.replace(/&/g,'%26');  // Windows drive letter, e.g. 'C:'
		//if (out.indexOf('//') == 0) alert('Menu trying to access a file on network:\n\n' + url + '\n\nIt won\'t work'); // Windows network file, e.g. '\\laptop'
		return out;
	},
	parseXml: function(xmlText,draw) {
		this.history = xmlText;
//alert(xmlText);
try {
		// Make sure we did not get an html error page instead
		if (xmlText.indexOf('<html') == 0) {
			this.errorScreen('XML feed is invalid');
			return;
		}

		var xmlDoc = Xml.getXmlDoc(xmlText);

		// Get feed info
		var menu = xmlDoc.getElementsByTagName('channel')[0];
		if (!menu) var menu = xmlDoc.getElementsByTagName('feed')[0];
		if (!menu) {
			alert(xmlText);
			this.errorScreen('XML is not well-formed');
			return;
		}

		// Load menu settings
		this.parseMenuTags(menu);

		// Parse items
		var its = xmlDoc.getElementsByTagName('item');
		if (!its || its.length == 0) its = xmlDoc.getElementsByTagName('entry');
		//if (!its || its.length == 0) {
		//	var t = Xml.getTagText(xmlDoc,'title');
		//	if (!t) this.errorScreen('XML feed has no items');
		//	else this.errorScreen(t);
		//	return;
		//}
		
		this.items = [];
		this.children = [];
		for (i=0; i<its.length; i++) {
			this.items[i] = new MenuItem(this,its[i]);
			this.children.push(this.items[i].module);
		}

		if (draw == undefined || draw) {
			this.drawMenu();
			//if (parseInt(this.ticker)) Ticker.start();
		}
} catch(e) { alert('Menu.parseXml(): ' + e); }
	},
	parseMenuTags: function(menu) {
		var t;
		t = Xml.getTagText(menu,'title');
		if (t) this.title = t;
		
		t = Xml.getTagText(menu,'subtitle');
		if (t) this.subtitle = t;
		
		t = Xml.getTagAttribute(menu,'image','href'); // itunes:image
		if (t) this.cover = this.formatLink(t);
		
		t = Xml.getTagText(menu,'background'); // Menu background
		if (t) this.bgImage = this.formatLink(t);
		
		t = Xml.getTagText(menu,'prefix'); // CSS prefix
		if (t) this.prefix = t;
		
		t = Xml.getTagText(menu,'ticker');
		if (t) this.ticker = parseInt(t,10);
	}
});

//
// MenuItem class
//
// Menus are made up of an array of MenuItems.  The items are parsed from the
// menu's xml config file, denoted in xml with <item> tags.  All items are 
// required to specify a module type (in a <module> tag).  Generally, a <title>
// tag is expected as well.  The value of any of an item's xml tags can be read 
// using the tag() function.
//
function MenuItem(parent,obj) {
	this.getCover = function() {
		var cover = Xml.getTagText(this.obj,'cover');
		if (!cover) cover = Xml.getTagAttribute(this.obj,'thumbnail','url'); // media:thumbnail
		if (!cover) cover = parent.cover; // itunes:image
		if (!cover) {
			var c = Xml.getTagText(this.obj,'content');
			if (!c) c = Xml.getTagText(this.obj,'description');
			var i1 = c.indexOf('<img ');
			if (i1 > 0) {
				var i2 = c.indexOf('src="',i1) + 5;
				if (i2 > 5) {
					i1 = c.indexOf('"',i2);
					cover = c.substring(i2,i1);
				}
			}
		}
		return parent.formatLink(cover);
	}

	this.module = 0;
	this.obj = obj;
	var param = Xml.getTagText(obj,'link');
	if (!param) param = Xml.getTagAttribute(obj,'link','href'); // Atom
	
	var type = Xml.getTagAttribute(obj,'link','type');
	if (!type) type = parent.childType;
	
	switch(type) {
	//switch(Xml.getTagAttribute(obj,'link','type')) {	
	//case 'exec': // TODO args
	//	this.module = new ExecModule(parent,param);
	//	this.module.args = Xml.getTagText(obj,'arguments');
	//	break;
	//case 'lastfm_radio_search':
	//	this.module = new LastFMRadioSearchModule(parent,param);
	//	break;
	case 'menu_dock':
		this.module = new DockModule(parent,param);
		break;
	case 'menu_grid':
		this.module = new MenuModule(parent,param);
		
		var t = Xml.getTagAttribute(obj,'link','rows');
		if (t) this.module.rows = parseInt(t,10);
		var t = Xml.getTagAttribute(obj,'link','columns');
		if (t) this.module.cols = parseInt(t,10);
		break;
	case 'menu_hulu':
		this.module = new HuluModule(parent,param);
		break;
	case 'menu_list':
		this.module = new ListModule(parent,param);
		break;
	case 'menu_show':
		this.module = new ShowModule(parent,param);
		break;
	case 'menu_music':
		this.module = new MusicRootModule(parent,param);
		break;
	case 'menu_music_artist':
		this.module = new MusicArtistModule(parent,param);
		break;
	case 'menu_music_album':
		this.module = new MusicAlbumModule(parent,param);
		break;
	case 'menu_movie':
		this.module = new MovieModule(parent,param);
		this.module.title = Xml.getTagText(obj,'title');
		this.module.subtitle = Xml.getTagText(obj,'subtitle');
		this.module.bgImage = parent.formatLink(Xml.getTagText(obj,'background'));
		this.module.description = Xml.getTagText(obj,'description');
		this.module.cover = parent.formatLink(Xml.getTagText(obj,'cover'));
		this.module.year = Xml.getTagText(obj,'year');
		this.module.rating = Xml.getTagText(obj,'rating');
		break;		
	case 'scores':
		this.module = new ScoresModule(parent,param);
		
		var radio = Xml.getTagText(obj,'radio');
		var video = Xml.getTagText(obj,'video');
		var highlights = Xml.getTagText(obj,'highlights');

		if (radio) this.module.radio = radio;
		if (video) this.module.video = video;
		if (highlights) this.module.highlights = highlights;		
		break;
	case 'search':
		this.module = new SearchModule(parent,param);
		t = Xml.getTagAttribute(obj,'link','popup');
		if (t) this.module.popup = parseInt(t,10);
		t = Xml.getTagAttribute(obj,'link','width');
		if (t) this.module.popupWidth = parseInt(t,10);
		t = Xml.getTagAttribute(obj,'link','height');
		if (t) this.module.popupHeight = parseInt(t,10);
		break;
	//case 'slingbox':
	//	this.module = new SlingboxModule(parent,param);
	//	t = Xml.getTagAttribute(obj,'link','minChannel');
	//	if (t) this.module.minCh = parseInt(t,10);
	//	t = Xml.getTagAttribute(obj,'link','maxChannel');
	//	if (t) this.module.maxCh = parseInt(t,10);
	//	break;	
	case 'tvguide':
		this.module = new TVGuideModule(parent,param);
		t = Xml.getTagAttribute(obj,'link','minChannel');
		if (t) this.module.minCh = parseInt(t,10);
		t = Xml.getTagAttribute(obj,'link','maxChannel');
		if (t) this.module.maxCh = parseInt(t,10);
		break;
	case 'audio':
		this.module = new MusicFileModule(parent,param); // TODO set append bit
		
		var cover = parent.formatLink(this.getCover());
		var artist = Xml.getTagText(obj,'artist') || Xml.getTagText(obj,'author');
		var album = Xml.getTagText(obj,'album');
		var track = Xml.getTagText(obj,'title');

		if (cover) this.module.cover = cover;
		if (artist) this.module.artist = artist;
		if (album) this.module.album = album;
		if (track) this.module.title = track;
		break;
	case 'playlist':
		this.module = new PlaylistModule(parent,param); // TODO set append bit
		
		var cover = parent.formatLink(this.getCover());
		var artist = Xml.getTagText(obj,'artist') || Xml.getTagText(obj,'author');
		var album = Xml.getTagText(obj,'album');
		var track = Xml.getTagText(obj,'title');

		if (cover) this.module.cover = cover;
		if (artist) this.module.artist = artist;
		if (album) this.module.album = album;
		if (track) this.module.title = track;
		break;
	case 'video':
		this.module = new VideoModule(parent,param);
		break;
	case 'flashvideo':
		this.module = new FlashVideoModule(parent,param);
		break;
	case 'dummy':
		this.module = new DummyModule(parent,param);
		break;
	case 'disabled':
		this.module = new DisabledModule(parent,param);
		break;		
	case 'href':
		this.module = new HrefModule(parent,param);
		break;
	//case 'weather':
	//	this.module = new WeatherModule(parent,param);
	//	break;
	case 'youtube':
		this.module = new YouTubeModule(parent,param);
		break;
	case 'youtube_feed':
		this.module = new YouTubeFeedModule(parent,param);
		break;
	case 'youtube_search':
		this.module = new YouTubeSearchModule(parent,param);
		//this.module.title = Xml.getTagText(obj,'title');
		break;
	case 'frame':
		this.module = new FrameModule(parent,param);
		
		var t = 0;
		t = Xml.getTagAttribute(obj,'link','width');
		if (t) this.module.width = t;
		t = Xml.getTagAttribute(obj,'link','height');
		if (t) this.module.height = t;
		break;
	default:
		// No type specified. Try to guess the best player using
		// the link's file extension
		
		// Find file extension
		var ext = param.toLowerCase();
		ext = ext.replace(/\\/g,'/'); // Replace back slashes with forward slashes
		while (ext.indexOf('/') >= 0) ext = ext.substr(ext.indexOf('/')+1);
		if (ext.indexOf('/') >= 0) ext.substr(0,ext.indexOf('?')); // Remove ? and following
		while (ext.indexOf('.') >= 0) ext = ext.substr(ext.indexOf('.')+1);

		switch(ext) {
		// Audio player
		case 'mp3':
		case 'wma':
		case 'm4a':
		case 'flac':
		case 'pls':
		case 'm3u':
			this.module = new MusicFileModule(parent,param); // TODO set append bit
			var cover = parent.formatLink(this.getCover());
			var artist = Xml.getTagText(obj,'artist') || Xml.getTagText(obj,'author');
			var album = Xml.getTagText(obj,'album');
			var track = Xml.getTagText(obj,'title');
			
			if (cover) this.module.cover = cover;
			if (artist) this.module.artist = artist;
			if (album) this.module.album = album;
			if (track) this.module.title = track;
			break;
		// Video player
		case 'avi':
		case 'mov':
		case 'm4v':
		case 'wmv':
		case 'divx':
		case 'mpg':
		case 'mkv':
			this.module = new VideoModule(parent,param);
			break;
		case 'flv':
		case 'mp4':
			this.module = new FlashVideoModule(parent,param);
			break;
		// RSS Feed - list module
		case 'xml':
			this.module = new ListModule(parent,param);
			break;
		default:
			if (param.indexOf('youtube') > 0) this.module = new YouTubeModule(parent,param);
			else this.module = new HrefModule(parent,param);
			break;		
		}
		
		
		break;
	}
	
	// Set title to default (the feed may change it)
	this.module.title = Xml.getTagText(obj,'title');

	// Set inline module parameters stored in link tag
	// (useful if source is an external RSS feed)
	var t = 0;
	t = Xml.getTagAttribute(obj,'link','background');
	if (t) this.module.bgImage = parent.formatLink(t);
	
	t = Xml.getTagAttribute(obj,'link','prefix');
	if (t) this.module.prefix = t;
	
	t = Xml.getTagAttribute(obj,'link','rows');
	if (t) this.module.rows = parseInt(t,10);
	
	t = Xml.getTagAttribute(obj,'link','sort');
	if (t) this.module.sorted = parseInt(t,10);
	
	
	t = Xml.getTagAttribute(obj,'link','childType');
	if (t) this.module.childType = t;
	

	// Function to get a tag from associated xml object	
	this.tag = function(t) {
		return Xml.getTagText(this.obj,t);
	};
}


var Overlay = Class.create({
	id: '',
	result: 0,
	//snapshot: 0,
	initialize: function(id) {
		this.id = id;
	},
	open: function() {
		if ($(this.id)) {
			//this.snapshot = new PageSnapshot();
			Pages.snapshot();
			Cell.clearAll();
			
			Keys.snapshot();
			Keys.clearAll();

			if (this.show) this.show(); // Custom show function
			else $(this.id).show();     // Default show function

			if(this.registerKeys) this.registerKeys(this.id);
		}
	},
	close: function() {
		if ($(this.id)) {
			if (this.hide) this.hide(); // Custom hide function
			else $(this.id).hide();     // Default hide function
	try {
			//this.snapshot.revert();
			Pages.revert();
	} catch(ea) { alert('Overlay::closeA: ' + ea); }
	try {
			Keys.revert();
	} catch(e) { alert('Overlay::closeB: ' + e); }
		}
	},
	idSwap: function(id) {
		// Lets you add a divs with duplicate ids.  It changes the name of the
		// the conflicting div and hides it.  A second call to idSwap() 
		// reverts back to the original state.
		var on = $(id);
		var off = $(id+"_idSwapped");
		
		if (off) off.id = id + "_temp1234567890";
		if (on) {
			on.id = id + "_idSwapped";
			on.hide();
		}
		if (off) {
			off.id = id;
			off.show();
		}
	},
});


/*-----------------------------------------------------------------------------------------------*/

// Pagination functions
var Pages = new function() {
	this.currentpage = 0;
	this.pages = [];
	this.pagerows = 0;
	this.pagecols = 0;
	this.stack = [];

	this.write = function(items,rows,cols,divid,attr) {
		if (!attr || attr == undefined) attr = "rel";
	
		var i = 0;
		this.pagerows = rows;
		this.pagecols = cols;
		this.pages = [];
		this.currentpage = 0;
try{		
		for (p=0; p<Math.ceil(items.length / (rows*cols)); p++) {
			var page = document.createElement('div');
			page.className = 'page';
			var page2 = document.createElement('div');

			for (r=0;r<rows&&i<items.length;r++) {
				for(c=0;c<cols&&i<items.length;c++) {
					page2.appendChild(items[i]);
					items[i].setAttribute(attr,(p*rows+r+1)+","+(c+1)+"," + items[i].getAttribute(attr));
					i++;
				}		
			}		
			page.id = divid+"_page"+p;
			if (p>0) page.style.display="none";

			page.appendChild(page2);
			this.pages[p] = page;	
		}
		//Keys.setPrereq(Pages.isReady);
		
		this.pages.each(function(p) { $(divid).appendChild(p); });
		
		// Show down arrow if more than one page
		if ($('page_down_img') && this.pages.length > 1) $('page_down_img').style.display = 'inline';
}catch(e) { alert('Page.write(): ' + e); }
	};

	this.gotoPage = function(p,sel,fast) {
		if (this.pages[this.currentpage] == undefined || this.pages[p] == undefined) return;
		if (fast == undefined) fast = 0;
	
		// Wait for effects to finish
		if (!Pages.isReady()) {
			//setTimeout("Pages.gotoPage("+p+","+sel+")",100);
			return;
		}
		if (p == this.currentpage) return;

		// Scroll current page out of view
		if (fast) this.pages[this.currentpage].hide();
		else {
			if (p>this.currentpage) Effect.SlideUp(this.pages[this.currentpage].id, {queue: { scope: 'waitfx' }});
			Effect.Fade(this.pages[this.currentpage].id, {queue: { scope: 'waitfx' }});
		}

		// Adjust selected item
		if (sel) {
			var test = Cell.sel;
			var delta = Math.abs(p-this.currentpage);	
			//if (p == (this.pages.length-1) && (Cell.grid.length % this.pagerows) == 1 && Cell.grid[Cell.grid.length-1].length < this.pagecols) {
			//	test = Cell.grid[Cell.grid.length-1][0];
			//}
			//else 
			if (p>this.currentpage)
				for (i=0;i<delta*this.pagerows&&test.down;i++) test = test.down;
			else if (p<this.currentpage)
				for (i=0;i<delta*this.pagerows&&test.up;i++) test = test.up;
		}

		// Scroll new page into view
		if (fast) this.pages[p].show();
		else {
			//if (p>this.currentpage) Effect.Appear(this.pages[p].id, { duration: 0.0, queue: { scope: 'waitfx' } }); 
			//else Effect.SlideDown(this.pages[p].id, {queue: { scope: 'waitfx' }});
			Effect.Appear(this.pages[p].id, { queue: { scope: 'waitfx' } }); 
			if (p<=this.currentpage) Effect.SlideDown(this.pages[p].id, {queue: { scope: 'waitfx' }});
		}
		
		this.currentpage = p;
		if (sel) Cell.select(test);
		else Cell.select(Cell.grid[this.currentpage*this.pagerows+1][1]);
		
		// Connect side bar to current page
		Cell.grid.each(function(g) {
			if (g[0] && Cell.grid[this.currentpage*this.pagerows+1]) g[0].right = Cell.grid[this.currentpage*this.pagerows+1][1];
		});
		
		// Update page number (if the object exists)
		if ($('page_num')) $('page_num').innerHTML = 'Page ' + (this.currentpage+1) + ' of ' + Math.max(1,this.pages.length);
		
		if ($('page_up_img')) {
			if (this.currentpage == 0) $('page_up_img').style.visibility = 'hidden';
			else $('page_up_img').style.visibility = 'visible';
		}
		if ($('page_down_img')) {
			if (this.currentpage == this.pages.length-1) $('page_down_img').style.visibility = 'hidden';
			else $('page_down_img').style.visibility = 'visible';
		}
	};
	this.prevPage = function() { 
		if (Pages.currentpage > 0) Pages.gotoPage(Pages.currentpage-1,1);
		else if (Cell.grid[1][1]) Cell.select(Cell.grid[1][1]);
	};
	this.nextPage = function() { 
		if (Pages.currentpage < Pages.pages.length-1) Pages.gotoPage(Pages.currentpage+1,1);
		else {
			var s = Cell.sel;
			while (s.right) s = s.right;
			Cell.select(s);
		}
	};
	this.isReady = function() {
		// Wait for effects to finish
		var queue = Effect.Queues.get('waitfx');
		return (queue.size() == 0);
	};
	this.snapshot = function() {
		var ss = new PageSnapshot();
		this.stack.push(ss);
	};
	this.revert = function() {
		var ss = this.stack.pop();
		Cell.grid = ss.cellGrid;
		Cell.sel = ss.cellSel;

		Pages.currentpage = ss.currentpage;
		Pages.pages = ss.pages;
		Pages.pagerows = ss.pagerows;
		Pages.pagecols = ss.pagecols;
		
		if (Cell.sel) Cell.sel.focus();
	}
};

/*-----------------------------------------------------------------------------------------------*/

var Cell = Class.create({
	initialize: function(dv,attr) {
		this.div = dv;
		dv.cell = this;
		this.up = 0;
		this.down = 0;
		this.left = 0;
		this.right = 0;		

		var coords = dv.getAttribute(attr).split(',');
		this.row = coords[0];
		this.col = coords[1];
		
		Event.observe(dv, "mouseover", Cell.hover, false);
		
		if (!Cell.grid[this.row]) Cell.grid[this.row] = [];
		Cell.grid[this.row][this.col] = this;	
	},
	activate: function() {
		if (this.div.onclick) this.div.onclick();
	},
	focus: function() {
		if (this.div.onmouseover) this.div.onmouseover();
	},
	blur: function() {
		if (this.div.onmouseout) this.div.onmouseout();
	}
});

Cell.prototype.grid = [];
Cell.prototype.mouseY = 0;
Cell.prototype.sel = 0;

Cell.select = function(c,fast) {
	if (fast == undefined) fast = 0;

	if (!c || c == Cell.sel || c.div == undefined) return;
	else if (c.col != 0) {
		var newpage = Math.floor((c.row-1) / Pages.pagerows);
		if (newpage >= 0 && newpage != this.currentpage) {
			Pages.gotoPage(newpage,0,fast);
		}
	}
	// Connect side bar to current item
	else if (Cell.sel && Cell.sel.col != 0) {
		Cell.grid.each(function(g) {
			if (g[0]) g[0].right = Cell.sel;
		});
	}

	if (Cell.sel) Cell.sel.blur();
	Cell.sel = c;
	Cell.sel.focus();
}

Cell.hover = function(e) {
	if (!e) var e = window.event;
	
	// Make sure mouse is moving, not just the screen scrolling
	if (Cell.mouseY == e.screenY) return;
	else Cell.mouseY = e.screenY;
	
	var d = (e.target || e.srcElement);
	while (!d.cell && d != document) d = d.parentNode;
	if (d.cell) Cell.select(d.cell);
}

// Used during object creation
Cell.setParameters = function(elem) {
	$(elem).addClassName('keyOn');
	elem.onmouseover = function() { this.className = this.className.replace('_off','_on'); }
	elem.onmouseout = function() { this.className = this.className.replace('_on','_off'); }
}

Cell.registerKeys = function() {
	Keys.register(37, function() { Cell.select(Cell.sel.left); });
	Keys.register(38, function() { Cell.select(Cell.sel.up); });
	Keys.register(39, function() { Cell.select(Cell.sel.right); });
	Keys.register(40, function() { Cell.select(Cell.sel.down); });
	
	Keys.register(33, Pages.prevPage); // PgUp
	Keys.register(34, Pages.nextPage); // PgDn
	Keys.register(35, function() { Pages.gotoPage(Pages.pages.length-1,1); }); // End
	Keys.register(36, function() { Pages.gotoPage(0,1); }); // Home

	Keys.register(13, function() { Cell.sel.activate(); }); // Enter
}

Cell.clearKeys = function() {
	Keys.clear(37); // Left
	Keys.clear(38); // Up
	Keys.clear(39); // Right
	Keys.clear(40); // Down
	
	Keys.clear(33); // PgUp
	Keys.clear(34); // PgDn
	Keys.clear(35); // End
	Keys.clear(36); // Home

	Keys.clear(13); // Enter
}

Cell.clearAll = function() {
	Cell.grid = [];
	Cell.sel = 0;
}

// Make all links that need to trigger a lightframe active
Cell.connectAll = function(attr,newsel) {
	if (!attr || attr == undefined) attr = "rel";
	Cell.grid = [];
	$$('.keyOn').each(function(d) {
		if (d.getAttribute(attr) != undefined) new Cell(d,attr);
	});

	// Connect all the cells
	var rmax = Cell.grid.length-1;
	for(row = 0; row <= rmax; row++) {
		if (!Cell.grid[row]) continue;
		
		var cmax = Cell.grid[row].length-1;
		for(col = 0; col <= cmax; col++) {
			if (!Cell.grid[row][col]) continue;
			
			// Up/Down
			var r = row-1;
			while(!Cell.grid[row][col].up && r >= 0) {
				if (Cell.grid[r] && Cell.grid[r][col]) {
					Cell.grid[row][col].up = Cell.grid[r][col];
					Cell.grid[row][col].down = Cell.grid[r][col].down;
					Cell.grid[r][col].down = Cell.grid[row][col];
					
					//if (row == 0) {
					//	Cell.grid[0][col].up = Cell.grid[rmax][col];
					//	Cell.grid[rmax][col].down = Cell.grid[0][col];
					//}
					//alert("Connecting (" + row + "," + col + ") to (" + r + "," + col + ")");
				}
				r--;
			}
			
			// Left/Right
			r = row;
			do {
				var c = col-1;
				while(!Cell.grid[row][col].left && c >= 0) {
					if (Cell.grid[r] && Cell.grid[r][c]) {
						Cell.grid[row][col].left = Cell.grid[r][c];
						if (r == row) {
							Cell.grid[row][col].right = Cell.grid[row][c].right;
							Cell.grid[row][c].right = Cell.grid[row][col];
						}
					}
					c--;
				}				
				r--;
				
				if (c >= 0) r = -1;
			} while (r >= 0);
			
			if (col == cmax && !Cell.grid[row][col].right && Cell.grid[row+1]) Cell.grid[row][col].right = Cell.grid[row+1][1]; 
			//else if (col == 1 && !Cell.grid[row][col].left && Cell.grid[row-1]) Cell.grid[row][col].left = Cell.grid[row-1][cmax];
		}
	}

	// Connect top of sidebar to bottom so it loops
	if (Cell.grid[1] && Cell.grid[1][0]) {
		var b = Cell.grid[1][0];
		while (b.down) b = b.down;
		b.down = Cell.grid[1][0];
		Cell.grid[1][0].up = b;
	}

	if (Cell.grid[1] && Cell.grid[1][1]) Cell.select(Cell.grid[1][1]);
}

function PageSnapshot() {
	this.cellGrid = Cell.grid;
	this.cellSel = Cell.sel;
	
	this.currentpage = Pages.currentpage;
	this.pages = Pages.pages;
	this.pagerows = Pages.pagerows;
	this.pagecols = Pages.pagecols;
}

Keys.setPrereq(Pages.isReady);

/*-----------------------------------------------------------------------------------------------*/

function getXMLField(xmlText,field) {
	var start = xmlText.toLowerCase().indexOf("<" + field.toLowerCase() + ">");
	if (!start) {
		start = xmlText.toLowerCase().indexOf("<" + field.toLowerCase() + " ");
		start = xmlText.toLowerCase().indexOf(">",start) + 1;
	}
	else start += field.length + 2;
	var end = xmlText.toLowerCase().indexOf("<\/" + field.toLowerCase() + ">");
	return xmlText.substring(start,end);
}
function getXMLParam(xmlText,param,field) {
	//var start;
	//if (field) start = xmlText.toLowerCase().indexOf("<" + field.toLowerCase() + " ") + field.length + 2;
	//start = xmlText.toLowerCase().indexOf(param.toLowerCase() + '="') + param.length + 2;
	//var end = xmlText.indexOf('"',start);
	//return xmlText.substring(start,end);
	
	// Search the tag for the desired parameter
	var i1 = xmlText.toLowerCase().indexOf(param.toLowerCase()+'="');
	if (i1 < 0) return 0;
	else i1 += param.length + 2;

	var i2 = xmlText.indexOf('"', i1);
	if (i2 < 0) return 0;
		
	return xmlText.substring(i1,i2);	
}

function getStyle(x,styleProp)
{
	if (!x) return undefined;
	if (x.currentStyle)
		var y = x.currentStyle[styleProp];
	else if (window.getComputedStyle)
		var y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp);
	return y;
}

function listProperties(obj) {
	var out = "";
	for(var key in obj){
		out += key + "\n";
	}
	return out;
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
