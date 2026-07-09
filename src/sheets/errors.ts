export class SheetsApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'SheetsApiError'
    this.status = status
  }
}
