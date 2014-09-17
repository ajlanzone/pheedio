<?php
require_once('../xml.php');  // Include XML parsing functions

//if (isset($_GET['s'])) $s = $_GET['s'];
//else die();

function my_htmlspecialchars($a){
   return htmlspecialchars($a[1]);
}

//
// Remove <link> tags, use <feedburner:origEnclosureLink> as new link
//
$feed = getUrl('http://feeds.feedburner.com/GiantbombVideos');
$feed = preg_replace('/<([\/]*)link>/','<$1oldlink>',$feed); // Rename <link> tags
$feed = preg_replace('/<([\/]*)feedburner:origEnclosureLink>/','<$1link>',$feed); // Rename <feedburner:origEnclosureLink> tags
$feed = str_replace('</link>','</link><cover>http://andman1/movies/Covers/Giant Bomb.png</cover>',$feed);
$feed = str_replace('_ip.m4v','_700.flv',$feed); // Choose medium quality (high is _1500)
$feed = preg_replace('/\?api_key=[A-Za-z0-9]*/','',$feed); // Remove api link

header("content-type: application/rss+xml");
echo($feed);
?>
