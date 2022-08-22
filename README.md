# TrueSlideshow

## Example

`.\ts.exe 10 "C:/path/to/folder"`

Two optional paramaters may be provided:

- The interval of slideshow in seconds, defaults to `5`
- The path to the folder with images, if no directory was provided, then it will default to `%USERPROFILE%\Pictures`

## Picking an executable (TBD)

Each release will contain two executables, the default which is built using `/SUBSYSTEM:WINDOWS` making the program run in the background and show no console (this is what you usually need), and the
`_debug` suffixed executable which is compiled with `/SUBSYSTEM:CONSOLE` making it always show a console with logging, ideal for reporting bugs.

It is recommended to install the default executable to `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup` so that it can startup with your session, or you can make a shortcut to it there with
additional arguments (e.g. custom folder) if you need it.
