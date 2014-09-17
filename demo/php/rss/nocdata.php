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

header("content-type: application/rss+xml");
echo($feed);
?>