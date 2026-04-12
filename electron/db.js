import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

const dbPath = join(app.getPath('userData'), 'portfolio.db')
const db = new Database(dbPath)

db.prepare(`
  CREATE TABLE IF NOT EXISTS positions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker     TEXT    NOT NULL,
    company    TEXT    NOT NULL,
    shares     REAL    NOT NULL,
    buyPrice   REAL    NOT NULL,
    buyDate    TEXT    NOT NULL,
    currency   TEXT    NOT NULL DEFAULT 'USD'
  )
`).run()

export const getPositions = () => db.prepare('SELECT * FROM positions').all()
export const addPosition = (pos) => {
  const { ticker, company, shares, buyPrice, buyDate, currency = 'USD' } = pos
  return db.prepare(`
    INSERT INTO positions (ticker, company, shares, buyPrice, buyDate, currency)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(ticker, company, shares, buyPrice, buyDate, currency)
}
export const deletePosition = (id) => db.prepare('DELETE FROM positions WHERE id = ?').run(id)