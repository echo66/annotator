    'use strict';

    var dataServer = new DataServer();

    var logging_details;

    var annBoard;
    var numColumns;
    var grid;
    var musicId;

    var fileurl;
    var wavesurfer;

    var context;
    var osc;
    var gain;

    var metronomeActive;

    $(function() {
        dataServer.init();
        dataServer.startShowHandlers();
        remainingStuff()
        //dataServer.login('echo11','bddias01',remainingStuff);
    })

    function remainingStuff(err,resp) {
        if (!err) {

            logging_details = {};
            logging_details.regions = {dragSelection: false};

            annBoard;
            numColumns = 23;
            grid = 40;
            musicId = 1;

            fileurl = "1.mp3";
            wavesurfer = Object.create(WaveSurfer);

            context = new AudioContext();
            osc = context.createOscillator();
            gain = context.createGain();
            osc.connect(gain);
            osc.frequency.value = 1000.0;
            osc.start(0);

            metronomeActive = true;


            $(function(){
                numColumns = beatdata.length;

                createWavesurferStuff();

                putBeatsOnWavesurfer();

                //grid = Math.abs(beatdata[0]-beatdata[1]);

                wavesurfer.on('region-dblclick',function(e){
                    annotationDialog(e.annotation.id);
                });

                wavesurfer.on('scroll',function(e){
                    annBoard.scrollAnnotationsTracks(e.target);
                });

                wavesurfer.on('ready',function(){
                    grid = wavesurfer.drawer.width / beatdata.length;

                    annBoard = new AnnotationsBoardCtr({
                        boardContainerId: "annotations-tracks-master-container",
                        grid: grid,
                        numColumns: numColumns,
                        duration: wavesurfer.getDuration(),
                        width: wavesurfer.drawer.width,
                        musicId: musicId,
                        dataServer: dataServer
                    });

                    annBoard.init();

                    wavesurfer.on('region-click',function(e){
                        console.log(e);
                    });

                    wavesurfer.on('region-created',function(e){

                        console.log('------');
                        console.log('region-created');
                        console.log(e);
                        console.log('------');

                    });

                    wavesurfer.on('region-update-end',function(e){

                        var new_start           =   e.start;
                        var new_end             =   e.end;
                        var aligned_new_start   =   align_time_to_grid(beatdata,e.start);
                        var aligned_new_end     =   align_time_to_grid(beatdata,e.end);

                        region_updated(e);

                        var trackId = $('#track-selector-list').val();
                        var savedTrackShown = trackId != -1;
                        if ( !e.annotation.id && savedTrackShown) {
                            //TODO
                        } else if (savedTrackShown) {
                            dataServer.annotations.db.get(e.annotation.id, function(err, ann) {
                                ann.start = aligned_new_start;
                                ann.end = aligned_new_end;
                                dataServer.annotations.db.put(
                                    ann
                                ).then(function(esp){
                                    annBoard.refreshAnnotation(ann);
                                });
                            });
                        }

                        
                    });

                    //wavesurfer.on('region-updated',region_updated);


                    function region_updated(e) {
                        // wavesurfer.un('region-updated',region_updated);

                        var new_start           =   e.start;
                        var new_end             =   e.end;
                        var aligned_new_start   =   align_time_to_grid(beatdata,e.start);
                        var aligned_new_end     =   align_time_to_grid(beatdata,e.end);
                        

                        if (logging_details.regions.dragSelection) {
                            console.log("----------");
                            console.log('region-updated');
                            console.log(e);
                            console.log("new start: " + new_start);
                            console.log("new end: " + new_end);
                            console.log("aligned new start: " + aligned_new_start);
                            console.log("aligned new end: " + aligned_new_end);
                            console.log("----------");
                        }

                        e.update({
                            start: aligned_new_start,
                            end: aligned_new_end
                        });

                        // wavesurfer.on('region-updated',region_updated);
                    }
                });
            });
        }
    }
    


    function toggleMetronome() {
        metronomeActive = !metronomeActive
    }


    function addTrack() {
        var tid = annBoard.addAnnotationsTrack();
    }


    function createWavesurferStuff() {

        var options = {
            audioContext  : context,
            container     : document.querySelector('#waveform'),
            waveColor     : 'violet',
            progressColor : 'purple',
            loaderColor   : 'purple',
            cursorColor   : 'navy',
            minPxPerSec   : 40,
            scrollParent  : true
        };

    /* Progress bar */
        (function () {
            var progressDiv = document.querySelector('#progress-bar');
            var progressBar = progressDiv.querySelector('.progress-bar');

            var showProgress = function (percent) {
                progressDiv.style.display = 'block';
                progressBar.style.width = percent + '%';
            };

            var hideProgress = function () {
                progressDiv.style.display = 'none';
            };

            wavesurfer.on('loading', showProgress);
            wavesurfer.on('ready', hideProgress);
            wavesurfer.on('destroy', hideProgress);
            wavesurfer.on('error', hideProgress);

            var eventHandlers = {
                'play': function () {
                    wavesurfer.playPause();
                },

                'back': function () {
                    wavesurfer.skipBackward();
                },

                'forth': function () {
                    wavesurfer.skipForward();
                },

                'toggle-mute': function () {
                    wavesurfer.toggleMute();
                },

                'toggle-region-creation-on-drag': function(e) {
                    if (e.srcElement.checked) {
                        wavesurfer.disableInteraction();
                        wavesurfer.enableDragSelection({
                            color: randomColor(0.5)
                        });
                    } else {
                        wavesurfer.disableDragSelection();
                        wavesurfer.enableInteraction();
                    }
                        
                },

                'clear-regions': function(e) {
                    var regions = wavesurfer.regions.list;
                    Object.keys(regions).forEach(function (rid) {
                        if(!rid)
                            return;
                        if (regions[rid].type!='beat-grid-marker')
                            regions[rid].remove();
                    });
                },

                'track-selected-to-sync': function(e) {
                    clearWavesurferSegments();
                    if ($(e.srcElement).val()==-1) 
                        return;
                    var annTrackId = $(e.srcElement).val();
                    loadAnnotationsOnWavesurfer(annTrackId);
                }
            };

        document.addEventListener('click', function (e) {
            var action = e.target.dataset && e.target.dataset.action;
            if (action && action in eventHandlers) {
                eventHandlers[action](e);
            }
        });

        }());

        wavesurfer.init(options);
        wavesurfer.load(fileurl);
        /*
        wavesurfer.enableDragSelection({
            color: randomColor(0.5)
        });
        */
    }

    function randomColor(alpha) {
        return 'rgba(' + [
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            alpha || 1
        ] + ')';
    }

    function putBeatsOnWavesurfer() {
        wavesurfer.on('ready', function () {
            for (var k in beatdata) {
                //console.log(beats.results.bindings[k].beatAt);
                var r = wavesurfer.addRegion({
                    color: 'rgba(255, 100, 0, 0.5)',
                    start: beatdata[k],
                    end: beatdata[k] + 0.025,
                    resize: false,
                    drag: false
                });
                r.type = 'beat-grid-marker';
                r.order = k;
            }
        });

        wavesurfer.on('seek',function(e){
            console.log(wavesurfer.getCurrentTime());
        });

        wavesurfer.on('region-in',function(e){
            
            // if (e.type=='beat-grid-marker' && metronomeActive)
            //     gain.connect(context.destination);
            

            //update cursor position in the board
            if (e.type=='beat-grid-marker')
                annBoard.setCursorsPosition(e.start);
        });

        wavesurfer.on('region-out',function(e){
            if (e.type=='beat-grid-marker')
                gain.disconnect();
        });

    }

    function nudgeBeatGrid (timevar) {
        //TODO
    }

    function populateBeatsTable(beats) {
        //TODO
    }

    function populateSongInfoPanel(info) {
        //TODO
    }

    /**
     *  {
     *      values:[lo,hi],
     *      indexes: [lo_i,hi_i]
     *  }
     */
    function getClosestValues(a, x) {
        var lo, hi;
        var lo_i, hi_i;
        for (var i = a.length; i--;) {
            if (a[i] <= x && (lo === undefined || lo < a[i])) {
                lo = a[i];
                lo_i = i;
            }
                
            if (a[i] >= x && (hi === undefined || hi > a[i])) {
                hi = a[i];
                hi_i = i;
            }
        };
        return { values:[lo, hi], indexes:[lo_i,hi_i]};
    }

    function align_time_to_grid(grid,time) {
        var r = getClosestValues(grid,time);
        var a = Math.abs(time-r.values[0]);
        var b = Math.abs(time-r.values[1]);

        if (a > b)
            return r.values[0];
        else 
            return r.values[1];
    }

    function repair_if_needed(grid, vals_indx, step) {
        if (vals_indx.values[0] && vals_indx.values[1]) {
            return vals_indx;
        } else if (vals_indx.values[0]==undefined) {
            var aux = {values:[0,0],indexes:[0,0]};
            aux.values[0] = vals_indx.values[1];
            aux.indexes[0] = vals_indx.indexes[1];
            aux.values[1] = grid[step];
            aux.indexes[1] = step;
            return aux;
        } else {
            /*
            TODO
            var aux = {values:[0,0],indexes:[0,0]};
            aux.values[0] = grid[grid.length-1-step];
            aux.indexes[0] = vals_indx.indexes[1];
            aux.values[1] = grid[step];
            aux.indexes[1] = step;
            */
        }

    }

    function clearWavesurferSegments() {
        var regions = wavesurfer.regions.list;
        Object.keys(regions).forEach(function (rid) {
            if(!rid)
                return;
            if (regions[rid].type!='beat-grid-marker')
                regions[rid].remove();
        });
    }

    function loadAnnotationsOnWavesurfer(annTrackId) {
        dataServer.annotations.db.query(function(doc,emit){
            if(doc.trackId==annTrackId)
                emit(doc);
        }).then( function(anns) {
            anns.rows.forEach(function(ann) {
                ann = ann.key;
                var r = wavesurfer.addRegion({
                    color: ann.color,
                    start: ann.start,
                    alpha: 0.5,
                    end: ann.end,
                    resize: true,
                    drag: true
                });
                r.annotation = {};
                r.annotation.id = ann._id;
                r.annotation.trackId = ann.trackId;
            });
        });
    }

    function mylog(x,y) {
        console.log(x);
        console.log(y);
    }