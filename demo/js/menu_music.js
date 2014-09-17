
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