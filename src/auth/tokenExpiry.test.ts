import { describe, expect, it } from 'vitest'
import { isTokenFresh } from './tokenExpiry'

describe('isTokenFresh', () => {
  it('is fresh well before expiry', () => {
    expect(isTokenFresh(100_000, 0)).toBe(true)
  })

  it('is not fresh once inside the buffer window', () => {
    expect(isTokenFresh(100_000, 100_000 - 30_000)).toBe(false)
  })

  it('is not fresh after expiry', () => {
    expect(isTokenFresh(100_000, 200_000)).toBe(false)
  })

  it('respects a custom buffer', () => {
    expect(isTokenFresh(100_000, 90_000, 5_000)).toBe(true)
  })
})
