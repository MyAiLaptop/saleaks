const { createServer } = require('http')
const { parse } = require('url')
const path = require('path')
const fs = require('fs')

const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

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

// Try to serve static file, returns true if served
function tryServeStatic(req, res, pathname) {
  const publicPath = path.join(__dirname, 'public', pathname)

  try {
    if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
      const ext = path.extname(publicPath).toLowerCase()
      const contentType = mimeTypes[ext] || 'application/octet-stream'
      const data = fs.readFileSync(publicPath)

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      })
      res.end(data)
      return true
    }
  } catch (e) {
    // File not found or error, let Next.js handle it
  }
  return false
}

// Import the standalone Next.js handler
const NextServer = require('next/dist/server/next-server').default
const nextConfig = require('./.next/required-server-files.json').config

const nextServer = new NextServer({
  hostname,
  port,
  dir: __dirname,
  dev: false,
  customServer: true,
  conf: nextConfig,
})

const handler = nextServer.getRequestHandler()

createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true)
    const { pathname } = parsedUrl

    // Try to serve static files from public folder first
    if (pathname && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
      if (tryServeStatic(req, res, pathname)) {
        return
      }
    }

    // Let Next.js handle everything else
    await handler(req, res, parsedUrl)
  } catch (err) {
    console.error('Error:', err)
    res.statusCode = 500
    res.end('Internal server error')
  }
}).listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port}`)
})
