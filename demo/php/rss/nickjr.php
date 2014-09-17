<?php
require_once('../xml.php');  // Include XML parsing functions

if (isset($_GET['s'])) $s = $_GET['s'];
else $s = '98735'; // Go, Diego, Go
//else $s = '98489'; // Dora the Explorer

//
// RSS Translator - Nick Jr. Video
//
// Convert:
// duration="xx:yy"
// to:
// <description>Duration: xx:yy</description>
//

// Translate the file
$feed = getUrl('http://www.nickjr.com/dynamo/video/data/mrssGen.jhtml?mgid=mgid%3Acms%3Aitem%3Anickjr.com%3A'.$s);
$feed = preg_replace('/duration="([0-9]*:[0-9]*)"/',"/>\n<description>Duration: $1</description>\n<media:content",$feed);

header("content-type: application/rss+xml");
echo($feed);
?>