var Keys = new function() {
	this.funcs = [];
	this.checks = [];
	this.snapshots = [];
	
	this.META_NONE = 0;
	this.META_ALT = 1;
	this.META_CTRL = 2;
	this.META_SHIFT = 4;
	
	this.handler = function(e) {
		if (!Keys.isReady()) return false;
		
   		//var key  = (window.event) ? event.keyCode : e.keyCode;
   		var evt = (window.event) ? event : e;
   		var key = evt.keyCode;
   		
   		var meta = 0;
		if (evt.altKey) meta |= Keys.META_ALT;
		if (evt.ctrlKey) meta |= Keys.META_CTRL;
		if (evt.shiftKey) meta |= Keys.META_SHIFT;
   		
   		var notFound = true;
		if (Keys.funcs[key]) {
			try {
				for (var i=0;i<Keys.funcs[key].length;i++) {
					if (meta == Keys.funcs[key][i].meta) { 
						try {
							Keys.funcs[key][i].func();
						} catch(err) { /*alert(err);*/ }
						notFound = false;
					}
				}
			} catch(e) { }				
		}
		//else alert(key);
		return notFound;
	};
	this.register = function(key,func,meta) {
		if (meta == undefined) meta = Keys.META_NONE;
		if (!this.funcs[key]) this.funcs[key] = [];
		this.funcs[key].push(new KeyFunc(func,meta));
	};
	this.clear = function(key) {
		if (this.funcs[key]) this.funcs[key] = [];
	};
	this.clearAll = function() {
		this.funcs = [];
	};
	this.setPrereq = function(func) {
		this.checks.push(func);
		if (this.checks.length > 1) alert('You now have more than 1 key prereq!');
	};
	this.clearPrereqs = function() {
		this.checks = [];
	};	
	this.isReady = function() {
		for (var i=0;i<this.checks.length;i++)  {
			if (!(this.checks[i]())) return false;
		}
		return true;
	};
	this.snapshot = function() {
		this.snapshots.push(this.funcs);
	};
	this.revert = function() {
		if (this.snapshots.length > 0) this.funcs = this.snapshots.pop();
	};
};

var KeyFunc = Class.create({
	func: 0,
	meta: 0,
	initialize: function(f,m) {
		this.func = f;
		this.meta = m;
	}
});

document.onkeydown = Keys.handler;

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
//loadjscssfile("css/lightframe.css", "css");

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

var LFrame = new function() {
	this.imgurl = 'images/'; // Path to the lightframe image directory

	// Options
	this.bgColor = '';	// color of background overlay
	this.bgFade = 1;	// fade background overlay or not (0 or 1)
	this.bgOnclick = 1;	// click on background overlay closes frame or not (0 or 1)
	this.bgOpacity = 0.9;	// opacity of background overlay
	this.borderColor = '';	// color of lightframe border
	this.closeButton = 1;	// show close button or not (0 or 1)
	this.fadetime_ms = 500;	// Time in ms to do fades
	this.lfFade = 1;	// fade lightframe or not (0 or 1)
	this.height = 480;	// height of lightframe
	this.width = 600;	// height of lightframe

	/*-----------------------------------------------------------------------------------------------*/

	this.isIE = ((navigator.userAgent.indexOf("MSIE 6.") != -1) || (navigator.userAgent.indexOf("MSIE 7.") != -1));
	
	this.parseQuery = function( query ) {
		if ( ! query ) return;
		var Pairs = query.split(/[,&]/);
		for ( var i = 0; i < Pairs.length; i++ ) {
			var KeyVal = Pairs[i].split('=');
			if ( ! KeyVal || KeyVal.length != 2 ) continue;
			var key = unescape( KeyVal[0] );
			key = key.toLowerCase();
			var val = unescape( KeyVal[1] );
			val = val.replace(/\+/g, ' ');

			if (key == 'bgcolor') this.bgColor = val;
			else if (key == 'bgfade') this.bgFade = val;
			else if (key == 'bgonclick') this.bgOnclick = val;
			else if (key == 'bgopacity') this.bgOpacity = val;
			else if (key == 'bordercolor') this.borderColor = val;
			else if (key == 'closebutton') this.closeButton = val;
			else if (key == 'fadetime_ms') this.fadetime_ms = val;
			else if (key == 'lffade') this.lfFade = val;
			else if (key == 'height') this.height = val;
			else if (key == 'width') this.width = val;
		}
	};

	// Onload, make all links that need to trigger a lightframe active
	this.init = function(queryString) {
		// Get user-configurable options
		//var scripts = document.getElementsByTagName('script');
		//var myScript = scripts[ scripts.length - 1 ];
		//var queryString = myScript.src.replace(/^[^\?]+\??/,'');
		//this.parseQuery( queryString );
		
		if (queryString != undefined) this.parseQuery( queryString );
	
		// Create LightFrames
		this.addLightframeMarkup();
		lif = document.getElementsByClassName('lfOn');
		for(i = 0; i < lif.length; i++) {
			valid = new LFLink(lif[i]);
		}
	};

	// Add in markup necessary to make this work. Basically two divs:
	// Overlay holds the shadow
	// lightframediv is the centered square that the content is put into.
	this.addLightframeMarkup = function() {
		var bod = document.getElementsByTagName('body')[0];

		if (!$('lf_overlay')) {
			var overlay = document.createElement('div');
			overlay.id = 'lf_overlay';
			if (this.bgOnclick != 0) overlay.onclick = function(){LFLink.prototype.deactivate();};
			if (this.bgColor != '') overlay.style.backgroundColor = this.bgColor;

			bod.appendChild(overlay);
		}

		if (!$('lightframediv')) {
			var lb = document.createElement('div');
			lb.id = 'lightframediv';
			if (this.closeButton != 0) {
				cbhtml = '<img src="' + this.imgurl + 'close.gif" id="lf_closebox" title="Close" onclick="LFLink.prototype.deactivate();" style="';
				if (this.borderColor != '') cbhtml += 'background-color:' + this.borderColor + ';';
				if (this.isIE) cbhtml += 'margin-top:-2px;margin-bottom:-17px;';
				cbhtml += '">';
				lb.innerHTML = cbhtml;
			}
			lb.innerHTML += '<iframe src="'+this.imgurl+'loading.gif" style="width:100%;height:100%;" id="lightframe" scrolling="auto" frameborder="0"></iframe>';
			if (this.borderColor != '') lb.style.borderColor = this.borderColor;

			bod.appendChild(lb);
		}
	};
	
	this.fadeOut = function(theID, oldtime) {
		var object = $(theID).style;
		var newtime = (new Date()).getTime();
		if (newtime != oldtime) {
			var delta = (newtime - oldtime) / LFrame.fadetime_ms;
			var newOpacity = parseFloat(object.opacity) - delta;

			if (newOpacity <= 0) {
				object.opacity = 0;
				object.filter = "alpha(opacity=0)";
				object.display = 'none';
				if (theID == 'lightframediv')
					$('lightframe').src = this.imgurl+'loading.gif';
				return;
			}
			else {
				object.opacity = newOpacity;
				object.filter = "alpha(opacity=" + newOpacity*100 + ")";
			}
		}
		setTimeout("LFrame.fadeOut('" + theID + "'," + newtime + ")",20);
	};

	this.fadeIn = function(theID, finalOpac, oldtime) {
		var object = $(theID).style;
		var newtime = (new Date()).getTime();
		if (newtime != oldtime) {
			var delta = (newtime - oldtime) / LFrame.fadetime_ms;
			var newOpacity = parseFloat(object.opacity) + delta*finalOpac;
			object.display = 'block';

			if (newOpacity > finalOpac) {
				object.opacity = finalOpac;
				object.filter = "alpha(opacity=" + finalOpac*100 + ")";
				return;
			}
			else {
				object.opacity = newOpacity;
				object.filter = "alpha(opacity=" + newOpacity*100 + ")";
			}
		}
		setTimeout("LFrame.fadeIn('" + theID + "'," + finalOpac + "," + newtime + ")",50);
	};	
};

/*-----------------------------------------------------------------------------------------------*/

// LightFrameLink class
function LFLink(ctrl) {
	ctrl.onclick = this.activate;
	ctrl.lif = this;
	if (ctrl.getAttribute("rel") != undefined) {
		var Pairs = ctrl.rel.split(/[,&]/);
		for ( var i = 0; i < Pairs.length; i++ ) {
			var KeyVal = Pairs[i].split('=');
			if ( ! KeyVal || KeyVal.length != 2 ) continue;
			var key = unescape( KeyVal[0] );
			key = key.toLowerCase();
			var val = unescape( KeyVal[1] );
			val = val.replace(/\+/g, ' ');

			if (key == 'height') this.height = val;
			else if (key == 'width') this.width = val;
		}
	}
}

LFLink.prototype.xPos = 0;
LFLink.prototype.yPos = 0;
LFLink.prototype.height = 0;
LFLink.prototype.width = 0;

// Turn everything on - mainly the IE fixes
LFLink.prototype.activate = function(){
	var lif = this;
	if (lif.lif) lif = lif.lif;

	lif.checkViewport();
	if (LFrame.isIE){
		lif.getScroll();
		lif.prepareIE('100%', 'hidden');
		lif.setScroll(0,0);
		lif.hideSelects('hidden');
	}
	lif.displayLightframe(this);
	return false;
}

// Make sure iframe fits on screen
LFLink.prototype.checkViewport = function(){


	var vpwidth,vpheight;
	if (typeof window.innerWidth != 'undefined') {
		vpwidth = window.innerWidth,
		vpheight = window.innerHeight
	} else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
		// IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
		vpwidth = document.documentElement.clientWidth,
		vpheight = document.documentElement.clientHeight
	} else {
		// older versions of IE
		vpwidth = document.getElementsByTagName('body')[0].clientWidth,
		vpheight = document.getElementsByTagName('body')[0].clientHeight
	}	

	var lb = $('lightframediv');
	var bwt=4, bwl=4;
	if (lb.currentStyle) {
		bwt = parseInt(lb.currentStyle['borderTopWidth']);
		bwl = parseInt(lb.currentStyle['borderLeftWidth']);
	}
	else if (window.getComputedStyle) {
		var s = document.defaultView.getComputedStyle(lb,null);
		bwt = parseInt(s.getPropertyValue('border-top-width'));
		bwl = parseInt(s.getPropertyValue('border-left-width'));		
	}

	var w, h;
	var wmax = vpwidth-20-2*bwl; // bwl = border width, 20 = 10+10 padding around frame
	var hmax = vpheight-20-2*bwt-15; // bwt = border width, 20 = 10+10 padding around frame, 15 = height of close button
	
	var hticker = 0;
	// ANDY - This is (1 of 2) HTPC-specific code in this function
	try { if (g_module.ticker) hticker = 35; } catch(err) { } // 35 = height of ticker (32px height + 3px top border)
	// END ANDY
	hmax -= hticker;
	
	if (this.width > 0) w = Math.min(this.width, wmax);
	else w = Math.min(LFrame.width, wmax);
	if (this.height > 0) h = Math.min(this.height, hmax);
	else h = Math.min(LFrame.height, hmax); 
	
	lb.style.width = w + 'px';
	lb.style.height = h + 'px';
	lb.style.margin = '-' + ((h-15)/2+bwt+(hticker/2)) + 'px -' + (w/2+bwl) + 'px';
}

// Ie requires height to 100% and overflow hidden or else you can scroll down past the lightframe
LFLink.prototype.prepareIE = function(height, overflow){
	bod = document.getElementsByTagName('body')[0];
	bod.style.height = height;
	bod.style.overflow = overflow;

	htm = document.getElementsByTagName('html')[0];
	htm.style.height = height;
	htm.style.overflow = overflow; 
}

// In IE, select elements hover on top of the lightframe
LFLink.prototype.hideSelects = function(visibility){
	selects = document.getElementsByTagName('select');
	for(i = 0; i < selects.length; i++) {
		selects[i].style.visibility = visibility;
	}
}

// Taken from lightbox implementation found at http://www.huddletogether.com/projects/lightbox/
LFLink.prototype.getScroll = function(){
	if (self.pageYOffset) {
		this.yPos = self.pageYOffset;
	} else if (document.documentElement && document.documentElement.scrollTop){
		this.yPos = document.documentElement.scrollTop; 
	} else if (document.body) {
		this.yPos = document.body.scrollTop;
	}
}

LFLink.prototype.setScroll = function(x, y){
	window.scrollTo(x, y); 
}

LFLink.prototype.deactivate = function(){
	if (LFrame.isIE){
		this.setScroll(0,this.yPos);
		this.prepareIE("auto", "auto");
		this.hideSelects("visible");
	}
	this.displayLightframe("none");
	
	// ANDY - This is (2 of 2) HTPC-specific code in this function
	try { if (Keys) Keys.revert(); } catch (err) { }
	// END ANDY
}

// Display or hide the lightframe div
LFLink.prototype.displayLightframe = function(url){
	if (url == 'none') {
		if (LFrame.bgFade != 0) LFrame.fadeOut('lf_overlay',(new Date()).getTime());
		else $('lf_overlay').style.display = 'none';
		if (LFrame.lfFade != 0) LFrame.fadeOut('lightframediv',(new Date()).getTime());
		else {
			$('lightframediv').style.display = 'none';
			//$('lightframe').src = 'about:blank';
			$('lightframe').src = LFrame.imgurl+'loading.gif';
		}
	}
	else {
		$('lightframe').src = url;
		if (LFrame.bgFade != 0) {
			$('lf_overlay').style.opacity = 0;
			$('lf_overlay').style.filter = 'alpha(opacity=0)';
			LFrame.fadeIn('lf_overlay',LFrame.bgOpacity,(new Date()).getTime());
		}
		else {
			$('lf_overlay').style.opacity = LFrame.bgOpacity;
			$('lf_overlay').filter = 'alpha(opacity=' + LFrame.bgOpacity*10 + ')';
			$('lf_overlay').style.display = 'block';
		}
		if (LFrame.lfFade != 0) {
			$('lightframediv').style.opacity = 0;
			LFrame.fadeIn('lightframediv',1.0,(new Date()).getTime());
		}
		else $('lightframediv').style.display = 'block';		
	}
}


var MouseHider = {
// 
// User variables
//
	delay: 2000,       // Delay after which mouse is hidden
	imgurl: '/images/', // Path to the cursor files, should end with '/'
//
// Internal variables
//
	bfx: 0,      // "Cached" handle to the bindAsEventListener object for stop()
	to: 0,       // Handle to setTimeout event in case we need to cancel it
	mx: -1,      // Last known x coordinate of mouse, used to detect motion
	my: -1,      // Last known y coordinate of mouse, used to detect motion
//
// User functions
//
	start: function(ms) {
		if (ms != undefined && !isNaN(parseInt(ms))) MouseHider.delay = parseInt(ms);
		if (MouseHider.bfx) MouseHider.stop();
		MouseHider.bfx = MouseHider.mouseHandler.bindAsEventListener();
		Event.observe(document.body, 'mousemove', MouseHider.bfx);
	},
	stop: function () {
		Event.stopObserving(document.body, 'mousemove', MouseHider.bfx);
		MouseHider.bfx = 0;
	},
//
// Internal member functions
//
	mouseHide: function() {
		//document.body.style.cursor = 'url('+MouseHider.imgurl+'nocursor.png),url('+MouseHider.imgurl+'nocursor.cur),auto';
		document.body.style.cursor = 'none';
		//alert('hide ' + document.body.style.cursor);
	},
	mouseShow: function() {
		document.body.style.cursor = 'auto';
	},
	mouseHandler: function(e) {
		var evt = (window.event) ? event : e;
		var x = evt.clientX;
		var y = evt.clientY;
		
		if (x != MouseHider.mx || y != MouseHider.my) {
			if (MouseHider.to) clearTimeout(MouseHider.to);
			MouseHider.to = setTimeout("MouseHider.mouseHide()", MouseHider.delay);

			MouseHider.mouseShow();
			
			MouseHider.mx = x;
			MouseHider.my = y;
		}
	}
};



var Screensaver = {
// 
// User variables
//
	timeout: 60000, // Time (in ms) of inactivity after which screensaver starts
	delay:   5000,  // Time (in ms) to show each picture (should be at least 2x fade)
	fade:    2.0,   // Time (in seconds) to fade in/out each picture
//
// Internal variables
//
	div: 0,       // Handle to screensaver div
	img: 0,       // Handle to screensaver img

	pics: 0,      // Array of picture urls
	picCtr: 0,    // Index into pics array
	totCtr: 0,
	intNext: 0,   // Handle to timer interval in case we need to cancel it
	cache: 0,     // Next image to be shown
	
	keyfx: 0,     // "Cached" handle to the bindAsEventListener object for disable()
	mousefx: 0,   // "Cached" handle to the bindAsEventListener object for disable()
	intTimer: 0,  // Handle to timer interval in case we need to cancel it
	activity: 0,  // Time of last user activity
	
	loadUrl: function(url) {
		url = "/php/get.php?s=" + encodeURIComponent(url) + '&refresh=' + (new Date).getTime();
		new Ajax.Request(url, {
			method:'get',
			onSuccess: function(transport){ 
				var pics = transport.responseText.split(',');
				Screensaver.initialize(pics);
				Screensaver.enable();
			}
		});
	},
	initialize: function(p,to) {
		Screensaver.disable();
		
		Screensaver.pics = p;
		if (to != undefined) this.timeout = to;
		
		// Pick random position
		var w = window.innerWidth;
		var h = window.innerHeight;
		var t = Math.round(30*Math.random()) + '%';
		var l = Math.round(45*Math.random()) + '%';
		
		var d = document.createElement('div');
		d.id = 'ssaver_div';
		d.style.display = 'none';
		d.innerHTML = '<img id="ssaver_img" src="'+p[0]+'" style="top:'+t+';left:'+l+';">'
			+ '<div id="ssaver_music_div"><img id="ssaver_music_cover" src="/images/black75.png"><div id="ssaver_music_title"></div><div id="ssaver_music_artist"></div><div id="ssaver_music_album"></div></div>';

		var bod = document.getElementsByTagName('body')[0];
		bod.appendChild(d);
		$(d).hide();
		
		Screensaver.div = d;
		Screensaver.img = $('ssaver_img');
		Screensaver.cache = new Image();
		Screensaver.cache.src = Screensaver.nextImage();
	},
	enable: function() {
		// Listen for key strokes or mouse movement
		Screensaver.mousefx = Screensaver.activityMonitor.bindAsEventListener();
		Event.observe(document.body, 'mousemove', Screensaver.mousefx);
		Screensaver.keyfx = Screensaver.activityMonitor.bindAsEventListener();
		Event.observe(document, 'keydown', Screensaver.keyfx);
		
		Screensaver.activity = new Date().getTime();
		//if (!Screensaver.intTimer) Screensaver.intTimer = setInterval('Screensaver.check()',1000);
	},
	disable: function() {
		// Stop listening to keys and mouse presses
		if (Screensaver.keyfx) Event.stopObserving(document.body, 'keydown', Screensaver.keyfx);
		if (Screensaver.mousefx) Event.stopObserving(document.body, 'mousemove', Screensaver.mousefx);
		Screensaver.keyfx = 0;		
		Screensaver.mousefx = 0;
		
		// Stop screensaver timer
		if (Screensaver.intTimer) clearInterval(Screensaver.intTimer);
		Screensaver.intTimer = 0;
	},
	show: function() {
		// Stop counting idle time
		if (Screensaver.intTimer) clearInterval(Screensaver.intTimer);
		Screensaver.intTimer = 0;
		
		// Eventually, stop the screensaver
		Screensaver.totCtr = 0;
		
		// Show the current music track if one is playing
		if (g_audio && g_audio.player.getInputState() == 3) {
			Screensaver.updateMusic(g_audio.nowplaying.track, g_audio.nowplaying.artist, g_audio.nowplaying.album, g_audio.nowplaying.cover);
			$('ssaver_music_div').show();
		}
		else $('ssaver_music_div').hide();
		
		// Show slideshow and start timer
		Effect.Appear(Screensaver.div, { duration: Screensaver.fade, queue: { scope: 'ssaver' } });
		if (!Screensaver.intNext) Screensaver.intNext = setInterval('Screensaver.next()',Screensaver.delay);
	},
	hide: function() {
		// Stop updating images
		if (Screensaver.intNext) {
			clearInterval(Screensaver.intNext);
			Screensaver.intNext = 0;
	
			// Stop fades, if any
			var queue = Effect.Queues.get('ssaver');
			queue.each(function(fx) {
				fx.cancel();
			});

			// Hide screensaver
			$(Screensaver.div).hide();
			$(Screensaver.img).show();
			if (g_module.ticker) Ticker.start();
		}
		if (!Screensaver.intTimer) Screensaver.intTimer = setInterval('Screensaver.check()',1000);
	},
	next: function() {
		//Effect.Fade(Screensaver.img, { duration: Screensaver.fade, queue: { scope: 'ssaver' }, afterFinish: function (obj) { 
		//	$(Screensaver.img).src = Screensaver.cache.src;
		//	Screensaver.cache.src = Screensaver.nextImage();
		//	new Effect.Appear(Screensaver.img, { duration: Screensaver.fade, queue: { scope: 'ssaver' } });
		//}});
		Screensaver.img.hide();
		if (Screensaver.totCtr > 720) {
			if (Ticker.running) Ticker.stop();
			Screensaver.div.style.opacity = 0.75;
			return;
		}
		else Screensaver.div.style.opacity = 1.0;

		Screensaver.img.src = Screensaver.cache.src;

		// Pick random position
		var ar = Screensaver.img.width/Screensaver.img.height;
		if (isNaN(ar)) ar = 1;
		var w = window.innerWidth;
		var h = window.innerHeight;
		
		Screensaver.img.style.top = Math.round(30*Math.random()) + '%';
		Screensaver.img.style.left = Math.round((100-70*ar*h/w)*Math.random()) + '%';
		
		Screensaver.cache.src = Screensaver.nextImage();
		Screensaver.img.show();
		Screensaver.totCtr++;
	},
	nextImage: function() {
		Screensaver.picCtr++;
		if (Screensaver.picCtr >= Screensaver.pics.length) Screensaver.picCtr = 0;
		return Screensaver.pics[Screensaver.picCtr];
	},
	activityMonitor: function(e) {
		// User did something. Update timer and hide screensaver
		Screensaver.activity = new Date().getTime();
		Screensaver.hide();
	},
	check: function() {
		if (Screensaver.keyfx == 0) return;

		// Get current time and compare it to last user activity.  If it has been long
		// enough, start the screensaver
		var ms = new Date().getTime();
		if (ms - Screensaver.activity > Screensaver.timeout) {
			Screensaver.show();
		}
	},
	updateMusic: function(track,artist,album,cover) {
		var d = $('ssaver_music_title');
		if (d) d.innerHTML = track;
		d = $('ssaver_music_artist');
		if (d) d.innerHTML = artist;
		d = $('ssaver_music_album');
		if (d) d.innerHTML = album;
		d = $('ssaver_music_cover');
		if (d) d.src = cover;
	}
};

