<?php
$s = $_GET['s'];
if ($s == false) return;

/*
// Parse url
$domain = substr(strstr($s,"://"),3);
$pivot = strpos($domain,"/",0);
if ($pivot == false) {
	$file = "/";
}
else {
	$file = substr($domain,$pivot);
	$domain = substr($domain,0,$pivot);
}

// Open socket to download file
$http = fsockopen($domain, 80, $errno, $errstr, 12);
if (!$http) {
    echo "$errstr ($errno)<br />\n";
	return;
}

fputs($http, "GET " . $file . " HTTP/1.0\r\n");
fputs($http, "Host: " . $domain . "\r\n");
fputs($http, "Referer: http://" . $domain . "\r\n");
//fputs($http, "User-Agent: Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)\r\n\r\n");
fputs($http, "User-Agent: FeedFetcher-Google; (+http://www.google.com/feedfetcher.html)\r\n\r\n");
//fputs($http, "User-Agent: Wget/1.9.1");

// Download file
$buf = '';
while (!feof($http)) {
	$buf .= fread($http, 1024);
}
fclose($http);


// Remove header
$bstart = strpos($buf,"\r\n\r\n");
$body = substr($buf,$bstart+4);
//*/

$body = file_get_contents($s);

echo($body);
//*/
//echo('Domain = ' . $domain . '<br>File = ' . $file);
?>