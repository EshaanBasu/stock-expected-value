$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Set-Location "c:\Users\ebasu7\OneDrive - Georgia Institute of Technology\Desktop\Stock Expected Value\frontend"
npm.cmd install
npm.cmd run dev
