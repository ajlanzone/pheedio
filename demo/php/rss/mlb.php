<?php
require_once('../xml.php');  // Include XML parsing functions

if (isset($_GET['s'])) $s = $_GET['s'];
else $s = 'http://mlb.mlb.com/gen/mlb/components/multimedia/topvideos.xml';

//
// RSS Translator - MLB.com Video (http://mlb.mlb.com/gen/mlb/components/multimedia/topvideos.xml)
//
// Convert:
// <url>http://mediadownloads.mlb.com/mlbam/2010/09/19/images/mlbf_12255671_th_25.jpg</url>
// to:
// <cover>http://mediadownloads.mlb.com/mlbam/2010/09/19/images/mlbf_12255671_th_25.jpg</cover>
//
// Convert:
// <url speed="800" ... >http://mediadownloads.mlb.com/mlbam/2010/09/19/mlbtv_tbanya_12255671_800K.mp4</url>
// to:
// <link speed="800" ... >http://mediadownloads.mlb.com/mlbam/2010/09/19/mlbtv_tbanya_12255671_800K.mp4</link>
//

// Translate the file
$feed = getUrl($s);

$feed = preg_replace('/<([\/]*)data/','<$1channel',$feed);
//$feed = preg_replace('/<url speed="800" (.*)<\/url>/','<link $1</link>',$feed);   // Rename <url> tag around video
$feed = preg_replace('/<url speed="1000" (.*)<\/url>/','<link $1</link>',$feed);   // Rename <url> tag around video
$feed = preg_replace('/<url>(.*)<\/url>/','<cover>$1</cover>',$feed); // Rename <url> tags around images

header("content-type: application/rss+xml");
echo('<?xml version="1.0" encoding="ISO-8859-1"?><rss version="2.0">');
echo($feed);
echo('</rss>');
?>