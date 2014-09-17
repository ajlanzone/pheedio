
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
