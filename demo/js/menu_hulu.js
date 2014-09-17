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
