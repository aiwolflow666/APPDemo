#!/usr/bin/env python3
import http.server
import socketserver
import socket
import os

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

os.chdir(os.path.dirname(os.path.abspath(__file__)))

handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True

for port in [8000, 8080, 3000, 5000, 9000]:
    try:
        httpd = socketserver.TCPServer(("", port), handler)
        break
    except OSError:
        continue
else:
    print("No available port found.")
    exit(1)

ip = get_local_ip()
print("=" * 50)
print("  TOEIC Study App - Local Server")
print("=" * 50)
print(f"  PC:    http://localhost:{port}/index.html")
print(f"  Phone: http://{ip}:{port}/index.html")
print("=" * 50)
print("  Press Ctrl+C to stop")
print()
httpd.serve_forever()
