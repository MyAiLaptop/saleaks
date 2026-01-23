const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = false
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
}

// Serve static files from public directory
function serveStatic(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return false
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    })
    res.end(data)
    return true
  })
  return true
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      const { pathname } = parsedUrl

      // Check if request is for a static file in /public
      // Static files are served from paths like /uploads/*, /images/*, etc.
      if (pathname && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
        const publicPath = path.join(__dirname, 'public', pathname)

        // Check if file exists in public folder
        if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
          return serveStatic(req, res, publicPath)
        }
      }

      // Let Next.js handle everything else
      await handle(req, res, parsedUrl)
    } catch (err) {
      res.statusCode = 500
      res.end('Internal server error')
    }
  }).listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
