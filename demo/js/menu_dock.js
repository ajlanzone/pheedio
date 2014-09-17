
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
			if (newpos <= this.width) div.style.zIndex = (10-Math.abs(newpos-this.mid));
			else div.style.zIndex = 0;
						
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
