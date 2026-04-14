$ErrorActionPreference = 'SilentlyContinue'
$url = 'http://localhost:8000'
for ($i = 0; $i -lt 60; $i++) {
    try {
        $c = New-Object Net.Sockets.TcpClient('localhost', 8000)
        if ($c.Connected) {
            $c.Close()
            Start-Process $url
            exit 0
        }
    } catch {}
    Start-Sleep -Milliseconds 500
}
exit 1
