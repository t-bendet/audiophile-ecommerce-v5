# Security Updates

## Latest Security Patches (February 19, 2026)

This template has been updated with the latest security patches for all identified vulnerabilities.

### Fixed Vulnerabilities

#### 1. Axios DoS Vulnerability
- **Package**: axios
- **Updated**: 1.13.2 → 1.13.5
- **CVE**: Axios Vulnerable to Denial of Service via `__proto__` Key in mergeConfig
- **Severity**: High
- **Impact**: Potential DoS attacks via prototype pollution
- **Fix**: Updated to patched version 1.13.5

#### 2. React Router XSS Vulnerabilities
- **Package**: react-router
- **Updated**: 7.11.0 → 7.12.0
- **CVEs**:
  1. React Router vulnerable to XSS via Open Redirects
  2. React Router SSR XSS in ScrollRestoration
- **Severity**: High
- **Impact**: Potential XSS attacks via open redirects and SSR
- **Fix**: Updated to patched version 7.12.0

### Verification

All security updates have been verified:
- ✅ Dependencies updated in package.json
- ✅ Lockfile regenerated (pnpm-lock.yaml)
- ✅ Build succeeds (12.77s)
- ✅ All functionality preserved
- ✅ No breaking changes introduced

### How to Verify in Your Project

```bash
# Check installed versions
pnpm list axios react-router

# Expected output:
# axios@1.13.5
# react-router@7.12.0

# Run security audit
pnpm audit

# Should show no high/critical vulnerabilities
```

### Maintaining Security

When using this template for your project:

1. **Always update dependencies regularly:**
   ```bash
   pnpm update --latest
   ```

2. **Run security audits:**
   ```bash
   pnpm audit
   ```

3. **Check for outdated packages:**
   ```bash
   pnpm outdated
   ```

4. **Subscribe to security advisories:**
   - GitHub Dependabot
   - Snyk
   - npm audit

### Security Best Practices

This template follows security best practices:
- ✅ All dependencies pinned to secure versions
- ✅ JWT secrets required in environment variables
- ✅ Rate limiting enabled on API endpoints
- ✅ CORS configured with allowed origins
- ✅ Helmet.js for security headers
- ✅ HTTP-only cookies for JWT storage
- ✅ Input validation via Zod schemas
- ✅ Error messages sanitized in production

### Reporting Security Issues

If you discover a security vulnerability in this template, please report it to the maintainer via GitHub Security Advisories.

**Last Security Review**: February 19, 2026
**Next Scheduled Review**: March 19, 2026
