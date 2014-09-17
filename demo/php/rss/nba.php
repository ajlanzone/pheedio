<?php
require_once('../xml.php');  // Include XML parsing functions

if (isset($_GET['s'])) $s = $_GET['s'];
else $s = 'http://www.nba.com/topvideo/rss.xml';

//
// RSS Translator - NBA.com Video (http://www.nba.com/topvideo/rss.xml)
//
// Convert:
// http://www.nba.com/video         /games/knicks/2009/07/19/nba_was_nyk_1520900050_recap.nba/index.html
// to:
// http://nba.cdn.turner.com/nba/big/games/knicks/2009/07/19/nba_was_nyk_1520900050_recap.nba_nba_576x324.flv
//

// Translate the file
$feed = getUrl($s);
$feed = str_replace('www.nba.com/video','nba.cdn.turner.com/nba/big',$feed);
$feed = str_replace('/index.html','_nba_576x324.flv',$feed);

header("content-type: application/rss+xml");
echo($feed);
?>