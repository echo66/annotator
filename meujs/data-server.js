'use strict';

function DataServer() {

  this.login = function(username,password,callback) {
    this.annotationDB.db.login(username, password, callback);

    this.username = username;
  }

  this.signUp = function(username,password,callback) {
    this.annotationDB.db.signUp(username, password, callback);
  }

  this.logout = function(callback) {
    this.annotationDB.db.logout(callback);
    this.username = undefined;
  }

  this.getSession = function(callback) {
    var c = {response:undefined, err:undefined};
    var response = undefined;
    var err = undefined;

    this.annotationDB.db.getSession(function (e, r) {
      c.response = r;
      c.err = e;
    });

    // May javascript gods forgive this sin. I promise that it will get better.
    // Using an active 'while' loop will not work due to the fact that I'm using a single thread.
    function a () {
      if (c.response==undefined && c.err==undefined)
        setTimeout(a,50);
    };

    setTimeout(a,50);

    return c;
  }

  this.getUser = function(usr) {
    var c = {response:undefined, err:undefined};
    var response = undefined;
    var err = undefined;

    this.annotationDB.db.getUser(usr, function (e, r) {
      c.response = r;
      c.err = e;
    });

    // May javascript gods forgive this sin. I promise that it will get better.
    // Using an active 'while' loop will not work due to the fact that I'm using a single thread.
    function a () {
      if (c.response==undefined && c.err==undefined)
        setTimeout(a,50);
    };

    setTimeout(a,50);

    return c;
    
  }

  this.logRemove = function(x,y) {
    DataServer.log('remove ',x,y);
  }

  this.logShow = function(x,y) {
    DataServer.log('show ',x,y);
  }

  this.logUpdate = function(x,y) {
    DataServer.log('update ',x,y);
  }

  this.startShowHandlers = function() {

    function init_info(db,handler,text) {
      db.info().then(function (info){
        db.changes({
          since: info.update_seq,
          live: true,
          include_docs: true
        }).on('change',handler);
      }).catch(function(err){
        console.log("error at "+text);
        console.log(err);
      });
    }

    var struct1 = this.annotationDB;

    init_info(this.annotationDB.db, function(x,y){struct1.showHandler(x,y);}, "annotationsDB.db.info!");
  }

  this.init = function() {
    this.annotationDB = {
      //db: new PouchDB('annotations'),
      url: "http://localhost:5984/annotations-db",
      removeHandler: this.logRemove,
      showHandler: this.logShow, 
      updateHandler: this.logUpdate
    };
    
    this.annotationDB.db        = new PouchDB(this.annotationDB.url);

  }

  this.startSync = function() {
    console.log('syncing')
    
    var opts = {live: true};

    this.annotationDB.db.sync(this.annotations.url, opts, syncError);

  }

  function syncError(e) {
    console.log("sync error");
    console.log(e);
  }


  


  this.createAnnotationsTrack = function(data, customHandler) {

    var validate = function() {
      if (!data.musicId)
        throw "[need:musicId]";
      if (!data.user)
        throw "[need:user]";
    };
    validate();

    var id = data._id || (('anntrack-' + (new Date().toISOString())).replace(/\./g,"-").replace(/:/g,"-") + PouchDB.utils.uuid());
    var handler = customHandler || this.annotationDB.updateHandler;
    var annTrack = {
      _id: id,
      title: data.title || ('Annotation ' + id),
      musicId: data.musicId,
      description: data.description || '',
      types: data.types || [],
      user: data.user,
      couchType: 'annotations-track'
    };
    this.annotationDB.db.put(annTrack, handler);
    return annTrack;
  }


  this.updateAnnotationsTrack = function(data, customHandler) {
    var db = this.annotationDB.db;
    var handler = customHandler || this.annotationDB.updateHandler;

    db.get(data._id, function(err, otherDoc) {
        otherDoc.title = data.title || otherDoc.title;
        otherDoc.types = data.types || otherDoc.types;
        otherDoc.description = data.description || otherDoc.description;
        db.put(
            otherDoc, handler
        );
    });
  }

  // TODO: remove all annotations under this track.
  this.removeAnnotationsTrack = function(annTrack, customHandler) {
    var db1 = this.annotationDB.db;
    var handler = customHandler || this.annotationsDB.removeHandler;

    db1.get(annId, function(err, ann) {
      if (!err) {
        db1.remove(ann, handler)
          .then(function(resp){
            db1.query(function(doc,emit){
                if(doc.trackId==annTrack._id) 
                    emit(doc);
            }).then( function(anns) {
                anns.rows.forEach(function(ann) {
                    ann = ann.key;
                    db1.remove(ann);
                });
            })
          });
      } else 
        throw err;
    });
  }

  
  this.getAllAnnotationsTracks = function(musicId, customHandler) {
    if (!customHandler)
      throw "[need:customHandler]";
    this.annotationsDB.db.query(function(doc,emit){
      if(doc.musicId==musicId && doc.user==username)
        emit(doc);
    }, customHandler);
  }


  /*
   * Annotations
   */


  this.createAnnotation = function(data, customHandler) {

    var validate = function() {
      if (!data.musicId)
        throw "[need:musicId]";
      if (!data.trackId)
        throw "[need:trackId]";
      if (!data.start)
        throw "[need:start]";
      if (!data.end)
        throw "[need:end]";
      if (!data.user)
        throw "[need:user]";
    };
    validate();

    var id = data._id || (('ann-' + (new Date().toISOString())).replace(/\./g,"-").replace(/:/g,"-") + PouchDB.utils.uuid());
    var handler = customHandler || this.annotationsDB.updateHandler;
    var ann = {
      _id: id,
      title: data.title || ("Annotation " + id),
      musicId: data.musicId,
      trackId: data.trackId, 
      description: data.description || '',
      types: data.types || [],
      start: data.start,
      end: data.end,
      color: data.color || 'grey',
      user: data.user,
      couchType: 'annotation'
    };
    this.annotationsDB.db.put(ann, handler);
    return ann;
  }


  this.updateAnnotation = function(data, customHandler) {
    var db = this.annotationsDB.db;
    var handler = customHandler || this.annotationsDB.updateHandler;

    db.get(data._id, function(err, otherDoc) {
        otherDoc.title = data.title || otherDoc.title;
        otherDoc.description = data.description || otherDoc.description;
        otherDoc.types = data.types || otherDoc.types;
        otherDoc.start = data.start || otherDoc.start;
        otherDoc.end = data.end || otherDoc.end;
        otherDoc.color = data.color || otherDoc.color;
        db.put(
            otherDoc, handler
        );
    });
  }


  this.removeAnnotation = function(annId, customHandler) {
    var db = this.annotationsDB.db;
    var handler = customHandler || this.annotationsDB.removeHandler;

    db.get(annId, function(err, ann) {
      if (!err) {
        db.remove(ann, handler);
      } else 
        throw err;
    });
  }


  this.getAllTrackAnnotations = function(trackId, customHandler) {
    if (!customHandler)
      throw "[need:customHandler]";
    this.annotationsDB.db.query(function(doc,emit){
      if(doc.trackId==trackId && doc.user==username)
        emit(doc);
    }, customHandler);
  }

  /*
   * ----------
   */


  this.clearLocal = function() {
    this.annotationsDB.db.destroy();
  }

}

DataServer.log = function log(title,x,y) { 
    console.log('');
    console.log('-----PouchDB-----');
    console.log('--'+title+'--');
    console.log(x); 
    console.log(y);
    console.log('-----------------');
    console.log('');
  }