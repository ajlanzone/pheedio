<?php

function getUrl($url) {
	// Parse url
	$domain = substr(strstr($url,"://"),3);
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
	if ($http == FALSE) {
		// Cannot connect to server
		return FALSE;
	}
	fputs($http, "GET " . $file . " HTTP/1.0\r\n");
	fputs($http, "Host: " . $domain . "\r\n");
	fputs($http, "Referer: http://" . $domain . "\r\n");
	fputs($http, "User-Agent: Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)\r\n\r\n");

	// Download file
	$data = '';
	while (!feof($http)) {
		$data = $data . fread($http, 1024);
	}
	fclose($http);
	
	// Remove header
	$i = strpos($data,"\r\n\r\n");
	if ($i === FALSE) $i = 0;
	else $i = $i+4;
	return substr($data,$i);
}


function getXMLField($xmlText,$field) {
	$xmlLower = strtolower($xmlText);
	$i1 = strpos($xmlLower, "<" . strtolower($field));
	if ($i1 === false) return FALSE;
	else {
		$i2 = strpos($xmlLower, "/>", $i1) + 2;
		$i1 = strpos($xmlLower, ">", $i1) + 1;

		// Make sure the tag isn't closed early
		if ($i1 == $i2) return "";
	}

	$i2 = strpos($xmlLower, "</" . strtolower($field), $i1);
	if ($i2 === false) {
		$i2 = strpos($xmlLower, "</", $i1);
		if ($i2 === false) return FALSE;
	}
	
	return substr($xmlText,$i1,$i2-$i1);
}

function getXMLParam($xmlText,$param,$field) {
	$xmlLower = strtolower($xmlText);
	// Get xml tag itself first
	$i1 = strpos($xmlLower, "<" . strtolower($field));
	if ($i1 === false) return FALSE;
	$i2 = strpos($xmlLower, ">", $i1);
	$fieldText = substr($xmlText,$i1,$i2-$i1);

	// Search the tag for the desired parameter
	$i1 = strpos($fieldText, $param.'="');
	if ($i1 === false) return FALSE;
	else $i1 = strpos($fieldText, '="', $i1) + 2;
	
	$i2 = strpos(strtolower($fieldText), '"', $i1);
	if ($i2 === false) return FALSE;
	
	return substr($fieldText,$i1,$i2-$i1);
}

function splitXML($xmlText,$field) {
	$i = 0;
	$a = array();
	$i1 = 0;
	$i2 = 0;
	
	while (($i1 = strpos(strtolower($xmlText), "<" . strtolower($field),$i2)) !== FALSE) {
		$i1 = strpos($xmlText, ">", $i1) + 1;
		$i2 = strpos(strtolower($xmlText), "</" . strtolower($field), $i1);
		if ($i2 === false) break;
		
		$temp = substr($xmlText,$i1,$i2-$i1);
		$temp = str_replace('<![CDATA[','',$temp);
		$temp = str_replace(']]>','',$temp);
		
		$a[$i] = $temp;
		$i++;
	}

	return $a;
}


?>