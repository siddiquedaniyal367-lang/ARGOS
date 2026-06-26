$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\ARGOS IDE.lnk")
$Shortcut.TargetPath = "C:\Users\Daniyal\ARGOS\launch_ide.bat"
$Shortcut.WorkingDirectory = "C:\Users\Daniyal\ARGOS"
$Shortcut.IconLocation = "chrome.exe"
$Shortcut.Save()
