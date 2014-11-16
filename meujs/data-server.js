'use strict';

function DataServer() {

  this.listeners = {}

  this.addEventListener = function(event,listener) {
    if (!this.listeners[event])
      this.listeners[event] = {};
    this.listeners[event][listener] = listener;
  }

  this.removeEventListener = function(event,listener) {
    if (this.listeners[event]) {
      delete this.listener[event][listener];
    }
  }

  this.login = function(username,password,callback) {
    this.username = "";
    function aux(err,resp) {
      DataServer.log('--PouchDB login default callback--', err, resp);
      if (!err)
        this.username = username;

      var event = new CustomEvent('data-server:login', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      callback(err,resp);
    };
    this.annotationDB.db.login(username, password, aux);
  }

  this.signUp = function(username,password,callback) {
    function aux(err,resp) {
      DataServer.log('--PouchDB signup default callback--', err, resp);

      var event = new CustomEvent('data-server:signup', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      callback(err,resp);
    };
    this.annotationDB.db.signUp(username, password, aux);
  }

  this.logout = function(callback) {
    function aux(err,resp) {
      this.username = "";
      DataServer.log('--PouchDB logout default callback--', err, resp);

      var event = new CustomEvent('data-server:logout', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      callback(err,resp);
    };
    this.annotationDB.db.logout(aux);
  }

  this.getSession = function(callback) {
    function aux(err,resp) {
      DataServer.log('--PouchDB getsession default callback--', err, resp);

      var event = new CustomEvent('data-server:getsession', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      callback(err,resp);
    };
    this.annotationDB.db.getSession(aux);
  }

  this.getUser = function(username) {
    function aux(err,resp) {
      DataServer.log('--PouchDB getuser default callback--', err, resp);

      var event = new CustomEvent('data-server:getuser', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      callback(err,resp);
    };
    this.annotationDB.db.getUser(username,aux);
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
      url: "http://localhost:5984/music-annotation",
      removeHandler: this.logRemove,
      showHandler: this.logShow, 
      updateHandler: this.logUpdate
    };

    PouchDB.plugin(List);
    
    this.annotationDB.db = new PouchDB(this.annotationDB.url);

    var event = new CustomEvent('data-server:init', {});
    document.dispatchEvent(event);
  }

  this.startSync = function() {
    console.log('syncing')
    
    var opts = {live: true};

    this.annotationDB.db.sync(this.annotations.url, opts, syncError);

    var event = new CustomEvent('data-server:start-sync', {});
    document.dispatchEvent(event);
  }

  function syncError(e) {
    console.log("sync error");
    console.log(e);
  }


  


  this.createAnnotationsTrack = function(data, customHandler) {

    var validate = function() {
      if (data.musicId == undefined)
        throw "[need:musicId]";
      if (data.user == undefined)
        throw "[need:user]";
    };
    validate();

    var id = data._id || (('anntrack-' + (new Date().toISOString())).replace(/\./g,"-").replace(/:/g,"-") + PouchDB.utils.uuid());
    var handler = customHandler || this.annotationDB.updateHandler;

    function aux(err,resp) {
      DataServer.log('--PouchDB createAnnotationsTrack default callback--', err, resp);

      var event = new CustomEvent('data-server:create-annotations-track', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,resp);
    };

    var annTrack = {
      _id: id,
      title: data.title || ('Annotation ' + id),
      musicId: data.musicId,
      description: data.description || '',
      types: data.types || [],
      user: data.user,
      couchType: 'annotations-track'
    };

    this.annotationDB.db.put(annTrack, aux);
    return annTrack;
  }


  this.updateAnnotationsTrack = function(data, customHandler) {
    var db = this.annotationDB.db;
    var handler = customHandler || this.annotationDB.updateHandler;

    function aux(err,resp) {
      DataServer.log('--PouchDB updateAnnotationsTrack default callback--', err, resp);

      var event = new CustomEvent('data-server:update-annotations-track', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,resp);
    };

    db.get(data._id, function(err, otherDoc) {
        otherDoc.title = data.title || otherDoc.title;
        otherDoc.types = data.types || otherDoc.types;
        otherDoc.description = data.description || otherDoc.description;
        db.put(
            otherDoc, aux
        );
    });
  }

  
  this.removeAnnotationsTrack = function(annTrack, customHandler) {
    var db1 = this.annotationDB.db;
    var handler = customHandler || this.annotationsDB.removeHandler;

    function aux(err,resp) {
      DataServer.log('--PouchDB removeAnnotationsTrack default callback--', err, resp);

      var event = new CustomEvent('data-server:remove-annotations-track', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,resp);

      var listURL = "projections/per_user_and_annotations_track/annotations";
      listURL = listURL + "?trackId="+annTrackId;

      db1.list("projections/per_user_and_annotations_track/annotations",function(e1,r1) {
        if (!e1) {
          r1.json.forEach(function(ann){
            db1.remove(ann, function(e2,r2) {
              if(!e2) {
                console.log("Removed annotation "+ann._idp+" associated with annotations track "+annTrack._id);
              } else 
                console.log("Error: could not remove annotation "+ann._idp+" associated with annotations track "+annTrack._id);
                console.log(e2);
            });
          });
        } else {
          console.log("Error: could not remove annotations associated with annotations track "+annTrack._id);
          console.log(e1);
        }
      });

      // TODO: remove all annotations under this track.
    };

    db1.get(annTrack._id,function(err,doc){
      db1.remove(doc,aux);
    });
  }

  
  this.getAllAnnotationsTracks = function(musicId, customHandler) {
    if (!customHandler)
      throw "[need:customHandler]";

    var listURL = "projections/per_user_and_music/annotations-tracks";
    listURL += "?musicId="+musicId;

    db.list(listURL, function(err,resp) {
      customHandler(err, (resp)?resp.json:undefined);
    });
  }


  /*
   * Annotations
   */


  this.createAnnotation = function(data, customHandler) {

    var validate = function() {
      if (data.musicId == undefined)
        throw "[need:musicId]";
      if (data.trackId == undefined)
        throw "[need:trackId]";
      if (data.start == undefined)
        throw "[need:start]";
      if (data.end == undefined)
        throw "[need:end]";
      if (data.user == undefined)
        throw "[need:user]";
    };
    validate();

    var id = data._id || (('ann-' + (new Date().toISOString())).replace(/\./g,"-").replace(/:/g,"-") + PouchDB.utils.uuid());
    var handler = customHandler || this.annotationsDB.updateHandler;

    function aux(err,resp) {
      DataServer.log('--PouchDB createAnnotation default callback--', err, resp);

      var event = new CustomEvent('data-server:create-annotations-track', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,resp);
    };

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
    this.annotationDB.db.put(ann, aux);
    return ann;
  }


  this.updateAnnotation = function(data, customHandler) {
    var db = this.annotationsDB.db;
    var handler = customHandler || this.annotationsDB.updateHandler;

    function aux(err,resp) {
      DataServer.log('--PouchDB updateAnnotation default callback--', err, resp);

      var event = new CustomEvent('data-server:update-annotations-track', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,resp);
    };

    db.get(data._id, function(err, otherDoc) {
        otherDoc.title = data.title || otherDoc.title;
        otherDoc.description = data.description || otherDoc.description;
        otherDoc.types = data.types || otherDoc.types;
        otherDoc.start = data.start || otherDoc.start;
        otherDoc.end = data.end || otherDoc.end;
        otherDoc.color = data.color || otherDoc.color;
        db.put(
            otherDoc, aux
        );
    });
  }


  this.removeAnnotation = function(annId, customHandler) {
    var db = this.annotationsDB.db;
    var handler = customHandler || this.annotationsDB.removeHandler;

    function aux(err,resp) {
      DataServer.log('--PouchDB removeAnnotation default callback--', err, resp);

      var event = new CustomEvent('data-server:remove-annotations-track', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,resp);
    };

    db.get(annId, function(err, ann) {
      if (!err) {
        db.remove(ann, aux);
      } else 
        throw err;
    });
  }


  this.getAllTrackAnnotations = function(trackId, customHandler) {
    if (!customHandler)
      throw "[need:customHandler]";


    var listURL = "projections/per_user_and_annotations_track/annotations-";
    listURL += "?trackId="+trackId;

    db.list(listURL, function(err,resp) {
      customHandler(err, (resp)?resp.json:undefined);
    });
  }

  /*
   * ----------
   */


  this.clearLocal = function() {
    this.annotationsDB.db.destroy();
  }

}

DataServer.log = function log(title,err,resp) { 
    console.log(' ');
    console.log(title);
    console.log('err');
    console.log(err); 
    console.log('resp');
    console.log(resp);
    console.log('-----------------');
    console.log(' ');
  }