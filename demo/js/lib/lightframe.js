
var LFrame = new function() {
	this.imgurl = 'images/'; // Path to the lightframe image directory

	// Options
	this.bgColor = '';	// color of background overlay
	this.bgFade = 1;	// fade background overlay or not (0 or 1)
	this.bgOnclick = 1;	// click on background overlay closes frame or not (0 or 1)
	this.bgOpacity = 0.8;	// opacity of background overlay
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
