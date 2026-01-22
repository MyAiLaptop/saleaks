const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const net = require('net')
const { exec } = require('child_process')

// SECURITY: Disable all console logging in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {}
  console.error = () => {}
  console.warn = () => {}
  console.info = () => {}
  console.debug = () => {}
}

// Open URL in default browser (cross-platform)
function openBrowser(url) {
  const platform = process.platform
  let command

  if (platform === 'win32') {
    command = `start "" "${url}"`
  } else if (platform === 'darwin') {
    command = `open "${url}"`
  } else {
    command = `xdg-open "${url}"`
  }

  exec(command, (err) => {
    if (err) {
      console.log(`Could not open browser automatically. Please visit: ${url}`)
    }
  })
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const defaultPort = parseInt(process.env.PORT || '3000', 10)

// Check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close()
      resolve(true)
    })
    server.listen(port, hostname)
  })
}

// Find an available port starting from the default
async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    if (await isPortAvailable(port)) {
      return port
    }
    console.log(`Port ${port} is in use, trying next...`)
  }
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`)
}

async function startServer() {
  try {
    const port = await findAvailablePort(defaultPort)

    if (port !== defaultPort) {
      console.log(`\n⚠️  Default port ${defaultPort} was in use`)
    }

    const app = next({ dev, hostname, port })
    const handle = app.getRequestHandler()

    await app.prepare()

    createServer(async (req, res) => {
      // SECURITY: Strip IP address from request - never log or pass it
      delete req.headers['x-forwarded-for']
      delete req.headers['x-real-ip']
      delete req.headers['cf-connecting-ip']
      req.socket.remoteAddress = '0.0.0.0'

      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        // Don't log errors with request details
        res.statusCode = 500
        res.end('Internal server error')
      }
    }).listen(port, (err) => {
      if (err) throw err
      const url = `http://${hostname}:${port}`
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   SA Leaks - Whistleblower Platform                        ║
║                                                            ║
║   Server running at: ${url}                       ║
║                                                            ║
║   Your identity is protected. No IP logging.               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`)
      // Open browser automatically
      openBrowser(url)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
