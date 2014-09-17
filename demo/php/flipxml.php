<?php

//$filename = urlencode(urldecode($_GET['img']));
$filename = urlencode($_GET['img']);
//$filename = 'http%3A%2F%2Flocalhost%2Fdebug%2Fcd2.jpg';

$size = isset($_GET['size']) ? intval($_GET['size']) : 400;
//if ($size == 0) $size = 400;

$speed = isset($_GET['speed']) ? intval($_GET['speed']) : 20;
//if ($speed == 0) $speed = 20;


header("Pragma: public");
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: private",false);
header("Content-Type: application/xml");
header("Content-Transfer-Encoding: binary");

echo ('<?xml version="1.0" encoding="utf-8"?>' ."\n");
echo ('<!--' ."\n");
echo ('	flShow Carousel 2.0 configuration file' ."\n");
echo ('	Please visit http://www.flshow.net/ for more info' ."\n");
echo ('-->' ."\n");
echo ('<slide_show>' ."\n");
echo ('<options>' ."\n");
echo ('<background>transparent</background>' ."\n");
echo ('<!-- #RRGGBB, transparent -->' ."\n");
echo ('<interaction>' ."\n");
echo ('<flip>auto</flip>' ."\n");
echo ('<!-- auto, mouse, keyboard -->' ."\n");
echo ('<speed>'.$speed.'</speed>' ."\n");
echo ('<!-- [-360,360] degrees per second -->' ."\n");
echo ('</interaction>' ."\n");
echo ('</options>' ."\n");
echo ('<photo>/php/resize.php?img='.$filename.'&amp;width='.$size.'&amp;height='.$size.'&amp;stretch=0</photo>' ."\n");
echo ('</slide_show>' ."\n");

?>