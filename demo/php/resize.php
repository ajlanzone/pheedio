<?php

//echo(urlencode('http://localhost/debug/cd1.jpg'));

$stretch = false;

//$filename = str_replace(' ','%20',urldecode($_GET['img']));
$filename = str_replace(' ','%20',$_GET['img']);
$maxW = $_GET['width'];
$maxH = $_GET['height'];

// Make sure we have enough information to resize an image
if (!$filename || (!$maxW && !$maxH)) die('Oooga booga!');

// Initialize variables
if (!$maxW) $maxW = $maxH;
if (!$maxH) $maxH = $maxW;
if (isset($_GET['stretch']) && intval($_GET['stretch']) != 0) $stretch = true;

// Read image info (size, filetype)
$info = @getimagesize($filename);
if ($info === false) die();
$inW = $info[0];
$inH = $info[1];
$type = $info[2];
$imgratio = $inW/$inH;

// Load image
if( $type == IMAGETYPE_JPEG ) {
	$inIMG = imagecreatefromjpeg($filename);
} elseif( $type == IMAGETYPE_GIF ) {
	$inIMG = imagecreatefromgif($filename);
} elseif( $type == IMAGETYPE_PNG ) {
	$inIMG = imagecreatefrompng($filename);
} else die("Unknown image type: " . $type);

// Determine size of re-sized image
if ($stretch) {
	$outW = $maxW;
	$outH = $maxH;
}
else {
	$h1 = round($maxW / $imgratio);
	$w1 = round($maxH * $imgratio);
	if ($h1 > $maxH) {
		$outW = $w1;
		$outH = $maxH;
	}
	else {
		$outW = $maxW;
		$outH = $h1;
	}
}

/*
// Debug
echo("Filname: " . $filename);
echo("<br>Target: " . $maxW . " x " . $maxH . " (stretch = " . $stretch . ")");
echo("<br>In: " . $inW . " x " . $inH . " (type = " . $type .")");
echo("<br>Out: ".$outW . " x " . $outH);
/*/


// Resize image
$outIMG = imagecreatetruecolor($outW, $outH);
imagecopyresampled($outIMG, $inIMG, 0, 0, 0, 0, $outW, $outH, $inW, $inH);

// Print header
header("Pragma: public");
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: private",false);
header("Content-Type: image/png");
//header("Content-Type: image/jpg");
header("Content-Transfer-Encoding: binary");

// Print image
//imagejpeg($outIMG);
//imagegif($outIMG);
imagepng($outIMG);
//*/

?>