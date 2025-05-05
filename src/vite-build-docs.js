import { mkdir, readFile, stat, watch } from 'fs/promises';
import { resolve } from 'path';
import { join } from 'path/posix';

import { glob } from 'glob';
import Handlebars from 'handlebars';

import { generate404, generateFile } from './generate.js';
import { createDevServer } from './server.js';

export function buildDocs( docConfig ) {
  let docsDir = null;
  let distDir = null;

  let server = null;
  let watchAbortController = null;
  let watcher = null;

  let template = null;
  let files = null;

  let pending = Promise.resolve();
  let queued = new Set();

  async function generateAllFiles() {
    try {
      const content = await readFile( join( distDir, 'index.html' ), 'utf-8' );

      template = Handlebars.compile( content );

      files = await glob( '**/*.md', { cwd: docsDir, posix: true } );

      for ( const file of files )
        await generateFile( file, docsDir, distDir, template, docConfig, files );

      await generate404( distDir, template, docConfig );

      if ( server != null )
        server.reload();
    } catch ( err ) {
      if ( err.code != 'ENOENT' )
        console.error( err );
    }
  }

  async function initializeWatchMode() {
    await mkdir( distDir, { recursive: true } );

    const port = docConfig.port || 3000;

    server = await createDevServer( distDir, port );

    if ( docConfig.onStartup != null )
      docConfig.onStartup( server );

    watchAbortController = new AbortController();
    watcher = watch( docsDir, { recursive: true, signal: watchAbortController.signal } );

    processWatcherEvents();
  }

  async function processWatcherEvents() {
    try {
      for await ( const event of watcher ) {
        if ( !queued.has( event.filename ) ) {
          queued.add( event.filename );
          enqueue( () => handleFileChange( event.filename, server ) );
        }
      }
    } catch ( err ) {
      if ( err.name == 'AbortError' )
        return;
      throw err;
    }
  }

  async function handleFileChange( file ) {
    if ( template == null )
      return;

    try {
      await delay( 100 );
      const stats = await stat( join( docsDir, file ) );
      if ( stats.isFile() ) {
        const inputFile = file.replaceAll( '\\', '/' );
        const outputFile = inputFile.replace( /.md$/, '.html' );
        console.log( outputFile );
        await generateFile( inputFile, docsDir, distDir, template, docConfig, files );
        queued.delete( file );
        server.reload( outputFile );
      }
    } catch ( err ) {
      if ( err.code != 'ENOENT' )
        console.error( err );
    }
  }

  function enqueue( fn ) {
    pending.finally( () => {
      pending = fn();
    } );
  }

  function delay( time ) {
    return new Promise( resolve => setTimeout( resolve, time ) );
  }

  return {
    name: 'build-docs',

    async configResolved( config ) {
      docsDir = resolve( config.root, docConfig.dir || 'docs' );
      distDir = resolve( config.root, config.build.outDir );

      if ( config.build.watch )
        await initializeWatchMode();
    },

    closeBundle() {
      enqueue( generateAllFiles );
    },

    closeWatcher() {
      if ( server != null ) {
        watchAbortController.abort();
        server.close();
      }
    },
  };
}
