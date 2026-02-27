import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'auth.db');

let db: Database.Database;

export function initAuthDb() {
  if (db) return db;

  db = new Database(DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT
    )
  `);

  const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin') as any;

  if (!adminUser) {
    const password = crypto.randomBytes(8).toString('hex'); // 16 characters
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);

    const boxWidth = 60;
    const line = '═'.repeat(boxWidth);
    const title = ' MONGODB WEBGUI - INITIAL SETUP ';
    const padding = Math.floor((boxWidth - title.length) / 2);
    
    console.log('\n' + chalk.yellow.bold('╔' + line + '╗'));
    console.log(chalk.yellow.bold('║' + ' '.repeat(padding) + title + ' '.repeat(boxWidth - title.length - padding) + '║'));
    console.log(chalk.yellow.bold('╠' + line + '╣'));
    console.log(chalk.yellow.bold('║' + ' '.repeat(2) + 'An admin account has been automatically created.' + ' '.repeat(boxWidth - 50) + '║'));
    console.log(chalk.yellow.bold('║' + ' '.repeat(2) + 'Please save these credentials securely:' + ' '.repeat(boxWidth - 41) + '║'));
    console.log(chalk.yellow.bold('║' + ' '.repeat(boxWidth) + '║'));
    console.log(chalk.yellow.bold('║' + ' '.repeat(4) + 'Username: ' + chalk.green.bold('admin') + ' '.repeat(boxWidth - 19) + '║'));
    console.log(chalk.yellow.bold('║' + ' '.repeat(4) + 'Password: ' + chalk.green.bold(password) + ' '.repeat(boxWidth - 19 - password.length + 5) + '║'));
    console.log(chalk.yellow.bold('║' + ' '.repeat(boxWidth) + '║'));
    console.log(chalk.yellow.bold('║' + ' '.repeat(2) + 'You can now log in at: ' + chalk.blue('/login') + ' '.repeat(boxWidth - 30) + '║'));
    console.log(chalk.yellow.bold('╚' + line + '╝') + '\n');
  }

  return db;
}

export function verifyAdminPassword(password: string): boolean {
  const database = initAuthDb();
  const user = database.prepare('SELECT * FROM users WHERE username = ?').get('admin') as any;
  if (!user) return false;
  return bcrypt.compareSync(password, user.password_hash);
}
