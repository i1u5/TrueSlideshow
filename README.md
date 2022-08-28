# TrueSlideshow

## Usage

`.\ts.exe --interval 10 --path "C:/path/to/folder"`

Two optional paramaters may be provided:

- `-i, --interval` The time between each image change in seconds, defaults to `5`
- `-p, --path` The path to the folder with images, if no directory was provided, then it will default to `%USERPROFILE%\Pictures`

In order to respect user preference, please note that the wallpapers will not persist so a simple logout and login (or restart) will reset the wallpaper back to the one set by the user.

## Picking an executable

Each release will contain two executables, the default which is built using `/SUBSYSTEM:WINDOWS` making the program run in the background and show no console (this is what you usually need), and the
`_console` suffixed executable which is compiled with `/SUBSYSTEM:CONSOLE` making it always show a console with logging, ideal for reporting bugs or keeping track of the program's activity.

It is recommended to install the default executable to `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup` so that it can startup with your session, or you can make a shortcut to it there with additional arguments (e.g. custom folder).
