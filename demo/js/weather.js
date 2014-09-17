
var WeatherModule = Class.create(Module,{
	title: '',
	zipcode: 0,
	interval: 0,
	bgImage: '',
	initialize: function(parent,zipcode) {
		this.parent = parent;
		this.zipcode = parseInt(zipcode);
	},
	open: function() {
		//if (typeof(netscape) != 'undefined') netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
		
		var url = "/demo/php/get.php?s=" + encodeURIComponent('http://rss.weather.com/weather/rss/local/' + this.zipcode) + '&refresh=' + (new Date).getTime();
		this.ajaxRequest = new Ajax.Request(url, {
			method:'get',
			onSuccess: function(transport){ g_module.drawWeather(transport.responseText); },
			onFailure: function(){ g_module.errorScreen('Ajax request failed'); }
		});
		
		this.registerKeys();
	},
	close: function($super) {
		if (this.interval) window.clearInterval(this.interval);
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
	drawWeather: function(xmlText) {
		//if (!this.bgImage) this.bgImage = '/images/bg/%SIZE%/background_main_weather.jpg';
		//this.bgImage = this.bgImage.replace(/%SIZE%/g,g_size); // Replace %SIZE% with global size variable
	
		this.title = 'San Marcos, CA (92078)';
		var image = '/demo/images/twc_logo.png';
		var radar = 'http://i.imwx.com/web/radar/us_lax_closeradar_plus_usen.jpg';
	
		$('content_div').hide();
		$('content_div').innerHTML = 
			'<img id="content_bg" src="'+this.bgImage+'"><div class="default_page_title '+this.prefix+'_page_title" id="page_title"><img style="float:left;height:100%;margin:10px;" src="'+image+'">'+this.title+'</div>'
			+ '<div id="sidebar" + class="default_sidebar '+this.prefix+'_sidebar"></div>'
			+ '<div id="page_div" class="default_page_div '+this.prefix+'_page_div">'
			+ '<img style="border:5px solid white;-moz-border-radius:5px;" src="'+radar+'">'
			
			+ '</div>';
		//$('content_div').style.backgroundImage = 'url(images/bg/background_scores_' + this.sport + '.jpg)';
		Effect.Appear('content_div', {duration:0.5,queue: { scope: 'waitfx' }});



/*	
		// Get the feed title
		var feedid = getXMLParam(xmlText,"id");
		//feedtitle = getXMLParam(xmlText,"label");

		var sport,fav1,fav2,ifsize;

		if (feedid == '49') {
			sport = 'http://sports.espn.go.com/mlb/';
			fav1 = 22; fav2 = 26;
			ifsize = "width=960,height=603";
		}
		else if (feedid == '5') {
			sport = 'http://sports.espn.go.com/nfl/';
			fav1 = 21; fav2 = 25;
			ifsize = "width=780,height=590";
		}
		else if (feedid == '73') {
			sport = 'http://sports.espn.go.com/nba/';
			fav1 = 20; fav2 = 8;
			ifsize = "width=870,height=590";
		}
		else if (feedid == '142') {
			sport = 'http://msn.foxsports.com/nhl/gameTrax?gameId=';
			fav1 = 15; fav2 = -1;
			ifsize = "width=800,height=500";
		}
		else if (feedid == '24') {
			sport = 'http://msn.foxsports.com/cfb/gameTrax?gameId=';
			fav1 = 29; fav2 = -1;
			ifsize = "width=798,height=590";
		}
		else if (feedid == '99') {
			sport = 'http://msn.foxsports.com/cbk/gameTrax?gameId=';
			fav1 = 17; fav2 = 357;
			ifsize = "width=800,height=500";
		}

		xmlText = changeTZ(xmlText);

		// Parse through the list of rss items
		var games = xmlText.split('<game ');

		var items = 0;
		if (games.length == 1) {
			$('page_div').innerHTML = '<div id="'+this.prefix+'_nogames">No games today</div>';
		}
		else {
			items = [];
			for(var i = 1; i < games.length && i < 50; i++) {
				var gameId = getXMLParam(games[i],"gameId");
				var gameType = getXMLParam(games[i],"gameType");
				var gameStatus = getXMLParam(games[i],"gameStatus");
				var awayTeam = getXMLParam(games[i],"awayTeam");
				var homeTeam = getXMLParam(games[i],"homeTeam");
				var awayName = getXMLParam(games[i],"awayName");
				var homeName = getXMLParam(games[i],"homeName");
				var awayId = getXMLParam(games[i],"awayId");
				var homeId = getXMLParam(games[i],"homeId");
				var awayScore = getXMLParam(games[i],"awayScore");
				var homeScore = getXMLParam(games[i],"homeScore");
				var pregame = getXMLParam(games[i],"pregame");
				var ingame = getXMLParam(games[i],"ingame");
				var postgame = getXMLParam(games[i],"postgame");
				var delayed = getXMLParam(games[i],"delayed");
				var redZone = getXMLParam(games[i],"redZone");

				// ESPN NFL/NBA uses a 280904019 instead of 20080904019
				if (feedid == '5' || feedid == '73') {
					gameId = '2' + gameId.substr(3);
					if (gameId.length == 8) gameId = gameId.substr(0,6) + '0' + gameId.substr(6);
				}

				// Adjust link for ESPN (MLB and NFL only)
				//if (ingame == '1') gameId = "gamecast?gameId=" + gameId;
				//else if (pregame == '1') gameId = "preview?gameId=" + gameId;
				//else  gameId = "recap?gameId=" + gameId;
				if (feedid == '49' || feedid == '5' || feedid == '73') gameId = "gamecast?gameId=" + gameId;

				// Sport-specific fields
				// Baseball
				var mob1 = getXMLParam(games[i],"mob1");
				var mob2 = getXMLParam(games[i],"mob2");
				var mob3 = getXMLParam(games[i],"mob3");
				var seriesStanding = getXMLParam(games[i],"seriesStanding");
				var seriesOver = getXMLParam(games[i],"seriesOver");
				var balls = getXMLParam(games[i],"balls");
				var strikes = getXMLParam(games[i],"strikes");
				var outs = getXMLParam(games[i],"outs");

				// Football
				var awayHaveBall = getXMLParam(games[i],"awayHaveBall");
				var homeHaveBall = getXMLParam(games[i],"homeHaveBall");
				var awayTeamRank = getXMLParam(games[i],"awayTeamRank");
				var homeTeamRank = getXMLParam(games[i],"homeTeamRank");

				if (awayTeamRank != 0) awayTeam = '(' + awayTeamRank + ') ' + awayTeam;
				if (homeTeamRank != 0) homeTeam = '(' + homeTeamRank + ') ' + homeTeam;
				if (awayHaveBall != 0) awayTeam = awayTeam + '&diams;';
				if (homeHaveBall != 0) homeTeam = homeTeam + '&diams;';

				var a = document.createElement('a');
				a.href = sport + gameId;
				a.id = "score" + (i-1);
				$(a).addClassName(this.prefix+'_a_off');
				$(a).addClassName('lfOn');

				a.setAttribute("rel",ifsize);

				Cell.setParameters(a);

				// Check for favorites 
				if (awayId == fav1 || awayId == fav2 || homeId == fav1 || homeId == fav2) {
					//a.style.borderColor = '#f00';
					$(a).addClassName(this.prefix+'_fav');
				}

				// Create scoreboard div
				var html = '';
				if (postgame == '1') html += '<div class="'+this.prefix+'_postgame">';
				else if (redZone == '1') html += '<div class="'+this.prefix+'_redzone">';
				else if (ingame == '1') html += '<div class="'+this.prefix+'_ingame">';
				else html += '<div class="'+this.prefix+'_pregame">';

				if (feedid == '49' && ingame == '1') {
					bases = mob3 + mob2 + mob1;
					html += '<div class="'+this.prefix+'_bases"><img align="top" alt="" src="images/base' + bases + '.png"></div>';
				}

				html += '<div class="'+this.prefix+'_team"><div class="'+this.prefix+'_score">' + awayScore + '</div>' + awayTeam + '</div>';
				html += '<div class="'+this.prefix+'_team"><div class="'+this.prefix+'_score">' + homeScore + '</div>' + homeTeam + '</div>';

				if (ingame == '1') html += '<div class="'+this.prefix+'_gray">' + gameStatus + '</div>';
				else html += '<div class="'+this.prefix+'_white">' + gameStatus + '</div>';
				html += '</div>';

				a.innerHTML = html;
				items[i-1] = a;
			}
		}

		// Add sidebar buttons
		i = 0;
		if (this.sport == 5 || this.sport == 49 || this.sport == 73) this.addRadioButton(i++);
		if (this.video) this.addSidebarBtn(i++,'Video','media-play.png',function() { g_module.goChild(0); });
		this.addSidebarBtn(i++,'Refresh Scores','rright.png',function() { g_module.refresh(); });
		this.addSidebarBtn(i++,'Back','go-back.png',function() { g_module.goBack(); });

		// Finalize page - depends on whether any games today
		if (items) { 
			// Games today
			Pages.write(items,4,4,'page_div');
			LFrame.init();
			Cell.connectAll();
			$('page_num').innerHTML = 'Page ' + (Pages.currentpage+1) + ' of ' + Pages.pages.length;
			this.interval = window.setInterval("g_module.refresh()",60000);
		}
		else {
			// No games today
			LFrame.init();
			Cell.connectAll();
			Cell.select(Cell.grid[1][0]);

			// Fix left/right issues when no scores are shown			
			for (var i=0; i<Cell.grid.length; i++) {
				if (Cell.grid[i] && Cell.grid[i][0]) Cell.grid[i][0].right = Cell.grid[i][0];
			}
		}
*/
	},
	addRadioButton: function(i) {
		switch(this.sport) {
		case 5:
			var link = 'http://www.nfl.com/fieldpass';
			break;
		case 49:
			var link = 'http://mlb.mlb.com/enterworkflow.do?flowId=registration.dynaindex&c_id=mlb&forwardUrl=/mediacenter/index.jsp';
			break;
		case 73:
			var link = 'http://www.nba.com/insideticket/alp_schedule.html';
			break;
		default:
			return;
		}
		
		// Add a radio button to sidebar
		this.addSidebarBtn(i,'Radio','sound.png',function() { 
			/*var a = document.createElement('a');
			a.href = link;
			var bod = document.getElementsByTagName('body')[0];
			bod.appendChild(a);
			var lf = new LFLink(a);
			a.onclick();*/
			window.open(link,'radio','height=380,width=660');
			return false;			
		});	
	}
});

// Convert times from ET to PT
function changeTZ(xml) {
	xml = xml.replace(/6:(\d{2}) [Aa][Mm]/g,'3:$1 am');
	xml = xml.replace(/7:(\d{2}) [Aa][Mm]/g,'4:$1 am');
	xml = xml.replace(/8:(\d{2}) [Aa][Mm]/g,'5:$1 am');
	xml = xml.replace(/9:(\d{2}) [Aa][Mm]/g,'6:$1 am');
	xml = xml.replace(/10:(\d{2}) [Aa][Mm]/g,'7:$1 am');
	xml = xml.replace(/11:(\d{2}) [AaE][MmT]/g,'8:$1 am');
	xml = xml.replace(/12:(\d{2}) [PpE][MmT]/g,'9:$1 am');
	xml = xml.replace(/1:(\d{2}) [PpE][MmT]/g,'10:$1 am');
	xml = xml.replace(/2:(\d{2}) [PpE][MmT]/g,'11:$1 am');
	xml = xml.replace(/3:(\d{2}) [PpE][MmT]/g,'12:$1 pm');
	xml = xml.replace(/4:(\d{2}) [PpE][MmT]/g,'1:$1 pm');
	xml = xml.replace(/5:(\d{2}) [PpE][MmT]/g,'2:$1 pm');
	xml = xml.replace(/6:(\d{2}) [PpE][MmT]/g,'3:$1 pm');
	xml = xml.replace(/7:(\d{2}) [PpE][MmT]/g,'4:$1 pm');
	xml = xml.replace(/8:(\d{2}) [PpE][MmT]/g,'5:$1 pm');
	xml = xml.replace(/9:(\d{2}) [PpE][MmT]/g,'6:$1 pm');
	xml = xml.replace(/10:(\d{2}) [PpE][MmT]/g,'7:$1 pm');
	xml = xml.replace(/,1:(\d{2})/g,' 10:$1');
	xml = xml.replace(/,2:(\d{2})/g,' 11:$1');
	xml = xml.replace(/,3:(\d{2})/g,' 12:$1');
	xml = xml.replace(/,4:(\d{2})/g,' 1:$1');
	xml = xml.replace(/,5:(\d{2})/g,' 2:$1');
	xml = xml.replace(/,6:(\d{2})/g,' 3:$1');
	xml = xml.replace(/,7:(\d{2})/g,' 4:$1');
	xml = xml.replace(/,8:(\d{2})/g,' 5:$1');
	return xml;
}
