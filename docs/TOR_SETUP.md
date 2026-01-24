# Setting Up Tor Hidden Service for SpillNova

This guide explains how to set up a .onion address for maximum anonymity.

## Why Use Tor?

1. **For Users**: They can submit leaks without their ISP knowing they visited saleaks.co.za
2. **For You**: You can manage the site without exposing your IP to the hosting provider
3. **For Everyone**: Harder to take down, more resistant to legal pressure

## Option 1: Self-Hosted Tor Hidden Service

### On a Linux Server (Ubuntu/Debian)

```bash
# Install Tor
sudo apt update
sudo apt install tor

# Edit Tor config
sudo nano /etc/tor/torrc

# Add these lines:
HiddenServiceDir /var/lib/tor/saleaks/
HiddenServicePort 80 127.0.0.1:3000

# Restart Tor
sudo systemctl restart tor

# Get your .onion address
sudo cat /var/lib/tor/saleaks/hostname
```

Your .onion address will look like: `abc123xyz...def.onion`

### Configure Next.js for Tor

Update your `next.config.js` to allow the .onion hostname:

```javascript
const nextConfig = {
  // ... existing config

  // Allow .onion hostname
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // ... existing headers
          // Add onion-location header to advertise .onion
          {
            key: 'Onion-Location',
            value: 'http://YOUR_ONION_ADDRESS.onion/:path*'
          },
        ],
      },
    ];
  },
};
```

## Option 2: Use OnionShare (Easiest)

For testing or temporary hosting:

1. Download OnionShare: https://onionshare.org/
2. Select "Host a Website"
3. Point it to your built Next.js app
4. It generates a temporary .onion address

## Option 3: Cloudflare Onion Service

If using Cloudflare:
1. Enable "Onion Routing" in Cloudflare dashboard
2. Cloudflare automatically provides a .onion mirror
3. Less anonymous for you, but convenient

## Security Checklist for Tor Hosting

- [ ] Server has no connection to your identity
- [ ] Paid for with cryptocurrency
- [ ] SSH access only through Tor (use `torsocks ssh`)
- [ ] No clearnet services running that could leak IP
- [ ] Regular security updates
- [ ] Disable server logging: `sudo systemctl stop rsyslog`

## Recommended Server Setup

```bash
# Disable all logging
sudo systemctl stop rsyslog
sudo systemctl disable rsyslog

# Clear existing logs
sudo rm -rf /var/log/*

# Configure Tor for better anonymity
sudo nano /etc/tor/torrc

# Add:
SafeLogging 1
Log notice file /dev/null
```

## Testing Your .onion Site

1. Download Tor Browser: https://www.torproject.org/
2. Navigate to your .onion address
3. Verify the site loads correctly

## Important Notes

- .onion addresses are **self-authenticating** (no SSL needed, though you can add it)
- Keep your `HiddenServiceDir` backed up securely - it contains your private key
- If the private key is compromised, generate a new .onion address
- Consider using Tor's **Vanguards** addon for additional protection against traffic analysis

## Resources

- Tor Project: https://www.torproject.org/
- Whonix (secure OS): https://www.whonix.org/
- Tails (amnesic OS): https://tails.boum.org/
