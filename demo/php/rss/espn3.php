<?php
require_once('../xml.php');  // Include XML parsing functions

if (isset($_GET['type'])) $type = $_GET['type'];
else $type = 'live';

$url = 'http://espn.go.com/espn3/feeds/rss/' . $type;

//
// RSS Translator - ESPN3 Feed 
//      http://espn.go.com/espn3/feeds/rss/live
//      http://espn.go.com/espn3/feeds/rss/upcoming
//      http://espn.go.com/espn3/feeds/rss/replay
//
// Convert:
//   http://espn.go.com/espn3/index?id=131323
// to:
//   http://espn.go.com/espn3/player?id=131323
//

// Translate the file
$feed = getUrl($url);
$feed = str_replace('index','player',$feed);

header("content-type: application/rss+xml");
echo($feed);
?>