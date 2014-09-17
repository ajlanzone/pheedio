<?php
require_once('../xml.php');  // Include XML parsing functions

if (isset($_GET['s'])) $s = $_GET['s'];
else $s = 'http://www.nfl.com/rss/rsslanding?searchString=gamehighlightsVideo';

//
// RSS Translator - NFL.com Video (http://www.nfl.com/rss/rsslanding?searchString=gamehighlightsVideo)
//
// Convert:
// http://www.nfl.com/goto?id=09000d5d8135735c
// to:
// http://www.nfl.com/static/embeddablevideo/09000d5d8135735c.json
//
// UPDATE: Forward the user to a second script (trans_nfl2.php) that finds the actual video link
//

// Translate the file
$feed = getUrl($s);
$feed = str_replace('<link','<link type="flashvideo"',$feed);
$feed = preg_replace('/<nfl:image size="small">([A-Za-z0-9\._:\/]*)<\/nfl:image>/','<cover>$1</cover>',$feed);

//$feed = preg_replace('/goto\?id=([A-Za-z0-9]*)/','static/embeddablevideo/$1.json',$feed);
$feed = preg_replace('/http:\/\/www.nfl.com\/goto\?id=([A-Za-z0-9]*)/','/php/rss/nfl2.php?s=$1',$feed);

header("content-type: application/rss+xml");
echo($feed);
?>