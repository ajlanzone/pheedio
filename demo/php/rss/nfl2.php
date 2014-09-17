<?php
require_once('../xml.php');  // Include XML parsing functions

if (isset($_GET['s'])) $s = $_GET['s'];
else return;

//
// RSS Translator - NFL.com Video (http://www.nfl.com/rss/rsslanding?searchString=gamehighlightsVideo)
//
// Download   : http://www.nfl.com/static/embeddablevideo/09000d5d8135735c.json
//    "uri":"/films/s2010/nfl-gameday/w02/100919_ghl_gameday_wk2_chi_vs_dal_700k.mp4",
//    {"rate":500000,"path":"films/s2010/nfl-gameday/w02/100919_ghl_gameday_wk2_chi_vs_dal_500k.mp4"},
//    {"rate":700000,"path":"films/s2010/nfl-gameday/w02/100919_ghl_gameday_wk2_chi_vs_dal_700k.mp4"},
//    {"rate":1200000,"path":"films/s2010/nfl-gameday/w02/100919_ghl_gameday_wk2_chi_vs_dal_1200k.mp4"},
//    {"rate":2000000,"path":"films/s2010/nfl-gameday/w02/100919_ghl_gameday_wk2_chi_vs_dal_2000k.mp4"},
//    {"rate":3000000,"path":"films/s2010/nfl-gameday/w02/100919_ghl_gameday_wk2_chi_vs_dal_3200k.mp4"}]},
// Search for : ... ","uri":"http://video.nfl.com/films/s2009/nfl-gameday/w05/091011_ghl_gameday_cin_vs_bal_700k.mp4"} ...
// Forward to : http://video.nfl.com/films/s2009/nfl-gameday/w05/091011_ghl_gameday_cin_vs_bal_700k.mp4
//

// Get the json file
$json = getUrl('http://www.nfl.com/static/embeddablevideo/' . $s . '.json');

// Find the video url
//$start = '"uri":"';
$start = '"rate":1200000,"path":"';
$end = '"';

$i1 = strpos($json,$start);
if ($i1 === FALSE) return;
$i1 += strlen($start);

$i2 = strpos($json,$end,$i1);
if ($i2 === FALSE) return;

$url = "http://vod.hstream.video.nfl.com/" . substr($json,$i1,$i2-$i1);
//$url = "rtmp://nfl.fcod.llnwd.net/a2290/vod/" . substr($json,$i1,$i2-$i1);
//<source id="liveCDN1" protocol="rtmp" host="cp37426.live.edgefcs.net/live"/>

// Redirect to the video
header("Location: ".$url);

?>