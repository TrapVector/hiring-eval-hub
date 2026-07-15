import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { buildSetupUrl } from '../../config/setupLink'
import type { AppConfig } from '../../store/db'
import styles from './DeviceLinkQrCode.module.css'

interface DeviceLinkQrCodeProps {
  config: AppConfig
}

/**
 * Shows a QR code (and a plain copyable link) that pre-fills Step 1 of the
 * setup wizard on another device. Generated entirely client-side — no
 * third-party QR image API is used, so none of these (non-secret, per
 * CLAUDE.md §7) values leave the device.
 */
export function DeviceLinkQrCode({ config }: DeviceLinkQrCodeProps) {
  const url = buildSetupUrl(window.location.href, {
    applicationsSheetId: config.applicationsSheetId,
    applicationsTabName: config.applicationsTabName,
    reviewsSheetId: config.reviewsSheetId,
    oauthClientId: config.oauthClientId,
  })

  const [svg, setSvg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 }).then((markup) => {
      if (!cancelled) setSvg(markup)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className={styles.section}>
      <h3>Set up another device</h3>
      <p>Scan this on your phone to pre-fill these connection details there.</p>
      {svg && <div className={styles.qr} dangerouslySetInnerHTML={{ __html: svg }} />}
      <div className={styles.linkRow}>
        <input type="text" readOnly value={url} onFocus={(e) => e.target.select()} />
        <button type="button" onClick={handleCopy}>
          Copy link
        </button>
      </div>
      {copied && <span className={styles.copied}>Copied.</span>}
    </section>
  )
}
