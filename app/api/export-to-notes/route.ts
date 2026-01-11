import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, title } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Write content to temp file first
    const tempFile = join(tmpdir(), `cartify-export-${Date.now()}.txt`);
    
    try {
      // Normalize line endings - ensure consistent Unix-style line breaks
      const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // Write to temp file with UTF-8 encoding and BOM to ensure proper reading
      writeFileSync(tempFile, normalizedContent, { encoding: 'utf8' });
      
      const noteTitle = title || 'Cartify Shopping List';
      // Escape title for AppleScript
      const escapedTitle = noteTitle
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      
      // Escape the file path for AppleScript
      const escapedPath = tempFile.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      
      // AppleScript - use cat to read and paragraphs to preserve formatting
      const appleScript = `set fileContent to do shell script "cat " & quoted form of "${escapedPath}"

tell application "Notes"
  activate
  try
    tell account "iCloud"
      set newNote to make new note at folder "Notes" with properties {name:"${escapedTitle}", body:fileContent}
    end tell
  on error
    -- Fallback to default account
    set newNote to make new note with properties {name:"${escapedTitle}", body:fileContent}
  end try
  
  -- Show the new note
  show newNote
end tell

return "success"`;

      // Write AppleScript to temp file and execute it
      const scriptFile = join(tmpdir(), `cartify-script-${Date.now()}.scpt`);
      try {
        writeFileSync(scriptFile, appleScript, { encoding: 'utf8' });
        
        // Run the AppleScript from file with timeout
        const startTime = Date.now();
        await execAsync(`osascript "${scriptFile}"`, { timeout: 8000 }); // 8 second timeout
        const duration = Date.now() - startTime;
        console.log(`✅ Notes export completed in ${duration}ms`);
        
        // Clean up script file
        try { unlinkSync(scriptFile); } catch {}
        
        // Clean up temp file
        try { unlinkSync(tempFile); } catch {}
        
        return NextResponse.json({
          success: true,
          message: 'Note created successfully in Notes app',
          duration
        });
      } catch (error: any) {
        // Clean up temp files on error
        try { unlinkSync(tempFile); } catch {}
        try { unlinkSync(scriptFile); } catch {}
        
        if (error.killed || error.signal === 'SIGTERM') {
          console.error('❌ AppleScript timed out');
          return NextResponse.json(
            { 
              error: 'Notes export timed out',
              details: 'The Notes app took too long to respond'
            },
            { status: 504 }
          );
        }
        
        console.error('❌ AppleScript error:', error);
        console.error('Stderr:', error.stderr);
        console.error('Stdout:', error.stdout);
        return NextResponse.json(
          { 
            error: 'Failed to create note in Notes app',
            details: error.message || error.stderr || 'Unknown error'
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Export to Notes error:', error);
      return NextResponse.json(
        { error: 'Failed to export to Notes app', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Export to Notes error:', error);
    return NextResponse.json(
      { error: 'Failed to export to Notes app', details: error.message },
      { status: 500 }
    );
  }
}

