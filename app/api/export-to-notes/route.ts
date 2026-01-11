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
      // Normalize line endings and write to temp file
      const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      writeFileSync(tempFile, normalizedContent, { encoding: 'utf8' });
      
      const noteTitle = title || 'Cartify Shopping List';
      // Escape title for AppleScript
      const escapedTitle = noteTitle
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      
      // Escape the file path for AppleScript
      const escapedPath = tempFile.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      
      // AppleScript to read file and create note with preserved formatting
      // Use read fileRef which preserves formatting correctly
      const appleScript = `set filePath to POSIX file "${escapedPath}"
set fileRef to open for access filePath
set fileContent to read fileRef
close access fileRef

-- Split by newline to get individual lines (preserves empty lines)
set AppleScript's text item delimiters to "\n"
set contentLines to text items of fileContent
set AppleScript's text item delimiters to ""

tell application "Notes"
  activate
  try
    tell account "iCloud"
      -- Create empty note first
      set newNote to make new note at folder "Notes" with properties {name:"${escapedTitle}", body:""}
      
      -- Append each line with explicit return to preserve formatting
      repeat with aLine in contentLines
        set body of newNote to (body of newNote) & aLine & return
      end repeat
    end tell
  on error
    -- Fallback to default account
    set newNote to make new note with properties {name:"${escapedTitle}", body:""}
    
    -- Append each line with explicit return to preserve formatting
    repeat with aLine in contentLines
      set body of newNote to (body of newNote) & aLine & return
    end repeat
  end try
end tell`;

      // Write AppleScript to temp file and execute it
      const scriptFile = join(tmpdir(), `cartify-script-${Date.now()}.scpt`);
      try {
        writeFileSync(scriptFile, appleScript, { encoding: 'utf8' });
        
        // Run the AppleScript from file
        await execAsync(`osascript "${scriptFile}"`);
        
        // Clean up script file
        try { unlinkSync(scriptFile); } catch {}
        
        // Clean up temp file
        try { unlinkSync(tempFile); } catch {}
        
        return NextResponse.json({
          success: true,
          message: 'Note created successfully in Notes app'
        });
      } catch (error: any) {
        // Clean up temp files on error
        try { unlinkSync(tempFile); } catch {}
        try { unlinkSync(scriptFile); } catch {}
        console.error('AppleScript error:', error);
        console.error('AppleScript stderr:', error.stderr);
        console.error('AppleScript stdout:', error.stdout);
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

