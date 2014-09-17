<?php
require_once('../xml.php');  // Include XML parsing functions

if (isset($_GET['s'])) $s = $_GET['s'];
else $s = 'http://query.mcms.mavenapps.net/mcms/query?s=foxnews1&u=foxnews1-foxnews&debug=false&q=%2F%2FvideoRelease[%28%28%40mvn%3Afnc_framework%3D%27Dotcom%27%29%20and%20%28%40mvn%3Adomain%3D%27F%27%29%20and%20%28%40owner%3D%27foxnews1-foxnews%27%29%29%20and%20%28%40releaseTemplateName%3D%27defaultFlv%27%29]&start=0&stop=48&o=airDate%20d';

//
// RSS Translator - Fox News Video (http://query.mcms.mavenapps.net/mcms/query?s=foxnews1&u=foxnews1-foxnews&debug=false&q=%2F%2FvideoRelease[%28%28%40mvn%3Afnc_framework%3D%27Dotcom%27%29%20and%20%28%40mvn%3Adomain%3D%27F%27%29%20and%20%28%40owner%3D%27foxnews1-foxnews%27%29%29%20and%20%28%40releaseTemplateName%3D%27defaultFlv%27%29]&start=0&stop=28&o=airDate%20d)
//

// Translate the file
$feed = getUrl($s);
$feed = str_replace('<channel>','<channel><title>FOX News</title>',$feed); // Add a title to the feed
$feed = preg_replace('/<([\/]*)mvn:fnc_grab_103x58>/','<$1cover>',$feed); // Rename <mvn:fnc_grab_103x58> tags

// Choose video file (flv1200 or flv700)
//$feed = preg_replace('/<([\/]*)mvn:flv1200>/','<$1link>',$feed); // Use the <mvn:flv1200> video
$feed = str_replace('media:content','link',$feed); // Use the flv700 video. It's buried in the <media:content> tag
$feed = str_replace('url=','href=',$feed);         // 

header("content-type: application/rss+xml");
echo($feed);
?>