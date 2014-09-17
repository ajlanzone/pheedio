
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
