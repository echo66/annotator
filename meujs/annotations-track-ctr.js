/**
 * Requires: fabric.js
 * Requires jQuery
 * Requires PouchDB
 *
 */
function AnnotationsTrackCtr(params) {
    var _canvas;
    var _cursor;
    var _id = params.trackId;
    var _annotations = params.annotations || {}; //SEARCH FOR "ANNOTATION DATA" COMMENTS
    var _master_container_dom_id = params.tracksContainerId;
    var _height = 50;
    var _beatGridDrawn = false;
    var _track_data = {}; //SEARCH FOR "TRACK DATA" COMMENTS
    var _duration = params.duration;
    var _width = params.width;

    var _beatgrid = params.beatgrid;
    var _dataServer = params.dataServer;
    var _musicId = params.musicId;

    var _blockBeingEdited;


    this.init = function() {
        //TRACK DATA
        _track_data.title = "Track " + _id;
        _track_data.description = "";
        _track_data.types = [];

        var panelGroup = $("#"+_master_container_dom_id);

        var panel = $("<div>",{
            class:"panel panel-default",
            id:"annotations-track-panel-"+_id
        });
        var panelHeading = $("<div>",{
            class:"panel-heading"
        });
        var panelTitle = $("<h4>",{
            class:"panel-title"
        });
        var panelTitleLink = $("<a>",{
            'data-toggle':"collapse",
            href:"#annotations-track-container-collapse-"+_id,
            id:"annotations-track-title-"+_id
        });
        panelTitleLink.html("Track "+_id);

        var panelCollapse = $("<div>",{
            class:"panel-collapse collapse",
            id:"annotations-track-container-collapse-"+_id
        });
        var panelBody = $("<div>",{
            class:"panel-body",
            id:"annotations-track-container-body-"+_id,
            style:"overflow-x: auto;"
        });
        var trackCanvas = $("<canvas>",{
            id: "annotations-track-canvas-"+_id,
            class: "annotations-track-canvas"
        });

        panelTitle.append(panelTitleLink);
        panelHeading.append(panelTitle);
        panelBody.append(trackButtonsGroupHTML());
        panelBody.append(trackCanvas);
        panelGroup.append(panelBody);
        panelCollapse.append(panelBody);
        panel.append(panelHeading);
        panel.append(panelCollapse);
        panelGroup.append(panel);

        _canvas = new fabric.Canvas('annotations-track-canvas-'+_id, { selection: false, renderOnAddRemove: false });
        _canvas.setWidth(_width);
        _canvas.setHeight(_height);

        createBoardCursor();
        this.addCanvasEventHandlers();

        $('#track-selector-list').append('<option value="'+_id+'">'+_track_data.title+'</option>');

        loadAnnotations();

        var event = new CustomEvent('annotation-track:inited', { '_id': _id });

        document.dispatchEvent(event);
    }

    function loadAnnotations() {
        _dataServer.getAllTrackAnnotations(_id, function(err,anns) {
            anns.forEach(function(ann) {
                put_annotation_on_canvas(ann);
            });
            _canvas.renderAll();
        });
    }

    this.setGridStruct = function(newBeatGrid) {

        _beatgrid = newBeatGrid;
    }


    this.getSelectedAnnotations = function() {
        return _canvas.getActiveObject();

        //TODO: wat?
    }

    function trackButtonsGroupHTML() {

        var btsGroup = $("<div>", { class:"btn-group" });
        var bt1 = $("<button>",  {
            html: "Change Track Info",
            type: "button",
            class: "btn btn-default",
            onclick: "annBoard.editAnnotationsTrackDialog('"+_id+"')"
        });
        var bt2 = $("<button>",  {
            html: "Toggle Grid",
            type: "button",
            class: "btn btn-default",
            onclick: "annBoard.toggleVisualGrid('"+_id+"')"
        });
        var bt3 = $("<button>",  {
            html: "Delete",
            type: "button",
            class: "btn btn-default",
            onclick: "annBoard.removeAnnotationsTrack('"+_id+"')"
        });
        var bt4 = $("<button>",  {
            html: "Put on Waveform",
            type: "button",
            class: "btn btn-default",
        });

        btsGroup.append(bt1);
        btsGroup.append(bt2);
        btsGroup.append(bt3);
        btsGroup.append(bt4);
        return btsGroup;
    }


    function createBoardCursor() {
        _cursor = new fabric.Rect({
            left: 0, top: 0,
            width: grid, height: _height,
            fill: 'black', originX: 'left', originY: 'top',
            centeredRotation: true, lockScalingY: true,
            lockMovementY: true, lockRotation: true,
            type: 'cursor', selectable: false
        });
        _canvas.bringToFront(_cursor);
        _canvas.add(_cursor);
        _canvas.renderAll();
    }


    this.addCanvasEventHandlers = function() {

        var my = this;
        var id = _id;

        // snap to grid

        _canvas.on('object:moving', object_moving);


        _canvas.on('object:scaling', object_scaling);

        _canvas.on('mouse:up', function(options) {

            var shape = options.target;

            if (_blockBeingEdited) {
                _dataServer.updateAnnotation({
                    _id: shape.annotation.id,
                    start: canvas_coords_to_time(shape.left),
                    end: canvas_coords_to_time(shape.left + shape.getScaleX() * shape.originalState.width)
                }, mylog);
            }

            _blockBeingEdited = undefined;
        });

        _canvas.on('mouse:down', function (options) {

            // OPEN ANNOTATION INFO DIALOG
            if (options.e.shiftKey && options.target) {
                my.openAnnotationInfoDialog(options.target);
                return;
            }

            if (options.target) 
                _blockBeingEdited = options.target;


            /*
             * I need to comment this because of what seems to be a bug: 
             * when I click in the first beat, fabric.js always tells that I'm clicking in the cursor.
             * So, I commented this and made the cursor unclicable.
             */
            // if (options.target) return; 

            // Inspired on wavesurfer!
            var e = options.e;
            e.preventDefault();
            var cv_el = _canvas.getElement();
            var bbox = _canvas.getElement().getBoundingClientRect();
            var clickTime = canvas_coords_to_time(e.offsetX);
            var segmentBorders = getClosestValues(_beatgrid, clickTime);

            console.log("------------------------------");
            console.log("fabric.js - mouse:down");
            console.log(options);
            console.log(["offsetX (x): ", e.offsetX, "offsetY (y): ", e.offsetY]);
            console.log(["time: ", clickTime]);
            console.log(['segment start time: ', segmentBorders.values[0], 'segment end time: ', segmentBorders.values[1]])
            console.log(['segment start grid index: ', segmentBorders.indexes[0], 'segment end grid index: ', segmentBorders.indexes[1]])
            console.log("------------------------------");


            // ADD NEW ANNOTATION
            if (options.e.ctrlKey) {
                // var c1 = (segmentBorders.values[0] / _duration) * _width;
                // var d1 = (segmentBorders.values[1] / _duration) * _width - c1;
                var c1 = time_to_canvas_coords(segmentBorders.values[0]);
                var d1 = time_to_canvas_coords(segmentBorders.values[1]) - c1;
                console.log("segment start: " + c1);
                console.log("segment end: " + (c1+d1));

                if (c1 < 0) {
                    console.error("Tried to insert an annotation, in track "+id+", before time=0.");
                    return;
                }

                // ANNOTATION DATA
                var annData = {
                    color: randomColor(0.5), 
                    musicId: _musicId,
                    trackId: _id,
                    start: segmentBorders.values[0],
                    end: segmentBorders.values[1],
                    user: _dataServer.username
                };

                _dataServer.createAnnotation(annData,function (err,resp) {
                    if (!err) {
                        annData._id = resp.id
                        put_annotation_on_canvas(annData);
                        _canvas.renderAll();

                        var event = new CustomEvent('annotation-track:new-annotation', { 
                            '_id': _id, 
                            'annotation': annData
                        });

                        document.dispatchEvent(event);

                        console.log(annData);
                    }
                });

                
            }


            //TODO: process each type of click
        });

        document.addEventListener('keydown', function (e) {
            if (e.keyCode==46)
                my.getSelectedAnnotations();
        });
    }

    
    this.toggleVisualGrid = function() {

        if (!_beatGridDrawn) {

            for (var col = 0; col < _beatgrid.length; col++) {
                var X = time_to_canvas_coords(_beatgrid[col]);
                _canvas.add(new fabric.Line(
                    [ X, 0, X, _height/2],
                    { stroke: '#ccc', selectable: false, gridLine: true}
                ));
            }
            _canvas.renderAll();

            _beatGridDrawn = true;
        } else {

            var toRemove = [];
            //TODO: check if I need to be so cautious regarding indexes in the removal process.

            for (var k in _canvas.getObjects()) {
                if (_canvas.getObjects()[k].gridLine)
                    toRemove.push(_canvas.getObjects()[k]);
            }
            for (var k in toRemove) { toRemove[k].remove(); }
            _canvas.renderAll();

            _beatGridDrawn = false;
        }
    }


    this.setCursorPosition = function(time) {
        _cursor.set({
            left: time_to_canvas_coords(time)
        });
        _canvas.renderAll();
        _canvas.calcOffset();
        _cursor.setCoords();
    }

    this.setTitle = function(newTitle) {
        $("#annotations-track-title-"+_id).html(newTitle);
    }

    this.scrollTo = function(value) {
        //TODO: almost there but does not scroll until the end.
        var w = value.scrollWidth;
        var l = value.scrollLeft;
        var aux = $("#annotations-track-container-body-"+_id).first()[0].scrollWidth;
        $("#annotations-track-container-body-"+_id).first().scrollLeft(aux * l/w);
    }


    this.delete = function() {

        _dataServer.removeAnnotationsTrack(_id, function(err,resp){
            $("#annotations-track-panel-"+_id).remove();
            _canvas.clear();
            _canvas = undefined;
            var event = new CustomEvent('annotation-track:deleted', { '_id': _id });
            document.dispatchEvent(event);
        });
    }

    

    function log_fabricjs_canvas_event(title,options) {
        var shape = options.target;
        var realCurrentWidth = shape.getScaleX() * shape.originalState.width;
        var blockEndTime = _duration * (shape.left+realCurrentWidth) / _canvas.width;
        var alignedBlockEndTime = align_time_to_grid(_beatgrid, blockEndTime);
        var alignedScaleX = ((alignedBlockEndTime / _duration) * _canvas.width - shape.left) / shape.originalState.width;
        var alignedCurrentWidth = ((alignedBlockEndTime / _duration) * _canvas.width - shape.left);
        console.log('');
        console.log('-------------------');
        console.log(title);
        console.log(shape);
        console.log('currentWidth (blockEndTime inverted): ' + 
                        ((blockEndTime / _duration) * _canvas.width - shape.left)); // inverted
        console.log('currentWidth (alignedBlockEndTime inverted): ' +
                        ((alignedBlockEndTime / _duration) * _canvas.width - shape.left)); // inverted
        console.log('currentWidth: ' + shape.currentWidth);
        console.log('REAL CURRENT WIDTH: ' + realCurrentWidth);
        console.log('blockEndTime: ' + blockEndTime);
        console.log('alignedBlockEndTime: ' + alignedBlockEndTime);
        console.log('right: ' + (realCurrentWidth + shape.left));
        console.log('right time: ' + canvas_coords_to_time(realCurrentWidth + shape.left));
        console.log('left: ' + shape.left);
        console.log('left time: ' + canvas_coords_to_time(shape.left));
        console.log('current scaleX: ' + shape.getScaleX());
        console.log('alignedScaleX: ' + alignedScaleX);
        console.log('alignedCurrentWidth: ' + alignedCurrentWidth);
        console.log('-------------------');
        console.log('');
    }

    function time_to_canvas_coords(time) {
        var X = (time / _duration) * _canvas.width;
        return X;
    }

    function canvas_coords_to_time(X) {
        var clickTime = _duration * X / _canvas.getElement().width || 0;
        return clickTime;
    }



    //--------------
    //--------------
    //--------------
    //--------------



    //--------------
    //--------------
    //--------------
    //--------------
    

    this.refresh_canvas = function() {
        remove_all_annotations_on_canvas();
        _canvas.clear();
        _beatGridDrawn = false;
        //createBoardCursor();
        loadAnnotations();
    }


    this.refresh_annotation = function(ann) {
        var ann_on_canvas = search_annotation_on_canvas(ann._id);

        _canvas.off('object:moving', object_moving);
        _canvas.off('object:scaling',object_scaling);

        ann_on_canvas.set({
            left: time_to_canvas_coords(ann.start),
            width: time_to_canvas_coords(Math.abs(ann.end-ann.start)),
            color: ann.color
        });

        _canvas.renderAll();

        _canvas.on('object:moving', object_moving);
        _canvas.on('object:scaling',object_scaling);
    }


    function put_annotation_on_canvas(doc) {
        var r = new fabric.Rect({
            left: time_to_canvas_coords(doc.start),
            top: 0,
            width: time_to_canvas_coords(Math.abs(doc.end-doc.start)),
            height: 30,
            fill: doc.color || randomColor(1),
            originX: 'left',
            originY: 'top',
            centeredRotation: true,
            lockScalingY: true,
            lockMovementY: true, 
            lockRotation: true,
            hasBorders: true,
            stroke : 'black'
        });
        r.annotation = {id: doc._id, trackId: doc.trackId};
        _canvas.add(r);
        // _canvas.renderAll();
    }


    function search_annotation_on_canvas(aid) {
        var list = _canvas.getObjects();
        for (var i = 0; i < list.length; i++)
            if (list[i].type!='cursor' && list[i].annotation.id == aid)
                return list[i];
        return null;
    }

    function remove_all_annotations_on_canvas() {
        var objects = _canvas.getObjects();
        objects.forEach(function(object) {
            object.remove();
        });
    }


    function update_annotation_on_canvas(annEvent) {
        if (annEvent.deleted) {
            var ann = search_annotation_on_canvas(annEvent.id);
            ann.remove();
        }
        //TODO: remaining events
    }

    function object_scaling(options) {

        // log_fabricjs_canvas_event('fabric.js - object:scaling',options);

        // 
        // I'm calculating realCurrentWidth because, for some reason, shape.currentWidth doesn't 
        // update until some arbitrary number of mouse:move events were throw.
        //
        var shape = options.target;
        var realCurrentWidth = shape.getScaleX() * shape.originalState.width;
        var blockEndTime = canvas_coords_to_time(shape.left+realCurrentWidth);

        if (snapToGrid) 
            blockEndTime = align_time_to_grid(_beatgrid, blockEndTime);

        var alignedScaleX = ((blockEndTime / _duration) * _canvas.width - shape.left) / shape.originalState.width;
        var alignedCurrentWidth = ((blockEndTime / _duration) * _canvas.width - shape.left);
        
        if (alignedCurrentWidth<1 || isNaN(alignedCurrentWidth)) {
            console.log("REFUSED OBJECT SCALING");
            return;
        }

        // _dataServer.updateAnnotation({
        //     _id: shape.annotation.id,
        //     start: canvas_coords_to_time(shape.left),
        //     end: blockEndTime
        // }, function(err,resp) {
        //     if (!err) {
                

        //         var event = new CustomEvent('annotation-track:annotation-updated', { 'ann': resp });
        //         document.dispatchEvent(event);
        //     } else
        //         console.log(err);
        // });

        _canvas.off('object:scaling',object_scaling);
        _canvas.off('object:scaling',object_moving);

        shape.set({
            scaleX: alignedScaleX,
            strokeWidth: 1 / Math.round(alignedScaleX)
        });

        _canvas.renderAll();
        _canvas.calcOffset();
        _cursor.setCoords();

        _canvas.on('object:scaling',object_scaling);
        _canvas.on('object:moving',object_moving);

    }

    function object_moving(options) {      

        var shape = options.target;
        var startTime = canvas_coords_to_time(shape.left);
        var endTime = canvas_coords_to_time(shape.left + shape.currentWidth);
        
        if (snapToGrid) {
            startTime = align_time_to_grid(_beatgrid, startTime);
            endTime = align_time_to_grid(_beatgrid, endTime);
        }

        var alignedX = time_to_canvas_coords(startTime);
        

        // ANNOTATION DATA

        // _dataServer.updateAnnotation(
        //     {
        //         _id: shape.annotation.id, 
        //         start: startTime, 
        //         end: endTime
        //     },
        //     function(err,resp){
                

        //         var event = new CustomEvent('annotation-track:annotation-updated', { 'ann': resp });
        //         document.dispatchEvent(event);
        // });

        _canvas.off('object:moving',object_moving);
        _canvas.off('object:scaling',object_scaling);

        options.target.set({
            left: alignedX,
            top: 0
        });

        _canvas.calcOffset();
        _cursor.setCoords();

        _canvas.on('object:moving',object_moving);
        _canvas.on('object:scaling',object_scaling);
        
        console.log('-------------------');
        console.log('fabric.js - object:moving');
        console.log('original left: ' + options.target.left);
        console.log('aligned left: ' + time_to_canvas_coords(align_time_to_grid(_beatgrid, canvas_coords_to_time(options.target.left))));
        console.log('-------------------');
    }

}