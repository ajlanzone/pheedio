<?php
require_once('../xml.php');  // Include XML parsing functions

if (isset($_GET['s'])) $s = $_GET['s'];
else $s = 'http://sports.espn.go.com/broadband/ivp/rss';

//
// RSS Translator - ESPN Video (http://sports.espn.go.com/broadband/ivp/rss)
//
// Convert:
// <media:thumbnail url="http://assets.espn.go.com/media/motion/2009/1014/dm_091014_ncf_shelly_stefon_thumbnail_big.jpg"/>
// to:
// <link>http://brsseavideo-ak.espn.go.com/motion/2011/0224/dm_110224_mlb_mozeliak_wainwright_576x432.flv</link>
//

// Translate the file
$feed = getUrl($s);

// Rename <link> and <media:link> tags
$feed = preg_replace('/<([\/]*)([media:]*)link>/','<$1$2oldlink>',$feed); 

// Use thumbnail url to generate video url
//$feed = preg_replace('/(<media:thumbnail url="http:\/\/assets.espn.go.com\/media\/motion\/[0-9]*\/[0-9]*\/([A-Za-z0-9_]*)_thumbnail_[A-Za-z]*.jpg"\/>)/',"<link>http://brsseavideo-ak.espn.go.com/motion/$2_576x432.flv</link>\n$1",$feed);
$feed = preg_replace('/(<media:thumbnail url="http:\/\/assets.espn.go.com\/media\/motion\/([0-9]*)\/([0-9]*)\/([A-Za-z0-9_]*)_thumbnail_[A-Za-z]*.jpg"\/>)/',"<link>http://brsseavideo-ak.espn.go.com/motion/$2/$3/$4_576x432.flv</link>\n$1",$feed);

header("content-type: application/rss+xml");
echo($feed);
?>