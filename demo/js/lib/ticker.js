
var Ticker = new function() {
	this.feeds = [];
	this.curfeed = -2;
	this.curscroll = 0;
	this.running = 0;
	this.timer = 0;

	this.start = function() {
		if (this.running) return;
		else this.running = 1;
		
		if ($('ticker-div')) {
			$('ticker-div').show();
			if (this.timer) clearTimeout(this.timer);
			this.timer = setTimeout("Ticker.updateTicker()",4000);
		}
		else {
			// Add Ticker markup
			var dv = document.createElement('div');
			dv.id = 'ticker-div';
			dv.innerHTML = '<div id="ticker-title"></div><div id="ticker-text"></div>';
			$$('body')[0].appendChild(dv);

			var d = new Date();

			// Feeds
			this.feeds.push('Sports','http://sports.espn.go.com/espn/rss/news');
			this.feeds.push('MLB','http://sports.espn.go.com/espn/rss/mlb/news');
			this.feeds.push('MLB','http://msn.foxsports.com/nugget/9240_49'),
			this.feeds.push('NFL','http://sports.espn.go.com/espn/rss/nfl/news');
			this.feeds.push('NFL','http://msn.foxsports.com/nugget/9240_5');
			this.feeds.push('NBA','http://sports.espn.go.com/espn/rss/nba/news');
			this.feeds.push('NBA','http://msn.foxsports.com/nugget/9240_73');
			//this.feeds.push('NHL','http://sports.espn.go.com/espn/rss/nhl/news');
			this.feeds.push('NHL','http://msn.foxsports.com/nugget/9240_142');
			if (d.getMonth() >= 8) {
				//this.feeds.push('NCAAF','http://sports.espn.go.com/espn/rss/ncf/news');
				if (d.getDay() == 6) this.feeds.push('NCAAF','http://msn.foxsports.com/nugget/9240_24');
			}
			if (d.getMonth() <= 2 || d.getMonth() >= 10) {
				//this.feeds.push('NCAAB','http://sports.espn.go.com/espn/rss/ncb/news');
				this.feeds.push('NCAAB','http://msn.foxsports.com/nugget/9240_99');
			}

			this.feeds.push('News','http://rss.news.yahoo.com/rss/topstories');
			this.feeds.push('Entertainment','http://rss.news.yahoo.com/rss/entertainment');
			this.feeds.push('Popular','http://rss.news.yahoo.com/rss/mostemailed');
			this.feeds.push('Slashdot','http://rss.slashdot.org/Slashdot/slashdot');		
			this.feeds.push('Joystiq','http://feeds.joystiq.com/weblogsinc/joystiq');
			//this.feeds.push('Destructoid','http://www.destructoid.com/elephant/index.phtml?mode=atom');
			//this.feeds.push('Coupons','http://feeds.feedburner.com/CouponMomBlog');

			this.curfeed = -2;
			this.curscroll = 0;
			this.getNextFeed();
		}
	};
	this.stop = function() {
		//if ($('ticker-div')) $('ticker-div').remove();
		//this.feeds = [];
		//this.curfeed = -2;
		//this.curscroll = 0;
		//this.running = 0;
		//if (this.timer) clearTimeout(this.timer);
		//this.timer = 0;
		
		this.running = 0;
		if ($('ticker-div')) $('ticker-div').hide();
		if (this.timer) clearTimeout(this.timer);
		this.timer = 0;
	};

	// Cycles through available news feeds
	this.getNextFeed = function() {
		// Clear old feeds
		$('ticker-text').innerHTML = '';
		this.curscroll = 0;

		this.curfeed += 2;
		if (this.curfeed >= this.feeds.length) this.curfeed = 0;

		this.getFeed(this.feeds[this.curfeed+1]);
		$('ticker-title').innerHTML = this.feeds[this.curfeed];
	};	

	// Called every few seconds, shows next news item	
	this.updateTicker = function() {
		if (!$('ticker-div')) return;

		if ($('scroll' + (this.curscroll+1))) {
			Effect.SlideUp('scroll' + this.curscroll);
			this.curscroll++;
			$('scroll' + this.curscroll).show();
			this.timer = setTimeout("Ticker.updateTicker()",4000);
		}
		else {
			Effect.Fade('scroll' + this.curscroll);
			this.getNextFeed();
		}
	};
	
	// Spawn Ajax request to download news feed
	this.getFeed = function(url) {
		//if (typeof(netscape) != 'undefined') netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");

		// Add timestamp to url
		if (url.indexOf('?') > 0) url += '&';
		else url += '?';
		url += 'refresh=' + (new Date).getTime();

		url = "/demo/php/get.php?s=" + escape(url);

		new Ajax.Request(url, {
			method:'get',
			onSuccess: function(transport){ Ticker.parseFeed(transport.responseText); },
			onFailure: function(){ Ticker.getNextFeed(); }
		});
	};
	
	// Parse xml
	this.parseFeed = function(xmlText) {
		var feedList = '';
		for (var i = 0; i < this.feeds.length-2; i += 2) {
			var i2 = i + this.curfeed + 2;
			if (i2 >= this.feeds.length) i2 -= this.feeds.length;
			if (this.feeds[i2] == this.feeds[i2+2]) continue;
			feedList += this.feeds[i2] + '&nbsp; |&nbsp; ';
		}
		if (this.feeds[this.curfeed] == this.feeds[this.curfeed+2]) {
			feedList = this.feeds[this.curfeed] + ' Scores';
		}

		var feedListDiv = document.createElement('div');
		feedListDiv.innerHTML = feedList;
		feedListDiv.style.color = '#fc7';

		// Parse through the list of rss items
		xmlText = xmlText.replace(/\<!\[CDATA\[/g,'');
		xmlText = xmlText.replace(/\]\]\>/g,'');
	
		// Parse through the list of rss items
		var games = xmlText.split('<game ');
		if (games.length > 1) {
			// FoxSports scores

			xmlText = changeTZ(xmlText);

			// Get the feed title
			var feedid = getXMLParam(xmlText,"id");
			var sport,fav1,fav2,ifsize;

			if (feedid == '49') {
				sport = 'http://sports.espn.go.com/mlb/';
				fav1 = 22; fav2 = 26;
			}
			else if (feedid == '5') {
				sport = 'http://sports.espn.go.com/nfl/';
				fav1 = 21; fav2 = 25;
			}
			else if (feedid == '73') {
				sport = 'http://sports.espn.go.com/nba/';
				fav1 = 20; fav2 = 8;
			}
			else if (feedid == '142') {
				sport = 'http://msn.foxsports.com/nhl/gameTrax?gameId=';
				fav1 = 15; fav2 = -1;
			}
			else if (feedid == '24') {
				sport = 'http://msn.foxsports.com/cfb/gameTrax?gameId=';
				fav1 = 29; fav2 = -1;
			}
			else if (feedid == '99') {
				sport = 'http://msn.foxsports.com/cbk/gameTrax?gameId=';
				fav1 = 17; fav2 = 357;
			}

			var items = [];
			for(var i = 1; i < games.length && i < 50; i++) {
				var gameId = getXMLParam(games[i],"gameId");
				var gameStatus = getXMLParam(games[i],"gameStatus");
				var awayTeam = getXMLParam(games[i],"awayTeam");
				var homeTeam = getXMLParam(games[i],"homeTeam");
				var awayScore = getXMLParam(games[i],"awayScore");
				var homeScore = getXMLParam(games[i],"homeScore");
				var pregame = getXMLParam(games[i],"pregame");
				var ingame = getXMLParam(games[i],"ingame");
				var postgame = getXMLParam(games[i],"postgame");

				// ESPN NFL/NBA uses a 280904019 instead of 20080904019
				if (feedid == '5' || feedid == '73') {
					gameId = '2' + gameId.substr(3);
					if (gameId.length == 8) gameId = gameId.substr(0,6) + '0' + gameId.substr(6);
				}

				// Adjust link for ESPN (MLB and NFL only)
				if (feedid == '49' || feedid == '5' || feedid == '73') {
					if (ingame == '1') gameId = "gamecast?gameId=" + gameId;
					else if (pregame == '1') gameId = "preview?gameId=" + gameId;
					else  gameId = "recap?gameId=" + gameId;
				}

				// Football
				var awayHaveBall = getXMLParam(games[i],"awayHaveBall");
				var homeHaveBall = getXMLParam(games[i],"homeHaveBall");
				var awayTeamRank = getXMLParam(games[i],"awayTeamRank");
				var homeTeamRank = getXMLParam(games[i],"homeTeamRank");

				if (awayTeamRank != 0) awayTeam = '(' + awayTeamRank + ') ' + awayTeam;
				if (homeTeamRank != 0) homeTeam = '(' + homeTeamRank + ') ' + homeTeam;
				if (awayHaveBall != 0) awayTeam = awayTeam + '&diams;';
				if (homeHaveBall != 0) homeTeam = homeTeam + '&diams;';

				if (postgame == '1') {
					if (awayScore > homeScore) awayTeam = '&#x25B8;' + awayTeam;
					else if (homeScore > awayScore) homeTeam = '&#x25B8;' + homeTeam;
				}

				scoreStr = awayTeam + " &nbsp;" + awayScore + " &nbsp; &nbsp;" + homeTeam + " &nbsp;" + homeScore + " &nbsp; &nbsp;" + gameStatus;

				var d = document.createElement('div');
				d.innerHTML = '<a href="' + sport + gameId + '">' + scoreStr + '</a>';
				d.id = 'scroll' + (i-1);
				$('ticker-text').appendChild(d);
			}
			// Put list of feeds at end
			feedListDiv.id = 'scroll' + (i-1);
			$('ticker-text').appendChild(feedListDiv);
		}
		else {
			// RSS Headlines
			var items = xmlText.split('<item');
			if (items.length == 1) items = xmlText.split('<entry');

			if (items.length == 1) {
				var d = document.createElement('div');
				d.innerHTML = '<div>No games today</div>';
				d.id = 'scroll0';
				$('ticker-text').appendChild(d);
				i = 1;
			}
			else {
				// Only show 10 headlines
				for (var i=0; i<items.length && i<10; i++) {
					var title = getXMLField(items[i],"title");
					var link = getXMLField(items[i],"link");

					title = title.replace(/&(lt|gt);/g, function (strMatch, p1){ return (p1 == "lt")? "<" : ">"; });
					title = title.replace(/<\/?[^>]+(>|$)/g, " ");

					var d = document.createElement('div');
					d.innerHTML = '<a href="' + link + '">' + unescape(title) + '</a>';
					d.id = 'scroll' + i;
					$('ticker-text').appendChild(d);	
				}
			}
			// Put list of feeds at end
			feedListDiv.id = 'scroll' + i;
			$('ticker-text').appendChild(feedListDiv);		
		}

		this.timer = setTimeout("Ticker.updateTicker()",4000);
	};
}
