
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
