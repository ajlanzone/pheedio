<?php
require_once('../xml.php');  // Include XML parsing functions

if (!isset($_GET['provider'])) die('?provider= Missing');
if (isset($_GET['feedtype'])) $feedtype = $_GET['feedtype'];
else $feedtype = 'menu';

$url = 'http://zeeveerssgen.appspot.com/get?provider=' . $_GET['provider'] . '&feedtype=' . $feedtype . '&version=4';

//
// RSS Translator - Zinc RSS Feed (http://zeeveerssgen.appspot.com/get?provider=cn&feedtype=menu&version=4)
//
// Convert:
// rss://
// to:
// http://
//

// Translate the file
$feed = getUrl($url);
$feed = str_replace('rss://','http://',$feed);

header("content-type: application/rss+xml");
echo($feed);
?>