import { NextResponse } from 'next/server'
import * as path from 'path'
import * as fs from 'fs'
import { execSync } from 'child_process'

const USER_DATA_DIR = path.join(process.cwd(), '.weee_user_data')

/**
 * API endpoint to clean up browser lock files and kill lingering processes
 * 
 * POST /api/weee/cleanup
 * 
 * Use this if the browser fails to launch due to lock issues
 */
export async function POST() {
  try {
    console.log('🧹 Cleaning up browser lock files and processes...')
    
    let processesKilled = 0
    let filesRemoved = 0
    
    // Kill lingering Chrome processes
    try {
      const grepCmd = `ps aux | grep "${USER_DATA_DIR}" | grep -v grep | awk '{print $2}'`
      const pids = execSync(grepCmd, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean)
      
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`)
          processesKilled++
          console.log(`✅ Killed process ${pid}`)
        } catch (error) {
          console.warn(`⚠️  Could not kill process ${pid}`)
        }
      }
      
      if (processesKilled > 0) {
        // Wait for processes to die
        execSync('sleep 0.5')
      }
    } catch (error) {
      console.warn('⚠️  Could not check for Chrome processes')
    }
    
    // Remove lock files
    const lockFile = path.join(USER_DATA_DIR, 'SingletonLock')
    const lockSocketFile = path.join(USER_DATA_DIR, 'SingletonSocket')
    const lockCookieFile = path.join(USER_DATA_DIR, 'SingletonCookie')
    
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile)
      filesRemoved++
      console.log('✅ Removed SingletonLock')
    }
    
    if (fs.existsSync(lockSocketFile)) {
      fs.unlinkSync(lockSocketFile)
      filesRemoved++
      console.log('✅ Removed SingletonSocket')
    }
    
    if (fs.existsSync(lockCookieFile)) {
      fs.unlinkSync(lockCookieFile)
      filesRemoved++
      console.log('✅ Removed SingletonCookie')
    }
    
    if (processesKilled === 0 && filesRemoved === 0) {
      console.log('ℹ️  No processes or lock files found')
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${processesKilled} process(es) and ${filesRemoved} lock file(s)`,
      processesKilled,
      filesRemoved,
    })
  } catch (error) {
    console.error('❌ Error cleaning up:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