var Ticker = new function() {
	this.feeds = [];
	this.curfeed = -2;
	this.curscroll = 0;
	this.running = 0;
	this.timer = 0;

	this.start = function() {
		if (this.running) return;
		else this.running = 1;
		
		if ($('ticker-div')) {
			$('ticker-div').show();
			if (this.timer) clearTimeout(this.timer);
			this.timer = setTimeout("Ticker.updateTicker()",4000);
		}
		else {
			// Add Ticker markup
			var dv = document.createElement('div');
			dv.id = 'ticker-div';
			dv.innerHTML = '<div id="ticker-title"></div><div id="ticker-text"></div>';
			$$('body')[0].appendChild(dv);

			var d = new Date();

			// Feeds
			this.feeds.push('Sports','http://sports.espn.go.com/espn/rss/news');
			this.feeds.push('MLB','http://sports.espn.go.com/espn/rss/mlb/news');
			this.feeds.push('MLB','http://msn.foxsports.com/nugget/9240_49'),
			this.feeds.push('NFL','http://sports.espn.go.com/espn/rss/nfl/news');
			this.feeds.push('NFL','http://msn.foxsports.com/nugget/9240_5');
			this.feeds.push('NBA','http://sports.espn.go.com/espn/rss/nba/news');
			this.feeds.push('NBA','http://msn.foxsports.com/nugget/9240_73');
			//this.feeds.push('NHL','http://sports.espn.go.com/espn/rss/nhl/news');
			this.feeds.push('NHL','http://msn.foxsports.com/nugget/9240_142');
			if (d.getMonth() >= 8) {
				//this.feeds.push('NCAAF','http://sports.espn.go.com/espn/rss/ncf/news');
				if (d.getDay() == 6) this.feeds.push('NCAAF','http://msn.foxsports.com/nugget/9240_24');
			}
			if (d.getMonth() <= 2 || d.getMonth() >= 10) {
				//this.feeds.push('NCAAB','http://sports.espn.go.com/espn/rss/ncb/news');
				this.feeds.push('NCAAB','http://msn.foxsports.com/nugget/9240_99');
			}

			this.feeds.push('News','http://rss.news.yahoo.com/rss/topstories');
			this.feeds.push('Entertainment','http://rss.news.yahoo.com/rss/entertainment');
			this.feeds.push('Popular','http://rss.news.yahoo.com/rss/mostemailed');
			this.feeds.push('Slashdot','http://rss.slashdot.org/Slashdot/slashdot');		
			this.feeds.push('Joystiq','http://feeds.joystiq.com/weblogsinc/joystiq');
			//this.feeds.push('Destructoid','http://www.destructoid.com/elephant/index.phtml?mode=atom');
			//this.feeds.push('Coupons','http://feeds.feedburner.com/CouponMomBlog');

			this.curfeed = -2;
			this.curscroll = 0;
			this.getNextFeed();
		}
	};
	this.stop = function() {
		//if ($('ticker-div')) $('ticker-div').remove();
		//this.feeds = [];
		//this.curfeed = -2;
		//this.curscroll = 0;
		//this.running = 0;
		//if (this.timer) clearTimeout(this.timer);
		//this.timer = 0;
		
		this.running = 0;
		if ($('ticker-div')) $('ticker-div').hide();
		if (this.timer) clearTimeout(this.timer);
		this.timer = 0;
	};

	// Cycles through available news feeds
	this.getNextFeed = function() {
		// Clear old feeds
		$('ticker-text').innerHTML = '';
		this.curscroll = 0;

		this.curfeed += 2;
		if (this.curfeed >= this.feeds.length) this.curfeed = 0;

		this.getFeed(this.feeds[this.curfeed+1]);
		$('ticker-title').innerHTML = this.feeds[this.curfeed];
	};	

	// Called every few seconds, shows next news item	
	this.updateTicker = function() {
		if (!$('ticker-div')) return;

		if ($('scroll' + (this.curscroll+1))) {
			Effect.SlideUp('scroll' + this.curscroll);
			this.curscroll++;
			$('scroll' + this.curscroll).show();
			this.timer = setTimeout("Ticker.updateTicker()",4000);
		}
		else {
			Effect.Fade('scroll' + this.curscroll);
			this.getNextFeed();
		}
	};
	
	// Spawn Ajax request to download news feed
	this.getFeed = function(url) {
		//if (typeof(netscape) != 'undefined') netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");

		// Add timestamp to url
		if (url.indexOf('?') > 0) url += '&';
		else url += '?';
		url += 'refresh=' + (new Date).getTime();

		url = "/demo/php/get.php?s=" + escape(url);

		new Ajax.Request(url, {
			method:'get',
			onSuccess: function(transport){ Ticker.parseFeed(transport.responseText); },
			onFailure: function(){ Ticker.getNextFeed(); }
		});
	};
	
	// Parse xml
	this.parseFeed = function(xmlText) {
		var feedList = '';
		for (var i = 0; i < this.feeds.length-2; i += 2) {
			var i2 = i + this.curfeed + 2;
			if (i2 >= this.feeds.length) i2 -= this.feeds.length;
			if (this.feeds[i2] == this.feeds[i2+2]) continue;
			feedList += this.feeds[i2] + '&nbsp; |&nbsp; ';
		}
		if (this.feeds[this.curfeed] == this.feeds[this.curfeed+2]) {
			feedList = this.feeds[this.curfeed] + ' Scores';
		}

		var feedListDiv = document.createElement('div');
		feedListDiv.innerHTML = feedList;
		feedListDiv.style.color = '#fc7';

		// Parse through the list of rss items
		xmlText = xmlText.replace(/\<!\[CDATA\[/g,'');
		xmlText = xmlText.replace(/\]\]\>/g,'');
	
		// Parse through the list of rss items
		var games = xmlText.split('<game ');
		if (games.length > 1) {
			// FoxSports scores

			xmlText = changeTZ(xmlText);

			// Get the feed title
			var feedid = getXMLParam(xmlText,"id");
			var sport,fav1,fav2,ifsize;

			if (feedid == '49') {
				sport = 'http://sports.espn.go.com/mlb/';
				fav1 = 22; fav2 = 26;
			}
			else if (feedid == '5') {
				sport = 'http://sports.espn.go.com/nfl/';
				fav1 = 21; fav2 = 25;
			}
			else if (feedid == '73') {
				sport = 'http://sports.espn.go.com/nba/';
				fav1 = 20; fav2 = 8;
			}
			else if (feedid == '142') {
				sport = 'http://msn.foxsports.com/nhl/gameTrax?gameId=';
				fav1 = 15; fav2 = -1;
			}
			else if (feedid == '24') {
				sport = 'http://msn.foxsports.com/cfb/gameTrax?gameId=';
				fav1 = 29; fav2 = -1;
			}
			else if (feedid == '99') {
				sport = 'http://msn.foxsports.com/cbk/gameTrax?gameId=';
				fav1 = 17; fav2 = 357;
			}

			var items = [];
			for(var i = 1; i < games.length && i < 50; i++) {
				var gameId = getXMLParam(games[i],"gameId");
				var gameStatus = getXMLParam(games[i],"gameStatus");
				var awayTeam = getXMLParam(games[i],"awayTeam");
				var homeTeam = getXMLParam(games[i],"homeTeam");
				var awayScore = getXMLParam(games[i],"awayScore");
				var homeScore = getXMLParam(games[i],"homeScore");
				var pregame = getXMLParam(games[i],"pregame");
				var ingame = getXMLParam(games[i],"ingame");
				var postgame = getXMLParam(games[i],"postgame");

				// ESPN NFL/NBA uses a 280904019 instead of 20080904019
				if (feedid == '5' || feedid == '73') {
					gameId = '2' + gameId.substr(3);
					if (gameId.length == 8) gameId = gameId.substr(0,6) + '0' + gameId.substr(6);
				}

				// Adjust link for ESPN (MLB and NFL only)
				if (feedid == '49' || feedid == '5' || feedid == '73') {
					if (ingame == '1') gameId = "gamecast?gameId=" + gameId;
					else if (pregame == '1') gameId = "preview?gameId=" + gameId;
					else  gameId = "recap?gameId=" + gameId;
				}

				// Football
				var awayHaveBall = getXMLParam(games[i],"awayHaveBall");
				var homeHaveBall = getXMLParam(games[i],"homeHaveBall");
				var awayTeamRank = getXMLParam(games[i],"awayTeamRank");
				var homeTeamRank = getXMLParam(games[i],"homeTeamRank");

				if (awayTeamRank != 0) awayTeam = '(' + awayTeamRank + ') ' + awayTeam;
				if (homeTeamRank != 0) homeTeam = '(' + homeTeamRank + ') ' + homeTeam;
				if (awayHaveBall != 0) awayTeam = awayTeam + '&diams;';
				if (homeHaveBall != 0) homeTeam = homeTeam + '&diams;';

				if (postgame == '1') {
					if (awayScore > homeScore) awayTeam = '&#x25B8;' + awayTeam;
					else if (homeScore > awayScore) homeTeam = '&#x25B8;' + homeTeam;
				}

				scoreStr = awayTeam + " &nbsp;" + awayScore + " &nbsp; &nbsp;" + homeTeam + " &nbsp;" + homeScore + " &nbsp; &nbsp;" + gameStatus;

				var d = document.createElement('div');
				d.innerHTML = '<a href="' + sport + gameId + '">' + scoreStr + '</a>';
				d.id = 'scroll' + (i-1);
				$('ticker-text').appendChild(d);
			}
			// Put list of feeds at end
			feedListDiv.id = 'scroll' + (i-1);
			$('ticker-text').appendChild(feedListDiv);
		}
		else {
			// RSS Headlines
			var items = xmlText.split('<item');
			if (items.length == 1) items = xmlText.split('<entry');

			if (items.length == 1) {
				var d = document.createElement('div');
				d.innerHTML = '<div>No games today</div>';
				d.id = 'scroll0';
				$('ticker-text').appendChild(d);
				i = 1;
			}
			else {
				// Only show 10 headlines
				for (var i=0; i<items.length && i<10; i++) {
					var title = getXMLField(items[i],"title");
					var link = getXMLField(items[i],"link");

					title = title.replace(/&(lt|gt);/g, function (strMatch, p1){ return (p1 == "lt")? "<" : ">"; });
					title = title.replace(/<\/?[^>]+(>|$)/g, " ");

					var d = document.createElement('div');
					d.innerHTML = '<a href="' + link + '">' + unescape(title) + '</a>';
					d.id = 'scroll' + i;
					$('ticker-text').appendChild(d);	
				}
			}
			// Put list of feeds at end
			feedListDiv.id = 'scroll' + i;
			$('ticker-text').appendChild(feedListDiv);		
		}

		this.timer = setTimeout("Ticker.updateTicker()",4000);
	};
}
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

var Xml = new function() {
	this.getXmlDoc = function(txt) {
		try { //Internet Explorer
			xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async="false";
			xmlDoc.loadXML(txt);
			return xmlDoc;
		} catch(e) { }
		try {
			parser=new DOMParser();
			xmlDoc=parser.parseFromString(txt,"text/xml");
			return xmlDoc;
		} catch(e) {
			alert(e);
		}
	};
	this.getTagText = function(xml,tag) {
		try {
			var tags = 0;
			//tags = xml.getElementsByTagName(tag);
			if (xml.getElementsByTagNameNS) 
				tags = xml.getElementsByTagNameNS('*', tag);
			else 
				tags = xml.getElementsByTagName(tag); // IE8

			if (!tags || tags.length == 0 || tags[0].childNodes.length == 0) return '';

			// CDATA tags are in [1] instead of [0]
			var l = tags[0].childNodes.length;
			if (l > 1) return tags[0].childNodes[1].nodeValue;
			else return tags[0].childNodes[0].nodeValue;
			//return tags[0].childNodes[0].nodeValue;
		} catch(e) { alert('Xml.getTagText(' + xml + ',' + tag + ') Exception : ' + e); }
		return '';
	};
	this.getTagAttribute = function(xml,tag,attr) {
		try {
			var tags = 0;
			//tags = xml.getElementsByTagNameNS('*', tag);
			if (xml.getElementsByTagNameNS) 
				tags = xml.getElementsByTagNameNS('*', tag);
			else 
				tags = xml.getElementsByTagName(tag); // IE8
				
			if (!tags || tags.length == 0) return '';
			
			for (var i=0; i<tags.length; i++) {
				var a = tags[i].attributes.getNamedItem(attr);
				if (a) return a.nodeValue;
			}
		} catch(e) { alert('Xml.getTagAttribute(' + xml + ',' + tag + ',' + attr + ') Exception : ' + e); }
		return '';
	};
}

var RssItem = Class.create({
	author: '',
	category: '',
	description: '',
	guid: '',
	link: '',
	pubDate: '',
	source: '',
	title: '',
	//itunes_author: '',
	itunes_duration: '',
	//itunes_summary: '',
	initialize: function(item) {
		this.author = Xml.getTagText(item,'author');
		this.category = Xml.getTagText(item,'category');
		this.description = Xml.getTagText(item,'description');
		this.guid = Xml.getTagText(item,'guid');
		this.link = Xml.getTagText(item,'link');
		this.pubDate = Xml.getTagText(item,'pubDate');
		this.source = Xml.getTagText(item,'source');
		this.title = Xml.getTagText(item,'title');

		// Atom
		if (!this.description) this.description = Xml.getTagText(item,'summary');
		//if (!this.description) this.description = Xml.getTagText(item,'atom:summary');
		//if (!this.pubDate) this.pubDate = Xml.getTagText(item,'atom:updated');
		if (!this.pubDate) this.pubDate = Xml.getTagText(item,'updated');

		// iTunes
		//this.itunes_duration = Xml.getTagText(item,'itunes:duration');	
		this.itunes_duration = Xml.getTagText(item,'duration');	
		//if (!this.author) this.author = Xml.getTagText(item,'itunes:author');
		//if (!this.description) this.description = Xml.getTagText(item,'itunes:summary');
	}
});

var RssFeed = Class.create({
	copyright: '',
	description: '',
	items: 0,
	language: '',
	link: '',
	title: '',
	itunes_author: '',
	itunes_image: '',
	itunes_subtitle: '',
	itunes_summary: '',
	media_thumbnail: '',	
	initialize: function(url) {
		// Add timestamp to url
		if (url.indexOf('?') > 0) url += '&';
		else url += '?';
		url += 'refresh=' + (new Date).getTime();

		url = "/php/get.php?s=" + escape(url);
	
		new Ajax.Request(url, {
			method:'get',
			onSuccess: this.parse,
			onFailure: function(){ alert('Something went wrong...') }
		});	
	},
	parse: function(transport) {
		var xmlDoc = Xml.getXmlDoc(transport.responseText);

		// Get feed info
		var channel = xmlDoc.getElementsByTagName('channel')[0];
		if (!channel) return;

		this.copyright = Xml.getTagText(channel,'copyright'); 
		this.description = Xml.getTagText(channel,'description');		
		this.language = Xml.getTagText(channel,'language');
		this.link = Xml.getTagText(channel,'link');
		this.title = Xml.getTagText(channel,'title');
		
		// iTunes
		this.itunes_author = Xml.getTagText(channel,'itunes:author');
		this.itunes_image = Xml.getTagAttribute(channel,'itunes:image','href');
		this.itunes_subtitle = Xml.getTagText(channel,'itunes:subtitle');
		this.itunes_summary = Xml.getTagText(channel,'itunes:summary');
		
		this.media_thumbnail = Xml.getTagAttribute(channel,'media:thumbnail','url');

		//alert(this.title);

		// Parse items
		var its = xmlDoc.getElementsByTagName('item');
		if (!its || its.length == 0) its = xmlDoc.getElementsByTagName('entry');

		items = [];		
		for (var i=0; i<its.length; i++) items[i] = new RssItem(its[i]);
	}
});

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

