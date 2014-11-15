/*
 * Requires fabric.js
 *
 * params.boardContainerId:
 * params.grid:
 * params.numColumns:
 *
 */
function AnnotationsBoardCtr(params) {

  var _master_container_dom_id = params.boardContainerId;
  var _grid = params.grid;
  var _numColumns = params.numColumns;
  var _width = params.width;
  var _annotationsTracks = {};
  var _counter = 0;
  var _duration = params.duration;
  var _trackWidth = params.width;
  var _musicId = params.musicId;
  var _dataServer = params.dataServer;

  this.init = function() {
    var db = _dataServer.annotationsTracks.db;

    db.query(function(doc,emit){
      if(doc.musicId==_musicId && doc.user==_dataServer.username) {
        emit(doc);
      }
    }).then( function(anntracks) {
      console.log('existing annotation tracks');
      anntracks.rows.forEach(function(anntrack) {

        anntrack = anntrack.key;

        drawAnnotationsTrackUI(anntrack);
        
      })
    }).catch( function(err) {
      console.log('err');
      console.log(err);
    });

  }

	this.addAnnotationsTrack = function(opts) {
		//var tid = 't' + _counter++;
    //var anntrack = _dataServer.setAnnotationsTrack({musicId:_musicId});
    var anntrack = _dataServer.createAnnotationsTrack({musicId:_musicId, user:_dataServer.username});

    drawAnnotationsTrackUI(anntrack);

    return anntrack._id;
	}

	this.setCursorsPosition = function(pos) {
		for (var k in _annotationsTracks) { _annotationsTracks[k].setCursorPosition(pos); }
	}

  this.toggleVisualGrid = function(tid) {
      _annotationsTracks[tid].toggleVisualGrid(tid);
  }

  this.editAnnotationsTrackDialog = function(tid) {
      _annotationsTracks[tid].openTrackInfoDialog();
  }

  this.removeAnnotationsTrack = function(tid) {
      _annotationsTracks[tid].delete();
      delete _annotationsTracks[tid];
  }

  this.scrollAnnotationsTracks = function(value) {
    for (var k in _annotationsTracks) { _annotationsTracks[k].scrollTo(value); };
  }

  /*
   * params.start
   * params.end 
   * params.color
   */
  this.addAnnotationToTrack = function(params) {
    //TODO
  }

  this.setAnnotationsTrackGrid = function(grid) {
    //TODO
  }

  /*
  this.getAnnotationsTrack = function(tid) {
      return _annotationsTracks[tid];
  }
  */

  function drawAnnotationsTrackUI(anntrack) {
    _annotationsTracks[anntrack._id] = new AnnotationsTrackCtr({
      tracksContainerId: _master_container_dom_id,
      trackId: anntrack._id,
      title: anntrack.title,
      description: anntrack.description,
      types: anntrack.types,
      duration: _duration,
      width: _width,
      musicId: _musicId,
      beatgrid: beatdata,
      dataServer: _dataServer,
      musicId: _musicId
    });

    _annotationsTracks[anntrack._id].init();
  }

  this.refreshAnnotationsTrack = function(atid) {
    _annotationsTracks[atid].refresh_canvas();
  }

  this.refreshAnnotation = function(ann) {
    _annotationsTracks[ann.trackId].refresh_annotation(ann);
  }
}