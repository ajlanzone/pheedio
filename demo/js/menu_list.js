
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