var DisabledModule = Class.create(Module, {
	title: '',
	ticker: 0,
	initialize: function(parent,title) {
		this.parent = parent;
		this.title = title;
	},
	clearKeys: function() {
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	open: function() {
		$('content_div').hide();
		$('content_div').innerHTML = '<div style="width:400px; height: 300px; margin: 0 auto; padding: 100px;"><div style="text-align:center;color:#aaa;text-shadow:1px 1px 0 black;">Sorry, the ' + this.title + ' module is not available in the demo.<br><br>Press <b>Escape</b> to go back.</div></div>';
		Effect.Appear('content_div', {duration:0.5, queue: { scope: 'waitfx' }});
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
	}
});

var DummyModule = Class.create(Module, {
	title: '',
	ticker: 0,
	initialize: function(parent,title) {
		this.parent = parent;
		this.title = title;
	},
	clearKeys: function() {
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	open: function() {
		$('content_div').hide();
		$('content_div').innerHTML = '<div style="width:400px; height: 300px; margin: 0 auto; padding: 100px;"><div id="sb_nogames">' + this.title + '</div></div>';
		Effect.Appear('content_div', {duration:0.5, queue: { scope: 'waitfx' }});
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
	}
});

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

var FrameModule = Class.create(Module, {
	title: 'No Title',
	ticker: 1,
	a: 0,
	width: 800,
	height: 500,
	initialize: function(parent,href) {
		this.parent = parent;
		if (parent) this.ticker = parent.ticker;
		var a = document.createElement('a');
		//a.href = '/php/get.php?s=' + escape(unescape(href));
		a.href = unescape(href);
		$(a).addClassName('lfOn');
			
		this.a = a;
	},
	open: function() {
		this.a.setAttribute('rel','width='+this.width+',height='+this.height);
		new LFLink(this.a);		
		LFrame.addLightframeMarkup();

		g_module.goBack();
		this.registerKeys();
		this.a.onclick();
	},
	//close: function() {
	//	LFLink.prototype.deactivate();
	//	Keys.revert();
	//	
	//},
/*	
	registerKeys: function() {
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
				
		Keys.clear(37); // Left
		Keys.clear(38); // Up
		Keys.clear(39); // Right
		Keys.clear(40); // Down
		Keys.clear(33); // PgUp
		Keys.clear(34); // PgDn	
	
		Keys.register(27, function() { // Esc
			// Close Lightframe, else go back
			if ($('lightframediv') && $('lightframediv').style.display == 'block'){
				LFLink.prototype.deactivate();
				Keys.clear(27); // Esc
				Keys.clear(8); // Backspace
				Keys.clear(166); // Remote Back
				
				Keys.clear(37); // Left
				Keys.clear(38); // Up
				Keys.clear(39); // Right
				Keys.clear(40); // Down
				Keys.clear(33); // PgUp
				Keys.clear(34); // PgDn
			}
			else g_module.goBack(); // Go back
			//g_module.goBack(); // Go back
			g_module.refresh();
		});
		Keys.register(8, function() { // Backspace
			// Close Lightframe, else go back
			if ($('lightframediv') && $('lightframediv').style.display == 'block'){
				LFLink.prototype.deactivate();  
				Keys.clear(27); // Esc
				Keys.clear(8); // Backspace
				Keys.clear(166); // Remote Back
				
				Keys.clear(37); // Left
				Keys.clear(38); // Up
				Keys.clear(39); // Right
				Keys.clear(40); // Down
				Keys.clear(33); // PgUp
				Keys.clear(34); // PgDn
			}
			else g_module.goBack(); // Go back
			//g_module.goBack(); // Go back
			g_module.refresh();
		});
		Keys.register(166, function() { // Remote back
			// Close Lightframe, else go back
			if ($('lightframediv') && $('lightframediv').style.display == 'block'){
				LFLink.prototype.deactivate();  
				Keys.clear(27); // Esc
				Keys.clear(8); // Backspace
				Keys.clear(166); // Remote Back
				
				Keys.clear(37); // Left
				Keys.clear(38); // Up
				Keys.clear(39); // Right
				Keys.clear(40); // Down
				Keys.clear(33); // PgUp
				Keys.clear(34); // PgDn
			}
			else g_module.goBack(); // Go back
			//g_module.goBack(); // Go back
			g_module.refresh();
		});
		
		Keys.register(37, function() { $('lightframe').contentWindow.scrollBy(-64,0) }); // Left
		Keys.register(38, function() { $('lightframe').contentWindow.scrollBy(0,-64) }); // Up
		Keys.register(39, function() { $('lightframe').contentWindow.scrollBy(64,0) }); // Right
		Keys.register(40, function() { $('lightframe').contentWindow.scrollBy(0,64) }); // Down
		
		Keys.register(33, function() { $('lightframe').contentWindow.scrollBy(0,-500) }); // PgUp
		Keys.register(34, function() { $('lightframe').contentWindow.scrollBy(0,500) }); // PgDn
	}*/
	registerKeys: function() {
		Keys.snapshot();
		Keys.clearAll();
		Keys.register(27, function() { // Esc
			LFLink.prototype.deactivate();  
			//Keys.revert(); // Done in deactivate()
			//g_module.goBack();
		});
		Keys.register(8, function() { // Backspace
			LFLink.prototype.deactivate();  
			//Keys.revert(); // Done in deactivate()
			//g_module.refresh();
		});
		Keys.register(166, function() { // Remote back
			LFLink.prototype.deactivate();  
			//Keys.revert(); // Done in deactivate()
			//g_module.refresh();
		});
		
		Keys.register(37, function() { $('lightframe').contentWindow.scrollBy(-64,0) }); // Left
		Keys.register(38, function() { $('lightframe').contentWindow.scrollBy(0,-64) }); // Up
		Keys.register(39, function() { $('lightframe').contentWindow.scrollBy(64,0) }); // Right
		Keys.register(40, function() { $('lightframe').contentWindow.scrollBy(0,64) }); // Down
		
		Keys.register(33, function() { $('lightframe').contentWindow.scrollBy(0,-500) }); // PgUp
		Keys.register(34, function() { $('lightframe').contentWindow.scrollBy(0,500) }); // PgDn
	}
	
});

var HrefModule = Class.create(Module, {
	href: 'http://www.google.com',
	title: 'No Title',
	ticker: 0,
	initialize: function(parent,href) {
		this.parent = parent;
		this.href = unescape(href);
	},
	open: function() {
		g_module.goBack();
		$('content_div').innerHTML = '<div style="width:100%;height:100%;background:transparent url(images/exec.gif) 50% 50% no-repeat;"></div>';
		window.location.href = this.href;
	},
	toHash: function() {
		if (this.parent) return this.parent.toHash();
		else return '0';
	}
});

var DockModule = Class.create(Menu,{
	mid: 3,
	width: 5,
	selected: 2,  // Reference to the currently selected object 
	subitem: 0,
	xform: [],
	preCache: [], // BG2
	registerKeys: function() {
		Keys.register(37, function() { g_module.shiftDock(1); });  // Left
		Keys.register(38, function() { g_module.subMenu(-1); });   // Up
		Keys.register(39, function() { g_module.shiftDock(-1); }); // Right
		Keys.register(40, function() { g_module.subMenu(1); });    // Down

		//Keys.register(33, Pages.prevPage); // PgUp
		//Keys.register(34, Pages.nextPage); // PgDn
		//Keys.register(35, function() { Pages.gotoPage(Pages.pages.length-1,1); }); // End
		//Keys.register(36, function() { Pages.gotoPage(0,1); }); // Home

		Keys.register(13, function() { g_module.activate(); }); // Enter
		
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
		
		Keys.register(49, function() { g_module.shiftDock(2); g_module.activate(); }); // 1 10%
		Keys.register(50, function() { g_module.shiftDock(1); g_module.activate(); }); // 2 20%
		Keys.register(51, function() { g_module.activate(); }); // 3 30%
		Keys.register(52, function() { g_module.shiftDock(-1); g_module.activate(); }); // 4 40%
		Keys.register(53, function() { g_module.shiftDock(-2); g_module.activate(); }); // 5 50%
	},
	clearKeys: function() {
		Keys.clear(37); // Left
		Keys.clear(38); // Up
		Keys.clear(39); // Right
		Keys.clear(40); // Down
		
		//Keys.clear(33); // PgUp
		//Keys.clear(34); // PgDn
		//Keys.clear(35); // End
		//Keys.clear(36); // Home
	
		Keys.clear(13); // Enter
		
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
		
		Keys.clear(49); // 1 Item 1
		Keys.clear(50); // 2 Item 2
		Keys.clear(51); // 3 Item 3
		Keys.clear(52); // 4 Item 4
		Keys.clear(53); // 5 Item 5
	},
	activate: function() {
		//alert(this.selected + ", " + this.subitem);
		if (this.subitem > 0) {
			// Activate child of menu
			$('submenu' + this.selected + '_' + (this.subitem-1)).onclick();
		}
		else $('menuimg'+this.selected).onclick();		
	},
	subMenu: function(s,menu) {
		var newitem = this.subitem + s;
		if (newitem < 0) return;
		else if (newitem > 3) return;
				
		if (menu == undefined) menu = this.selected;
		
		// Make sure subitem exists
		if (newitem > 0 && !$('submenu' + menu + '_' + (newitem-1))) return;
		else this.subitem = newitem;
	
		for (var i=1; i<=3; i++) {
			var m = $('submenu' + menu + '_' + (i-1));
			if (!m) continue;
			if (i == this.subitem) m.onmouseover();
			else m.onmouseout();
		}
		if (this.subitem == 0) $('dock_glow').show();
		else $('dock_glow').hide();
	},
	shiftDock: function(s) {
		var queue = Effect.Queues.get('menufx');
		if (s == 0 && queue.size() != 0) {
			setTimeout('g_module.shiftDock(0)',100);
			return;
		}
		else if (s != 0) setTimeout('g_module.shiftDock(0)',100);
	
		//, queue: { scope: 'menufx' }
	
		var i = 0;
		while($('menuitem'+i)) {
			var div = $('menuitem'+i);
			if (!div || div.getAttribute("menupos") == undefined) continue;

			// Set new position		
			var newpos = parseInt(div.getAttribute("menupos"))+s;
			if (newpos >= this.items.length && newpos > this.width) newpos -= this.items.length;
			else if (newpos < 0 || (this.width == this.items.length && newpos < 1)) newpos += this.items.length;
			div.setAttribute("menupos",newpos);

			// Transition to new position if item is visible
			new Effect.Morph(div.id, {
				style: this.xform[Math.min(newpos,this.width+1)], // CSS Properties
				duration: 0.5, // Core Effect properties
				queue: { scope: 'menufx' }
			});
			
			// Update background image and submenu
			if (newpos == this.mid) { // Find the icon that is in the middle
				this.selected = i;
			
				var bgstr = div.getAttribute("menubg");
				if (s != 0) {
					// Reset sub-menu index
					this.subitem = 0;
					this.subMenu(0,i);
				
					//Effect.Fade('dock_div', { duration: 0.25, queue: { scope: 'menufx' }, afterFinish: function (obj) { 
					//	$('dock_div').style.backgroundImage = 'url(' + bgstr + ')';
					//	//$('dock_title').innerHTML = g_module.items[3*g_module.selected];
					//	$('page_title').innerHTML = g_module.items[3*g_module.selected];
					//	new Effect.Appear('dock_div', { duration: 0.25, queue: { scope: 'menufx' } });
					//}});

					$('page_title').innerHTML = g_module.items[g_module.selected].tag('title');
					$('content_div').style.backgroundImage = 'url(' + bgstr + ')'; // BG1
					//$('content_bg').src = this.preCache[i].src; // $('dock_bg'+i).src; // BG2
										
					$('dock_glow').show();

					//Effect.BlindDown('submenu'+i, { delay: 0.25, duration: 0.5, queue: { scope: 'menufx' } });
					Effect.Appear('submenu'+i, { delay: 0.25, duration: 0.5, queue: { scope: 'menufx' } });
				}
				else {
					$('submenu'+i).show();					
				}
			}
			else {
				// This item is not in the middle
				$('submenu'+i).hide();
			}
			
			// Adjust z-index
			//if (newpos <= this.width) div.style.zIndex = (10-Math.abs(newpos-this.mid));
			//else div.style.zIndex = 0;
						
			i++;
		}
	},
	drawMenu: function() {
		var menuTitle = "";
		if (this.selected >= this.items.length) this.selected = 0;
		if (this.selected < this.items.length) menuTitle = this.items[this.selected].tag('title');
	
		$('content_div').hide();
		$('content_div').style.backgroundImage = 'url(' + this.bgImage + ')';
		$('content_div').innerHTML = 
			'<div id="dock_bg_div" style="width:100%;height:100%;"></div>' // BG1
			//'<img id="content_bg" src="'+this.bgImage+'"><div id="dock_bg_div" style="width:100%;height:100%;"></div>' // BG2
			+ '<div id="dock_div" style="width:100%;height:100%;">'
			+ '<div id="dock_glow"><img src="images/glow_silver.png"></div>'			
			+ '<div id="dock_left"><img src="images/other/arrow_l.png" onclick="g_module.shiftDock(1);return false;"></div>'
			+ '<div id="dock_right"><img src="images/other/arrow_r.png" onclick="g_module.shiftDock(-1);return false;"></div>'
			+ '<div id="page_title" class="default_page_title '+this.prefix+'_page_title">'+menuTitle+'</div>'
			+ '</div>';
		//Effect.Appear('content_div', {queue: { scope: 'waitfx' }});
		Effect.Appear('content_div', { duration:1.0 });
	
		// Create layout parameters
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;		
		var size = [];
		var top = [];
		var left = [];
		var opacity = [];

		for (var i=1; i<=this.width; i++) {
			var x = (this.mid-1 - Math.abs(this.mid-i)) / (this.mid-1);
			size[i] = 160*x*Math.sqrt(x) + 120;
			opacity[i] = '1.0';
		}

		left[this.mid] = Math.floor((1280-size[this.mid])/2);
		top[this.mid] = 310;
		
		for (var i=this.mid-1; i>0; i--) {
			left[i] = left[i+1] - size[i] - 60;
			top[i] = top[this.mid] + (size[this.mid]-size[i])/2
		}
		for (var i=this.mid+1; i<=this.width; i++) {
			left[i] = left[i-1] + size[i-1] + 60;
			top[i] = top[this.mid] + (size[this.mid]-size[i])/2;
		}

		// Invisible end points 
		size[0] = '0';
		size[this.width+1] = '0';
		top[0] = '460';
		top[this.width+1] = '460';
		left[0] = '0';
		left[this.width+1] = '1280';
		opacity[0] = '0';
		opacity[this.width+1] = '0';

		// Scale to our resolution and build transform table
		for (var i=0; i<=this.width+1; i++) {
			size[i] = Math.round(size[i]*scale);
			top[i] = Math.round((top[i]-64)*scale+64);
			left[i] = Math.round(left[i]*scale);

			this.xform[i] = 'width:' + size[i] + 'px;top:' + top[i] + 'px;left:' + left[i] + 'px;opacity:' + opacity[i] + ';';
		}

		// Draw shortcut numbers
		for (var i=0; i<this.width; i++) {
			var d = document.createElement('div');
			$(d).addClassName('dock_shortcut_div');
			if (this.prefix) $(d).addClassName(this.prefix + '_shortcut_div');
			d.innerHTML = (i+1);
			d.style.left = left[i+1] + 'px';
			d.style.width = size[i+1] + 'px';
			
			$('content_div').appendChild(d);
		}

		// Create markup for menu items
		for (var i=0; i<this.items.length; i++) {
			var d = document.createElement('div');
			d.id = 'menuitem'+i;
			d.innerHTML = '<img id="menuimg'+i+'" style="width:100%;" src="' + this.items[i].getCover() + '"><div id ="submenu' + i + '"></div>';
			d.setAttribute("menubg",this.items[i].tag('background').replace(/%SIZE%/g,g_size));

			// Determine icon's position
			var i2 = i+(this.mid-this.selected);
			if (i2 >= this.items.length) i2 -= this.items.length;
			else if (i2 < 0) i2 += this.items.length;
			d.setAttribute("menupos",i2);

			// Set position's style attributes			
			if (i2 < 0) i2 = 0;
			else if (i2 >= size.length) i2 = size.length-1;
			d.style.width = size[i2] + 'px';
			//d.style.height = size[i2] + 'px';
			d.style.top = top[i2] + 'px';
			d.style.left = left[i2] + 'px';
			d.style.opacity = opacity[i2];
			d.style.position = 'absolute';
			d.style.overflow = 'hidden';

			$('content_div').appendChild(d);
			
			try {
			// Build submenu
			$('submenu'+i).addClassName('dock_submenu_div');
			if (this.prefix) $('submenu'+i).addClassName(this.prefix + '_submenu_div');
			$('submenu'+i).hide();
			var cs = this.children[i].children;
			if (cs.length > 3) {
				for (var j=1; j<4 && j<cs.length; j++) {
					var d2 = document.createElement('div');
					d2.id = 'submenu' + i + '_' + (j-1);
					d2.innerHTML = cs[j].title;
					d2.onclick = function() { g_module.children[g_module.selected].goChild(this.getAttribute('cindex')); }
					d2.setAttribute('cindex',j);
					d2.onmouseover = function() { this.className = this.className.replace('_off','_on'); }
					d2.onmouseout = function() { this.className = this.className.replace('_on','_off'); }
					
					$(d2).addClassName('dock_item_off');
					if (this.prefix) $(d2).addClassName(this.prefix + '_item_off');
					$('submenu'+i).appendChild(d2);
				}
			}
			} catch(e) { alert(e); }
			
			// Add onclick to icon
			$('menuimg'+i).onclick = function() { g_module.goChild(this.getAttribute('cindex')); }
			$('menuimg'+i).setAttribute('cindex',i);
			$('menuimg'+i).style.cursor = 'pointer';
			
			// Pre-cache background images
			this.preCache[i] = new Image();
			this.preCache[i].src = this.items[i].tag('background').replace(/%SIZE%/g,g_size);
			
			// Create background image
			if (i == this.selected) $('content_div').style.backgroundImage = 'url(' + this.preCache[i].src + ')'; // BG1
			//if (i == this.selected) $('content_bg').src = this.preCache[i].src; // BG2			
		}

		this.shiftDock(0);
	}
});

var MenuModule = Class.create(Menu,{
	//active: 0,
	rows: 3,
	cols: 4,
	tempPage: 0,
	pageTO: 0,	
	close: function($super) {
		if (Cell.sel && Cell.sel.div) this.selected = Cell.sel.div.id;
		$super();
	},
	registerKeys: function() {
		Cell.registerKeys();
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
		
		Keys.register(48, function() { g_module.updatePage(0); }); // 0
		Keys.register(49, function() { g_module.updatePage(1); }); // 1
		Keys.register(50, function() { g_module.updatePage(2); }); // 2
		Keys.register(51, function() { g_module.updatePage(3); }); // 3
		Keys.register(52, function() { g_module.updatePage(4); }); // 4
		Keys.register(53, function() { g_module.updatePage(5); }); // 5
		Keys.register(54, function() { g_module.updatePage(6); }); // 6
		Keys.register(55, function() { g_module.updatePage(7); }); // 7
		Keys.register(56, function() { g_module.updatePage(8); }); // 8
		Keys.register(57, function() { g_module.updatePage(9); }); // 		
	},
	clearKeys: function() {
		Cell.clearKeys();
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
		
		Keys.clear(48); // 0
		Keys.clear(49); // 1
		Keys.clear(50); // 2
		Keys.clear(51); // 3
		Keys.clear(52); // 4
		Keys.clear(53); // 5
		Keys.clear(54); // 6
		Keys.clear(55); // 7
		Keys.clear(56); // 8
		Keys.clear(57); // 9		
	},
	updatePage: function(n) {
		n = parseInt(n);
		if (this.pageTO || n == -1) {
			// Second number or timeout
			if (n >= 0) this.tempPage = 10*this.tempPage + n;
			this.tempPage -= 1;

			clearTimeout(this.pageTO);
			this.pageTO = 0;			
			
			Pages.gotoPage(this.tempPage,0,0);
		}
		else {
			// First number
			this.tempPage = n;
			this.pageTO = setTimeout('g_module.updatePage(-1)',2000);
		}
	},	
	parseMenuTags: function($super,menu) {
		var t = Xml.getTagText(menu,'rows');
		if (t) this.rows = t;
		
		t = Xml.getTagText(menu,'columns');
		if (t) this.cols = t;
		$super(menu);
	},
	drawSidebar: function() {
		// By default, the sidebar only has a back button
		if (this.parent) this.addSidebarBtn(0,'Back','go-back.png',function() { g_module.goBack(); });
	},
	drawMenu: function() {
		$('content_div').hide();
		//$('content_div').style.backgroundImage = 'url('+this.bgImage+')';
		$('content_div').innerHTML = 
			((this.bgImage) ? '<img id="content_bg" src="'+this.bgImage+'">' : '')
			+ '<div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>'
			+ '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>'
			+ '<div id="page_up"><img id="page_up_img" style="visibility:hidden;" src="images/other/arrow_u.png" onclick="Pages.prevPage();return false;"></div>'
			+ '<div id="page_div" class="default_page_div '+this.prefix+'_page_div"></div>'
			+ '<div id="page_down"><span id="page_num"></span><img style="display:none;" id="page_down_img" align="top" src="images/other/arrow_d.png"  onclick="Pages.nextPage();return false;"></div>';		

		//Effect.Appear('content_div', {queue: { scope: 'waitfx' }});
		//Effect.Appear('content_div', { duration:0.5 });

		// Calculate grid size
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var totWidth = parseInt(getStyle($('page_div'),'width'));
		var totHeight = parseInt(getStyle($('page_div'),'height'));

		var border = 2;   // 2px border
		var margin = Math.round(2*scale);   // 2px margin
		var padding = Math.round(20*scale); // 20px padding
		var width = Math.floor(totWidth/this.cols - 2*margin - 2*padding - 2*border);
		var height = Math.floor(totHeight/this.rows - 2*margin - 2*padding - 2*border);

		// Draw grid divs
		var divs = [];
		for (var i = 0; i < this.children.length; i++) {
			var d = document.createElement('div');
			d.id = 'item'+i;
			$(d).addClassName('default_menu_div_off');
			$(d).addClassName(this.prefix+'_menu_div_off');
			d.setAttribute('cindex',i);
			d.onclick = function() { g_module.goChild(this.getAttribute('cindex')); }
			
			Cell.setParameters(d);

			// This is all a hack to allow the subtitle to use BlindDown if chosen by
			// keyboard input.  The mouse moves too fast, so BlindDown gets all screwy.
			// I could have just made the subtitle appear with simple CSS and this
			// whole function could be removed, but I like the BlindDown effect.
			/*d.onmouseover = function(e) { 
				this.className = this.className.replace('_off','_on');
				
				// Show subtitle
				var newsub = 'subtitle'+this.getAttribute('cindex');
				if (this.active == newsub) return;
				else if (this.active) $(this.active).hide();
				this.active = newsub;				
				
				if (e == undefined) Effect.BlindDown(newsub,{duration:0.5}); // Keyboard
				else $(newsub).show(); // Mouse
			}
			//*/

			// Ugly CSS hack to get images resized into menu blocks while still being
			// centered horizontally and vertically.
			var str = '';
			str += '<table valign="middle" align="center" cellpadding="0" cellspacing="0" height="100%"><tr><td>';
			str += '<div class="default_menu_inner '+this.prefix+'_menu_inner" style="width:'+width+'px;">';
			//str += '<img src="'+this.items[i].tag('icon')+'" class="cover" style="max-height:'+height+'px;">';
			var cover = this.items[i].getCover();
			var title = this.items[i].tag('title');
			var subtitle = this.items[i].tag('subtitle');
			if (subtitle) title = title + '<br><span class="subsub">'+subtitle+'</span>';
			if (cover) str += '<img src="'+cover+'" class="cover" style="max-height:'+height+'px;">';
			str += '</div>';
			str += '</td></tr></table>';
			str += '<div id="subtitle'+i+'" class="subtitle" style="margin:5px -'+(padding+border)+'px 0 -'+(padding+border)+'px;">'+title+'</div>';
			d.innerHTML = str;

			d.style.width = width+'px';
			d.style.height = height+'px';
			d.style.margin = margin+'px';
			d.style.padding = padding+'px';
			
			// Save title for sorting
			var stitle = this.items[i].tag('title').toUpperCase();
			if (stitle.substr(0,4) == 'THE ') stitle = stitle.substr(4);
			d.title = stitle; 

			divs.push(d);
		}

		this.drawSidebar();

		// Finalize page
		if (this.sorted) divs = divs.sort(function(a,b) {
  			if (a.title<b.title) return -1;
  			if (a.title>b.title) return 1;
  			return 0;
		});
		Pages.write(divs,this.rows,this.cols,'page_div');
		LFrame.init();
		Cell.connectAll();
		if (this.selected && $(this.selected)) Cell.select($(this.selected).cell,1);
		$('page_num').innerHTML = 'Page ' + (Pages.currentpage+1) + ' of ' + Pages.pages.length;

		Effect.Appear('content_div', { duration:0.5 });
		
		// The rest of the subtitle BlindDown hack
		//for (var i = 0; i < this.children.length; i++) $('subtitle'+i).style.display = 'none';
	}
});
//
//
var HuluModule = Class.create(Menu,{
	rows: 10,
	keyart: '',
	ticker: 0,
	close: function($super) {
		if (Cell.sel && Cell.sel.div) this.selected = Cell.sel.div.id;
		$super();
	},
	registerKeys: function() {
		//Cell.registerKeys();
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back

		// Cell keys with minor changes for seasons		
		Keys.register(37, Pages.prevPage);
		Keys.register(38, function() { Cell.select(Cell.sel.up); });
		Keys.register(39, Pages.nextPage);
		Keys.register(40, function() { Cell.select(Cell.sel.down); });

		Keys.register(33, Pages.prevPage); // PgUp
		Keys.register(34, Pages.nextPage); // PgDn
		Keys.register(35, function() { Pages.gotoPage(Pages.pages.length-1,1); }); // End
		Keys.register(36, function() { Pages.gotoPage(0,1); }); // Home

		Keys.register(13, function() { Cell.sel.activate(); }); // Enter
	},
	clearKeys: function() {
		Cell.clearKeys();
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	parseMenuTags: function($super,menu) {
		var t = Xml.getTagText(menu,'rows');
		if (t) this.rows = t;
		$super(menu);
	},
	drawSidebar: function() {
	
	},
	drawMenu: function() {
		$('content_div').hide();
		//$('content_div').style.backgroundImage = 'url('+this.bgImage+')';
		$('content_div').innerHTML = 
			'<div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>'
			+ '<img id="hulu_key_art" src="'+this.bgImage+'">'
			+ '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>'
			+ '<div id="page_up" style="padding-top:1%;height:4%;"><img id="page_up_img" style="visibility:hidden;" src="images/other/arrow_u.png" onclick="Pages.prevPage();return false;"></div>'
			+ '<div id="page_div" class="show_page_div '+this.prefix+'_page_div"></div>'
			+ '<div id="page_down" style="padding-top:1%;height:4%;"><span id="page_num"></span><img style="display:none;" id="page_down_img" align="top" src="images/other/arrow_d.png"  onclick="Pages.nextPage();return false;"></div>'
			+ '<div id="show_info"><img id="show_cover" class="cover"><div id="show_title">'+this.title+'</div><div id="show_description">'+this.subtitle+'</div></div>';

		//Effect.Appear('content_div', {queue: { scope: 'waitfx' }});
		//Effect.Appear('content_div', { duration:0.5 });			

		// Calculate grid size
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var totWidth = parseInt(getStyle($('page_div'),'width'));
		var totHeight = parseInt(getStyle($('page_div'),'height'));

		var border = 2;   // 2px border
		var margin = Math.round(2*scale);   // 2px margin
		var padding = Math.round(4*scale); // 20px padding
		//var width = Math.floor(totWidth - 2*margin - 2*padding - 2*border);
		var height = Math.floor(totHeight/this.rows - 2*margin - 2*padding - 2*border);

		// Draw grid divs
		var divs = [];
		for (var i = 0; i < this.items.length; i++) {
			var d = document.createElement('div');
			d.id = 'item'+i;
			$(d).addClassName('default_show_div_off');
			$(d).addClassName(this.prefix+'_show_div_off');
			d.setAttribute('cindex',i);
			d.onclick = function() { g_module.goChild(this.getAttribute('cindex')); }
			
			Cell.setParameters(d);

			var title = this.items[i].tag('title');
			var descr = this.items[i].tag('description');
			if (!descr) descr = this.items[i].tag('content');
			
			//
			// HACK (1 of 3) - Guess address of hulu keyart based on link
			// This may break if hulu changes things.
			//
			// Expected: 
			//   http://www.hulu.com/watch/92766/dawn-of-the-dead#http%3A%2F%2Fwww.hulu.com%2Ffeed%2Fpopular%2Ffeature_film%2Ftoday
			// Conversion:
			//   * Remove everything before last /
			//   * Remove everything after #
			//   * Convert - to _
			//   * Link is http://assets.hulu.com/shows/key_art_XXXXXX.jpg
			// Result: 
			//   http://assets.hulu.com/shows/key_art_dawn_of_the_dead.jpg
			//
			var link = this.items[i].tag('link');
			var showStub = link.substr(link.lastIndexOf('/')+1);
			showStub = showStub.substr(0,showStub.indexOf('#'));
			showStub = showStub.replace(/-/g,'_');
			var keyart = 'http://assets.hulu.com/shows/key_art_' + showStub + '.jpg';
			// END HACK

			var precache = new Image();
			precache.src = keyart;

			d.setAttribute('title', title);
			d.setAttribute('cover', this.items[i].getCover());
			d.setAttribute('keyart',keyart);
			if (descr) {
				// We have a description, so it needs to appear when this item is highlighted
				descr = descr.replace(/&(lt|gt);/g, function (strMatch, p1){ return (p1 == "lt")? "<" : ">"; });
				descr = descr.replace(/<\/?[^>]+(>|$)/g, " ");
				descr = descr.replace(/ 12:00:00 UTC/g, ",");

				var i1 = descr.lastIndexOf('Add this to your queue');
				var i2 = descr.lastIndexOf('Air date');
				if (i1 > 0 && i2 > 0) descr = descr.substr(0,i1) + '<br><small>' + descr.substr(i2) + '</small>';

				d.setAttribute('description', descr);
			}
			
			d.onmouseover = function(e) { 
				this.className = this.className.replace('_off','_on');
				$('show_cover').src = this.getAttribute('cover');
				$('show_title').innerHTML = this.getAttribute('title');
				$('hulu_key_art').src = (g_module.keyart) ? g_module.keyart : this.getAttribute('keyart');
				
				var t = this.getAttribute('description');
				if (t) $('show_description').innerHTML = t;
			}

			//d.innerHTML = '<span id="subtitle'+i+'" style="height:'+(height/2)+'px;line-height:'+(height/2)+'px;">'+title+'</span>';
			d.innerHTML = '<span id="subtitle'+i+'" style="height:'+height+'px;line-height:'+height+'px;">'+title+'</span>';

			//d.style.width = width+'px';
			d.style.height = height+'px';
			d.style.margin = margin+'px';
			d.style.padding = padding+'px';

			var stitle = title.toUpperCase();
			if (stitle.substr(0,4) == 'THE ') stitle = stitle.substr(4);
			d.stitle = stitle;

			divs.push(d);
		}
		
		var showId = '';

		//
		// HACK (2 of 3) - Check for a common keyart for all items 
		// (e.g. for all episodes of a single show). This may break
		// if hulu changes things
		//
		// Expected: 
		//   http://www.hulu.com/watch/56370/30-rock-generalissimo#http...
		//   http://www.hulu.com/watch/54234/30-rock-retreat-to-move-forward#http...
		// Conversion:
		//   * Remove everything before last /
		//   * Remove everything after #
		//   * Convert - to _
		//   * Compare strings and find longest common substring (e.g. 30_rock_)
		//   * Strip off ending _ (and anything else)
		//   * Link is http://assets.hulu.com/shows/key_art_XXXXXX.jpg
		// Result: 
		//   http://assets.hulu.com/shows/key_art_30_rock.jpg
		//		
		if (this.items.length > 1) {
			var ss0 = this.items[0].tag('link');
			ss0 = ss0.substr(ss0.lastIndexOf('/')+1);
			ss0 = ss0.substr(0,ss0.indexOf('#'));
			ss0 = ss0.replace(/-/g,'_');

			var ss1 = this.items[1].tag('link');
			ss1 = ss1.substr(ss1.lastIndexOf('/')+1);
			ss1 = ss1.substr(0,ss1.indexOf('#'));
			ss1 = ss1.replace(/-/g,'_');

			var lcs = 1;
			for (lcs = 1; lcs<ss0.length; lcs++) {
				var temp = ss0.substr(0,lcs);
				if (ss1.indexOf(temp) != 0) break;
			}
			if (lcs > 3) {
				showId = ss0.substr(0,lcs);
				showId = showId.substr(0,showId.lastIndexOf('_'));
				this.keyart = 'http://assets.hulu.com/shows/key_art_' + showId + '.jpg';
				$('hulu_key_art').src = this.keyart;
			}
		}
		// END HACK

		// Add a 'More...' button for shows not on RSS feed.  We guess that there are more
		// shows if the the RSS feed is exactly 20 items (hulu's max).
		if (this.items.length == 20) {
			//
			// HACK (3 of 3) - Guess url of hulu page based on feed url
			// This may break if hulu changes things
			//
			// Expected: 
			//   http://www.hulu.com/feed/show/945/episodes
			// Conversion:
			//   * Remove /feed/ from link
			// Result: 
			//   http://www.hulu.com/show/945/episodes
			//			
			this.children[20] = new HrefModule(this,this.url.replace('/feed/','/'));
		
			var d = document.createElement('div');
			d.id = 'item20';
			$(d).addClassName('default_show_div_off');
			$(d).addClassName(this.prefix+'_show_div_off');
			d.setAttribute('cindex',20);
			d.onclick = function() { g_module.goChild(this.getAttribute('cindex')); }
			
			Cell.setParameters(d);

			d.setAttribute('title','More...');
			d.setAttribute('description','See more episodes at Hulu.com');
			d.setAttribute('cover','/demo/images/hulu.png');
			d.setAttribute('keyart','/demo/images/hulu.jpg');
		
			d.onmouseover = function(e) { 
				this.className = this.className.replace('_off','_on');
				$('show_cover').src = this.getAttribute('cover');
				$('show_title').innerHTML = this.getAttribute('title');
				$('hulu_key_art').src = (g_module.keyart) ? g_module.keyart : this.getAttribute('keyart');
				
				var t = this.getAttribute('description');
				if (t) $('show_description').innerHTML = t;
			}

			d.innerHTML = '<span id="subtitle20" style="height:'+height+'px;line-height:'+height+'px;">More...</span>';

			//d.style.width = width+'px';
			d.style.height = height+'px';
			d.style.margin = margin+'px';
			d.style.padding = padding+'px';

			// Make this appear at the end of sorted list
			d.stitle = 'ZZZZZZZZZZZZZZZZZZZZZZZZ';

			divs.push(d);
		}

		this.drawSidebar();

		// Finalize page
		if (this.sorted) divs = divs.sort(function(a,b) {
  			if (a.stitle<b.stitle) return -1;
  			if (a.stitle>b.stitle) return 1;
  			return 0;
		});
		Pages.write(divs,this.rows,1,'page_div');
		LFrame.init();
		Cell.connectAll();
		$('page_num').innerHTML = 'Page ' + (Pages.currentpage+1) + ' of ' + Pages.pages.length;
		if (this.selected && $(this.selected)) Cell.select($(this.selected).cell,1);
		
		Effect.Appear('content_div', { duration:0.5 });
	}
});

var ListModule = Class.create(Menu,{
	rows: 6,
	tempPage: 0,
	pageTO: 0,	
	close: function($super) {
		if (Cell.sel && Cell.sel.div) this.selected = Cell.sel.div.id;
		$super();
	},
	registerKeys: function() {
		Cell.registerKeys();
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
		
		Keys.register(48, function() { g_module.updatePage(0); }); // 0
		Keys.register(49, function() { g_module.updatePage(1); }); // 1
		Keys.register(50, function() { g_module.updatePage(2); }); // 2
		Keys.register(51, function() { g_module.updatePage(3); }); // 3
		Keys.register(52, function() { g_module.updatePage(4); }); // 4
		Keys.register(53, function() { g_module.updatePage(5); }); // 5
		Keys.register(54, function() { g_module.updatePage(6); }); // 6
		Keys.register(55, function() { g_module.updatePage(7); }); // 7
		Keys.register(56, function() { g_module.updatePage(8); }); // 8
		Keys.register(57, function() { g_module.updatePage(9); }); // 9		
	},
	clearKeys: function() {
		Cell.clearKeys();
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
		
		Keys.clear(48); // 0
		Keys.clear(49); // 1
		Keys.clear(50); // 2
		Keys.clear(51); // 3
		Keys.clear(52); // 4
		Keys.clear(53); // 5
		Keys.clear(54); // 6
		Keys.clear(55); // 7
		Keys.clear(56); // 8
		Keys.clear(57); // 9
	},
	updatePage: function(n) {
		n = parseInt(n);
		if (this.pageTO || n == -1) {
			// Second number or timeout
			if (n >= 0) this.tempPage = 10*this.tempPage + n;
			this.tempPage -= 1;

			clearTimeout(this.pageTO);
			this.pageTO = 0;			
			
			Pages.gotoPage(this.tempPage,0,0);
		}
		else {
			// First number
			this.tempPage = n;
			this.pageTO = setTimeout('g_module.updatePage(-1)',2000);
		}
	},
	parseMenuTags: function($super,menu) {
		var t = Xml.getTagText(menu,'rows');
		if (t) this.rows = t;
		$super(menu);
	},
	drawSidebar: function() {
		// By default, the sidebar only has a back button
		if (this.parent) this.addSidebarBtn(0,'Back','go-back.png',function() { g_module.goBack(); });
	},
	drawMenu: function() {
		$('content_div').hide();
		//$('content_div').style.backgroundImage = 'url('+this.bgImage+')';
		$('content_div').innerHTML = 
			((this.bgImage) ? '<img id="content_bg" src="'+this.bgImage+'">' : '')
			+ '<div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>'
			+ '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>'
			+ '<div id="page_up"><img id="page_up_img" style="visibility:hidden;" src="images/other/arrow_u.png" onclick="Pages.prevPage();return false;"></div>'
			+ '<div id="page_div" class="default_page_div '+this.prefix+'_page_div"></div>'
			+ '<div id="page_down"><span id="page_num"></span><img style="display:none;" id="page_down_img" align="top" src="images/other/arrow_d.png"  onclick="Pages.nextPage();return false;"></div>';

		//Effect.Appear('content_div', {queue: { scope: 'waitfx' }});
		//Effect.Appear('content_div', { duration:0.5 });			

		// Calculate grid size
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var totWidth = parseInt(getStyle($('page_div'),'width'));
		var totHeight = parseInt(getStyle($('page_div'),'height'));

		var border = 2;   // 2px border
		var margin = Math.round(2*scale);   // 2px margin
		var padding = Math.round(4*scale); // 20px padding
		//var width = Math.floor(totWidth - 2*margin - 2*padding - 2*border);
		var height = Math.floor(totHeight/this.rows - 2*margin - 2*padding - 2*border);

		// Draw grid divs
		var divs = [];
		for (var i = 0; i < this.children.length; i++) {
			var d = document.createElement('div');
			d.id = 'item'+i;
			$(d).addClassName('default_list_div_off');
			$(d).addClassName(this.prefix+'_list_div_off');
			d.setAttribute('cindex',i);
			d.onclick = function() { g_module.goChild(this.getAttribute('cindex')); }
			
			// Save title for sorting
			var stitle = this.items[i].tag('title').toUpperCase();
			if (stitle.substr(0,4) == 'THE ') stitle = stitle.substr(4);
			d.title = stitle;
			
			Cell.setParameters(d);

			// This is all a hack to allow the subtitle to use BlindDown if chosen by
			// keyboard input.  The mouse moves too fast, so BlindDown gets all screwy.
			// I could have just made the subtitle appear with simple CSS and this
			// whole function could be removed, but I like the BlindDown effect.
			/*d.onmouseover = function(e) { 
				this.className = this.className.replace('_off','_on');
				
				// Show subtitle
				var newsub = 'subtitle'+this.getAttribute('cindex');
				if (this.active == newsub) return;
				else if (this.active) $(this.active).hide();
				this.active = newsub;				
				
				if (e == undefined) Effect.BlindDown(newsub,{duration:0.5}); // Keyboard
				else $(newsub).show(); // Mouse
			}
			//*/

			var str = '';
			var cover = this.items[i].getCover();
			if (cover) str += '<img src="'+cover+'" class="cover">';
			str += '<span id="subtitle'+i+'" style="height:'+(height/2)+'px;line-height:'+(height/2)+'px;">'+this.items[i].tag('title')+'</span>';
			
			
			
			var descr = this.items[i].tag('description');
			if (!descr) descr = this.items[i].tag('content');
			descr = descr.replace(/&(lt|gt);/g, function (strMatch, p1){ return (p1 == "lt")? "<" : ">"; });
			//descr = descr.replace(/<\/p>/g, "\n");
			descr = descr.replace(/<\/?[^>]+(>|$)/g, " ");

			
			
			str += '<span id="description'+i+'" style="height:'+(height/2)+'px;line-height:'+(height/2)+'px;overflow:hidden;" class="description">'+descr+'</span>';
			d.innerHTML = str;

			//d.style.width = width+'px';
			d.style.height = height+'px';
			d.style.margin = margin+'px';
			d.style.padding = padding+'px';

			divs.push(d);
		}

		this.drawSidebar();

		// Finalize page
		if (this.sorted) divs = divs.sort(function(a,b) {
  			if (a.title<b.title) return -1;
  			if (a.title>b.title) return 1;
  			return 0;
		});
		Pages.write(divs,this.rows,1,'page_div');
		LFrame.init();
		Cell.connectAll();
		$('page_num').innerHTML = 'Page ' + (Pages.currentpage+1) + ' of ' + Pages.pages.length;
		if (this.selected && $(this.selected)) Cell.select($(this.selected).cell,1);
		
		Effect.Appear('content_div', { duration:0.5 });
		
		// The rest of the subtitle BlindDown hack
		//for (var i = 0; i < this.children.length; i++) $('subtitle'+i).style.display = 'none';
	}
});

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

var MusicRootModule = Class.create(Menu,{
	rows: 10,
	ticker: 1,
	close: function($super) {
		if (Cell.sel && Cell.sel.div) this.selected = Cell.sel.div.id;
		$super();
	},
	registerKeys: function() {
		Cell.registerKeys();
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
	},
	clearKeys: function() {
		Cell.clearKeys();
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	parseMenuTags: function($super,menu) {
		var t = Xml.getTagText(menu,'rows');
		if (t) this.rows = t;
		$super(menu);
	},
	drawSidebar: function() {
		this.addSidebarBtn(0,'Now Playing','EQ.png',function() { g_module.nowPlaying(); });
		this.addSidebarBtn(1,'Playlist','playlist.png',function() { g_audio.overlay.open(); });
		if (this.parent) this.addSidebarBtn(2,'Back','go-back.png',function() { g_module.goBack(); });
	},
	drawMenu: function() {
		$('content_div').hide();
		//$('content_div').style.backgroundImage = 'url('+this.bgImage+')';
		$('content_div').innerHTML = 
			((this.bgImage) ? '<img id="content_bg" src="'+this.bgImage+'">' : '')
			+ '<div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>'
			+ '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>'
			+ '<div id="page_up"><img id="page_up_img" style="visibility:hidden;" src="images/other/arrow_u.png" onclick="Pages.prevPage();return false;"></div>'
			+ '<div id="page_div" class="default_page_div '+this.prefix+'_page_div"></div>'
			+ '<div id="page_down"><span id="page_num"></span><img style="display:none;" id="page_down_img" align="top" src="images/other/arrow_d.png"  onclick="Pages.nextPage();return false;"></div>';		

		//Effect.Appear('content_div', {queue: { scope: 'waitfx' }});
		//Effect.Appear('content_div', { duration:0.5 });

		// Calculate grid size
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var totWidth = parseInt(getStyle($('page_div'),'width'));
		var totHeight = parseInt(getStyle($('page_div'),'height'));

		var border = 2;   // 2px border
		var height = Math.floor(totHeight/this.rows - 2*border);
		var width = Math.floor(totWidth - 2*border - 2*(height+8));
		
		var pwidth = Math.floor(120*scale);
		var qwidth = Math.floor(160*scale);

		// Draw grid divs
		var divs = [];
		for (var i = 0; i < this.children.length; i++) {
			// Primary artist item
			var d = document.createElement('div');
			d.id = 'item'+i;
			$(d).addClassName('music_root_div_off');
			//$(d).addClassName(this.prefix+'_list_div_off');
			d.setAttribute('cindex',i);
			d.onclick = function() { g_module.goChild(this.getAttribute('cindex')); }

			// Save title for sorting
			var stitle = this.items[i].tag('title').toUpperCase();
			if (stitle.substr(0,4) == 'THE ') stitle = stitle.substr(4);
			d.title = stitle; 
			
			Cell.setParameters(d);

			var str = '';
			var artist = this.items[i].tag('title');
			var cover = this.items[i].getCover();
			if (!cover) cover = '/demo/images/nocover_audio.png';
			str += '<img src="'+cover+'" class="cover">';
			str += '<span id="subtitle'+i+'" style="height:'+height+'px;line-height:'+height+'px;">'+artist+'</span>';
			
			var count = this.items[i].tag('albumCount');
			if (count == 1) str += '<div class="subtitle" style="height:'+height+'px;line-height:'+height+'px;">1 album</div>';
			else if (count > 1) str += '<div class="subtitle" style="height:'+height+'px;line-height:'+height+'px;">'+count+' albums</div>';
			d.innerHTML = str;

			d.style.width = width+'px';
			d.style.height = height+'px';

			// Play Artist button
			var p = document.createElement('div');
			p.id = 'playall'+i;
			$(p).addClassName('music_root_sb_off');
			//$(p).addClassName(this.prefix+'_list_div_off');
			p.title = d.title + '1';
			p.setAttribute('cindex',i);
			p.onclick = function() { g_module.add(this.getAttribute('cindex'),1); }
			Cell.setParameters(p);
			p.style.width = height+'px';
			p.style.height = height+'px';
			p.style.lineHeight = height+'px';
			
			p.innerHTML =  '<span class="subtitle" style="line-height:'+height+'px;width:'+pwidth+'px;margin-left:-'+(pwidth+height-15)+'px;">Play Artist Now</span>'
				+'<img src="/demo/images/other/toolbar/play-all.png" style="width:100%;height:100%;">';
	
			// Queue Artist button
			var q = document.createElement('div');
			q.id = 'queueall'+i;
			$(q).addClassName('music_root_sb_off');
			//$(q).addClassName(this.prefix+'_list_div_off');
			q.title = d.title + '2';
			q.setAttribute('cindex',i);
			q.onclick = function() { g_module.add(this.getAttribute('cindex'),0); }
			Cell.setParameters(q);
			q.style.width = height+'px';
			q.style.height = height+'px';
			q.style.lineHeight = height+'px';
			
			q.innerHTML = '<span class="subtitle" style="line-height:'+height+'px;width:'+qwidth+'px;margin-left:-'+(qwidth+height-15)+'px;">Add Artist to Playlist</span>'
				+'<img src="/demo/images/other/toolbar/playlist-mode.png" style="width:100%;height:100%;">';

			d.title = d.title + '0';
			divs.push(d);
			divs.push(p);
			divs.push(q);			
		}

		this.drawSidebar();

		// Finalize page
		//if (this.sorted) 
		divs = divs.sort(function(a,b) {
  			if (a.title<b.title) return -1;
  			if (a.title>b.title) return 1;
  			return 0;
		});
		Pages.write(divs,this.rows,3,'page_div');
		LFrame.init();
		Cell.connectAll();
		$('page_num').innerHTML = 'Page ' + (Pages.currentpage+1) + ' of ' + Pages.pages.length;
		if (this.selected && $(this.selected)) Cell.select($(this.selected).cell,1);
		
		Effect.Appear('content_div', { duration:0.5 });
		
		// The rest of the subtitle BlindDown hack
		//for (var i = 0; i < this.children.length; i++) $('subtitle'+i).style.display = 'none';
	},
	add: function(cindex,playnow) {
try {
		if (playnow) g_audio.clear(); // Clear the playlist
		g_module.goChild(cindex);
		g_module.addArtist(playnow,0);
} catch (e) { alert('add(): ' + e); }
	}
});






var MusicArtistModule = Class.create(Menu,{
	mid:3,
	width: 5,
	selected: 2,  // Reference to the currently selected object 
	subitem: 0,
	xform: [],
	ticker: 1,
//	bgImage: '/images/bg/%SIZE%/background_main.jpg',
	registerKeys: function() {
		Keys.register(37, function() { g_module.shiftDock(1); });  // Left
		Keys.register(38, function() { g_module.subMenu(-1); });   // Up
		Keys.register(39, function() { g_module.shiftDock(-1); }); // Right
		Keys.register(40, function() { g_module.subMenu(1); });    // Down

		//Keys.register(33, Pages.prevPage); // PgUp
		//Keys.register(34, Pages.nextPage); // PgDn
		//Keys.register(35, function() { Pages.gotoPage(Pages.pages.length-1,1); }); // End
		//Keys.register(36, function() { Pages.gotoPage(0,1); }); // Home

		Keys.register(13, function() { g_module.activate(); }); // Enter
		
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
		
		Keys.register(49, function() { g_module.shiftDock(2); g_module.activate(); }); // 1 10%
		Keys.register(50, function() { g_module.shiftDock(1); g_module.activate(); }); // 2 20%
		Keys.register(51, function() { g_module.activate(); }); // 3 30%
		Keys.register(52, function() { g_module.shiftDock(-1); g_module.activate(); }); // 4 40%
		Keys.register(53, function() { g_module.shiftDock(-2); g_module.activate(); }); // 5 50%
	},
	clearKeys: function() {
		Keys.clear(37); // Left
		Keys.clear(38); // Up
		Keys.clear(39); // Right
		Keys.clear(40); // Down
		
		//Keys.clear(33); // PgUp
		//Keys.clear(34); // PgDn
		//Keys.clear(35); // End
		//Keys.clear(36); // Home
	
		Keys.clear(13); // Enter
		
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
		
		Keys.clear(49); // 1 Item 1
		Keys.clear(50); // 2 Item 2
		Keys.clear(51); // 3 Item 3
		Keys.clear(52); // 4 Item 4
		Keys.clear(53); // 5 Item 5
	},
	activate: function() {
		// Activate child of menu
		var i = $('music_artist_submenu' + this.subitem);
		if (i) i.onclick();
	},
	subMenu: function(s) {
		var newitem = this.subitem + s;
		if (newitem < 0) return;
		else if (newitem > 3) return;
		
		// Make sure subitem exists
		if (!$('music_artist_submenu' + newitem)) return;
		else this.subitem = newitem;
	
		for (var i=0; i<4; i++) {
			var m = $('music_artist_submenu' + i);
			if (!m) continue;
			if (i == this.subitem) m.onmouseover();
			else m.onmouseout();
		}
	},
	shiftDock: function(s) {
		var queue = Effect.Queues.get('menufx');
		if (s == 0 && queue.size() != 0) {
			setTimeout('g_module.shiftDock(0)',100);
			return;
		}
		else if (s != 0) setTimeout('g_module.shiftDock(0)',100);
	
		//, queue: { scope: 'menufx' }
	
		var i = 0;
		while($('menuitem'+i)) {
			var div = $('menuitem'+i);
			if (!div || div.getAttribute("menupos") == undefined) continue;

			// Set new position		
			var newpos = parseInt(div.getAttribute("menupos"))+s;
			if (newpos >= this.items.length && newpos > this.width) newpos -= this.items.length;
			else if (newpos < 0 || (this.width == this.items.length && newpos < 1)) newpos += this.items.length;
			div.setAttribute("menupos",newpos);

			// Transition to new position if item is visible
			new Effect.Morph(div.id, {
				style: this.xform[Math.min(newpos,this.width+1)], // CSS Properties
				duration: 0.5, // Core Effect properties
				queue: { scope: 'menufx' }
			});
			
			// Update background image and submenu
			if (newpos == this.mid) { // Find the icon that is in the middle
				this.selected = i;
			
				var bgstr = div.getAttribute("menubg");
				if (s != 0) {
					$('music_artist_submenu0').innerHTML = g_module.items[g_module.selected].tag('title');
				}
			}
			
			// Adjust z-index
			if (newpos <= this.width) div.style.zIndex = (10-Math.abs(newpos-this.mid));
			else div.style.zIndex = 0;
						
			i++;
		}
	},
	drawMenu: function() {
		$('content_div').hide();
		$('content_div').innerHTML = 
			((this.bgImage) ? '<img id="content_bg" src="'+this.bgImage.replace(/%SIZE%/g,g_size)+'">' : '')
			+ '<div id="dock_bg_div" style="width:100%;height:100%;"></div>' // BG1
			//+ '<div id="dock_glow"><img src="images/glow_silver.png"></div>'			
			+ '<div id="music_artist_submenu"></div>'
			+ '<div id="dock_left"><img src="images/other/arrow_l.png" onclick="g_module.shiftDock(1);return false;"></div>'
			+ '<div id="dock_right"><img src="images/other/arrow_r.png" onclick="g_module.shiftDock(-1);return false;"></div>'
			+ '<div id="page_title" class="default_page_title '+this.prefix+'_page_title">'+this.title+'</div>'
			+ '</div>';
		Effect.Appear('content_div', { duration:1.0 });
	
		// Create layout parameters
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var size = [];
		var top = [];
		var left = [];
		var opacity = [];

		for (var i=1; i<=this.width; i++) {
			var x = (this.mid-1 - Math.abs(this.mid-i)) / (this.mid-1);
			size[i] = 160*x*Math.sqrt(x) + 120;
			opacity[i] = '1.0';
		}

		left[this.mid] = Math.floor((1280-size[this.mid])/2);
		top[this.mid] = 150;
		
		for (var i=this.mid-1; i>0; i--) {
			left[i] = left[i+1] - size[i] - 60;
			top[i] = top[this.mid] + (size[this.mid]-size[i])/2;
			//top[i] = top[this.mid] + (size[this.mid]-size[i]);
		}
		for (var i=this.mid+1; i<=this.width; i++) {
			left[i] = left[i-1] + size[i-1] + 60;
			top[i] = top[this.mid] + (size[this.mid]-size[i])/2;
			//top[i] = top[this.mid] + (size[this.mid]-size[i]);
		}

		// Invisible end points 
		size[0] = '0';
		size[this.width+1] = '0';
		top[0] = top[this.mid] + size[this.mid]/2;
		top[this.width+1] = top[this.mid] + size[this.mid]/2;
		left[0] = '0';
		left[this.width+1] = '1280';
		opacity[0] = '0';
		opacity[this.width+1] = '0';

		// Scale to our resolution and build transform table
		for (var i=0; i<=this.width+1; i++) {
			size[i] = Math.round(size[i]*scale);
			top[i] = Math.round((top[i]-64)*scale+64);
			left[i] = Math.round(left[i]*scale);

			this.xform[i] = 'width:' + size[i] + 'px;height:' + Math.round(1.5*size[i]) + 'px;top:' + top[i] + 'px;left:' + left[i] + 'px;opacity:' + opacity[i] + ';';
		}
		
		$('music_artist_submenu').style.top = Math.round(top[this.mid]+size[this.mid]+scale*20) + 'px';

		// Draw shortcut numbers
		for (var i=0; i<this.width; i++) {
			//if (i == this.mid-1) continue;
			var d = document.createElement('div');
			$(d).addClassName('dock_shortcut_div');
			if (this.prefix) $(d).addClassName(this.prefix + '_shortcut_div');
			d.innerHTML = (i+1);
			d.style.left = left[i+1] + 'px';
			d.style.width = size[i+1] + 'px';
			d.style.top = Math.round(top[i+1] - 64*scale) + 'px';
			
			$('content_div').appendChild(d);
		}
	
		// Make sure there are enough albums to make the rotating dock look good
		var len = this.items.length;
		while (this.items.length <= this.width+1) {
			for (var i=0; i<len; i++) {
				this.items.push(this.items[i]);
			}		
		}

		// Create markup for menu items
		for (var i=0; i<this.items.length; i++) {
			var d = document.createElement('div');
			d.id = 'menuitem'+i;
			var cover = this.items[i].getCover();
			if (!cover) cover = '/demo/images/nocover_audio.png';
			d.innerHTML = '<img id="menuimg'+i+'" style="width:100%;height:67%;" src="' + cover + '">';

			// Determine icon's position
			var i2 = i+(this.mid-this.selected);
			if (i2 >= this.items.length) i2 -= this.items.length;
			else if (i2 < 0) i2 += this.items.length;
			d.setAttribute("menupos",i2);

			// Set position's style attributes			
			if (i2 < 0) i2 = 0;
			else if (i2 >= size.length) i2 = size.length-1;
			d.style.width = size[i2] + 'px';
			d.style.height = Math.round(1.5*size[i2]) + 'px';
			d.style.top = top[i2] + 'px';
			d.style.left = left[i2] + 'px';
			d.style.opacity = opacity[i2];
			d.style.position = 'absolute';
			d.style.overflow = 'hidden';

			$('content_div').appendChild(d);
			
			// Add onclick to icon
			$('menuimg'+i).onclick = function() { g_module.goChild(this.getAttribute('cindex')); }
			$('menuimg'+i).setAttribute('cindex',i % len);
			$('menuimg'+i).style.cursor = 'pointer';
/*			
			// Add image reflection
			if (document.all && !window.opera) {
				// IE -- Untested. This probably doesn't work
				var image = document.createElement('img');
				image.src = $('menuimg'+i).src;
				image.style.width = '100%';
				image.style.height = '33%';
				image.style.opacity = '0.25';
				image.style.filter = 'flipv progid:DXImageTransform.Microsoft.Alpha(opacity='+(100)+', style=1, finishOpacity=0, startx=0, starty=0, finishx=0, finishy='+(0.5*100)+')';
				d.appendChild(image);
			}
			else {
				try {
				var canvas = document.createElement('canvas');
				//var p = $('menuimg'+i+'_mirror');
				var image = $('menuimg'+i);
				if (canvas.getContext) {
					var context = canvas.getContext("2d");

					canvas.style.height = '33%';
					canvas.style.width = '100%';
					canvas.style.opacity = '0.25';
					canvas.height = 0.5*size[this.mid];
					canvas.width = size[this.mid];
					
					d.appendChild(canvas);

					context.save();
					context.translate(0,image.height-1);
					context.scale(1,-1);
					context.drawImage(image, 0, 0, size[this.mid], image.height);
					context.restore();

					context.globalCompositeOperation = "destination-out";
					var gradient = context.createLinearGradient(0, 0, 0, 0.4*size[this.mid]);
					gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
					gradient.addColorStop(0, "rgba(255, 255, 255, 0.0)");

					context.fillStyle = gradient;
					context.rect(0, 0, size[this.mid], size[this.mid]*2);
					context.fill();
				}
				} catch(e) { alert(e); }
			}
*/
		}
		
		// Album title
		var d2 = document.createElement('span');
		d2.id = 'music_artist_submenu0';
		d2.innerHTML = this.items[this.selected].tag('title');
		d2.onclick = function() { g_module.goChild(g_module.selected%g_module.children.length); }
		d2.onmouseover = function() { this.className = this.className.replace('_off','_on'); }
		d2.onmouseout = function() { this.className = this.className.replace('_on','_off'); }
		$(d2).addClassName('music_artist_on');
		$('music_artist_submenu').appendChild(d2);
		$('music_artist_submenu').appendChild(document.createElement('br'));
		$('music_artist_submenu').appendChild(document.createElement('br'));

		// Play Album button
		d2 = document.createElement('span');
		d2.id = 'music_artist_submenu1';
		d2.innerHTML = '<img src="/demo/images/other/toolbar/play-all.png"> Play Album Now';
		//d2.onclick = function() { g_module.add(g_module.children[g_module.selected%g_module.children.length].url,1); }
		d2.onclick = function() { g_module.add(g_module.children[g_module.selected%g_module.children.length],1); }
		d2.onmouseover = function() { this.className = this.className.replace('_off','_on'); }
		d2.onmouseout = function() { this.className = this.className.replace('_on','_off'); }
		$(d2).addClassName('music_artist_off');
		$('music_artist_submenu').appendChild(d2);
		$('music_artist_submenu').appendChild(document.createElement('br'));

		// Queue Album button
		d2 = document.createElement('span');
		d2.id = 'music_artist_submenu2';
		d2.innerHTML = '<img src="/demo/images/other/toolbar/playlist-mode.png"> Add Album to Playlist';
		d2.onclick = function() { g_module.add(g_module.children[g_module.selected%g_module.children.length],0); }
		d2.onmouseover = function() { this.className = this.className.replace('_off','_on'); }
		d2.onmouseout = function() { this.className = this.className.replace('_on','_off'); }
		$(d2).addClassName('music_artist_off');
		$('music_artist_submenu').appendChild(d2);
		$('music_artist_submenu').appendChild(document.createElement('br'));
		
		// Now Playing button
		d2 = document.createElement('span');
		d2.id = 'music_artist_submenu3';
		d2.innerHTML = '<img src="/demo/images/other/toolbar/EQ.png"> Now Playing';
		d2.onclick = function() { g_module.nowPlaying(); }
		d2.onmouseover = function() { this.className = this.className.replace('_off','_on'); }
		d2.onmouseout = function() { this.className = this.className.replace('_on','_off'); }
		$(d2).addClassName('music_artist_off');
		$('music_artist_submenu').appendChild(d2);

		this.subitem = 0;
		this.shiftDock(0);
		
		setTimeout('g_module.drawReflection()',500);
	},
	add: function(child,playnow) {
		if (playnow) g_audio.clear(); // Clear the playlist
		g_module.go(child);
		g_module.addAlbum(playnow);
	},
	addArtist: function(playnow,cindex) {
		if (cindex == 0 && !this.items) {
			setTimeout('g_module.addArtist('+playnow+',0)',100);
			return;
		}
		var albums = g_module.children;
		for (var i=cindex; i<albums.length; i++) {
			g_module.goChild(i); // Load the album's list of tracks
			g_module.addAlbum(0); // Queue the album
			
			// Wait for the album to load before queueing the next one
			if (!g_module.items) {
				setTimeout('g_module.addArtist('+playnow+','+(i+1)+')',100);
				return;
			}			
		}
		if (playnow) {
			g_audio.restart();
			g_module.nowPlaying();	
		}
		else g_module.goBack();
	},
	drawReflection: function() {
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var size = 280*scale;
		var image0 = $('menuimg0');
		
		for (var i=0; i<this.items.length; i++) {
			var d = $('menuitem'+i);
			
			// Add image reflection
			if (document.all && !window.opera) {
				// IE -- Untested. This probably doesn't work
				var image = document.createElement('img');
				image.src = $('menuimg'+i).src;
				image.style.width = '100%';
				image.style.height = '33%';
				image.style.opacity = '0.25';
				image.style.filter = 'flipv progid:DXImageTransform.Microsoft.Alpha(opacity='+(100)+', style=1, finishOpacity=0, startx=0, starty=0, finishx=0, finishy='+(0.5*100)+')';
				d.appendChild(image);
			}
			else {
				try {
				var canvas = document.createElement('canvas');
				var image = $('menuimg'+i);
				if (canvas.getContext) {
					var context = canvas.getContext("2d");

					canvas.style.height = '33%';
					canvas.style.width = '100%';
					canvas.style.opacity = '0.25';
					canvas.height = 0.5*size;
					canvas.width = size;

					d.appendChild(canvas);

					context.save();
					context.translate(0,image0.height-1);
					context.scale(1,-1);
					context.drawImage(image, 0, -image0.height, size, 2*image0.height);
					context.restore();

					context.globalCompositeOperation = "destination-out";
					var gradient = context.createLinearGradient(0, 0, 0, 0.4*size);
					gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
					gradient.addColorStop(0, "rgba(255, 255, 255, 0.0)");

					context.fillStyle = gradient;
					context.rect(0, 0, size, size*2);
					context.fill();
				}
				} catch(e) { alert('drawReflection: ' + e); }
			}
		}
	}
});



var MusicAlbumModule = Class.create(Menu,{
	rows: 10,
	ticker: 1,
	close: function($super) {
		if (Cell.sel && Cell.sel.div) this.selected = Cell.sel.div.id;
		$super();
	},
	addAlbum: function(playnow) {
		if (!this.items) {
			setTimeout('g_module.addAlbum('+playnow+')',100);
			return;
		}
		for (var i=0; i<this.children.length; i++) {
			if (playnow && i == 0) this.children[i].add(1);
			else this.children[i].add(0);
		}
		if (playnow) g_audio.restart();
		else this.goBack();
	},
	registerKeys: function() {
		Cell.registerKeys();
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
	},
	clearKeys: function() {
		Cell.clearKeys();
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	parseMenuTags: function($super,menu) {
		var t = Xml.getTagText(menu,'rows');
		if (t) this.rows = t;
		$super(menu);
	},
	drawSidebar: function() {
		this.addSidebarBtn(0,'Now Playing','EQ.png',function() { g_module.nowPlaying(); });
		this.addSidebarBtn(1,'Playlist','playlist.png',function() { g_audio.overlay.open(); });
		if (this.parent) this.addSidebarBtn(2,'Back','go-back.png',function() { g_module.goBack(); });
	},
	drawMenu: function() {
		$('content_div').hide();
		var cover = this.items[0].getCover();
		if (!cover) cover = '/demo/images/nocover_audio.png';
		$('content_div').innerHTML = 
			((this.bgImage) ? '<img id="content_bg" src="'+this.bgImage+'">' : '')
			+ '<div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>'
			+ '<div id="music_album_cover_div"><img id="music_album_cover" src="'+cover+'" style="width:100%;height:66%;"></div>'
			+ '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>'
			+ '<div id="page_up"><img id="page_up_img" style="visibility:hidden;" src="images/other/arrow_u.png" onclick="Pages.prevPage();return false;"></div>'
			+ '<div id="page_div" class="music_album_div '+this.prefix+'_album_div"></div>'
			+ '<div id="page_down"><span id="page_num"></span><img style="display:none;" id="page_down_img" align="top" src="images/other/arrow_d.png"  onclick="Pages.nextPage();return false;"></div>';		

		//Effect.Appear('content_div', {queue: { scope: 'waitfx' }});
		//Effect.Appear('content_div', { duration:0.5 });			

		// Calculate grid size
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var totWidth = parseInt(getStyle($('page_div'),'width'));
		var totHeight = parseInt(getStyle($('page_div'),'height'));

		var border = 2;   // 2px border
		var height = Math.floor(totHeight/this.rows - 2*border);
		var width = Math.floor(totWidth - 2*border - (height+18));
		
		var qwidth = Math.floor(72*scale);
		
		// Draw grid divs
		var divs = [];
		for (var i = 0; i < this.children.length; i++) {
			var d = document.createElement('div');
			d.id = 'item'+i;
			$(d).addClassName('music_album_div_off');
			//$(d).addClassName(this.prefix+'_list_div_off');
			d.setAttribute('cindex',i);
			d.style.width = width+'px';
			d.style.height = height+'px';
			d.title = this.items[i].tag('title');
			d.onclick = function() { 
				var cindex = this.getAttribute('cindex');
				g_module.children[cindex].add(0);
				$('checked'+cindex).src = '/demo/images/other/checked.png';
			}
			
			Cell.setParameters(d);

			var str = '';
			str += '<img id="checked'+i+'" src="/demo/images/other/' + ((g_audio.getIndex(d.title) < 0) ? 'un' : '') + 'checked.png" style="height:100%;float:left;">';
			str += '<img src="/demo/images/other/toolbar/playlist-mode.png" style="height:100%;float:right;">';
			str += '<span id="subtitle'+i+'" style="height:'+height+'px;line-height:'+height+'px;">'+this.items[i].tag('title')+'</span>';
			d.innerHTML = str;

			// Play Now button
			var q = document.createElement('div');
			q.id = 'playall'+i;
			$(q).addClassName('music_album_sb_off');
			q.setAttribute('cindex',i);
			q.onclick = function() { g_module.children[this.getAttribute('cindex')].add(1); }
			Cell.setParameters(q);
			q.style.width = height+'px';
			q.style.height = height+'px';
			q.style.lineHeight = height+'px';
			
			//q.innerHTML = '<span class="subtitle" style="line-height:'+height+'px;width:'+qwidth+'px;margin-left:-'+(qwidth+height-15)+'px;">Play Now</span>'
			//	+'<img src="/demo/images/other/toolbar/play-now.png" style="width:100%;height:100%;">';
			q.innerHTML = '<img src="/demo/images/other/toolbar/play-now.png" style="width:100%;height:100%;">';

			// Save title for sorting
			var stitle = this.items[i].tag('title').toUpperCase();
			if (stitle.substr(0,4) == 'THE ') stitle = stitle.substr(4);
			d.title = stitle + '0';
			q.title = stitle + '0';

			divs.push(d);
			divs.push(q);	
		}

		// Add cover reflection
		if (document.all && !window.opera) {
			// IE -- Untested. This probably doesn't work
			var image = document.createElement('img');
			image.src = $('menuimg'+i).src;
			image.style.width = '100%';
			image.style.height = '33%';
			image.style.opacity = '0.25';
			image.style.filter = 'flipv progid:DXImageTransform.Microsoft.Alpha(opacity='+(100)+', style=1, finishOpacity=0, startx=0, starty=0, finishx=0, finishy='+(0.5*100)+')';
			$('music_album_cover_div').appendChild(image);
		}
		else {
			try {
			var canvas = document.createElement('canvas');
			var image = $('music_album_cover');
			if (canvas.getContext) {
				var context = canvas.getContext("2d");
				var width = image.width;
				var height = image.height;

				canvas.style.height = '33%';
				canvas.style.width = '100%';
				canvas.style.opacity = '0.25';
				canvas.height = height*0.5;
				canvas.width = width;

				$('music_album_cover_div').appendChild(canvas);

				context.save();
				context.translate(0,image.height-1);
				context.scale(1,-1);
				context.drawImage(image, 0, 0, width, height);
				context.restore();

				context.globalCompositeOperation = "destination-out";
				var gradient = context.createLinearGradient(0, 0, 0, 0.3*height);
				gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
				gradient.addColorStop(0, "rgba(255, 255, 255, 0)");

				context.fillStyle = gradient;
				context.rect(0, 0, width, height*2);
				context.fill();
			}
			} catch(e) { }
		}

		this.drawSidebar();

		// Finalize page
		divs = divs.sort(function(a,b) {
  			if (a.title<b.title) return -1;
  			if (a.title>b.title) return 1;
  			return 0;
		});
		Pages.write(divs,this.rows,2,'page_div');
		LFrame.init();
		Cell.connectAll();
		$('page_num').innerHTML = 'Page ' + (Pages.currentpage+1) + ' of ' + Pages.pages.length;
		if (this.selected && $(this.selected)) Cell.select($(this.selected).cell,1);
		
		Effect.Appear('content_div', { duration:0.5 });
	}
});
//
// NOTE: Season browsing assumes that episodes are grouped together by season 
// and that the seasons are ordered sequentially 
//
var ShowModule = Class.create(Menu,{
	rows: 10,
	ticker: 0,
	close: function($super) {
		if (Cell.sel && Cell.sel.div) this.selected = Cell.sel.div.id;
		$super();
	},
	registerKeys: function() {
		//Cell.registerKeys();
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back

		// Cell keys with minor changes for seasons		
		Keys.register(37, function() { g_module.gotoSeason(-1); });
		Keys.register(38, function() { Cell.select(Cell.sel.up); });
		Keys.register(39, function() { g_module.gotoSeason(1); });
		Keys.register(40, function() { Cell.select(Cell.sel.down); });

		Keys.register(33, Pages.prevPage); // PgUp
		Keys.register(34, Pages.nextPage); // PgDn
		Keys.register(35, function() { Pages.gotoPage(Pages.pages.length-1,1); }); // End
		Keys.register(36, function() { Pages.gotoPage(0,1); }); // Home

		Keys.register(13, function() { Cell.sel.activate(); }); // Enter
	},
	clearKeys: function() {
		Cell.clearKeys();
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	parseMenuTags: function($super,menu) {
		var t = Xml.getTagText(menu,'rows');
		if (t) this.rows = t;
		$super(menu);
	},
	drawSidebar: function() {
		// By default, the sidebar only has a back button
		//if (this.parent) this.addSidebarBtn(0,'Back','go-back.png',function() { g_module.goBack(); });
	},
	drawMenu: function() {
		if (!this.items || this.items.length < 1) {
			this.errorScreen('XML feed has no shows');
			return;
		}
		var seasons = this.items[0].tag('season');	
	
		$('content_div').hide();
		//$('content_div').style.backgroundImage = 'url('+this.bgImage+')';
		$('content_div').innerHTML = 
			((this.bgImage) ? '<img id="content_bg" src="'+this.bgImage+'">' : '')
			//+ '<div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>'
			+ '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>'
			+ '<div id="show_season_div">'
			+ ((seasons) ? '<img id="show_left_img" style="float:left;" src="images/other/arrow_l.png" onclick="g_module.gotoSeason(-1);return false;"><img id="show_right_img" style="float:right;" src="images/other/arrow_r.png" onclick="g_module.gotoSeason(1);return false;"><div id="show_season" class="show_season_off keyOn"></div>' : '<div id="show_season_title">'+this.title+'</div>')
			+ '</div>'
			+ '<div id="page_up" style="padding-top:1%;height:4%;"><img id="page_up_img" style="visibility:hidden;" src="images/other/arrow_u.png" onclick="Pages.prevPage();return false;"></div>'
			+ '<div id="page_div" class="show_page_div '+this.prefix+'_page_div"></div>'
			+ '<div id="page_down" style="padding-top:1%;height:4%;"><span id="page_num"></span><img style="display:none;" id="page_down_img" align="top" src="images/other/arrow_d.png"  onclick="Pages.nextPage();return false;"></div>'
			+ '<div id="show_info"><img id="show_cover" class="cover"><div id="show_title">'+this.title+'</div><div id="show_description">'+this.subtitle+'</div></div>';

		//var d = document.createElement('div');
		//d.id = 'show_season';
		//$(d).addClassName('default_show_div_off');
		//Cell.setParameters(d);
		//d.setAttribute("rel","0,1");
		//$('show_season_div').appendChild(d);

		//Effect.Appear('content_div', {queue: { scope: 'waitfx' }});
		//Effect.Appear('content_div', { duration:0.5 });

		// Calculate grid size
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var totWidth = parseInt(getStyle($('page_div'),'width'));
		var totHeight = parseInt(getStyle($('page_div'),'height'));

		var border = 2;   // 2px border
		var margin = Math.round(2*scale);   // 2px margin
		var padding = Math.round(4*scale); // 20px padding
		//var width = Math.floor(totWidth - 2*margin - 2*padding - 2*border);
		var height = Math.floor(totHeight/this.rows - 2*margin - 2*padding - 2*border);

		// Draw grid divs
		var divs = [];
		for (var i = 0; i < this.items.length; i++) {
			var d = document.createElement('div');
			d.id = 'item'+i;
			$(d).addClassName('default_show_div_off');
			$(d).addClassName(this.prefix+'_show_div_off');
			d.setAttribute('cindex',i);
			d.onclick = function() { g_module.goChild(this.getAttribute('cindex')); }
			
			Cell.setParameters(d);

			var title = this.items[i].tag('title');
			var season = this.items[i].tag('season');
			var descr = this.items[i].tag('description');
			if (!descr) descr = this.items[i].tag('content');

			d.setAttribute('title', title);
			d.setAttribute('cover', this.items[i].getCover());
			if (season) d.setAttribute('season', season);
			if (descr) {
				// We have a description, so it needs to appear when this item is highlighted
				descr = descr.replace(/&(lt|gt);/g, function (strMatch, p1){ return (p1 == "lt")? "<" : ">"; });
				descr = descr.replace(/<\/?[^>]+(>|$)/g, " ");
				descr = descr.replace(/ 12:00:00 UTC/g, ",");
				
				var i1 = descr.lastIndexOf('Add this to your queue');
				var i2 = descr.lastIndexOf('Air date');
				if (i1 > 0 && i2 > 0) descr = descr.substr(0,i1) + '<br><small>' + descr.substr(i2) + '</small>';
				
				d.setAttribute('description', descr);
			}
			
			d.onmouseover = function(e) { 
				this.className = this.className.replace('_off','_on');
				$('show_cover').src = this.getAttribute('cover');
				$('show_title').innerHTML = this.getAttribute('title');
				
				var t = this.getAttribute('description');
				if (t) $('show_description').innerHTML = t;
				
				t = this.getAttribute('season');
				if (t) {
					//$('show_season').innerHTML = '<img src="' + this.getAttribute('cover') + '" align="top"> Season ' + t;
					$('show_season').innerHTML = g_module.title + '<br><span class="show_season_subtitle">Season ' + t + '</span>';
					if (t == g_module.getMinSeason()) $('show_left_img').style.visibility = 'hidden';
					else $('show_left_img').style.visibility = 'visible';
					if (t == g_module.getMaxSeason()) $('show_right_img').style.visibility = 'hidden';
					else $('show_right_img').style.visibility = 'visible';
				}
			}

			//d.innerHTML = '<span id="subtitle'+i+'" style="height:'+(height/2)+'px;line-height:'+(height/2)+'px;">'+title+'</span>';
			d.innerHTML = '<span id="subtitle'+i+'" style="height:'+height+'px;line-height:'+height+'px;">'+title+'</span>';

			//d.style.width = width+'px';
			d.style.height = height+'px';
			d.style.margin = margin+'px';
			d.style.padding = padding+'px';

			var stitle = title.toUpperCase();
			if (stitle.substr(0,4) == 'THE ') stitle = stitle.substr(4);
			d.stitle = stitle;

			divs.push(d);
		}

		this.drawSidebar();

		// Finalize page
		if (this.sorted) divs = divs.sort(function(a,b) {
  			if (a.stitle<b.stitle) return -1;
  			if (a.stitle>b.stitle) return 1;
  			return 0;
		});
		Pages.write(divs,this.rows,1,'page_div');
		LFrame.init();
		Cell.connectAll();
		$('page_num').innerHTML = 'Page ' + (Pages.currentpage+1) + ' of ' + Pages.pages.length;
		if (this.selected && $(this.selected)) Cell.select($(this.selected).cell,1);
		
		Effect.Appear('content_div', { duration:0.5 });
		
		// The rest of the subtitle BlindDown hack
		//for (var i = 0; i < this.children.length; i++) $('subtitle'+i).style.display = 'none';
	},
	gotoSeason: function(dir) {
		var min = this.getMinSeason();
		var max = this.getMaxSeason();
	
		// Calculate next season number
		var n = parseInt(Cell.sel.div.getAttribute('season'));
		n += dir;
		//if (n < 1) n = max;
		//else if (n > max+1) n = 1;
		if (n < min || n > max+1) return;
		
		// Scroll to next season	
		s = Cell.grid[1][1];
		while (parseInt(s.div.getAttribute('season')) != n && s.right) s = s.right;
		Cell.select(s);
	},
	getMaxSeason: function() {
		// Find max season
		var s = Cell.sel;
		while (s.right) s = s.right;
		return parseInt(s.div.getAttribute('season'));
	},
	getMinSeason: function() {
		// Find min season
		var s = Cell.grid[1][1];
		return parseInt(s.div.getAttribute('season'));
	}
});

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

var ScoresModule = Class.create(Module,{
	sport: 0,
	title: '',
	prefix: 'sb',
	interval: 0,
	ticker: 1,
	video: 0,
	radio: 0,
	highlights: 0,
	initialize: function(parent,sport) {
		this.parent = parent;
		this.sport = parseInt(sport);
		this.children = [];
	},
	open: function() {
		//if (typeof(netscape) != 'undefined') netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
		
		var url = "/demo/php/get.php?s=" + encodeURIComponent('http://msn.foxsports.com/nugget/9240_' + this.sport + '?refresh=' + (new Date).getTime());
		this.ajaxRequest = new Ajax.Request(url, {
			method:'get',
			onSuccess: function(transport){ g_module.drawScores(transport.responseText); },
			onFailure: function(){ g_module.errorScreen('Ajax request failed'); }
		});
		
		this.registerKeys();
		Screensaver.disable();
		//Ticker.start(); // Start score ticker if not already started
	},
	close: function($super) {
		if (this.interval) window.clearInterval(this.interval);
		Screensaver.enable();
		$super();
	},
	registerKeys: function() {
		Keys.register(27, function() { // Esc
			// Close Lightframe, else go back
			if ($('lightframediv') && $('lightframediv').style.display == 'block') LFLink.prototype.deactivate();  
			else g_module.goBack(); // Go back
		});
		Keys.register(8, function() { // Backspace
			// Close Lightframe, else go back
			if ($('lightframediv') && $('lightframediv').style.display == 'block') LFLink.prototype.deactivate();  
			else g_module.goBack(); // Go back
		});
		Keys.register(166, function() { // Remote Back
			// Close Lightframe, else go back
			if ($('lightframediv') && $('lightframediv').style.display == 'block') LFLink.prototype.deactivate();  
			else g_module.goBack(); // Go back
		});
		Cell.registerKeys();	
	},
	clearKeys: function() {
		Cell.clearKeys();
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	drawScores: function(xmlText) {
		$('content_div').hide();
		$('content_div').innerHTML = 
			'<img id="content_bg" src="'+this.bgImage+'"><div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>'
			+ '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>'
			+ '<div id="page_up"><img id="page_up_img" style="visibility:hidden;" src="images/other/arrow_u.png" onclick="Pages.prevPage();return false;"></div>'
			+ '<div id="page_div" class="default_page_div '+this.prefix+'_page_div"></div>'
			+ '<div id="page_down"><span id="page_num"></span><img style="display:none;" id="page_down_img" align="top" src="images/other/arrow_d.png"  onclick="Pages.nextPage();return false;"></div>';
		//$('content_div').style.backgroundImage = 'url(images/bg/background_scores_' + this.sport + '.jpg)';
		Effect.Appear('content_div', {duration:0.5,queue: { scope: 'waitfx' }});
	
		// Get the feed title
		var feedid = getXMLParam(xmlText,"id");
		//feedtitle = getXMLParam(xmlText,"label");

		var sport,fav1,fav2,ifsize;

		if (feedid == '49') {
			sport = 'http://sports.espn.go.com/mlb/';
			fav1 = 22; fav2 = 26;
			ifsize = "width=960,height=603";
		}
		else if (feedid == '5') {
			sport = 'http://sports.espn.go.com/nfl/';
			fav1 = 21; fav2 = 25;
			//ifsize = "width=780,height=590";
			ifsize = "width=797,height=594";
		}
		else if (feedid == '73') {
			sport = 'http://sports.espn.go.com/nba/';
			fav1 = 20; fav2 = 29;
			ifsize = "width=870,height=590";
		}
		else if (feedid == '142') {
			sport = 'http://msn.foxsports.com/nhl/gameTrax?gameId=';
			fav1 = 15; fav2 = -1;
			ifsize = "width=800,height=500";
		}
		else if (feedid == '24') {
			sport = 'http://msn.foxsports.com/cfb/gameTrax?gameId=';
			fav1 = 29; fav2 = -1;
			ifsize = "width=798,height=590";
		}
		else if (feedid == '99') {
			sport = 'http://msn.foxsports.com/cbk/gameTrax?gameId=';
			fav1 = 17; fav2 = 357;
			ifsize = "width=800,height=500";
		}

		xmlText = this.changeTZ(xmlText);

		// Parse through the list of rss items
		var games = xmlText.split('<game ');

		var items = 0;
		if (games.length == 1) {
			$('page_div').innerHTML = '<div id="'+this.prefix+'_nogames">No games today</div>';
		}
		else {
			items = [];
			for(var i = 1; i < games.length && i < 50; i++) {
				var gameId = getXMLParam(games[i],"gameId");
				var gameType = getXMLParam(games[i],"gameType");
				var gameStatus = getXMLParam(games[i],"gameStatus");
				var awayTeam = getXMLParam(games[i],"awayTeam");
				var homeTeam = getXMLParam(games[i],"homeTeam");
				var awayName = getXMLParam(games[i],"awayName");
				var homeName = getXMLParam(games[i],"homeName");
				var awayId = getXMLParam(games[i],"awayId");
				var homeId = getXMLParam(games[i],"homeId");
				var awayScore = getXMLParam(games[i],"awayScore");
				var homeScore = getXMLParam(games[i],"homeScore");
				var pregame = getXMLParam(games[i],"pregame");
				var ingame = getXMLParam(games[i],"ingame");
				var postgame = getXMLParam(games[i],"postgame");
				var delayed = getXMLParam(games[i],"delayed");
				var redZone = getXMLParam(games[i],"redZone");

				// ESPN NFL/NBA uses a 280904019 instead of 20080904019
				if (feedid == '5' || feedid == '73') {
					gameId = '2' + gameId.substr(3);
					if (gameId.length == 8) gameId = gameId.substr(0,6) + '0' + gameId.substr(6);
				}

				// Adjust link for ESPN (MLB and NFL only)
				//if (ingame == '1') gameId = "gamecast?gameId=" + gameId;
				//else if (pregame == '1') gameId = "preview?gameId=" + gameId;
				//else  gameId = "recap?gameId=" + gameId;
				if (feedid == '49' || feedid == '5' || feedid == '73') gameId = "gamecast?gameId=" + gameId;

				// Sport-specific fields
				// Baseball
				var mob1 = getXMLParam(games[i],"mob1");
				var mob2 = getXMLParam(games[i],"mob2");
				var mob3 = getXMLParam(games[i],"mob3");
				var seriesStanding = getXMLParam(games[i],"seriesStanding");
				var seriesOver = getXMLParam(games[i],"seriesOver");
				var balls = getXMLParam(games[i],"balls");
				var strikes = getXMLParam(games[i],"strikes");
				var outs = getXMLParam(games[i],"outs");

				// Football
				var awayHaveBall = getXMLParam(games[i],"awayHaveBall");
				var homeHaveBall = getXMLParam(games[i],"homeHaveBall");
				var awayTeamRank = getXMLParam(games[i],"awayTeamRank");
				var homeTeamRank = getXMLParam(games[i],"homeTeamRank");

				if (awayTeamRank != 0) awayTeam = '(' + awayTeamRank + ') ' + awayTeam;
				if (homeTeamRank != 0) homeTeam = '(' + homeTeamRank + ') ' + homeTeam;
				if (awayHaveBall != 0) awayTeam = awayTeam + '&diams;';
				if (homeHaveBall != 0) homeTeam = homeTeam + '&diams;';

				var a = document.createElement('a');
				a.href = sport + gameId;
				a.id = "score" + (i-1);
				$(a).addClassName(this.prefix+'_a_off');
				$(a).addClassName('lfOn');

				a.setAttribute("rel",ifsize);

				Cell.setParameters(a);

				// Check for favorites 
				if (awayId == fav1 || awayId == fav2 || homeId == fav1 || homeId == fav2) {
					//a.style.borderColor = '#f00';
					$(a).addClassName(this.prefix+'_fav');
				}

				// Create scoreboard div
				var html = '';
				if (postgame == '1') html += '<div class="'+this.prefix+'_postgame">';
				else if (redZone == '1') html += '<div class="'+this.prefix+'_redzone">';
				else if (ingame == '1') html += '<div class="'+this.prefix+'_ingame">';
				else html += '<div class="'+this.prefix+'_pregame">';

				if (feedid == '49' && ingame == '1') {
					bases = mob3 + mob2 + mob1;
					html += '<div class="'+this.prefix+'_bases"><img align="top" alt="" src="images/base' + bases + '.png"></div>';
				}

				html += '<div class="'+this.prefix+'_team"><div class="'+this.prefix+'_score">' + awayScore + '</div>' + awayTeam + '</div>';
				html += '<div class="'+this.prefix+'_team"><div class="'+this.prefix+'_score">' + homeScore + '</div>' + homeTeam + '</div>';

				if (ingame == '1') html += '<div class="'+this.prefix+'_gray">' + gameStatus + '</div>';
				else html += '<div class="'+this.prefix+'_white">' + gameStatus + '</div>';
				html += '</div>';

				a.innerHTML = html;
				items[i-1] = a;
			}
		}

		// Add sidebar buttons
		i = 0;
		if (this.video) {
			this.children[0] = new HrefModule(this,this.video);
			this.addSidebarBtn(i++,'Live Video','fullscreen.png',function() { g_module.goChild(0); });
		}
		if (this.radio) {
			this.addSidebarBtn(i++,'Live Radio','sound.png',function() { 
				window.open(g_module.radio,'radio','height=380,width=660');
				return false;			
			});
		}
		if (this.highlights) {
			this.children[2] = new ListModule(this,this.highlights);
			this.addSidebarBtn(i++,'Highlights','media-play.png',function() { g_module.goChild(2); });
		}
		this.addSidebarBtn(i++,'Refresh Scores','rright.png',function() { g_module.refresh(); });
		this.addSidebarBtn(i++,'Back','go-back.png',function() { g_module.goBack(); });

		// Finalize page - depends on whether any games today
		if (items) { 
			// Games today
			Pages.write(items,4,4,'page_div');
			LFrame.init();
			Cell.connectAll();
			$('page_num').innerHTML = 'Page ' + (Pages.currentpage+1) + ' of ' + Pages.pages.length;
			this.interval = window.setInterval("g_module.refresh()",60000);
		}
		else {
			// No games today
			LFrame.init();
			Cell.connectAll();
			Cell.select(Cell.grid[1][0]);

			// Fix left/right issues when no scores are shown			
			for (var i=0; i<Cell.grid.length; i++) {
				if (Cell.grid[i] && Cell.grid[i][0]) Cell.grid[i][0].right = Cell.grid[i][0];
			}
		}
	},
	changeTZ: function(xml) {
		// Convert times from ET to PT
		xml = xml.replace(/6:(\d{2}) [Aa][Mm]/g,'3:$1 am');
		xml = xml.replace(/7:(\d{2}) [Aa][Mm]/g,'4:$1 am');
		xml = xml.replace(/8:(\d{2}) [Aa][Mm]/g,'5:$1 am');
		xml = xml.replace(/9:(\d{2}) [Aa][Mm]/g,'6:$1 am');
		xml = xml.replace(/10:(\d{2}) [Aa][Mm]/g,'7:$1 am');
		xml = xml.replace(/11:(\d{2}) [AaE][MmT]/g,'8:$1 am');
		xml = xml.replace(/12:(\d{2}) [PpE][MmT]/g,'9:$1 am');
		xml = xml.replace(/1:(\d{2}) [PpE][MmT]/g,'10:$1 am');
		xml = xml.replace(/2:(\d{2}) [PpE][MmT]/g,'11:$1 am');
		xml = xml.replace(/3:(\d{2}) [PpE][MmT]/g,'12:$1 pm');
		xml = xml.replace(/4:(\d{2}) [PpE][MmT]/g,'1:$1 pm');
		xml = xml.replace(/5:(\d{2}) [PpE][MmT]/g,'2:$1 pm');
		xml = xml.replace(/6:(\d{2}) [PpE][MmT]/g,'3:$1 pm');
		xml = xml.replace(/7:(\d{2}) [PpE][MmT]/g,'4:$1 pm');
		xml = xml.replace(/8:(\d{2}) [PpE][MmT]/g,'5:$1 pm');
		xml = xml.replace(/9:(\d{2}) [PpE][MmT]/g,'6:$1 pm');
		xml = xml.replace(/10:(\d{2}) [PpE][MmT]/g,'7:$1 pm');
		xml = xml.replace(/,1:(\d{2})/g,' 10:$1');
		xml = xml.replace(/,2:(\d{2})/g,' 11:$1');
		xml = xml.replace(/,3:(\d{2})/g,' 12:$1');
		xml = xml.replace(/,4:(\d{2})/g,' 1:$1');
		xml = xml.replace(/,5:(\d{2})/g,' 2:$1');
		xml = xml.replace(/,6:(\d{2})/g,' 3:$1');
		xml = xml.replace(/,7:(\d{2})/g,' 4:$1');
		xml = xml.replace(/,8:(\d{2})/g,' 5:$1');
		return xml;
	}
});

var SearchModule = Class.create(Module, {
	title: '',
	children: [],

	url: 'http://www.google.com/search?q={searchTerms}',
	popup: 1,
	popupWidth: 800,
	popupHeight: 600,

	// Keyboard
	cols: 10,
	shift: 0,
	keys:  [ 'BKSP','a','b','c','d','e','f','g','h','i','SPACE','j','k','l','m','n','o','p','q','r','SHIFT','s','t','u','v','w','x','y','z','0','GO','1','2','3','4','5','6','7','8','9' ],
	skeys: [ 'BKSP','A','B','C','D','E','F','G','H','I','SPACE','J','K','L','M','N','O','P','Q','R','SHIFT','S','T','U','V','W','X','Y','Z',')','GO','!','@','#','$','%','^','&','*','(' ],
	typing: 0,
	initialize: function(parent,url) {
		this.parent = parent;
		if (url) this.url = unescape(url);
	},
	registerKeys: function() {
		Keys.snapshot();
		Keys.clearAll();
		
		Keys.register(37, function() { Cell.select(Cell.sel.left); g_module.typing = 0; });
		Keys.register(38, function() { Cell.select(Cell.sel.up); g_module.typing = 0; });
		Keys.register(39, function() { Cell.select(Cell.sel.right); g_module.typing = 0; });
		Keys.register(40, function() { Cell.select(Cell.sel.down); g_module.typing = 0; });
	
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
		
		Keys.register(8, function() { g_module.append(0); }); // Backspace
		Keys.register(65, function() { g_module.append(1); g_module.typing = 1; }); // A
		Keys.register(66, function() { g_module.append(2); g_module.typing = 1; }); // B
		Keys.register(67, function() { g_module.append(3); g_module.typing = 1; }); // C
		Keys.register(68, function() { g_module.append(4); g_module.typing = 1; }); // D
		Keys.register(69, function() { g_module.append(5); g_module.typing = 1; }); // E
		Keys.register(70, function() { g_module.append(6); g_module.typing = 1; }); // F
		Keys.register(71, function() { g_module.append(7); g_module.typing = 1; }); // G
		Keys.register(72, function() { g_module.append(8); g_module.typing = 1; }); // H
		Keys.register(73, function() { g_module.append(9); g_module.typing = 1; }); // I
		
		Keys.register(32, function() { g_module.append(10); g_module.typing = 1; }); // Space		
		Keys.register(74, function() { g_module.append(11); g_module.typing = 1; }); // J
		Keys.register(75, function() { g_module.append(12); g_module.typing = 1; }); // K
		Keys.register(76, function() { g_module.append(13); g_module.typing = 1; }); // L
		Keys.register(77, function() { g_module.append(14); g_module.typing = 1; }); // M
		Keys.register(78, function() { g_module.append(15); g_module.typing = 1; }); // N
		Keys.register(79, function() { g_module.append(16); g_module.typing = 1; }); // O
		Keys.register(80, function() { g_module.append(17); g_module.typing = 1; }); // P
		Keys.register(81, function() { g_module.append(18); g_module.typing = 1; }); // Q
		Keys.register(82, function() { g_module.append(19); g_module.typing = 1; }); // R
		
		//Keys.register(16, function() { g_module.append(20); }); // Shift
		Keys.register(83, function() { g_module.append(21); g_module.typing = 1; }); // S
		Keys.register(84, function() { g_module.append(22); g_module.typing = 1; }); // T
		Keys.register(85, function() { g_module.append(23); g_module.typing = 1; }); // U
		Keys.register(86, function() { g_module.append(24); g_module.typing = 1; }); // V
		Keys.register(87, function() { g_module.append(25); g_module.typing = 1; }); // W
		Keys.register(88, function() { g_module.append(26); g_module.typing = 1; }); // X
		Keys.register(89, function() { g_module.append(27); g_module.typing = 1; }); // Y
		Keys.register(90, function() { g_module.append(28); g_module.typing = 1; }); // Z
		Keys.register(48, function() { g_module.append(29); g_module.typing = 1; }); // 0

		Keys.register(13, function() { if (g_module.typing == 1) g_module.append(30); else Cell.sel.activate(); }); // Enter
		Keys.register(49, function() { g_module.append(31); g_module.typing = 1; }); // 1
		Keys.register(50, function() { g_module.append(32); g_module.typing = 1; }); // 2
		Keys.register(51, function() { g_module.append(33); g_module.typing = 1; }); // 3
		Keys.register(52, function() { g_module.append(34); g_module.typing = 1; }); // 4
		Keys.register(53, function() { g_module.append(35); g_module.typing = 1; }); // 5
		Keys.register(54, function() { g_module.append(36); g_module.typing = 1; }); // 6
		Keys.register(55, function() { g_module.append(37); g_module.typing = 1; }); // 7
		Keys.register(56, function() { g_module.append(38); g_module.typing = 1; }); // 8
		Keys.register(57, function() { g_module.append(39); g_module.typing = 1; }); // 9
		
		// Shift + keys
		Keys.register(65, function() { g_module.shift = 1; g_module.append(1); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // A
		Keys.register(66, function() { g_module.shift = 1; g_module.append(2); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // B
		Keys.register(67, function() { g_module.shift = 1; g_module.append(3); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // C
		Keys.register(68, function() { g_module.shift = 1; g_module.append(4); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // D
		Keys.register(69, function() { g_module.shift = 1; g_module.append(5); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // E
		Keys.register(70, function() { g_module.shift = 1; g_module.append(6); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // F
		Keys.register(71, function() { g_module.shift = 1; g_module.append(7); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // G
		Keys.register(72, function() { g_module.shift = 1; g_module.append(8); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // H
		Keys.register(73, function() { g_module.shift = 1; g_module.append(9); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // I
		
		Keys.register(74, function() { g_module.shift = 1; g_module.append(11); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // J
		Keys.register(75, function() { g_module.shift = 1; g_module.append(12); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // K
		Keys.register(76, function() { g_module.shift = 1; g_module.append(13); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // L
		Keys.register(77, function() { g_module.shift = 1; g_module.append(14); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // M
		Keys.register(78, function() { g_module.shift = 1; g_module.append(15); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // N
		Keys.register(79, function() { g_module.shift = 1; g_module.append(16); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // O
		Keys.register(80, function() { g_module.shift = 1; g_module.append(17); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // P
		Keys.register(81, function() { g_module.shift = 1; g_module.append(18); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // Q
		Keys.register(82, function() { g_module.shift = 1; g_module.append(19); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // R
		
		Keys.register(83, function() { g_module.shift = 1; g_module.append(21); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // S
		Keys.register(84, function() { g_module.shift = 1; g_module.append(22); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // T
		Keys.register(85, function() { g_module.shift = 1; g_module.append(23); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // U
		Keys.register(86, function() { g_module.shift = 1; g_module.append(24); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // V
		Keys.register(87, function() { g_module.shift = 1; g_module.append(25); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // W
		Keys.register(88, function() { g_module.shift = 1; g_module.append(26); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // X
		Keys.register(89, function() { g_module.shift = 1; g_module.append(27); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // Y
		Keys.register(90, function() { g_module.shift = 1; g_module.append(28); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // Z
		Keys.register(48, function() { g_module.shift = 1; g_module.append(29); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // 0

		Keys.register(49, function() { g_module.shift = 1; g_module.append(31); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // 1
		Keys.register(50, function() { g_module.shift = 1; g_module.append(32); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // 2
		Keys.register(51, function() { g_module.shift = 1; g_module.append(33); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // 3
		Keys.register(52, function() { g_module.shift = 1; g_module.append(34); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // 4
		Keys.register(53, function() { g_module.shift = 1; g_module.append(35); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // 5
		Keys.register(54, function() { g_module.shift = 1; g_module.append(36); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // 6
		Keys.register(55, function() { g_module.shift = 1; g_module.append(37); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // 7
		Keys.register(56, function() { g_module.shift = 1; g_module.append(38); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // 8
		Keys.register(57, function() { g_module.shift = 1; g_module.append(39); g_module.shift = 0; g_module.typing = 1; }, Keys.META_SHIFT); // 9		
	},
	clearKeys: function() {
		Keys.revert();
	},
	open: function() {
		$('content_div').hide();
		$('content_div').innerHTML = 
			'<div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>'
			+ '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>'
			+ '<div id="search_input" class="default_search_input '+this.prefix+'_search_input">|</div>'
			+ '<div id="search_keys" class="default_search_keys '+this.prefix+'_search_keys"></div>'
		Effect.Appear('content_div', {duration:0.5, queue: { scope: 'waitfx' }});
		
		// Calculate grid size
		var totWidth = parseInt(getStyle($('search_keys'),'width'));
		var totHeight = parseInt(getStyle($('search_keys'),'height'));

		var border = 2;   // 2px border
		var margin = 2;   // 2px margin
		var size = Math.floor(totWidth/(this.cols+1) - 2*margin - 2*border);
		var size2 = totWidth - (this.cols-1)*(size+2*margin+2*border) - 2*margin - 2*border;

		for (var i=0; i<40; i++) {
			var row = Math.floor(i/this.cols);
			var col = i%this.cols;
		
			var d = document.createElement('div');
			d.id = 'key'+i;
			$(d).addClassName('default_search_div_off');
			if (this.prefix) $(d).addClassName(this.prefix+'_search_div_off');
			d.setAttribute('key',i);
			d.setAttribute("rel",(row+1)+","+(col+1));
			d.onclick = function() { g_module.append(this.getAttribute('key')); g_module.typing = 0; }
			d.innerHTML = this.keys[i];
			
			Cell.setParameters(d);
			
			if (col == 0) d.style.width = size2+'px';
			else d.style.width = size+'px';
			d.style.height = size+'px';
			d.style.lineHeight = size+'px';
			d.style.margin = margin+'px';
			
			$('search_keys').appendChild(d);
		}

		this.registerKeys();
		Cell.connectAll("rel");
		Pages.pagerows = 4;
	},
	append: function(idx) {
		var s = $('search_input').innerHTML;
		
		if (idx == 0) { // Backspace
			if (s.length > 1) {
				s = s.substr(0,s.length-2);
				$('search_input').innerHTML = s + '|';
			}
		}
		else if (idx == 20) { // Shift
			if (this.shift) {
				this.shift = 0;
				for (var i=0; i<this.keys.length; i++) $('key'+i).innerHTML = this.keys[i];				
			}
			else {
				this.shift = 1;
				for (var i=0; i<this.keys.length; i++) $('key'+i).innerHTML = this.skeys[i];
			}
		}
		else if (idx == 30) { // Go
			if (s.length > 1) {
				s = s.substr(0,s.length-1);
				this.search(s);				
			}
		}
		else {
			s = s.substr(0,s.length-1);
			if (idx == 10) s = s + ' ';
			else if (this.shift) s = s + this.skeys[idx];
			else s = s + this.keys[idx];
			$('search_input').innerHTML  = s + '|';

			//if (this.shift) {
			//	this.shift = 0;
			//	for (var i=0; i<this.keys.length; i++) $('key'+i).innerHTML = this.keys[i];				
			//}
		}		
	},
	search: function(s) {
		//
		// This function can be overridden to make other, more sophisticated search modules.
		//
		var url2 = this.url.replace('{searchTerms}',s);
	
		if (this.popup) {
			// Frame module
			this.children[0] = new FrameModule(this,url2);
			this.children[0].width = this.popupWidth;
			this.children[0].height = this.popupHeight;
		}
		else {
			// HrefModule
			this.children[0] = new HrefModule(this,url2);
		}
		this.goChild(0);		
	}
});

var TVGuideModule = Class.create(Module, {
	title: '',
	ticker: 0,
	srvid: '',
	date: 0,
	minCh: 0,
	maxCh: 1000,
	gridmins: 120, // width of guide in minutes
	rows: 8,
	divs: [],
	guideChannel: 0,
	tempChannel: 0,
	guideChannelTO: 0,
	tzOffset: 0, // 1,
	initialize: function(parent,srvid) {
		this.parent = parent;
		this.srvid = srvid;
	},
	open: function() {
		$('content_div').innerHTML = this.getGuideHtml();
		this.openGuide();
		this.registerKeys();
	},
	openGuide: function() {
		//this.getGuide(new Date());
		var d = new Date();
		if (this.tzOffset) d.setTime(d.getTime()+this.tzOffset*3600000);
		this.getGuide(d);
	},
	hideGuide: function() {
		var div = $('guide_div');
		if (div) div.innerHTML = '';
		
		var details = $('guide_details');
		if (details) details.innerHTML = '';

		var progress = $('guide_progress');
		if (progress) progress.hide();
	},
	getGuideHtml: function() {
		return '<div id="guide_div"></div><div id="guide_details"></div><div id="guide_progress" style="display:none;"></div>';
	},
	getGuide: function(date) {
		this.date = date;
		this.date.setMinutes(0);
		this.date.setSeconds(0);
		
		var yr = date.getFullYear();
		var mo = date.getMonth()+1;
		var dy = date.getDate();
		var hr = date.getHours();
		if (hr == 24) hr = 0;
	
		// Draw menu for the first time
		// http://tvlistings.tvguide.com/ListingsWeb/listings/data/ajaxcache.ashx?fmt=0&srvid=67199&gridmins=120&gridyr=2009&gridmo=10&griddy=7&gridhr=11&chanrow=1&genre=0&favchan=false
		var u = 'http://tvlistings.tvguide.com/ListingsWeb/listings/data/ajaxcache.ashx?fmt=0&srvid='+this.srvid+'&gridmins='+this.gridmins+'&gridyr='+yr+'&gridmo='+mo+'&griddy='+dy+'&gridhr='+hr+'&chanrow=1&genre=0&favchan=false&24hr=1';
//alert(u);
		//u = 'http://localhost/debug/tvlistings.txt';

		u = "/demo/php/get.php?s=" + encodeURIComponent(u);
		this.ajaxRequest = new Ajax.Request(u, {
			method:'get',
			onSuccess: function(transport){ g_module.drawGuide(transport.responseText); },
			onFailure: function(){ g_module.errorScreen('Ajax request failed'); }
		});	
	},	
	registerKeys: function() {
		this.registerGuideKeys();
		
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back		
	},
	registerGuideKeys: function() {
		Cell.registerKeys();
		Keys.clear(37); // Left
		Keys.clear(39); // Right
		Keys.register(37, function() { g_module.left(); }); // Left
		Keys.register(39, function() { g_module.right(); }); // Right
		
		Keys.register(78, function() { g_module.nextPage(); }); // n Next Item
		Keys.register(80, function() { g_module.prevPage(); }); // p Previous Item
		
		Keys.register(76, function() { g_module.hideGuide(); }); // L
		
		Keys.register(48, function() { g_module.updateGuideChannel(0); }); // 0 0%
		Keys.register(49, function() { g_module.updateGuideChannel(1); }); // 1 10%
		Keys.register(50, function() { g_module.updateGuideChannel(2); }); // 2 20%
		Keys.register(51, function() { g_module.updateGuideChannel(3); }); // 3 30%
		Keys.register(52, function() { g_module.updateGuideChannel(4); }); // 4 40%
		Keys.register(53, function() { g_module.updateGuideChannel(5); }); // 5 50%
		Keys.register(54, function() { g_module.updateGuideChannel(6); }); // 6 60%
		Keys.register(55, function() { g_module.updateGuideChannel(7); }); // 7 70%
		Keys.register(56, function() { g_module.updateGuideChannel(8); }); // 8 80%
		Keys.register(57, function() { g_module.updateGuideChannel(9); }); // 9 90%		
	},
	clearKeys: function() {
		Cell.clearKeys();
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	nextPage: function() {
		Effect.Fade('guide_div', { duration: 0.5, queue: { scope: 'guidefx' }, afterFinish: function (obj) { 
			$('guide_div').innerHTML = '';
		}});
		$('guide_progress').hide();
		$('guide_details').innerHTML = '';
	
		this.guideChannel = Cell.sel.div.getAttribute('channel');
	
		var t = this.date.getTime();
		t += this.gridmins*60*1000;
		this.date.setTime(t);
		this.getGuide(this.date);
	},
	prevPage: function() {
		Effect.Fade('guide_div', { duration: 0.5, queue: { scope: 'guidefx' }, afterFinish: function (obj) { 
			$('guide_div').innerHTML = '';
			$('guide_details').innerHTML = '';
		}});
		$('guide_progress').hide();
		$('guide_details').innerHTML = '';

		this.guideChannel = Cell.sel.div.getAttribute('channel');
	
		var t = this.date.getTime();
		t -= this.gridmins*60*1000;
		this.date.setTime(t);
		this.getGuide(this.date);
	},
	left: function() {
		if (Cell.sel.left.row != Cell.sel.row) this.prevPage();
		else Cell.select(Cell.sel.left);
	},
	right: function() {
		if (Cell.sel.right.row != Cell.sel.row) this.nextPage();
		else Cell.select(Cell.sel.right);
	},
	updateGuideChannel: function(n) {
		if (this.guideChannelTO || n == -1) {
			// Second number or timeout
			if (n >= 0) this.tempChannel = 10*this.tempChannel + n;

			clearTimeout(this.guideChannelTO);
			this.guideChannelTO = 0;			
			
			var selected = 0;
			for (var i=0; i<this.divs.length; i++) {
				if (this.divs[i].getAttribute('channel') >= this.tempChannel) {
					selected = this.divs[i];
					break;
				}
			}
			if (selected) Cell.select($(selected).cell);
		}
		else {
			// First number
			this.tempChannel = n;
			this.guideChannelTO = setTimeout('g_module.updateGuideChannel(-1)',2000);
		}
	},	
	getEpisodeInfo: function(qr,tvoid) {
		// Cancel previous request
		if (this.ajaxRequest) {
			// prevent and state change callbacks from being issued
			this.ajaxRequest.transport.onreadystatechange = Prototype.emptyFunction;
			// abort the XHR
			this.ajaxRequest.transport.abort();
			// update the request counter
			Ajax.activeRequestCount--;
		}
		if (qr >= 0 && tvoid >= 0) {
			var u = 'http://www.tvguide.com/listings/data/detailcache.aspx?Qr='+qr+'&tvoid='+tvoid+'&flags=C&v2=1';
			u = "/demo/php/get.php?s=" + encodeURIComponent(u);
			this.ajaxRequest = new Ajax.Request(u, {
				method:'get',
				onSuccess: function(transport){ g_module.updateEpisodeInfo(transport.responseText); }
			});
		}
	},
	updateEpisodeInfo: function(txt) {
		//------------------------------------------------------------------
		// TV Guide scraper
		// http://www.tvguide.com/listings/data/detailcache.aspx?Qr=4236553&tvoid=194599&flags=C&v2=1
		//------------------------------------------------------------------
		// Relevant info is on the first line
		var lines = txt.split("\n");
		var ep = new TVGuideEpisode(lines[0]);
		
		//------------------------------------------------------------------
		
		if (ep.episode) $('guid_detail_episode').innerHTML = 'Episode: '+ep.episode;
		if (ep.description) $('guid_detail_description').innerHTML = ep.description + ( (ep.year) ? ' ('+ep.year+')' : '' );
	},
	drawGuide: function(txt) {
try {
		var queue = Effect.Queues.get('guidefx');
		queue.each(function(fx) {
			fx.cancel();
		});
		
//alert(txt);
		//------------------------------------------------------------------
		// TV Guide scraper
		// http://tvlistings.tvguide.com/ListingsWeb/listings/data/ajaxcache.ashx?fmt=0&srvid=67199&gridmins=120&gridyr=2009&gridmo=10&griddy=7&gridhr=11&chanrow=1&genre=0&favchan=false
		//------------------------------------------------------------------
		
		var lines = txt.split("\n");

		// Get times for header (they are on the first line)
		var times = [];
		var L1C = lines[0].split("\t");
		var times = L1C[10].split("|");
		
		// Parse shows (all lines after first)
		var shows = [];
		for (var i=1; i<lines.length; i++) {
			var show = new TVGuideShow(lines[i]);
			if (show.chnum >= this.minCh && show.chnum <= this.maxCh) shows.push(show);
		}

		//------------------------------------------------------------------

		// Calculate grid size
		var scale = parseInt(getStyle($('static_div'),'width'),10)/1280;
		var totWidth = parseInt(getStyle($('guide_div'),'width'),10);
		var totHeight = parseInt(getStyle($('guide_div'),'height'),10);

		var hdrHeight = Math.round(scale*32);
		totHeight -= hdrHeight;

		var border = 2;   // 2px border from CSS
		var margin = 2;//Math.round(2*scale);   // 2px margin
		var hpadding = 5;//Math.round(2*scale); // 20px padding
		var vpadding = 2;//Math.round(2*scale); // 20px padding

		var chwidth = 4; // width of channel column (in gridwidths, not pixels)

		//var width = Math.floor(totWidth/this.cols - 2*margin - 2*padding - 2*border);
		var wadjust = 2*margin + 2*hpadding + 2*border;
		var colwidth = totWidth/(this.gridmins/5 + chwidth);
		var height = Math.floor(totHeight/this.rows - 2*margin - 2*vpadding - 2*border);

		// Update position of bar
		var dt = new Date();
		if (this.tzOffset) dt.setTime(dt.getTime()+this.tzOffset*3600000);
		if ((dt.getTime() - this.date.getTime()) < 1000*60*60 && (dt.getTime() - this.date.getTime()) >= 0) {
			// Find bounds of guide_div
			var lmin = parseInt(getStyle($('guide_div'),'left'),10);
			var lmax = totWidth+lmin;
			
			// Adjust for padding, margins, borders
			lmin += margin + border + Math.floor(chwidth*colwidth);
			lmax -= margin + border + (totWidth-Math.floor(colwidth*(this.gridmins/5 + chwidth)));
			
			var lval = (dt.getMinutes()/this.gridmins)*(lmax-lmin) + lmin;
		
			$('guide_progress').show();
			$('guide_progress').style.left = lval+'px';
		}
		else $('guide_progress').hide();

		// Draw time headers
		for (var i=0; i<=this.gridmins/30; i++) {
			var d = document.createElement('div');
			$(d).addClassName('guide_time_div');

			var width;
			if (i == 0) width = chwidth*Math.floor(colwidth);
			else width = 6*Math.floor(colwidth);

			// Leave slot above channel names blank
			if (i != 0) d.innerHTML = times[i-1];
			else d.innerHTML = '&nbsp;';

			d.style.width = width+'px';
			d.style.height = hdrHeight+'px';
			d.style.lineHeight = hdrHeight+'px';
			
			$('guide_div').appendChild(d);
		}

		// Draw grid divs
		this.divs = [];
		var lastch = 0;
		var row = 0;
		var col = 1;
		var selected = 0;
		for (var i = 0; i < shows.length; i++) {
			// If this is a new channel, add the channel column div
			if (lastch != shows[i].chnum) {
				// Add extra divs to end of row so Pages.write() works
				while(col < 8 && i != 0) {
					this.divs.push(document.createElement('div'));
					col++;
				}
				col = 1;
				row++;
			
				// Add channel column
				lastch = shows[i].chnum;
			
				var d = document.createElement('div');
				d.id = 'channel'+i;
				$(d).addClassName('guide_chn_off');
				d.setAttribute('channel',shows[i].chnum);
				d.onclick = function() { g_module.setChannel(this.getAttribute('channel')); g_module.hideGuide(); }

				Cell.setParameters(d);

				var width = Math.floor(chwidth*colwidth - wadjust);

				d.innerHTML = '<img src="' + shows[i].chicon + '" width="30" height="20" style="-moz-border-radius:8px;border-right:0px solid #bbb;background:#fff;float:left;padding:'+((height-20)/2+vpadding)+'px 4px;margin:-'+vpadding+'px 8px -'+vpadding+'px -'+hpadding+'px;"><span class="guide_chn_num">' + shows[i].chnum + "</span><br>" + shows[i].chname;
				d.style.width = width+'px';
				d.style.height = height+'px';
				d.style.lineHeight = Math.floor(height/2)+'px';
				d.style.margin = margin+'px';
				d.style.padding = vpadding+'px '+hpadding+'px';

				d.onmouseover = function(e) { 
					this.className = this.className.replace('_off','_on');
					$('guide_details').innerHTML = '';
					g_module.getEpisodeInfo(-1,-1);
				}			

				this.divs.push(d);

				// Check if this is the last selected channel				
				if (this.guideChannel != 0 && shows[i].chnum == this.guideChannel) {
					selected = d;
				}
			}
			col++;

			var d = document.createElement('div');
			d.id = 'item'+i;
			d.showobj = shows[i];
			$(d).addClassName('guide_div_off');
			d.setAttribute('channel',shows[i].chnum);
			d.onclick = function() { g_module.setChannel(this.getAttribute('channel')); g_module.hideGuide(); }

			Cell.setParameters(d);

			d.innerHTML = ((shows[i].inProgress()) ? '&laquo; ' : '') + shows[i].show;

			var width = Math.floor(shows[i].guidewidth*colwidth - wadjust);
			d.style.width = width+'px';
			d.style.height = height+'px';
			d.style.lineHeight = Math.floor(height/2)+'px';
			d.style.margin = margin+'px';
			d.style.padding = vpadding+'px '+hpadding+'px';

			switch(shows[i].category) {
			case 2: // Family
				d.style.backgroundColor = 'rgba(256,0,0,0.5)';//'#ff0000';
				break;
			case 64: // Movie
				d.style.backgroundColor = 'rgba(128,0,128,0.5)';//'#880088';
				break;
			case 256: // News
				d.style.backgroundColor = 'rgba(128,128,0,0.5)';//'#888800';
				break;
			case 1024: // Sports
				d.style.backgroundColor = 'rgba(0,128,0,0.5)';//'#008800';//880088'#dd7700';
				break;
			case 1:
			default:
				break;
			}

			// Get show info and display it below the list
			d.onmouseover = function(e) { 
				this.className = this.className.replace('_off','_on');
				$('guide_details').innerHTML = 
					'<span id="guide_detail_show">'+this.showobj.show+'</span><span id="guid_detail_episode"></span>'
					+ '<span id="guid_detail_time">'+this.showobj.startTime()+' | '+this.showobj.duration+' min</span>'
					+ '<span id="guid_detail_description"></span>';
				g_module.getEpisodeInfo(this.showobj.Qr,this.showobj.tvoid);
			}

			d.setAttribute("rel",row+","+col);

			this.divs.push(d);
		}
		Pages.write(this.divs,this.rows,8,'guide_div');
		Cell.connectAll();
		if (selected) Cell.select($(selected).cell,1);
		
		new Effect.Appear('guide_div', { duration: 0.5, queue: { scope: 'guidefx' } });
		
} catch(e) { alert('drawGuide: ' + e); }

	},
});

var TVGuideShow = Class.create({
	chindex: 0,
	chnum: 0,
	chname: '',
	show:   '',
	guidewidth: '',
	category:0,
	Qr: 0,
	chicon: 0,
	badge: '',
	start: 0, // in ms
	duration: 0, // in min
	tvoid: 0,
	initialize: function(line) {
		var col = line.split("\t");
		if (col.length < 16) return; // Bad line

		this.chindex  = parseInt(col[0],10);
		this.chnum    = parseInt(col[1],10);
		this.chname   = col[2];
		this.show     = col[4];
		this.guidewidth = parseInt(col[5],10);
		this.category = parseInt(col[6],10);
		this.Qr       = parseInt(col[12],10);
		this.chicon   = 'http://www.tvguide.com/icon/src_'+col[13]+'.gif';
		this.duration = parseInt(col[15],10);
		this.tvoid    = parseInt(col[16],10);
		if (this.tvoid > 0) this.badge = 'http://www.tvguide.com/images/badges/'+this.tvoid+'.gif';
		
		// Determine start
		//this.start    = col[14];
		//var dstr = col[14].trim();
		var dstr = col[14];
		try { // WebKit does not have trim() yet
			dstr = dstr.trim();
		} catch(e) { }
		var yr = parseInt(dstr.substr(0,4),10);
		var mo = parseInt(dstr.substr(4,2),10);
		var dy = parseInt(dstr.substr(6,2),10);
		var hr = parseInt(dstr.substr(8,2),10);
		var mn = parseInt(dstr.substr(10,2),10);

		var d = new Date();
		d.setFullYear(yr);
		d.setMonth(mo-1);
		d.setDate(dy);
		d.setHours(hr);
		d.setMinutes(mn);
		d.setSeconds(0);
		this.start = d;
	},
	startTime: function() {
		if (this.start) {
			var h = this.start.getHours();
			var ampm = ((h+1) > 12) ? 'pm' : 'am';

			var hour = (h == 0 || h == 12) ? 12 : (h % 12);
			var mins = this.start.getMinutes() + "";
			if (mins.length < 2) mins = '0'+mins;

			return hour+":"+mins+ampm;
		}
		else return '';
	},
	inProgress: function() {
		if (this.start) return (this.start.getTime()+1000 < g_module.date.getTime());
		else return false;
	}
});

var TVGuideEpisode = Class.create({
	Qr: 0,
	show: '',
	episode: '',
	description: '',
	duration: 0, // in minutes
	rating: '',
	year: '',
	type: '',
	genre: '',
	initialize: function(line) {
		var col = line.split("\t");
		if (col.length < 3) return;
		
		this.Qr = parseInt(col[0],10);
		this.show = col[1];
		this.episode = col[2];
		this.description = col[3];
		this.duration = parseInt(col[6],10);
		this.rating = (col[7] == 'None') ? col[8] : col[7];
		this.year = parseInt(col[9],10);
		this.type = col[10];
		this.genre = col[11];		
	}
});	

var YouTubeModule = Class.create(Module, {
	title:'YouTube',
	url:'',
	ticker:0,
	player:0,
	initialize: function(parent,url) {
		this.parent = parent;
		this.url = url; // url to YouTube page, video id is extracted
	},
	registerKeys: function() {
		Keys.snapshot();
		Keys.clearAll();
		
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back

		Keys.register(37, function() { g_module.seek(-5,false); }); // Left
		Keys.register(39, function() { g_module.seek(5,false); }); // Right
		Keys.register(70, function() { g_module.seek(10,false); }); // f
		Keys.register(82, function() { g_module.seek(-10,false); }); // r

		Keys.register(32, function() { g_module.player.pauseVideo(); }); // Space Pause
		Keys.register(13, function() { g_module.player.playVideo(); }); // Enter Play
		Keys.register(83, function() { g_module.player.stopVideo(); }); // s Stop

		Keys.register(80, function() { g_module.seekTo(0,false); }); // p Previous Item
		
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
		//Keys.clear(27); // Esc
		//Keys.clear(8); // Backspace
		//Keys.clear(166); // Remote Back
		
		Keys.revert();		
	},
	open: function() {
		var width = parseInt(getStyle($('content_div'),'width'));
		var height = parseInt(getStyle($('content_div'),'height'));
		$('content_div').hide();
		
		// Parse URL to build link to movie
		var args = (this.url.split('?'))[1].split('&');
		for(var i=0; i<args.length; i++) {
			if (args[i].charAt(0) == 'v' && args[i].charAt(1) == '=') {
				id = args[i].substr(2);
				break;
			}
		}
		
		// Make sure the URL contained a valid YouTube id
		if (id == undefined) {
			this.errorScreen('Cannot find YouTube id from URL "'+this.url+'"');
			return;
		}

		var movie = 'http://www.youtube.com/v/'+id+'&hl=en&fs=1&autoplay=1&color1=0x333333&color2=0x666666&hd=1&enablejsapi=1&iv_load_policy=3&ap=%2526fmt%3D18';
		//$('content_div').innerHTML = '<object id="youtubeObj" width="'+width+'" height="'+height+'"><param name="movie" value="'+movie+'"></param><param name="wmode" value="transparent"></param><param name="allowFullScreen" value="true"></param><param name="allowScriptAccess" value="always"></param><embed src="'+movie+'" type="application/x-shockwave-flash" allowScriptAccess="always" wmode="transparent" allowfullscreen="true" width="'+width+'" height="'+height+'"></embed></object>';
		$('content_div').innerHTML = '<object id="youtubeObj" width="'+width+'" height="'+height+'" data="'+movie+'" type="application/x-shockwave-flash"><param name="movie" value="'+movie+'"></param><param name="wmode" value="transparent"></param><param name="allowFullScreen" value="true"></param><param name="allowScriptAccess" value="always"></param></object>';
		
		this.player = $('youtubeObj');
		
		Effect.Appear('content_div', {duration:0.5, queue: { scope: 'waitfx' }});
		this.registerKeys();
		Screensaver.disable();
	},
	close: function($super) {
		Screensaver.enable();
		$super();
	},
	seek: function(delta,allowSeekAhead) {
		var t = g_module.player.getCurrentTime() + delta;
		if (t < 0) t = 0;
		g_module.player.seekTo(t,allowSeekAhead);
	},	
	seekPercent: function(percent) {
		var total = g_module.player.getDuration();
		var p2 = Math.round(percent*total);
		g_module.player.seekTo(p2,true);
	},
	seekTo: function(secs,allowSeekAhead) {
		g_module.player.seekTo(secs,allowSeekAhead);
	}
});




var YouTubeFeedModule = Class.create(Menu,{
	rows: 4,
	close: function($super) {
		if (Cell.sel && Cell.sel.div) this.selected = Cell.sel.div.id;
		$super();
	},
	registerKeys: function() {
		Cell.registerKeys();
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(8, function() { g_module.goBack(); }); // Backspace
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
	},
	clearKeys: function() {
		Cell.clearKeys();
		Keys.clear(27); // Esc
		Keys.clear(8); // Backspace
		Keys.clear(166); // Remote Back
	},
	parseMenuTags: function($super,menu) {
		var t = Xml.getTagText(menu,'rows');
		if (t) this.rows = t;
		$super(menu);
	},
	drawSidebar: function() {
		// By default, the sidebar only has a back button
		if (this.parent) this.addSidebarBtn(0,'Back','go-back.png',function() { g_module.goBack(); });
	},
	drawMenu: function() {
		this.title = this.title.replace("YouTube Videos matching query: ",'YouTube: ');
	
		$('content_div').hide();
		//$('content_div').style.backgroundImage = 'url('+this.bgImage+')';
		$('content_div').innerHTML = 
			((this.bgImage) ? '<img id="content_bg" src="'+this.bgImage+'">' : '')
			+ '<div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>'
			+ '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>'
			+ '<div id="page_up"><img id="page_up_img" style="visibility:hidden;" src="images/other/arrow_u.png" onclick="Pages.prevPage();return false;"></div>'
			+ '<div id="page_div" class="default_page_div '+this.prefix+'_page_div"></div>'
			+ '<div id="page_down"><span id="page_num"></span><img style="display:none;" id="page_down_img" align="top" src="images/other/arrow_d.png"  onclick="Pages.nextPage();return false;"></div>';

		//Effect.Appear('content_div', {queue: { scope: 'waitfx' }});
		//Effect.Appear('content_div', { duration:0.5 });			

		// Calculate grid size
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var totWidth = parseInt(getStyle($('page_div'),'width'));
		var totHeight = parseInt(getStyle($('page_div'),'height'));

		var border = 2;   // 2px border
		var margin = Math.round(0*scale);   // 2px margin
		var padding = Math.round(0*scale); // 20px padding
		//var width = Math.floor(totWidth - 2*margin - 2*padding - 2*border);
		var height = Math.floor(totHeight/this.rows - 2*margin - 2*padding - 2*border);

		// Draw grid divs
		var divs = [];
		for (var i = 0; i < this.children.length; i++) {
			var d = document.createElement('div');
			d.id = 'item'+i;
			$(d).addClassName('youtube_list_div_off');
			$(d).addClassName(this.prefix+'_list_div_off');
			d.setAttribute('cindex',i);
			d.onclick = function() { g_module.goChild(this.getAttribute('cindex')); }
			
			// Save title for sorting
			var stitle = this.items[i].tag('title').toUpperCase();
			if (stitle.substr(0,4) == 'THE ') stitle = stitle.substr(4);
			d.title = stitle;
			
			Cell.setParameters(d);

			// Get title and cover
			var str = '';
			var title = this.items[i].tag('title');
			var cover = this.items[i].getCover();
			if (cover) str += '<img src="'+cover+'" class="cover">';
			str += '<div id="subtitle'+i+'" style="height:'+(height/4)+'px;line-height:'+(height/4)+'px;">'+title+'</div>';
			
			// Get description (without any html tags)
			var descr = this.items[i].tag('description');
			descr = descr.replace(/&(lt|gt);/g, function (strMatch, p1){ return (p1 == "lt")? "<" : ">"; });
			descr = descr.replace(/<\/?[^>]+(>|$)/g, " ");
			
			// HACK - Add markup to the description so that it looks better.
			// This may need updating if YouTube changes the format of their RSS feeds.
			descr = descr.replace(/From:/g, '</div><div class="from">From:');
			descr = descr.replace(/Views:/g, '</div><div class="views">Views:');
			descr = descr.replace(/Time:/g, '</div><div class="views">Time:');
			descr = descr.replace(/([0-9]+)\s*ratings/g, '</div><div class="ratings">$1 ratings');
			descr = descr.replace(/More in\s*([A-Za-z &;]*)/g, '</div><div class="category">$1');
			descr = descr.replace(title,'');
			
			str += '<div id="description'+i+'" style="font-size:66%;height:'+(3*height/4)+'px;line-height:'+(3*height/16)+'px;overflow:hidden;" class="description"><div class="descr_text">'+descr+'</div></div>';
			d.innerHTML = str;
			
			//d.style.width = width+'px';
			d.style.height = height+'px';
			d.style.margin = margin+'px';
			d.style.padding = padding+'px';

			divs.push(d);
		}

		this.drawSidebar();

		// Finalize page
		if (this.sorted) divs = divs.sort(function(a,b) {
  			if (a.title<b.title) return -1;
  			if (a.title>b.title) return 1;
  			return 0;
		});
		Pages.write(divs,this.rows,1,'page_div');
		LFrame.init();
		Cell.connectAll();
		$('page_num').innerHTML = 'Page ' + (Pages.currentpage+1) + ' of ' + Pages.pages.length;
		if (this.selected && $(this.selected)) Cell.select($(this.selected).cell,1);
		
		Effect.Appear('content_div', { duration:0.5 });
	}
});

var YouTubeSearchModule = Class.create(Module,{
	children:[],  // Array of child Modules 
	items: 0,     // Array of info on the items in this menu
	prefix: '',   // String prefixed to CSS styles for custom skinning
	history: '',
	selected: 0,  // Reference to the currently selected object 
	sorted: 0,    // Whether or not to sort the items by title
	subtitle: '', // Subtitle -- contains additional info such as description or artist
	title: '',    // Title displayed at top of this menu
	url: '',
	rows: 4,
	cols: 10,
	shift: 0,
	keys:  [ 'BKSP','a','b','c','d','e','f','g','h','i','SPACE','j','k','l','m','n','o','p','q','r','SHIFT','s','t','u','v','w','x','y','z','0','CLEAR','1','2','3','4','5','6','7','8','9' ],
	skeys: [ 'BKSP','A','B','C','D','E','F','G','H','I','SPACE','J','K','L','M','N','O','P','Q','R','SHIFT','S','T','U','V','W','X','Y','Z',')','CLEAR','!','@','#','$','%','^','&','*','(' ],
	initialize: function(parent,url) {
		this.parent = parent;
		this.url = url;
	},
	open: function() {
		$('content_div').hide();
		$('content_div').innerHTML = 
			'<div class="default_page_title '+this.prefix+'_page_title" id="page_title">'+this.title+'</div>'
			+ '<div id="search_input" class="youtube_search_input '+this.prefix+'_search_input">|</div>'
			+ '<div id="search_keys" class="youtube_search_keys '+this.prefix+'_search_keys"></div>'
			+ '<div id="page_up"><img id="page_up_img" style="visibility:hidden;" src="images/other/arrow_u.png" onclick="Pages.prevPage();return false;"></div>'
			+ '<div id="page_div" class="default_page_div youtube_page_div '+this.prefix+'_page_div"></div>'
			+ '<div id="page_down"><span id="page_num"></span><img style="display:none;" id="page_down_img" align="top" src="images/other/arrow_d.png"  onclick="Pages.nextPage();return false;"></div>';
			
		Effect.Appear('content_div', {duration:0.5, queue: { scope: 'waitfx' }});
		
		// Calculate grid size
		var totWidth = parseInt(getStyle($('search_keys'),'width'));
		var totHeight = parseInt(getStyle($('search_keys'),'height'));

		var border = 2;   // 2px border
		var margin = 2;   // 2px margin
		var size = Math.floor(totWidth/(this.cols+1) - 2*margin - 2*border);
		var size2 = totWidth - (this.cols-1)*(size+2*margin+2*border) - 2*margin - 2*border;


		//var height = Math.floor(totHeight/this.rows - 2*margin - 2*border);

		for (var i=0; i<40; i++) {
			var row = Math.floor(i/this.cols);
			var col = i%this.cols;
		
			var d = document.createElement('div');
			d.id = 'key'+i;
			$(d).addClassName('default_search_div_off');
			if (this.prefix) $(d).addClassName(this.prefix+'_search_div_off');
			d.setAttribute('key',i);
			d.setAttribute("rel",(row+1)+","+(col+1));
			d.onclick = function() { g_module.append(this.getAttribute('key')); }
			d.innerHTML = this.keys[i];
			
			Cell.setParameters(d);
			
			if (col == 0) d.style.width = size2+'px';
			else d.style.width = size+'px';
			d.style.height = size+'px';
			d.style.lineHeight = size+'px';
			d.style.margin = margin+'px';
			
			$('search_keys').appendChild(d);
		}
		
		if (this.history) {
			$('search_input').innerHTML = this.history;
			this.fetch(this.history.substr(0,this.history.length-1));
		}

		this.registerKeys();
		Cell.connectAll("rel");
		Pages.pagerows = 4;
	},
	close: function($super) {
		this.history = $('search_input').innerHTML;
		$super();
	},
	loadHistory: function(xml) {
		var strs = xml.split('&');
		var needle = this.toHash() + '=';

		for (var i=1; i<strs.length; i++) {
			if (strs[i].indexOf(needle) == 0) {
				var x = strs[i].substr(strs[i].indexOf('=')+1);
				this.history = decodeURIComponent(x);
				break;
			}
		}
	},
	fetch: function(s) {
		// Cancel previous request
		if (this.ajaxRequest) {
			// prevent and state change callbacks from being issued
			this.ajaxRequest.transport.onreadystatechange = Prototype.emptyFunction;
			// abort the XHR
			this.ajaxRequest.transport.abort();
			// update the request counter
			Ajax.activeRequestCount--;
		}
	
		var u = 'http://gdata.youtube.com/feeds/base/videos?q='+s.replace(/\s+/g,'%20')+'&alt=rss&v=2';
		u = "/demo/php/get.php?s=" + encodeURIComponent(u);
		this.ajaxRequest = new Ajax.Request(u, {
			method:'get',
			onSuccess: function(transport){ g_module.parseXml(transport.responseText); }
		});
	},
	parseXml: function(xmlText,draw) {
//alert(xmlText);
		// Make sure we did not get an html error page instead
		if (xmlText.indexOf('<html') == 0) {
			this.errorScreen('Xml feed is invalid');
			return;
		}

		var xmlDoc = Xml.getXmlDoc(xmlText);

		// Get feed info
		var menu = xmlDoc.getElementsByTagName('channel')[0];
		if (!menu) var menu = xmlDoc.getElementsByTagName('feed')[0];
		if (!menu) {
			alert(xmlText);
			this.errorScreen('Xml is not well-formed');
			return;
		}
try {
		// Load menu settings
		var t;
		t = Xml.getTagText(menu,'title');
		if (t) this.title = t;

		// Parse items
		var its = xmlDoc.getElementsByTagName('item');
		if (!its || its.length == 0) its = xmlDoc.getElementsByTagName('entry');
		if (!its || its.length == 0) return;		
		
		this.items = [];
		this.children = [];
		for (i=0; i<its.length; i++) {
			this.items[i] = new MenuItem(this,its[i]);
			this.children.push(this.items[i].module);
		}

		if (draw == undefined || draw) {
			this.drawMenu();
		}
} catch(e) { alert('YouTubeSearch.parseXml(): ' + e); }
	},
	registerKeys: function() {
		Keys.snapshot();
		Keys.clearAll();
		
		Cell.registerKeys();
	
		Keys.register(27, function() { g_module.goBack(); }); // Esc
		Keys.register(166, function() { g_module.goBack(); }); // Remote Back
		
		Keys.register(8, function() { g_module.append(0); }); // Backspace
		Keys.register(65, function() { g_module.append(1); }); // A
		Keys.register(66, function() { g_module.append(2); }); // B
		Keys.register(67, function() { g_module.append(3); }); // C
		Keys.register(68, function() { g_module.append(4); }); // D
		Keys.register(69, function() { g_module.append(5); }); // E
		Keys.register(70, function() { g_module.append(6); }); // F
		Keys.register(71, function() { g_module.append(7); }); // G
		Keys.register(72, function() { g_module.append(8); }); // H
		Keys.register(73, function() { g_module.append(9); }); // I
		
		Keys.register(32, function() { g_module.append(10); }); // Space		
		Keys.register(74, function() { g_module.append(11); }); // J
		Keys.register(75, function() { g_module.append(12); }); // K
		Keys.register(76, function() { g_module.append(13); }); // L
		Keys.register(77, function() { g_module.append(14); }); // M
		Keys.register(78, function() { g_module.append(15); }); // N
		Keys.register(79, function() { g_module.append(16); }); // O
		Keys.register(80, function() { g_module.append(17); }); // P
		Keys.register(81, function() { g_module.append(18); }); // Q
		Keys.register(82, function() { g_module.append(19); }); // R
		
		Keys.register(83, function() { g_module.append(21); }); // S
		Keys.register(84, function() { g_module.append(22); }); // T
		Keys.register(85, function() { g_module.append(23); }); // U
		Keys.register(86, function() { g_module.append(24); }); // V
		Keys.register(87, function() { g_module.append(25); }); // W
		Keys.register(88, function() { g_module.append(26); }); // X
		Keys.register(89, function() { g_module.append(27); }); // Y
		Keys.register(90, function() { g_module.append(28); }); // Z
		Keys.register(48, function() { g_module.append(29); }); // 0

		Keys.register(49, function() { g_module.append(31); }); // 1
		Keys.register(50, function() { g_module.append(32); }); // 2
		Keys.register(51, function() { g_module.append(33); }); // 3
		Keys.register(52, function() { g_module.append(34); }); // 4
		Keys.register(53, function() { g_module.append(35); }); // 5
		Keys.register(54, function() { g_module.append(36); }); // 6
		Keys.register(55, function() { g_module.append(37); }); // 7
		Keys.register(56, function() { g_module.append(38); }); // 8
		Keys.register(57, function() { g_module.append(39); }); // 9
		
		// Shift + keys
		Keys.register(65, function() { g_module.shift = 1; g_module.append(1); g_module.shift = 0; }, Keys.META_SHIFT); // A
		Keys.register(66, function() { g_module.shift = 1; g_module.append(2); g_module.shift = 0; }, Keys.META_SHIFT); // B
		Keys.register(67, function() { g_module.shift = 1; g_module.append(3); g_module.shift = 0; }, Keys.META_SHIFT); // C
		Keys.register(68, function() { g_module.shift = 1; g_module.append(4); g_module.shift = 0; }, Keys.META_SHIFT); // D
		Keys.register(69, function() { g_module.shift = 1; g_module.append(5); g_module.shift = 0; }, Keys.META_SHIFT); // E
		Keys.register(70, function() { g_module.shift = 1; g_module.append(6); g_module.shift = 0; }, Keys.META_SHIFT); // F
		Keys.register(71, function() { g_module.shift = 1; g_module.append(7); g_module.shift = 0; }, Keys.META_SHIFT); // G
		Keys.register(72, function() { g_module.shift = 1; g_module.append(8); g_module.shift = 0; }, Keys.META_SHIFT); // H
		Keys.register(73, function() { g_module.shift = 1; g_module.append(9); g_module.shift = 0; }, Keys.META_SHIFT); // I
		
		Keys.register(74, function() { g_module.shift = 1; g_module.append(11); g_module.shift = 0; }, Keys.META_SHIFT); // J
		Keys.register(75, function() { g_module.shift = 1; g_module.append(12); g_module.shift = 0; }, Keys.META_SHIFT); // K
		Keys.register(76, function() { g_module.shift = 1; g_module.append(13); g_module.shift = 0; }, Keys.META_SHIFT); // L
		Keys.register(77, function() { g_module.shift = 1; g_module.append(14); g_module.shift = 0; }, Keys.META_SHIFT); // M
		Keys.register(78, function() { g_module.shift = 1; g_module.append(15); g_module.shift = 0; }, Keys.META_SHIFT); // N
		Keys.register(79, function() { g_module.shift = 1; g_module.append(16); g_module.shift = 0; }, Keys.META_SHIFT); // O
		Keys.register(80, function() { g_module.shift = 1; g_module.append(17); g_module.shift = 0; }, Keys.META_SHIFT); // P
		Keys.register(81, function() { g_module.shift = 1; g_module.append(18); g_module.shift = 0; }, Keys.META_SHIFT); // Q
		Keys.register(82, function() { g_module.shift = 1; g_module.append(19); g_module.shift = 0; }, Keys.META_SHIFT); // R
		
		Keys.register(83, function() { g_module.shift = 1; g_module.append(21); g_module.shift = 0; }, Keys.META_SHIFT); // S
		Keys.register(84, function() { g_module.shift = 1; g_module.append(22); g_module.shift = 0; }, Keys.META_SHIFT); // T
		Keys.register(85, function() { g_module.shift = 1; g_module.append(23); g_module.shift = 0; }, Keys.META_SHIFT); // U
		Keys.register(86, function() { g_module.shift = 1; g_module.append(24); g_module.shift = 0; }, Keys.META_SHIFT); // V
		Keys.register(87, function() { g_module.shift = 1; g_module.append(25); g_module.shift = 0; }, Keys.META_SHIFT); // W
		Keys.register(88, function() { g_module.shift = 1; g_module.append(26); g_module.shift = 0; }, Keys.META_SHIFT); // X
		Keys.register(89, function() { g_module.shift = 1; g_module.append(27); g_module.shift = 0; }, Keys.META_SHIFT); // Y
		Keys.register(90, function() { g_module.shift = 1; g_module.append(28); g_module.shift = 0; }, Keys.META_SHIFT); // Z
		Keys.register(48, function() { g_module.shift = 1; g_module.append(29); g_module.shift = 0; }, Keys.META_SHIFT); // 0

		Keys.register(49, function() { g_module.shift = 1; g_module.append(31); g_module.shift = 0; }, Keys.META_SHIFT); // 1
		Keys.register(50, function() { g_module.shift = 1; g_module.append(32); g_module.shift = 0; }, Keys.META_SHIFT); // 2
		Keys.register(51, function() { g_module.shift = 1; g_module.append(33); g_module.shift = 0; }, Keys.META_SHIFT); // 3
		Keys.register(52, function() { g_module.shift = 1; g_module.append(34); g_module.shift = 0; }, Keys.META_SHIFT); // 4
		Keys.register(53, function() { g_module.shift = 1; g_module.append(35); g_module.shift = 0; }, Keys.META_SHIFT); // 5
		Keys.register(54, function() { g_module.shift = 1; g_module.append(36); g_module.shift = 0; }, Keys.META_SHIFT); // 6
		Keys.register(55, function() { g_module.shift = 1; g_module.append(37); g_module.shift = 0; }, Keys.META_SHIFT); // 7
		Keys.register(56, function() { g_module.shift = 1; g_module.append(38); g_module.shift = 0; }, Keys.META_SHIFT); // 8
		Keys.register(57, function() { g_module.shift = 1; g_module.append(39); g_module.shift = 0; }, Keys.META_SHIFT); // 9		
	},
	clearKeys: function() {
		Keys.revert();
	},
	parseMenuTags: function($super,menu) {
		var t = Xml.getTagText(menu,'rows');
		if (t) this.rows = t;
		$super(menu);
	},
	append: function(idx) {
		var s = $('search_input').innerHTML;
		
		if (idx == 0) { // Backspace
			if (s.length > 1) {
				s = s.substr(0,s.length-2);
				$('search_input').innerHTML = s + '|';
				this.fetch(s);
			}
		}
		else if (idx == 20) { // Shift
			if (this.shift) {
				this.shift = 0;
				for (var i=0; i<this.keys.length; i++) $('key'+i).innerHTML = this.keys[i];				
			}
			else {
				this.shift = 1;
				for (var i=0; i<this.keys.length; i++) $('key'+i).innerHTML = this.skeys[i];
			}
		}
		else if (idx == 30) { // Clear
			$('search_input').innerHTML = '|';
		}
		else {
			s = s.substr(0,s.length-1);
			if (idx == 10) s = s + ' ';
			else if (this.shift) s = s + this.skeys[idx];
			else s = s + this.keys[idx];
			$('search_input').innerHTML  = s + '|';
			this.fetch(s);

			if (this.shift) {
				this.shift = 0;
				for (var i=0; i<this.keys.length; i++) $('key'+i).innerHTML = this.keys[i];				
			}
		}		
	},
	drawMenu: function() {
		if (Cell.sel && Cell.sel.div) this.selected = Cell.sel.div.id;
		
		this.title = this.title.replace("YouTube Videos matching query: ",'YouTube: ');
		$('page_title').innerHTML = this.title;
		$('page_div').innerHTML = '';

		// Calculate grid size
		var scale = parseInt(getStyle($('static_div'),'width'))/1280;
		var totWidth = parseInt(getStyle($('page_div'),'width'));
		var totHeight = parseInt(getStyle($('page_div'),'height'));

		var border = 2;   // 2px border
		var margin = Math.round(0*scale);   // 2px margin
		var padding = Math.round(0*scale); // 20px padding
		//var width = Math.floor(totWidth - 2*margin - 2*padding - 2*border);
		var height = Math.floor(totHeight/this.rows - 2*margin - 2*padding - 2*border);

		// Draw grid divs
		var divs = [];
		for (var i = 0; i < this.children.length; i++) {
			var d = document.createElement('div');
			d.id = 'item'+i;
			$(d).addClassName('youtube_list_div_off');
			$(d).addClassName(this.prefix+'_list_div_off');
			d.setAttribute('cindex',i);
			d.onclick = function() { g_module.goChild(this.getAttribute('cindex')); }
			
			Cell.setParameters(d);

			// Get title and cover
			var str = '';
			var title = this.items[i].tag('title');
			var cover = this.items[i].getCover();
			if (cover) str += '<img src="'+cover+'" class="cover">';
			str += '<div id="subtitle'+i+'" class="title" style="height:'+(height/4)+'px;line-height:'+(height/4)+'px;">'+title+'</div>';
			
			// Get description (without any html tags)
			var descr = this.items[i].tag('description');
			descr = descr.replace(/&(lt|gt);/g, function (strMatch, p1){ return (p1 == "lt")? "<" : ">"; });
			descr = descr.replace(/<\/?[^>]+(>|$)/g, " ");
			
			// HACK - Add markup to the description so that it looks better.
			// This may need updating if YouTube changes the format of their RSS feeds.
			descr = descr.replace(/From:/g, '</div><div class="from">From:');
			descr = descr.replace(/Views:/g, '</div><div class="views">Views:');
			descr = descr.replace(/Time:/g, '</div><div class="views">Time:');
			descr = descr.replace(/([0-9]+)\s*ratings/g, '</div><div class="ratings">$1 ratings');
			descr = descr.replace(/More in\s*([A-Za-z &;]*)/g, '</div><div class="category">$1');
			descr = descr.replace(title,'');
			
			str += '<div id="description'+i+'" style="font-size:66%;height:'+(3*height/4)+'px;line-height:'+(3*height/16)+'px;overflow:hidden;" class="description"><div class="descr_text">'+descr+'</div></div>';
			d.innerHTML = str;
			
			//d.style.width = width+'px';
			d.style.height = height+'px';
			d.style.margin = margin+'px';
			d.style.padding = padding+'px';

			d.setAttribute("rel",(i+1)+","+11);


			divs.push(d);
		}

		// Finalize page
		Cell.clearAll();
		Pages.write(divs,this.rows,1,'page_div',"junk");
		Cell.connectAll("rel",0);
		
		if (this.selected && $(this.selected)) Cell.select($(this.selected).cell,1);
	}
});


