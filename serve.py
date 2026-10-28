"""
Lightweight development server for Varanasi Movie Countdown website.
Supports HTTP 206 Partial Content (Range requests) for butter-smooth 4K video scrubbing.
"""

import os
import sys
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class RangeRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().do_GET()

        range_header = self.headers.get('Range')
        if not range_header or not range_header.startswith('bytes='):
            return super().do_GET()

        try:
            file_size = os.path.getsize(path)
            range_val = range_header.strip().split('=')[1]
            parts = range_val.split('-')
            start = int(parts[0]) if parts[0] else 0
            end = int(parts[1]) if len(parts) > 1 and parts[1] else file_size - 1

            if start >= file_size or end >= file_size or start > end:
                self.send_error(416, "Requested Range Not Satisfiable")
                return

            length = end - start + 1
            ctype = self.guess_type(path)

            self.send_response(206)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
            self.send_header('Content-Length', str(length))
            self.end_headers()

            with open(path, 'rb') as f:
                f.seek(start)
                bytes_left = length
                chunk_size = 64 * 1024
                while bytes_left > 0:
                    read_len = min(chunk_size, bytes_left)
                    data = f.read(read_len)
                    if not data:
                        break
                    try:
                        self.wfile.write(data)
                        bytes_left -= len(data)
                    except (ConnectionResetError, BrokenPipeError):
                        break
        except Exception:
            pass

    def log_message(self, format, *args):
        # Keep console output clean
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

if __name__ == '__main__':
    port = PORT
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    server_address = ('', port)
    httpd = ThreadingHTTPServer(server_address, RangeRequestHandler)
    print(f"\n=======================================================")
    print(f"  VARANASI COUNTDOWN SERVER RUNNING ON PORT {port}")
    print(f"  Open in browser: http://localhost:{port}/")
    print(f"  (Includes HTTP 206 Range support for 4K video playback)")
    print(f"=======================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
