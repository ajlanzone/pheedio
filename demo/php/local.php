<?php

$filename = $_GET['s'];
//$filename = 'c:/cars.jpg';
//$filename = 'C:\Documents and Settings\andy\My Documents\My Pictures\1316_cornsunset_2880x900.jpg';

// Find file extension
$file_extension = strtolower(substr(strrchr($filename,"."),1));

// Determine file type
switch ($file_extension) {
	case "xml": $ctype="application/xml"; break;
	case "pdf": $ctype="application/pdf"; break;
	case "exe": $ctype="application/octet-stream"; break;
	case "zip": $ctype="application/zip"; break;
	case "doc": $ctype="application/msword"; break;
	case "xls": $ctype="application/vnd.ms-excel"; break;
	case "ppt": $ctype="application/vnd.ms-powerpoint"; break;
	case "gif": $ctype="image/gif"; break;
	case "png": $ctype="image/png"; break;
	case "jpe": case "jpeg":
	case "jpg": $ctype="image/jpg"; break;
	default: $ctype="application/force-download";
}

// Make sure file exists
if (!file_exists($filename)) {
	die("NO FILE HERE");
}

header("Pragma: public");
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: private",false);
header("Content-Type: $ctype");
//header("Content-Disposition: attachment; filename=\"".basename($filename)."\";");
header("Content-Transfer-Encoding: binary");
header("Content-Length: ".@filesize($filename));
set_time_limit(0);
@readfile("$filename") or die("File not found.");

?>