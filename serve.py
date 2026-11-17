import http.server, sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

http.server.ThreadingHTTPServer(('', int(sys.argv[1])), NoCache).serve_forever()
