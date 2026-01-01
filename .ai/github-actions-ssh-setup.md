# GitHub Actions SSH Setup Guide

## Overview

This guide explains how to set up SSH authentication for GitHub Actions to deploy to your production server.

---

## Step 1: Generate SSH Key Pair

**On your local machine** (NOT on the production server):

```bash
# Generate a dedicated SSH key for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-gsd-deploy" -f ~/.ssh/github-actions-gsd

# This creates two files:
# ~/.ssh/github-actions-gsd       (private key - for GitHub Secrets)
# ~/.ssh/github-actions-gsd.pub   (public key - for production server)
```

**Important:**
- When prompted for passphrase, **leave it empty** (press Enter twice)
- GitHub Actions cannot use passphrase-protected keys
- This key should be dedicated to GitHub Actions only

---

## Step 2: Add Public Key to Production Server

**Copy the public key to your production server:**

```bash
# Method 1: Using ssh-copy-id (recommended)
ssh-copy-id -i ~/.ssh/github-actions-gsd.pub your-username@your-server-ip

# Method 2: Manual copy
cat ~/.ssh/github-actions-gsd.pub
# Then SSH to server and add to ~/.ssh/authorized_keys
```

**Verify it works:**

```bash
# Test SSH connection with the new key
ssh -i ~/.ssh/github-actions-gsd your-username@your-server-ip

# If successful, you should connect without password
# Then exit
exit
```

---

## Step 3: Add Private Key to GitHub Secrets

**Get the private key contents:**

```bash
# Display the private key
cat ~/.ssh/github-actions-gsd

# Output will look like:
# -----BEGIN OPENSSH PRIVATE KEY-----
# b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
# ... (many lines) ...
# -----END OPENSSH PRIVATE KEY-----
```

**Add to GitHub:**

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `PRODUCTION_HOST` | Your server IP or domain | `203.0.113.42` or `server.example.com` |
| `PRODUCTION_USER` | SSH username on server | `deploy` or `ubuntu` |
| `PRODUCTION_SSH_KEY` | **Entire private key contents** | Copy everything from `cat ~/.ssh/github-actions-gsd` |
| `PRODUCTION_SSH_PORT` | SSH port (optional) | `22` (default) |

**Important for PRODUCTION_SSH_KEY:**
- Copy the ENTIRE private key including the header and footer lines
- Include `-----BEGIN OPENSSH PRIVATE KEY-----`
- Include `-----END OPENSSH PRIVATE KEY-----`
- Include all lines in between
- Don't add quotes or modify the content

---

## Step 4: Secure the Private Key on Your Machine

**Important Security:**

```bash
# Set restrictive permissions on the private key
chmod 600 ~/.ssh/github-actions-gsd

# Store it securely (recommended: password manager)
# Consider encrypting it if storing in cloud backup
```

---

## Step 5: Test GitHub Actions Deployment

**Trigger a test deployment:**

1. Go to GitHub → **Actions** tab
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select branch: `main`
5. Keep "Skip tests" unchecked
6. Click **Run workflow**

**Watch the deployment:**
- The workflow will show each step
- SSH connection should succeed
- Deployment should complete successfully

---

## Security Best Practices

### 1. Dedicated Deploy User (Recommended)

Instead of using your personal user, create a dedicated deploy user on the server:

```bash
# On production server (as root or with sudo)
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy  # Add to docker group

# Set up authorized_keys
sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo touch /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Add the GitHub Actions public key
sudo nano /home/deploy/.ssh/authorized_keys
# Paste: ssh-ed25519 AAAA... github-actions-gsd-deploy

# Set ownership
sudo chown -R deploy:deploy /home/deploy/.ssh

# Give deploy user access to /opt/gsd
sudo chown -R deploy:deploy /opt/gsd
```

**Then update GitHub Secret:**
- `PRODUCTION_USER` = `deploy`

### 2. Restrict SSH Key Access

Limit what the GitHub Actions key can do:

```bash
# On production server, edit authorized_keys
sudo nano /home/deploy/.ssh/authorized_keys

# Add restrictions before the key:
command="/opt/gsd/scripts/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA... github-actions-gsd-deploy
```

This ensures the key can ONLY run the deploy script, nothing else.

### 3. Use Environment Protection Rules

In GitHub Settings → Environments → production:

- ✅ Enable **Required reviewers** (require approval before deploy)
- ✅ Set **Wait timer** (delay before deployment)
- ✅ Restrict to **specific branches** (only main can deploy)

### 4. Rotate Keys Periodically

```bash
# Every 6-12 months, generate new keys
ssh-keygen -t ed25519 -C "github-actions-gsd-deploy-2025" -f ~/.ssh/github-actions-gsd-new

# Add new public key to server
ssh-copy-id -i ~/.ssh/github-actions-gsd-new.pub deploy@server

# Update GitHub Secret with new private key
# Test deployment
# Remove old key from server's authorized_keys
```

---

## Troubleshooting

### SSH Connection Failed in GitHub Actions

**Check the workflow logs:**

```
Error: Permission denied (publickey)
```

**Possible causes:**

1. **Private key not copied correctly**
   - Ensure you copied the ENTIRE key including headers
   - Check for extra spaces or line breaks

2. **Public key not on server**
   - SSH to server manually
   - Check `~/.ssh/authorized_keys` contains the public key

3. **Wrong username**
   - Verify `PRODUCTION_USER` matches the server username
   - Check with: `ssh user@server whoami`

4. **Wrong host**
   - Verify `PRODUCTION_HOST` is correct
   - Check with: `ping your-server-ip`

5. **Permissions too open**
   - On server: `chmod 700 ~/.ssh`
   - On server: `chmod 600 ~/.ssh/authorized_keys`

### Test SSH Connection Manually

```bash
# On your local machine, test the exact connection GitHub Actions will use
ssh -i ~/.ssh/github-actions-gsd -p 22 deploy@your-server-ip

# Should connect without password
# If it asks for password, the key isn't working
```

### Verify Key Fingerprint

```bash
# Get fingerprint of your private key
ssh-keygen -lf ~/.ssh/github-actions-gsd

# On server, check authorized_keys
ssh-keygen -lf ~/.ssh/authorized_keys

# Fingerprints should match
```

---

## Alternative: Using GitHub Deploy Keys

**If you prefer repository-specific keys:**

GitHub Deploy Keys are scoped to a single repository, but they're **read-only** by default and can't trigger workflows or access packages.

**For deployment, use SSH keys in Secrets (as described above)** because you need:
- Write access to pull from GHCR
- Ability to SSH to server
- Repository-wide access

---

## Summary Checklist

Before running GitHub Actions deployment:

- [ ] SSH key pair generated (ed25519, no passphrase)
- [ ] Public key added to production server's `~/.ssh/authorized_keys`
- [ ] Private key added to GitHub Secret: `PRODUCTION_SSH_KEY`
- [ ] `PRODUCTION_HOST` secret set (server IP or domain)
- [ ] `PRODUCTION_USER` secret set (SSH username)
- [ ] `PRODUCTION_SSH_PORT` secret set (if not 22)
- [ ] Manual SSH test successful: `ssh -i ~/.ssh/github-actions-gsd user@server`
- [ ] GitHub Actions workflow triggered and successful

---

## Next Steps

After SSH setup is complete:

1. Run your first GitHub Actions deployment
2. Monitor the workflow logs
3. Verify deployment at https://getsd.bieda.it
4. Set up environment protection rules (optional)
5. Create a dedicated deploy user (recommended)

---

**Questions or issues?** Check the troubleshooting section or review GitHub Actions workflow logs for specific error messages.
