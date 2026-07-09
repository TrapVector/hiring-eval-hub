/** True when the token still has more than `bufferMs` of life left. */
export function isTokenFresh(expiresAt: number, now: number, bufferMs = 60_000): boolean {
  return now < expiresAt - bufferMs
}
