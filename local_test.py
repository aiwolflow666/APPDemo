#!/usr/bin/env python3
import http.server
import socketserver
import socket
import os

PORT = 8000

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

with socketserver.TCPServer(("", PORT), handler) as httpd:
    ip = get_local_ip()
    print("=" * 50)
    print("  TOEIC Study App - Local Server")
    print("=" * 50)
    print(f"  PC:   http://localhost:{PORT}/index.html")
    print(f"  Phone: http://{ip}:{PORT}/index.html")
    print("=" * 50)
    print("  Press Ctrl+C to stop")
    print()
    httpd.serve_forever()
