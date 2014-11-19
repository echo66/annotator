'use strict';

WaveSurfer.WaveScrollbar = {
    defaultParams: {
        height: 100,
        cursorWidth: 1,
        cursorColor: '#ffea00',
        windowColor: 'rgba(59,105,22,0.4)',
    },
    init: function (params) {
        this.params = WaveSurfer.util.extend({}, this.defaultParams, params);

        this.wavesurfer = params.wavesurfer;

        if (!this.wavesurfer) {
            throw Error('No WaveSurfer intance provided');
        }

        this.container = 'string' == typeof params.container ?
            document.querySelector(params.container) : params.container;

        if (!this.container) {
            throw Error('No container for WaveScrollbar');
        }
        this.container = this.container.appendChild(document.createElement('div'))
        this.createElements();
        this.initEvents();
    },

    createElements: function () {
        this.style = this.wavesurfer.drawer.style;

        this.style(this.wavesurfer.drawer.wrapper, {
            'overflow-x': 'hidden'
        });

        this.style(this.container, {
            position: 'relative',
            cursor: 'move',
            '-webkit-touch-callout': 'none',
            '-webkit-user-select': 'none',
            '-khtml-user-select': 'none',
            '-moz-user-select': 'none',
            '-ms-user-select': 'none',
            'user-select': 'none',
            height: this.params.height + 'px'
        });

        this.ratio = this.wavesurfer.drawer.waveCc.canvas.offsetWidth / this.container.offsetWidth;

        var canvas = this.cloneCanvas(this.wavesurfer.drawer.waveCc.canvas);

        this.style(canvas, {
            height: this.params.height + 'px',
            width: '100%',
            position: 'relative',
            zIndex: 0
        });

        this.canvas = this.container.appendChild(canvas);

        this.cursor = this.container.appendChild(
            document.createElement('cursor')
        );

        this.cursor.className = 'wavesurfer-scroll-cursor';

        this.style(this.cursor, {
            top: "0px",
            left: "0px",
            width: this.params.cursorWidth + 'px',
            backgroundColor: this.params.cursorColor,
            position: 'absolute',
            height: this.params.height + 'px',
            zIndex: 5,
        });

        this.container.appendChild(this.cursor);

        this.window = this.container.appendChild(
            document.createElement('div')
        );

        this.window.className = 'wavesurfer-scroll-window';

        this.style(this.window, {
            top: "0px",
            left: "0px",
            width: this.wavesurfer.container.offsetWidth / this.ratio + 'px',
            backgroundColor: this.params.windowColor,
            position: 'absolute',
            height: this.params.height + 'px',
            zIndex: 4,
        });

        this.selection = this.container.appendChild(
            document.createElement('div')
        );

        this.style(this.selection, {
            top: "0px",
            left: "0px",
            width: '0px',
            backgroundColor: this.wavesurfer.params.selectionColor,
            position: 'absolute',
            height: this.params.height + 'px',
            zIndex: 3,
        });
    },

    initEvents: function () {
        var pan = {};
        var my = this;

        function onMouseDown(e) {
            pan.active = true;
            pan.last = my.getX(e);
        }

        this.container.addEventListener('mousedown', function (e) {
            my.wavesurfer.seekAndCenter(my.getX(e) / my.container.offsetWidth);
            pan.isWindow = false;
            onMouseDown(e);
        });

        this.window.addEventListener('mousedown', function (e) {
            pan.isWindow = true;
            onMouseDown(e);
            e.stopPropagation();
        });

        document.addEventListener('mouseup', function (e) {
            pan.active = false;
        });

        this.container.addEventListener('mousemove', WaveSurfer.util.throttle(function (e) {
            e.stopPropagation();
            if (pan.active) {               

                if (pan.isWindow) {
                    my.wavesurfer.drawer.wrapper.scrollLeft += (my.getX(e) - pan.last) * my.ratio;
                 } else {
                    my.wavesurfer.seekAndCenter(my.getX(e) / my.container.offsetWidth);
                 }                
                pan.last = my.getX(e);
            }
        }, 30));

        this.wavesurfer.drawer.wrapper.onscroll = function (e) {
            var scroll = e.target.scrollLeft;
            var pos = scroll / my.ratio;
            if (pos < 0) {
                pos = 0;
            } else if (pos > (my.container.offsetWidth - my.window.offsetWidth)) {
                pos = my.container.offsetWidth - my.window.offsetWidth;
            }
            my.window.style.left = pos + 'px';
        };

        this.wavesurfer.on('progress', function (progress) {
            var cursorPosition = progress * my.container.offsetWidth;
            if (cursorPosition < 0) {
                cursorPosition = 0;
            }
            my.cursor.style.left = cursorPosition + 'px';
        });

        this.wavesurfer.on('selection-update', function (selection) {
            if (selection !== null) {
                my.selection.style.left = selection.startPercentage * my.container.offsetWidth + 'px';
                my.selection.style.width = selection.endPercentage *
                    my.container.offsetWidth - selection.startPercentage * my.container.offsetWidth + 'px';
            } else {
                my.selection.style.width = 0;
            }
        });

        this.wavesurfer.on('region-created', function (region) {
            var regionEl = my.container.appendChild(
                document.createElement('region')
            );
            regionEl.id = region.id + "-small";
            my.updateRegion(region);
        });

        this.wavesurfer.on('region-updated', function (region) {
            my.updateRegion(region);
        });

        this.wavesurfer.on('region-removed', function (region) {
            var regionEl = document.getElementById(region.id + "-small");
            if (regionEl) {
                my.container.removeChild(regionEl);
            }
        });

        this.wavesurfer.on('marked', function (mark) {
            var markEl = my.container.appendChild(
                document.createElement('mark')
            );
            markEl.id = mark.id + "-small";
            my.updateMark(mark);
        });

        this.wavesurfer.on('mark-updated', function (mark) {
            my.updateMark(mark);
        });

        this.wavesurfer.on('mark-removed', function (mark) {
            var markEl = document.getElementById(mark.id + "-small");
            if (markEl) {
                my.container.removeChild(markEl);
            }
        });

    },

    updateRegion: function (region) {
        var my = this;
        var regionEl = document.getElementById(region.id + "-small");
        var left = Math.max(0, Math.round(
            (region.startPosition / this.wavesurfer.getDuration()) * my.container.offsetWidth));
        var width = Math.max(0, Math.round(
            (region.endPosition / this.wavesurfer.getDuration()) * my.container.offsetWidth)) - left;

        this.style(regionEl, {
            height: '100%',
            position: 'absolute',
            zIndex: 4,
            left: left + 'px',
            width: width + 'px',
            backgroundColor: region.color,
            top: '0px',
        });
    },

    updateMark: function (mark) {
        var my = this;
        var markEl = document.getElementById(mark.id + "-small");
        this.style(markEl, {
            height: '100%',
            top: '0px',
            position: 'absolute',
            zIndex: 4,
            width: mark.width + 'px',
            left: Math.max(0, Math.round(
                mark.percentage * my.container.offsetWidth - mark.width / 2
            )) + 'px',
            backgroundColor: mark.color
        });
    },

    cloneCanvas: function (oldCanvas) {
        var newCanvas = document.createElement('canvas');
        var context = newCanvas.getContext('2d');
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;
        context.drawImage(oldCanvas, 0, 0);
        return newCanvas;
    },

    getX: function (e) {
        return e.clientX - this.container.getBoundingClientRect().left;
    },

    destroy: function () {
        if (typeof this.container !== 'undefined') {
            this.container.removeChild(this.canvas);
            this.container.removeChild(this.cursor);
            this.container.removeChild(this.window);
            this.container.removeChild(this.selection);
            this.container.remove();
        }
    },
};