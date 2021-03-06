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

    init_info(this.annotationDB.db, function(x,y){struct1.showHandler(y,x);}, "annotationDB.db.info!");
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

    var my = this;
    this.getSession(function(err,resp){
      if (resp.userCtx.name)
        my.username = resp.userCtx.name;
    })

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


  this.getUsername = function() {
    return this.username;
  }

  this.login = function(username,password,customHandler) {
    this.username = undefined;
    var my = this;
    function aux(err,resp) {
      DataServer.log('--PouchDB login default callback--', err, resp);
      if (!err)
        my.username = username;

      var event = new CustomEvent('data-server:login', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);
      
      if (customHandler)
        customHandler(err,resp);
    };
    this.annotationDB.db.login(username, password, aux);
  }

  this.signUp = function(username,password,customHandler) {
    function aux(err,resp) {
      DataServer.log('--PouchDB signup default callback--', err, resp);

      var event = new CustomEvent('data-server:signup', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      if (customHandler)
        customHandler(err,resp);
    };
    this.annotationDB.db.signUp(username, password, aux);
  }

  this.logout = function(customHandler) {
    var my = this;
    function aux(err,resp) {
      my.username = undefined;
      DataServer.log('--PouchDB logout default callback--', err, resp);

      var event = new CustomEvent('data-server:logout', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      if (customHandler)
        customHandler(err,resp);
    };
    this.annotationDB.db.logout(aux);
  }

  this.getSession = function(customHandler) {
    function aux(err,resp) {
      DataServer.log('--PouchDB getsession default callback--', err, resp);

      var event = new CustomEvent('data-server:getsession', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      if (customHandler)
        customHandler(err,resp);
    };
    this.annotationDB.db.getSession(aux);
  }

  this.getUser = function(username,customHandler) {
    function aux(err,resp) {
      DataServer.log('--PouchDB getuser default callback--', err, resp);

      var event = new CustomEvent('data-server:getuser', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      if (customHandler)
        customHandler(err,resp);
    };
    this.annotationDB.db.getUser(username,aux);
  }


  this.createAnnotationsTrack = function(data, customHandler) {

    var validate = function() {
      if (data.musicId == undefined)
        throw "[need:musicId]";
      if (data.user == undefined)
        throw "[need:user]";
    };
    validate();

    var id = data._id || (('ann-track-' + (new Date().toISOString())).replace(/\./g,"-").replace(/:/g,"-") + PouchDB.utils.uuid());
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
      couchTypes: ['annotations-track']
    };

    this.annotationDB.db.put(annTrack, aux);
    return annTrack;
  }


  this.updateAnnotationsTrack = function(data, customHandler) {
    var db = this.annotationDB.db;
    var handler = customHandler || this.annotationDB.updateHandler;
    var doc;

    function aux(err,resp) {
      DataServer.log('--PouchDB updateAnnotationsTrack default callback--', err, resp);

      var event = new CustomEvent('data-server:update-annotations-track', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,doc);
    };

    db.get(data._id, function(err, otherDoc) {
        otherDoc.title = data.title || otherDoc.title;
        otherDoc.types = data.types || otherDoc.types;
        otherDoc.description = data.description || otherDoc.description;
        doc = otherDoc;
        db.put(
            otherDoc, aux
        );
    });
  }

  
  this.removeAnnotationsTrack = function(annTrackId, customHandler) {
    var db1 = this.annotationDB.db;
    var handler = customHandler || this.annotationDB.removeHandler;

    db1.get(annTrackId,function(err,annTrack){
      db1.remove(annTrack, function (err,resp) {
        DataServer.log('--PouchDB removeAnnotationsTrack default callback--', err, resp);

        var event = new CustomEvent('data-server:remove-annotations-track', { 'err': err, 'resp': resp });
        document.dispatchEvent(event);

        var listURL = "projections/per_user_and_annotations_track/annotations";
        listURL = listURL + "?trackId="+annTrack._id;

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

        handler(err,resp);

      });
    });
  }

  
  this.getAllAnnotationsTracks = function(musicId, customHandler) {
    if (!customHandler)
      throw "[need:customHandler]";

    var listURL = "projections/per_user_and_music/annotations-tracks";
    listURL += "?musicId="+musicId;

    this.annotationDB.db.list(listURL, function(err,resp) {
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
    var handler = customHandler || this.annotationDB.updateHandler;

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
      couchTypes: ['annotation']
    };
    this.annotationDB.db.put(ann, aux);
    return ann;
  }


  this.updateAnnotation = function(data, customHandler) {
    var db = this.annotationDB.db;
    var handler = customHandler || this.annotationDB.updateHandler;
    var doc;

    function aux(err,resp) {
      DataServer.log('--PouchDB updateAnnotation default callback--', err, resp);

      var event = new CustomEvent('data-server:update-annotations-track', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,doc);
    };

    db.get(data._id, function(err, otherDoc) {
        otherDoc.title = data.title || otherDoc.title;
        otherDoc.description = data.description || otherDoc.description;
        otherDoc.types = data.types || otherDoc.types;
        otherDoc.start = data.start || otherDoc.start;
        otherDoc.end = data.end || otherDoc.end;
        otherDoc.color = data.color || otherDoc.color;
        doc = otherDoc;
        db.put(
            otherDoc, {include_docs:true}, aux
        );
    });
  }


  this.removeAnnotation = function(annId, customHandler) {
    var db = this.annotationDB.db;
    var handler = customHandler || this.annotationDB.removeHandler;

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


    var listURL = "projections/per_user_and_annotations_track/annotations";
    listURL += "?trackId="+trackId;

    this.annotationDB.db.list(listURL, function(err,resp) {
      customHandler(err, (resp)?resp.json:undefined);
    });
  }

  /*
   * ----------
   */

  /*
   * Annotations Relations
   */

  this.createAnnotationsRelation = function(data,annsIds,customHandler) {
    var id = data._id || (('ann-rel-' + (new Date().toISOString())).replace(/\./g,"-").replace(/:/g,"-") + PouchDB.utils.uuid());

    if (annsIds==undefined || annsIds.length==0)
      throw "[need:annsIds]";
    if (data.type==undefined)
      throw "[need:type]";

    var handler = customHandler || this.annotationDB.updateHandler;

    function aux(err,resp) {
      DataServer.log('--PouchDB createAnnotationsRelation default callback--', err, resp);

      var event = new CustomEvent('data-server:create-annotations-relation', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,resp);
    };

    var rel = {};
    for (key in data) {
      rel[key] = data[key];
    }
    rel.connects = annsIds;
    rel.couchTypes = ['annotation-relation'];
    
    this.annotationDB.db.put(rel, aux);
    return rel;
  }

  this.removeAnnotationsRelation = function(relId,customHandler) {
    var db = this.annotationDB.db;
    var handler = customHandler || this.annotationDB.removeHandler;

    function aux(err,resp) {
      DataServer.log('--PouchDB removeAnnotationsRelation default callback--', err, resp);

      var event = new CustomEvent('data-server:remove-annotations-relation', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,resp);
    };

    db.get(relId, function(err, rel) {
      if (!err) {
        db.remove(rel, aux);
      } else 
        throw err;
    });
  }

  /*
   * Concepts
   */
  this.createConcept = function(data,customHandler) {
    var id = data._id || (('concept-' + (new Date().toISOString())).replace(/\./g,"-").replace(/:/g,"-") + PouchDB.utils.uuid());

    var handler = customHandler || this.annotationDB.updateHandler;

    function aux(err,resp) {
      DataServer.log('--PouchDB createConcept default callback--', err, resp);

      var event = new CustomEvent('data-server:create-concept', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,resp);
    };

    var concept = {
      title: data.title,
      description: data.description,
      user: this.getUsername(),
      subtypes: data.subtypes,
      supertypes: data.supertypes,
      couchTypes: ['concept']
    };
    
    this.annotationDB.db.put(concept, aux);
    return concept;
  }


  /*
   * Feedback
   */

  this.createFeedback = function(data, types, customHandler) {
    var id = data._id || (('feedback-' + (new Date().toISOString())).replace(/\./g,"-").replace(/:/g,"-") + PouchDB.utils.uuid());
    var handler = customHandler || this.annotationDB.updateHandler;

    function aux(err,resp) {
      DataServer.log('--PouchDB createFeedback default callback--', err, resp);

      var event = new CustomEvent('data-server:create-feedback', { 'err': err, 'resp': resp });
      document.dispatchEvent(event);

      handler(err,resp);
    };

    var feedback = {
      _id: id,
      user: this.getUsername(),
      content: data.content, 
      title: data.title || '',
      responseTo: data.responseTo, // other feedback ID
      relatedTo: data.relatedTo,
      couchTypes: ['feedback'].push(types)
    };

    this.annotationDB.db.put(ann, aux);
    return ann;
  }




  this.clearLocal = function() {
    this.annotationDB.db.destroy();
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