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
