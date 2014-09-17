var Xml = new function() {
	this.getXmlDoc = function(txt) {
		try { //Internet Explorer
			xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async="false";
			xmlDoc.loadXML(txt);
			return xmlDoc;
		} catch(e) { }
		try {
			parser=new DOMParser();
			xmlDoc=parser.parseFromString(txt,"text/xml");
			return xmlDoc;
		} catch(e) {
			alert(e);
		}
	};
	this.getTagText = function(xml,tag) {
		try {
			var tags = 0;
			//tags = xml.getElementsByTagName(tag);
			if (xml.getElementsByTagNameNS) 
				tags = xml.getElementsByTagNameNS('*', tag);
			else 
				tags = xml.getElementsByTagName(tag); // IE8

			if (!tags || tags.length == 0 || tags[0].childNodes.length == 0) return '';

			// CDATA tags are in [1] instead of [0]
			var l = tags[0].childNodes.length;
			if (l > 1) return tags[0].childNodes[1].nodeValue;
			else return tags[0].childNodes[0].nodeValue;
			//return tags[0].childNodes[0].nodeValue;
		} catch(e) { alert('Xml.getTagText(' + xml + ',' + tag + ') Exception : ' + e); }
		return '';
	};
	this.getTagAttribute = function(xml,tag,attr) {
		try {
			var tags = 0;
			//tags = xml.getElementsByTagNameNS('*', tag);
			if (xml.getElementsByTagNameNS) 
				tags = xml.getElementsByTagNameNS('*', tag);
			else 
				tags = xml.getElementsByTagName(tag); // IE8
				
			if (!tags || tags.length == 0) return '';
			
			for (var i=0; i<tags.length; i++) {
				var a = tags[i].attributes.getNamedItem(attr);
				if (a) return a.nodeValue;
			}
		} catch(e) { alert('Xml.getTagAttribute(' + xml + ',' + tag + ',' + attr + ') Exception : ' + e); }
		return '';
	};
}

var RssItem = Class.create({
	author: '',
	category: '',
	description: '',
	guid: '',
	link: '',
	pubDate: '',
	source: '',
	title: '',
	//itunes_author: '',
	itunes_duration: '',
	//itunes_summary: '',
	initialize: function(item) {
		this.author = Xml.getTagText(item,'author');
		this.category = Xml.getTagText(item,'category');
		this.description = Xml.getTagText(item,'description');
		this.guid = Xml.getTagText(item,'guid');
		this.link = Xml.getTagText(item,'link');
		this.pubDate = Xml.getTagText(item,'pubDate');
		this.source = Xml.getTagText(item,'source');
		this.title = Xml.getTagText(item,'title');

		// Atom
		if (!this.description) this.description = Xml.getTagText(item,'summary');
		//if (!this.description) this.description = Xml.getTagText(item,'atom:summary');
		//if (!this.pubDate) this.pubDate = Xml.getTagText(item,'atom:updated');
		if (!this.pubDate) this.pubDate = Xml.getTagText(item,'updated');

		// iTunes
		//this.itunes_duration = Xml.getTagText(item,'itunes:duration');	
		this.itunes_duration = Xml.getTagText(item,'duration');	
		//if (!this.author) this.author = Xml.getTagText(item,'itunes:author');
		//if (!this.description) this.description = Xml.getTagText(item,'itunes:summary');
	}
});

var RssFeed = Class.create({
	copyright: '',
	description: '',
	items: 0,
	language: '',
	link: '',
	title: '',
	itunes_author: '',
	itunes_image: '',
	itunes_subtitle: '',
	itunes_summary: '',
	media_thumbnail: '',	
	initialize: function(url) {
		// Add timestamp to url
		if (url.indexOf('?') > 0) url += '&';
		else url += '?';
		url += 'refresh=' + (new Date).getTime();

		url = "/php/get2.php?s=" + escape(url);
	
		new Ajax.Request(url, {
			method:'get',
			onSuccess: this.parse,
			onFailure: function(){ alert('Something went wrong...') }
		});	
	},
	parse: function(transport) {
		var xmlDoc = Xml.getXmlDoc(transport.responseText);

		// Get feed info
		var channel = xmlDoc.getElementsByTagName('channel')[0];
		if (!channel) return;

		this.copyright = Xml.getTagText(channel,'copyright'); 
		this.description = Xml.getTagText(channel,'description');		
		this.language = Xml.getTagText(channel,'language');
		this.link = Xml.getTagText(channel,'link');
		this.title = Xml.getTagText(channel,'title');
		
		// iTunes
		this.itunes_author = Xml.getTagText(channel,'itunes:author');
		this.itunes_image = Xml.getTagAttribute(channel,'itunes:image','href');
		this.itunes_subtitle = Xml.getTagText(channel,'itunes:subtitle');
		this.itunes_summary = Xml.getTagText(channel,'itunes:summary');
		
		this.media_thumbnail = Xml.getTagAttribute(channel,'media:thumbnail','url');

		//alert(this.title);

		// Parse items
		var its = xmlDoc.getElementsByTagName('item');
		if (!its || its.length == 0) its = xmlDoc.getElementsByTagName('entry');

		items = [];		
		for (var i=0; i<its.length; i++) items[i] = new RssItem(its[i]);
	}
});
