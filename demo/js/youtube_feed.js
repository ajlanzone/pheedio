
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
