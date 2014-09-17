<?php
require_once('../xml.php');  // Include XML parsing functions

if (isset($_GET['s'])) $s = $_GET['s'];
else die();

function my_htmlspecialchars($a){
   return htmlspecialchars($a[1]);
}

//
// Remove <![CDATA[]]> tags and encode their contents
//
$feed = getUrl($s);
$feed = preg_replace_callback('/<!\[CDATA\[(.*)\]\]>/','my_htmlspecialchars',$feed);

// 
// Convert: 
// href="http://www.joost.com/090d7nl/t/Game-Trailers"
// to
// href="http://www.joost.com/api/metadata/get/090d7nl?fmt=atom"
//
$feed = preg_replace('/href="http:\/\/www.joost.com\/([A-Za-z0-9]*).*"/','href="http://www.joost.com/api/metadata/get/$1?fmt=atom"',$feed);
$feed = str_replace('<link ','<link type="menu_list" ',$feed);

header("content-type: application/rss+xml");
echo($feed);
?>