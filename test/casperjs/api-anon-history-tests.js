/* Utility to load a specific page and output html, page text, or a screenshot
 *  Optionally wait for some time, text, or dom selector
 */
try {
    //...if there's a better way - please let me know, universe
    var scriptDir = require( 'system' ).args[3]
            // remove the script filename
            .replace( /[\w|\.|\-|_]*$/, '' )
            // if given rel. path, prepend the curr dir
            .replace( /^(?!\/)/, './' ),
        spaceghost = require( scriptDir + 'spaceghost' ).create({
            // script options here (can be overridden by CLI)
            //verbose: true,
            //logLevel: debug,
            scriptDir: scriptDir
        });

} catch( error ){
    console.debug( error );
    phantom.exit( 1 );
}
spaceghost.start();


// =================================================================== SET UP
var utils = require( 'utils' );

// =================================================================== TESTS
spaceghost.thenOpen( spaceghost.baseUrl ).waitForSelector( '.history-name' );
spaceghost.then( function(){

    // ------------------------------------------------------------------------------------------- anon allowed
    this.test.comment( 'index should get a list of histories' );
    var index = this.api.histories.index();
    this.test.assert( utils.isArray( index ), "index returned an array: length " + index.length );
    this.test.assert( index.length === 1, 'Has at least one history' );

    this.test.comment( 'show should get a history details object' );
    var historyShow = this.api.histories.show( index[0].id );
    //this.debug( this.jsonStr( historyShow ) );
    this.test.assert( historyShow.id === index[0].id, 'Is the first history' );
    this.test.assert( this.hasKeys( historyShow, [ 'id', 'name', 'user_id' ] ) );

    this.test.comment( 'Calling show with "current" should return the current history' );
    var current = this.api.histories.show( 'current' );
    //this.debug( this.jsonStr( current ) );
    this.test.assert( current.id === index[0].id, 'Is the first history' );
    this.test.assert( current.id === historyShow.id, 'current returned same id' );


    // ------------------------------------------------------------------------------------------- anon forbidden
    //TODO: why not return the current history?
    this.test.comment( 'calling show with "most_recently_used" should return None for an anon user' );
    var recent = this.api.histories.show( 'most_recently_used' );
    this.test.assert( recent === null, 'most_recently_used returned None' );

    this.test.comment( 'Calling set_as_current should fail for an anonymous user' );
    this.api.assertRaises( function(){
        this.api.histories.set_as_current( current.id );
    }, 403, 'API authentication required for this request', 'set_as_current failed with error' );

    this.test.comment( 'Calling create should fail for an anonymous user' );
    this.api.assertRaises( function(){
        this.api.histories.create({ current: true });
    }, 403, 'API authentication required for this request', 'create failed with error' );

    this.test.comment( 'Calling delete should fail for an anonymous user' );
    this.api.assertRaises( function(){
        this.api.histories.delete_( current.id );
    }, 403, 'API authentication required for this request', 'create failed with error' );

    this.test.comment( 'Calling update should fail for an anonymous user' );
    this.api.assertRaises( function(){
        this.api.histories.update( current.id, {} );
    }, 403, 'API authentication required for this request', 'update failed with error' );

    //TODO: need these two in api.js
    //this.test.comment( 'Calling archive_import should fail for an anonymous user' );
    //this.api.assertRaises( function(){
    //    this.api.histories.archive_import( current.id, {} );
    //}, 403, 'API authentication required for this request', 'archive_import failed with error' );

    //this.test.comment( 'Calling archive_download should fail for an anonymous user' );
    //this.api.assertRaises( function(){
    //    this.api.histories.archive_download( current.id, {} );
    //}, 403, 'API authentication required for this request', 'archive_download failed with error' );

    // test server bad id protection
    spaceghost.test.comment( 'A bad id should throw an error' );
    this.api.assertRaises( function(){
        this.api.histories.show( '1234123412341234' );
    }, 400, 'unable to decode', 'Bad Request with invalid id: show' );

});

// ------------------------------------------------------------------------------------------- hdas
spaceghost.thenOpen( spaceghost.baseUrl ).waitForSelector( '.history-name' );
//TODO: can't use this - get a 400 when tools checks for history: 'logged in to manage'
//spaceghost.then( function(){
//    this.api.tools.thenUpload( spaceghost.api.histories.show( 'current' ).id, {
//        filepath: this.options.scriptDir + '/../../test-data/1.sam'
//    });
//});
spaceghost.then( function(){
    spaceghost.tools.uploadFile( '../../test-data/1.sam', function( uploadInfo ){
        this.test.assert( uploadInfo.hdaElement !== null, "Convenience function produced hda" );
        var state = this.historypanel.getHdaState( '#' + uploadInfo.hdaElement.attributes.id );
        this.test.assert( state === 'ok', "Convenience function produced hda in ok state" );
    });
});

spaceghost.then( function(){
    var current = this.api.histories.show( 'current' );

    // ------------------------------------------------------------------------------------------- anon allowed
    this.test.comment( 'anonymous users can index hdas in their current history' );
    var hdaIndex = this.api.hdas.index( current.id );
    this.test.assert( hdaIndex.length === 1, 'indexed hdas' );

    this.test.comment( 'anonymous users can show hdas in their current history' );
    var hda = this.api.hdas.show( current.id, hdaIndex[0].id );
    this.test.assert( this.hasKeys( hda, [ 'id', 'name' ] ), 'showed hda: ' + hda.name );

    this.test.comment( 'anonymous users can hide hdas in their current history' );
    var changed = this.api.hdas.update( current.id, hda.id, { visible: false });
    hda = this.api.hdas.show( current.id, hda.id );
    this.test.assert( hda.visible === false, 'successfully hidden' );

    this.test.comment( 'anonymous users can mark their hdas as deleted in their current history' );
    changed = this.api.hdas.update( current.id, hda.id, { deleted: true });
    hda = this.api.hdas.show( current.id, hda.id );
    this.test.assert( hda.deleted, 'successfully deleted' );

    // ------------------------------------------------------------------------------------------- anon forbidden
    //TODO: should be allowed...
    this.test.comment( 'Calling create should fail for an anonymous user' );
    this.api.assertRaises( function(){
        this.api.hdas.create( current.id, { source: 'hda', content: 'doesntmatter' });
    }, 403, 'API authentication required for this request', 'create failed with error' );

    //TODO: should be allowed (along with purge) and automatically creates new history (as UI)
    this.test.comment( 'Calling delete should fail for an anonymous user' );
    this.api.assertRaises( function(){
        this.api.hdas.delete_( current.id, hda.id );
    }, 403, 'API authentication required for this request', 'delete failed with error' );

    //TODO: only sharing, tags, annotations should be blocked/prevented
    this.test.comment( 'Calling update with keys other than "visible" or "deleted" should fail silently' );
    changed = this.api.hdas.update( current.id, hda.id, { tags: [ 'one' ] });
    hda = this.api.hdas.show( current.id, hda.id );
    this.debug( this.jsonStr( hda.tags ) );

    this.test.assert( hda.tags.length === 0, 'tags were not set' );

});

// ===================================================================
spaceghost.run( function(){
});