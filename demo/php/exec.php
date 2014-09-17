<?php
//
// To get this script to show GUI apps:
//   * On the server, go to Run and enter command 'services.msc'
//   * Right click on the Apache service and choose Properties
//   * Under 'Log On' tab, make sure 'Allow service to interact
//     with desktop' is checked
//

// Variable: strCommand
// String value indicating the command line you want to run. You
// must include any parameters you want to pass to the executable
// file.
$strCommand = "notepad.exe";

// Variable: intWindowStyle
// Optional. Integer value indicating the appearance of the program's
// window. Note that not all programs make use of this information.
//    0 - Hides the window and activates another window.
//    1 - Activates and displays a window. If the window is minimized
//        or maximized, the system restores it to its original size
//        and position. An application should specify this flag when
//        displaying the window for the first time.
//    2 - Activates the window and displays it as a minimized window.
//    3 - Activates the window and displays it as a maximized window.
//    4 - Displays a window in its most recent size and position. The
//        active window remains active.
//    5 - Activates the window and displays it in its current size
//        and position.
//    6 - Minimizes the specified window and activates the next top-
//        level window in the Z order.
//    7 - Displays the window as a minimized window. The active window
//        remains active.
//    8 - Displays the window in its current state. The active window
//        remains active.
//    9 - Activates and displays the window. If the window is minimized
//        or maximized, the system restores it to its original size and
//        position. An application should specify this flag when
//        restoring a minimized window.
//   10 - Sets the show-state based on the state of the program that
//        started the application.
$intWindowStyle = 3; // Maximized

// Variable: bWaitOnReturn
// Optional. Boolean value indicating whether the script should wait for
// the program to finish executing before continuing to the next
// statement in your script. If set to true, script execution halts until
// the program finishes, and Run returns any error code returned by the
// program. If set to false (the default), the Run method returns
// immediately after starting the program, automatically returning 0 (not
// to be interpreted as an error code).
//
// Note: this variable doesn't do much if this php script is called via
// an Ajax XMLHttpRequest.
//
$bWaitOnReturn = false;


// Get script input

// strCommand
if (!isset($_GET['cmd']))
	return;
$strCommand = $_GET['cmd'];

// TODO: Check command against a white list??

if ($strCommand[0] != '"')
	$strCommand = '"' . $strCommand . '"';

// strCommand arguments
if (isset($_GET['args']))
	$strCommand .= ' ' . $_GET['args'];

// intWindowStyle
if (isset($_GET['win'])) {
	$win = $_GET['win'];
	if (is_numeric($win)) $intWindowStyle = $win;
}

// bWaitOnReturn
if (isset($_GET['wait'])) {
	$wait = $_GET['wait'];
	if ($wait) $bWaitOnReturn = true;
}

// Execute the program
$WshShell = new COM("WScript.Shell");
$oExec = $WshShell->Run($strCommand, $intWindowStyle, $bWaitOnReturn);

// Other ways of launching the program
//exec($strCommand);

?>
