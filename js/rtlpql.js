////////////////////////////////////////////////////////////
// rtlpql // rtl_power Quick Look  // (c) John Penny 2022
////////////////////////////////////////////////////////////

// IDEAS
// save to img (canvas and frequency bar)
// remote CSV files via URI
// allow creating and saving configs to localdata
// allow config from query string for users who want to use online, not locally
// One shot worker mode for parse/render to avoid blocking operations

////////////////////////////////////////////////////////////

// KNOWN ISSUES TO FIX
// Touch dragging on the sampler is not yet implemented
// If the sampler box exits the scrollbox, the scrollbox does not move with it
// If the scan is short or shallow the sampler does not resize to function correctly
// If the scan has very small bins, the bin data canvas will not be readable

////////////////////////////////////////////////////////////

// README Don't edit this file unless making changes not available in the config file /config/rtlpql_config.js
var rtlpql = (function() {
    'use strict';
    
    const dom = {
        doc: document,
        body: document.body,
        app: {
            dropboxMaster: document.getElementById('dropbox-master'),
            dropboxMasterChooser: document.querySelector('#dropbox-master>.chooser'),
            dropboxes: document.getElementById('dropbox-container'),

            loupe: document.getElementById('scan-loupe'),
            loupeMousebox: document.getElementById('scan-loupe-mousebox'),
            loupeMouseboxSampler: document.getElementById('scan-loupe-sampler'),
            loupeData: document.getElementById('scan-loupe-data'),

            scan: document.getElementById('scan-container'),
            scanMousebox: document.getElementById('scan-canvas-mousebox'),
            scanMouseboxSampler: document.getElementById('scan-canvas-sampler'),
            scanScrollbox: document.getElementById('scan-scrollbox'),
            scanZoombox: document.getElementById('scan-zoombox'),
            scanZoom: document.getElementById('scan-zoomer'),

            colour: document.getElementById('colour'),
        },
        ctl: {
            floorPlus: document.getElementById('ctl-fp'),
            floorMinus: document.getElementById('ctl-fm'),
            ceilPlus: document.getElementById('ctl-cp'),
            ceilMinus: document.getElementById('ctl-cm'),
            zoomPlus: document.getElementById('ctl-zp'),
            zoomMinus: document.getElementById('ctl-zm'),
            fullscreen: document.getElementById('ctl-f'),
            rerender: document.getElementById('ctl-rr'),
            discardFloor: document.getElementById('ctl-if'),
            dontClear: document.getElementById('ctl-dc'),
        },
        var: {
            dBFloor: document.getElementById('var-fi'),
            dBCeil: document.getElementById('var-ci'),
            zoom: document.getElementById('var-zi'),
        },
        ckey: {
            floor: document.getElementById('ckey-f'),
            ceil: document.getElementById('ckey-c'),
            nan: document.getElementById('ckey-n'),
            power: document.getElementById('ckey-p'),
        },
        canvas: {
            loupe: document.getElementById('scan-loupe-canvas'),
            scan: document.getElementById('scan-canvas'),
            frequency: document.getElementById('scan-frequency-canvas'),
        },
        ribbon: {
            readme: document.getElementById('readme-ribbon'),
            info: document.getElementById('info-ribbon'),
            data: document.getElementById('data-ribbon'),
            colourKeys: document.getElementById('key-ribbon'),
            controls: document.getElementById('control-ribbon'),
        },
        alert: {
            p0: document.getElementById('console-p0'),
            p1: document.getElementById('console-p1'),
            p2: document.getElementById('console-p2'),
        },
    };

    const appStates = {
        run: 'run',
        waiting: 'waiting',
        parsing: 'parsing',
        rendering: 'rendering',
    }
    
    let app = {
        state: undefined,
        lastState: undefined,
        
        verboseLogging: false,
        
        dpr: window.devicePixelRatio, // device pixel ratio for cleaner rendering

        upscalePixelated: true,
        upscalePixelatedRootClass: 'upscalepixelated',

        connectedLAN: false,
        connectedLANRootClass: 'online',

        useIcons: true,
        iconRootClass: 'usingicons',
        iconClass: 'material-symbols-rounded',
        iconAttr: 'data-icon',

        animationFrameID: undefined, // allows cancellation of async animation frame calls
        ctlIntervalID: undefined, // allows repeating button input
        ctlInterval: 50, // interval time in ms
    }

    let control = {
        floorPlus: 'x',
        floorMinus: 'z',
        ceilPlus: 's',
        ceilMinus: 'a',
        zoomPlus: 'w',
        zoomMinus: 'q',
        rerender: 'Enter',
        fullscreen: 'f',
        discardFloor: 'i',
        dontClear: 'c',
    }

    const controlHints = {
        floorPlus: `Floor + (${control.floorPlus})`,
        floorMinus: `Floor - (${control.floorMinus})`,
        ceilPlus: `Ceil + (${control.ceilPlus})`,
        ceilMinus: `Ceil - (${control.ceilMinus})`,
        zoomPlus: `Zoom + (${control.zoomPlus}) || scroll wheel`,
        zoomMinus: `Zoom - (${control.zoomMinus}) || scroll wheel`,
        rerender: `Rerender (${control.rerender})`,
        fullscreen: `Fullscreeen (${control.fullscreen})`,
        discardFloor: `Discard < Floor on/off (${control.discardFloor})`,
        dontClear: `Don't clear rerender on/off (${control.dontClear})`,
    }

    let colour = {
        background: 'black',
        nan: 'magenta',
        ceil: 'white',
        floor: 'blue',
        power: 'yellow',
        powerTint: 'rgb(0, 0, 50)',
    }

    let scan = {
        sweeps: [[]],

        binMetaCount: 6,
        nan: 'nan',

        dBMin: 999, // 999
        dBMax: -999, // -999

        sweepBinCount: undefined,
        
        binFreqRange: undefined,
        binDataCount: undefined,
        binDataFreqStep: undefined,
        binDataAveragingSamples: undefined,

        firstSweepTime: undefined,
        lastSweepTime: undefined,
        firstSweepDate: undefined,
        lastSweepDate: undefined,

        sweepStartFreq: undefined,
        sweepEndFreq: undefined,

        fileName: undefined,
    };

    let render = {
        loupe: dom.canvas.loupe.getContext('2d'),
        scan: dom.canvas.scan.getContext('2d'),
        frequency: dom.canvas.frequency.getContext('2d'),

        sweepHead: 0,
        pixelHead: 0,
        csvRowHead: 0,
        discardFloor: false,
        dontClear: false,
        byrow: false,
        zoom: 1,
        zoomStep: 0.1,
        samplerWidth: 15,
        samplerHeight: 10,
        samplerMagnification: 20,
        dBStep: 0.1,
        
        pixelCount: 0,
        width: undefined,
        height: undefined,

        dBFloor: undefined,
        dBCeil: undefined,
    };

    // PUBLIC

    function run(configs)
    {
        _updateAppState(appStates.run);
        _checkLAN();
        _initIcons();
        _prepareConfigs(configs);
        _setUpEvents();
    }

    function parsedRow(result)
    {
        // papa parse will parse empty rows, so they must be handled too
        if (result.data[0] === '' && result.data.length < 2)
        {
            if (app.verboseLogging) console.log("empty row found : parsedRow");
            return;
        }

        if (app.verboseLogging) console.log("a row was parsed : parsedRow");

        // gather all values available on the first run
        if (!scan.firstSweepDate)
        {
            scan.firstSweepDate = result.data[0];
            scan.firstSweepTime = result.data[1];
            scan.sweepStartFreq = result.data[2];
            scan.binDataFreqStep = result.data[4];
            scan.binFreqRange = result.data[3] - result.data[2];
            // NOTE the the CSV files contain extra data that we must ignore - I don't know why
            // in that light we must calculate the correct data count via frequency step
            scan.binDataCount = Math.round(scan.binFreqRange / scan.binDataFreqStep);
            scan.binDataAveragingSamples = result.data[5];
        }
        
        // search for the end of the first full scan sweep, to handle multi sweep files
        if (!scan.sweepBinCount && scan.firstSweepTime != result.data[1])
        {
            // the scan row size is where the head is now (pre increment)
            scan.sweepBinCount = render.csvRowHead;
            // handle the first scan sweep, then continue on with this one
            scanSweepEnded();
        }

        // poll the dB min max, and transform NaN values
        for (let i = 0; i < scan.binDataCount; i++)
        {
            // correct for leading meta cells
            const j = scan.binMetaCount + i;

            // transform nan string to NaN
            if (result.data[j].trim().toUpperCase() === scan.nan.trim().toUpperCase()) {
                result.data[j] = NaN;
                continue; // skip dB min-maxing on NaN
            }

            // poll min max as we go
            if (result.data[j] < Number(scan.dBMin)) scan.dBMin = result.data[j];
            if (result.data[j] > Number(scan.dBMax)) scan.dBMax = result.data[j];
        }

        // add raw parsed data to our dataset
        scan.sweeps[render.sweepHead].push(result.data);

        // increment the CSV head
        render.csvRowHead++;
    
        // check if a scan sweep has ended
        if (scan.sweepBinCount && (render.csvRowHead) % scan.sweepBinCount == 0) scanSweepEnded();
    
        ////

        function scanSweepEnded() {
            // push a new scan sweep array
            scan.sweeps.push([]);

            // increment the sweep head
            render.sweepHead++;
        }
    }

    function parsed()
    {
        if (app.verboseLogging) console.log("parsing finished : parsed");
    
        // data correction
        if (scan.sweepBinCount)
        {
            // parser prepares an empty scan sweep array at the end of each sweep
            scan.sweeps.pop(); // not needed
        }
        else
        {
            // we did not gather the bin data or end a sweep during parsing, as there was only one sweep
            scan.sweepBinCount = scan.sweeps[0].length;
        }

        // gather the values available on the last run
        scan.lastSweepDate = scan.sweeps[scan.sweeps.length - 1][scan.sweepBinCount - 1][0];
        scan.lastSweepTime = scan.sweeps[scan.sweeps.length - 1][scan.sweepBinCount - 1][1];
        scan.sweepEndFreq = scan.sweeps[scan.sweeps.length - 1][scan.sweepBinCount - 1][3];

        // assign dB min max to the mutible render vars
        if(!render.dBFloor) render.dBFloor = scan.dBMin;
        if(!render.dBCeil) render.dBCeil = scan.dBMax;
        
        // begin rendering
        _renderScan();
    }

    function rendering(row = 0, bin = 0, col = 0)
    {
        if (row + bin + col === 0) render.pixelHead = 0; // new render

        const o = render.byrow;
        const s = render.scan;
        const w = render.width;
        const pc = render.pixelCount;
        const dc = scan.binDataCount;
        const bc = scan.sweepBinCount;

        const ss = parseInt(dom.app.scanMouseboxSampler.style.top)
        const se = ss + parseInt(dom.app.scanMouseboxSampler.style.height)

        while (render.pixelHead < pc)
        {
            // render a pixel, note we must ignore the meta data
            _renderScanPixel(s, render.pixelHead - (w * row), row, scan.sweeps[row][bin][col + scan.binMetaCount]);
            col++; // col == pixel
            
            // check for end of bin
            if (col === dc)
            {
                bin++;
                col = 0;
            }
            
            // check for end of row
            if (bin === bc)
            {
                row++;
                bin = 0;

                if (o) return continueRenderOnCallback();
            }
        }

        console.log(`Rendering has finished. Pixels processed: ${render.pixelHead}  Pixels expected: ${render.pixelCount}`);

        ////

        function continueRenderOnCallback()
        {
            if (row > ss && row <= se) _sampleScanCanvas(); // update the loupe as we go
            app.animationFrameID = window.requestAnimationFrame(function ()
            {
                rtlpql.rendering(row, bin, col);
            });
        }
    }

    // PRIVATE

    function _checkLAN()
    {
        app.connectedLAN = window.navigator.onLine;
        if (app.connectedLAN) dom.body.classList.add(app.connectedLANRootClass);
        // this is not foolproof, as it will still try to fetch assets when LAN is connected, but WAN is not.
    }

    function _postRenderSetUp()
    {
        
        _setUpMouseboxSampler(dom.app.scanMousebox, dom.app.scanMouseboxSampler, dom.canvas.scan, render.samplerWidth, render.samplerHeight, _sampleScanCanvas, false, true);
        _sampleScanCanvas(); // init
        
        _setUpMouseboxSampler(dom.app.loupeMousebox, dom.app.loupeMouseboxSampler, dom.canvas.loupe, render.samplerMagnification, render.samplerMagnification, _sampleLoupeCanvas, true, false);
        _sampleLoupeCanvas(); // init
        
        _setUpUI();
        _setUpScanFrequency();

        _setUpZoomBox(); // must run last
    }

    function _renderScan()
    {
        if (app.upscalePixelated) dom.body.classList.add(app.upscalePixelatedRootClass);
        _updateAppState(appStates.rendering);
        _setUpScan();
        rendering();
        _postRenderSetUp();
    }
    
    function _rerenderScan()
    {
        window.cancelAnimationFrame(app.animationFrameID);
        if (!render.dontClear) _fillCanvas(render.scan, colour.background);
        rendering();
        _sampleScanCanvas();
        _sampleLoupeCanvas();
    }
    
    function _renderScanPixel(canvasContext, x, y, n)
    {
        render.pixelHead++;
        let c = _dBToColour(n); // obtain the colour
        if (c === 'discard') return; // do not render discarded pixels
        canvasContext.fillStyle = c;
        canvasContext.fillRect(x, y, 1, 1); // draw a single pixel
    }

    function _parse(file)
    {
        _updateAppState(appStates.parsing);
        Papa.parse(file, papaParseConfig); // calls back - see papaParseConfig
    }

    function _prepareConfigs(configs)
    {
        if (configs) {
            for (const [key, value] of Object.entries(configs)) {
                const dropbox = dom.app.dropboxMaster.cloneNode(true);
                const chooser = dropbox.querySelector(':scope > .chooser');
                dropbox.querySelector(':scope > .label').innerHTML = key;
                dom.app.dropboxes.appendChild(dropbox);
                addListeners(dropbox, chooser, value);
            }
        }

        addListeners(dom.app.dropboxMaster, dom.app.dropboxMasterChooser);
        
        _updateAppState(appStates.waiting);

        function addListeners(dropbox, chooser, config = undefined) {
            dropbox.addEventListener('click', (event) => {
                chooser.click();
            }, false);

            chooser.addEventListener('change', (event) => {
                _handleCSVFile(chooser.files[0], config);
            }, false);

            dropbox.addEventListener('drop', (event) => {
                event.preventDefault(); // prevent built in browser handlers
                dropbox.classList.remove('drophover');
                _handleCSVDropped(event, config);
            }, false);

            dropbox.addEventListener('dragover', (event) => {
                event.preventDefault(); // prevent built in browser handlers
                dropbox.classList.add('drophover');
            }, false);

            dropbox.addEventListener('dragleave', (event) => {
                event.preventDefault(); // prevent built in browser handlers
                dropbox.classList.remove('drophover');
            }, false);
        }
    }

    function _applyConfig(config)
    {
        if (!config) { // no config, fall back to all defaults
            _showConsoleMessage(dom.alert.p1, 'No config found, running with defaults.', '');
            return;
        }

        if (config.options.verboseLogging) app.verboseLogging = config.options.verboseLogging;
        if (config.options.useIcons) app.useIcons = config.options.useIcons;
        if (config.options.discardValuesUnderFloor) render.discardFloor = config.options.discardValuesUnderFloor;
        if (config.options.dontClearOnRerender) render.dontClear = config.options.dontClearOnRerender;
        if (config.options.byrow) render.byrow = config.options.byrow
        if (config.options.scanZoom) render.zoom = config.options.scanZoom;
        if (config.options.zoomStep) render.zoomStep = config.options.zoomStep;
        if (config.options.samplerWidth) render.samplerWidth = config.options.samplerWidth;
        if (config.options.samplerHeight) render.samplerHeight = config.options.samplerHeight;
        if (config.options.samplerMagnification) render.samplerMagnification = config.options.samplerMagnification;
        if (config.options.dBStep) render.dBStep = config.options.dBStep;
        if (config.options.dBFloor) render.dBFloor = config.options.dBFloor;
        if (config.options.dBCeil) render.dBCeil = config.options.dBCeil;
        if (config.options.scanBinMetaCount) scan.binMetaCount = config.options.scanBinMetaCount;

        for (const [key, value] of Object.entries(control)) {
            if (config.controls[key]) control[key] = config.controls[key];
        }

        for (const [key, value] of Object.entries(colour)) {
            if (config.colours[key]) colour[key] = config.colours[key];
        }
    }

    function _setUpEvents()
    {
        dom.body.addEventListener('dragover', (event) => {
            event.preventDefault(); // prevent built in browser handlers
        }, false);

        dom.body.addEventListener('drop', (event) => {
            event.preventDefault(); // prevent built in browser handlers
        }, false);

        dom.ctl.zoomPlus.addEventListener('wheel', (event) => {
            event.preventDefault();
            const k = (event.deltaY > 0) ? control.zoomPlus : control.zoomMinus;
            _handleZoomEvent(k);
        }, {capture: false, passive: false});

        dom.ctl.zoomMinus.addEventListener('wheel', (event) => {
            event.preventDefault();
            const k = (event.deltaY > 0) ? control.zoomPlus : control.zoomMinus;
            _handleZoomEvent(k);
        }, {capture: false, passive: false});

        // keys
        dom.doc.addEventListener('keydown', (event) => {
            if (app.state != appStates.rendering) return; // abort if not in rendering state
            let k = event.key;
            if (k === control.fullscreen) _handleFullscreenEvent(event);
            if (k === control.zoomPlus || k === control.zoomMinus) _handleZoomEvent(k);
            if (k === control.floorPlus || k === control.floorMinus) _handleFloorEvent(k);
            if (k === control.ceilPlus || k === control.ceilMinus) _handleCeilEvent(k);
            if (k === control.rerender) _handleRerenderEvent();
            if (k === control.discardFloor) render.discardFloor = _handleBoolEvent(dom.ctl.discardFloor, render.discardFloor);
            if (k === control.dontClear) render.dontClear = _handleBoolEvent(dom.ctl.dontClear, render.dontClear);
        }, false);

        
        // buttons
        dom.ctl.floorMinus.addEventListener('mousedown', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleFloorEvent(control.floorMinus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.floorMinus.addEventListener('mouseup', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        dom.ctl.floorPlus.addEventListener('mousedown', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleFloorEvent(control.floorPlus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.floorPlus.addEventListener('mouseup', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        dom.ctl.ceilMinus.addEventListener('mousedown', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleCeilEvent(control.ceilMinus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.ceilMinus.addEventListener('mouseup', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        dom.ctl.ceilPlus.addEventListener('mousedown', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleCeilEvent(control.ceilPlus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.ceilPlus.addEventListener('mouseup', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        dom.ctl.zoomMinus.addEventListener('mousedown', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleZoomEvent(control.zoomMinus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.zoomMinus.addEventListener('mouseup', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        dom.ctl.zoomPlus.addEventListener('mousedown', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleZoomEvent(control.zoomPlus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.zoomPlus.addEventListener('mouseup', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        //

        dom.ctl.floorMinus.addEventListener('touchstart', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleFloorEvent(control.floorMinus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.floorMinus.addEventListener('touchend', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        dom.ctl.floorPlus.addEventListener('touchstart', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleFloorEvent(control.floorPlus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.floorPlus.addEventListener('touchend', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        dom.ctl.ceilMinus.addEventListener('touchstart', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleCeilEvent(control.ceilMinus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.ceilMinus.addEventListener('touchend', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        dom.ctl.ceilPlus.addEventListener('touchstart', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleCeilEvent(control.ceilPlus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.ceilPlus.addEventListener('touchend', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        dom.ctl.zoomMinus.addEventListener('touchstart', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleZoomEvent(control.zoomMinus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.zoomMinus.addEventListener('touchend', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        dom.ctl.zoomPlus.addEventListener('touchstart', (event) => {
            app.ctlIntervalID = setInterval(() => {
                _handleZoomEvent(control.zoomPlus);
            }, app.ctlInterval);
        }, false);
        dom.ctl.zoomPlus.addEventListener('touchend', (event) => {
            clearInterval(app.ctlIntervalID);
        }, false);

        //

        dom.ctl.rerender.addEventListener('click', (event) => {
            _handleRerenderEvent();
        }, false);

        dom.ctl.discardFloor.addEventListener('click', (event) => {
            render.discardFloor = _handleBoolEvent(dom.ctl.discardFloor, render.discardFloor);
        }, false);

        dom.ctl.dontClear.addEventListener('click', (event) => {
            render.dontClear = _handleBoolEvent(dom.ctl.dontClear, render.dontClear);
        }, false);

        dom.ctl.fullscreen.addEventListener('click', (event) => {
            _handleFullscreenEvent(event);
        }, false);

        dom.app.scan.addEventListener('fullscreenchange', (event) => {
            _handleFullscreenEvent(event);
        }, false);
    }

    function _initDataRibbon()
    {
        dom.ribbon.data.innerHTML = `
    
        ${scan.fileName} • Swept ${scan.sweeps.length} times from ${_MHz(scan.sweepStartFreq)} to ${_MHz(scan.sweepEndFreq)}, with ${scan.sweepBinCount} bins ${_Hz(scan.binFreqRange)} wide per sweep, and ${scan.binDataCount} readings ${_Hz(scan.binDataFreqStep)} wide per bin, with ${scan.binDataAveragingSamples} samples averaged per reading • First sweep at ${scan.firstSweepTime} on ${scan.firstSweepDate} • Last sweep at ${scan.lastSweepTime} on ${scan.lastSweepDate}
       
        `;
    }
    
    function _initKeyRibbon()
    {
        for (const [key, value] of Object.entries(dom.ckey))
        {
            value.style.backgroundColor = colour[key];
        }
    }
    
    function _initIcons()
    {
        // replace text for icons
        if (app.connectedLAN && app.useIcons)
        {
            dom.body.classList.add(app.iconRootClass);
            const icons = document.getElementsByClassName(app.iconClass);
            for (const el of icons)
            {
                el.innerHTML = el.getAttribute(app.iconAttr);
            }
        }
    }

    function _initControlRibbon()
    {
        for (const [key, value] of Object.entries(dom.ctl))
        {
            dom.ctl[key].title = controlHints[key];
        }

        _initCtlBool(dom.ctl.discardFloor, render.discardFloor);
        _initCtlBool(dom.ctl.dontClear, render.dontClear);
        
        _updateControlRibbon();
    }

    function _initCtlBool(el, bool)
    {
        if (bool)
        {
            el.classList.add('on');
            el.classList.remove('off');
        }
        else
        {
            el.classList.add('off');
            el.classList.remove('on');
        }
    }
    
    function _updateControlRibbon()
    {
        for (const [key, value] of Object.entries(dom.var))
        {
            value.setAttribute('data-var', Number(render[key]).toFixed(2));
        }
    }
    
    function _showConsoleMessage(el, prefix, suffix)
    {
        // add a prefix, or clear the last one if none was passed
        el.setAttribute('data-prefix', (prefix ? prefix : ''));

        // add a suffix, or clear the last one if none was passed
        el.setAttribute('data-suffix', (suffix ? suffix : ''));

        // change to anything not containing 'yes'
        el.setAttribute('data-showing', 'no');

        // force reflow so change registers
        void el.clientTop;

        // change to anything containing 'yes'
        el.setAttribute('data-showing', 'yes');
    }

    function _coloursToRgb()
    {
        for (const [key, value] of Object.entries(colour))
        {
            colour[key] = _rgb(value);
        }
    }

    function _updateAppState(state)
    {
        app.state = state;

        if (!app.lastState)
        {
            // first state call
            dom.body.classList.add(app.state);
        }
        else
        {
            // change of state
            dom.body.classList.replace(app.lastState, app.state);
        }

        app.lastState = app.state;
    }

    function _setUpUI()
    {
        _initDataRibbon();
        _initControlRibbon();
        _initKeyRibbon();
    }
    
    function _setUpZoomBox()
    {
        const zbw = dom.app.scanZoom.getBoundingClientRect().width;
        const zbh = dom.app.scanZoom.getBoundingClientRect().height;
        dom.app.scanZoombox.setAttribute('data-width', zbw);
        dom.app.scanZoombox.setAttribute('data-height', zbh);
        dom.app.scanZoombox.style.minWidth = zbw;
        dom.app.scanZoombox.style.minHeight = zbh;
        
        if (render.zoom != 1) _handleZoomEvent();
    }
    
    function _setUpCanvas(canvasContext, canvasElement, w, h, fillColour, scaler = 1, smoothing = false)
    {
        const dpw = w * app.dpr; // device pixel width
        const dph = h * app.dpr; // device pixel height

        canvasContext.canvas.width = dpw * scaler;
        canvasContext.canvas.height = dph * scaler;
        canvasContext.scale(app.dpr * scaler, app.dpr * scaler);

        canvasElement.style.width = w; // to pixel width
        canvasElement.style.height = h; // to pixel height

        canvasContext.imageSmoothingEnabled = smoothing;
        _fillCanvas(canvasContext, fillColour)
    }

    function _setUpScanFrequency()
    {
        const w = render.width;
        const h = 40;
        _setUpCanvas(render.frequency, dom.canvas.frequency, w, h, colour.background);
        console.log(`Set up scan frequency canvas - width: ${w}px height: ${h}px`);

        const suffix = 'MHz';
        const c = render.frequency;
        const pad = 1;
        const fontSize = scan.binDataCount * .5; // remember data points == pixels
        c.font = fontSize + 'px monospace';

        for (let i = 0; i < scan.sweepBinCount; i++)
        {
            const x = i * scan.binDataCount;

            c.fillStyle = 'blue';
            c.fillRect(x, 0, 1, h);

            const txt = `${_MHz(Number(scan.sweepStartFreq) + (i * scan.binFreqRange), 3, true)}`;

            c.save();

            c.translate(x, h);
            c.rotate(-Math.PI/2);

            c.fillStyle = 'white';
            c.textBaseline = 'top';
            c.textAlign = "left";
            c.fillText(txt, pad, 0, h - (pad * 2));

            c.fillStyle = 'white';
            c.textBaseline = 'bottom';
            c.textAlign = "right";
            c.fillText(suffix, h - pad, scan.binDataCount, h - (pad * 2));

            c.restore();
        }
    }

    function _setUpScan()
    {
        const w = scan.sweepBinCount * scan.binDataCount;
        const h = scan.sweeps.length;
        render.pixelCount = w * h;
        render.width = w;
        render.height = h;
        _setUpCanvas(render.scan, dom.canvas.scan, w, h, colour.background);
        console.log(`Set up scan canvas - width: ${w}px height: ${h}px pixels: ${render.pixelCount}`);
    }

    function _sampleScanCanvas()
    {
        const sampler = dom.app.scanMouseboxSampler;
        const loupeSampler = dom.app.loupeMouseboxSampler;

        const sampleW = parseInt(sampler.style.width);
        const sampleH = parseInt(sampler.style.height);
        const sampleX = parseInt(sampler.style.left);
        const sampleY = parseInt(sampler.style.top);
       
        const outsideColour = colour.background;

        const loupeW = sampleW * render.samplerMagnification;
        const loupeH = sampleH * render.samplerMagnification;

        _setUpCanvas(render.loupe, dom.canvas.loupe, loupeW, loupeH, outsideColour);
        _renderLoupe(dom.canvas.scan, render.loupe, sampleX, sampleY, sampleW, sampleH, 0, 0, loupeW, loupeH, outsideColour);

        // force loupe pixel sampling when the loupe render changes
        if (loupeSampler.style.left && loupeSampler.style.top) _sampleLoupeCanvas();
    }

    function _renderLoupe(sourceCanvas, destContext, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH, background)
    {
        if (background) _fillCanvas(destContext, background);

        sourceX = sourceX * app.dpr;
        sourceY = sourceY * app.dpr;
        sourceW = sourceW * app.dpr;
        sourceH = sourceH * app.dpr;

        destContext.drawImage(
            sourceCanvas, // canvas source
            sourceX, sourceY, // source rect pos x, y
            sourceW, sourceH, // source rect size
            destX, destY, // dest rect pos x, y
            destW, destH, // dest rect size
        );
    }

    function _setUpMouseboxSampler(mousebox, sampler, canvas, samplerW, samplerH, doneCall = undefined, gridMultiplied = false, zoomable = false)
    {
        // NOTE this needs to be more general purpose, but had to rush through it for now
        sampler.style.width = samplerW;
        sampler.style.height = samplerH;

        // TODO in short or shallow scans the sampler must resize down
        // TODO if the sampler leaves the scrollbox the scrollbox should scroll with it

        sampler.style.left = 0;
        sampler.style.top = 0;

        const pixelGridDelta = (gridMultiplied) ? render.samplerMagnification : 1; // not 1:1 pixel grid

        ////

        // TODO implement touchmove for moving the sampler

        mousebox.addEventListener('mousedown', (event) => {
            mousebox.setAttribute('data-dragging', 'true');
            mousebox.setAttribute('data-clicking', 'true');
        }, false);
        
        let nX = 0;
        let nY = 0;
        mousebox.addEventListener('mousemove', (event) => {
            if (mousebox.getAttribute('data-dragging') != 'true') return;
            mousebox.setAttribute('data-clicking', 'false'); // not a click

            nX += (zoomable) ? event.movementX / render.zoom : event.movementX;
            nY += (zoomable) ? event.movementY / render.zoom : event.movementY;

            if (Math.abs(nX) >= pixelGridDelta || Math.abs(nY) >= pixelGridDelta) {
                snapMove(nX, nY, pixelGridDelta); // call only on significant changes
                nX = 0;
                nY = 0;
            }
        }, false);

        mousebox.addEventListener('mouseup', (event) => {
            if (mousebox.getAttribute('data-clicking') == 'true') { // to mousebox coords
                const x = event.offsetX; // pre scaled property
                const y = event.offsetY;
                snapMove(x, y, pixelGridDelta, true, true);
            }
            mousebox.setAttribute('data-dragging', 'false');
            mousebox.setAttribute('data-clicking', 'false');
        }, false);

        mousebox.addEventListener('mouseleave', (event) => {
            mousebox.setAttribute('data-dragging', 'false');
            mousebox.setAttribute('data-clicking', 'false');
        }, false);

        ////

        function snapMove(x, y, gridDelta = 1, absolute = false, centre = false)
        {
            // NOTE will cause box to snap away from the cursor, not a bug, side effect of pixel snapping
            const sW = parseInt(sampler.style.width);
            const sH = parseInt(sampler.style.height);
            
            const sX = (absolute) ? 0 : parseInt(sampler.style.left);
            const sY = (absolute) ? 0 : parseInt(sampler.style.top);
            
            const cW = parseInt(canvas.style.width);
            const cH = parseInt(canvas.style.height);
            
            x = (centre)? Math.round(x - (sW * .5)) : x; // centre xy
            y = (centre)? Math.round(y - (sH * .5)) : y;
            
            x = Math.round(x / gridDelta) * gridDelta; // snap xy
            y = Math.round(y / gridDelta) * gridDelta;

            // check movement wont cause the sampler to exit the canvas
            if (sX + (sW + x) <= cW) {
                sampler.style.left = sX + x + 'px';
            }
            else { // snap to end
                sampler.style.left = cW - sW + 'px';
            }
            if (sY + (sH + y) <= cH) {
                sampler.style.top = sY + y + 'px';
            }
            else { // snap to end
                sampler.style.top = cH - sH + 'px';
            }
            // snap to start x y
            if (sX + x < 0) sampler.style.left = '0px';
            if (sY + y < 0) sampler.style.top = '0px';

            if (doneCall) doneCall();
        }
    }

    function _sampleLoupeCanvas()
    {
        const scanSampler = dom.app.scanMouseboxSampler;
        const loupeSampler = dom.app.loupeMouseboxSampler;
        const loupeData = dom.app.loupeData;

        const ssX = parseInt(scanSampler.style.left);
        const ssY = parseInt(scanSampler.style.top);
        const lsX = parseInt(loupeSampler.style.left) / render.samplerMagnification;
        const lsY = parseInt(loupeSampler.style.top) / render.samplerMagnification;
        const x = ssX + lsX;
        const y = ssY + lsY;
        
        if (!scan.sweeps[y] || x >= render.width)
        {
            // abort if loupe is larger than data and a pixel outside the scan was sampled
            loupeData.innerHTML = 'Not a scan pixel';
            loupeData.style.backgroundColor = 'black';
            return;
        }
        
        const row = y;
        const bin = Math.floor(x / scan.binDataCount);
        const col = x - (bin * scan.binDataCount);

        const dB = scan.sweeps[row][bin][col + scan.binMetaCount];
        const f = Number(scan.sweepStartFreq) + (x * scan.binDataFreqStep);
        const date = scan.sweeps[row][bin][0] + ' ' + scan.sweeps[row][bin][1];
        const pow = _dBToPowerRatio(dB).toFixed(6);
        
        const fGHz = _GHz(f);
        const fMHz = _MHz(f);
        const fkHz = _kHz(f);
        const fHz = _Hz(f);

        const nan = Number.isNaN(dB);

        const txt = `
        ${nan ? 'Contains NaN error' : dB} ${nan ? '' : 'dB'}
        <hr/>
        ${fHz}
        <br/>
        ${fkHz}
        <br/>
        ${fMHz}
        <br/>
        ${fGHz}
        <hr/>
        PR: ${nan ? '' : pow}
        <hr/>
        ${date}
        <hr/>
        r${row}b${bin}c${col}x${x}y${y}
        `;

        loupeData.style.backgroundColor = _dBToColour(dB);
        loupeData.innerHTML = txt;
    }

    function _dBToColour(dB)
    {
        // convert dB to a colour
        let c;

        if (Number.isNaN(dB))
        {
            // catch error pixels
            c = colour.nan;
        }
        else
        {
            if (dB > Number(render.dBCeil))
            {
                // catch over ceil
                c = colour.ceil;
            }
            else if (dB < Number(render.dBFloor))
            {
                // catch below floor
                if (render.discardFloor) return 'discard'; // optional, black (discarded)
                c = colour.floor; // or some colour
            }
            else
            {
                // a useful dB value into an RGB colour
                const powArr = colour.power.replace(/[^\d,.]/g, '').split(',');
                const tintArr = colour.powerTint.replace(/[^\d,.]/g, '').split(',');
                let v = _inverseLerp(scan.dBMin, scan.dBMax, dB);
                if (scan.dBMin == scan.dBMax) v = 1; // extreme edge case for tiny scans
                const r = Math.min(Math.max((v * powArr[0]) + tintArr[0], 0), 255);
                const g = Math.min(Math.max((v * powArr[1]) + tintArr[1], 0), 255);
                const b = Math.min(Math.max((v * powArr[2]) + tintArr[2], 0), 255);
                c = `rgb(${r}, ${g}, ${b})`;
            }
        }

        return c;
    }
    
    function _Hz(Hz, places = 3, excludeSuffix = false)
    {
        // to Hz string label
        return Number(Hz).toFixed(places) + (excludeSuffix ? '' : ' Hz');
    }

    function _kHz(Hz, places = 3, excludeSuffix = false)
    {
        // convert Hz to kHz string label
        return (Number(Hz) / 1e+3).toFixed(places) + (excludeSuffix ? '' : ' kHz');
    }

    function _MHz(Hz, places = 3, excludeSuffix = false)
    {
        // convert Hz to MHz string label
        return (Number(Hz) / 1e+6).toFixed(places) + (excludeSuffix ? '' : ' MHz');
    }

    function _GHz(Hz, places = 3, excludeSuffix = false)
    {
        // convert Hz to GHz string label
        return (Number(Hz) / 1e+9).toFixed(places) + (excludeSuffix ? '' : ' GHz');
    }
    
    function _dBToPowerRatio(dB)
    {
        // convert dB to linear power ratio
        return Math.pow(10, dB / 10);
    }
    
    function _inverseLerp(a, b, n)
    {
        return (n - a) / (b - a);
    }
    
    function _lerp(a, b, t)
    {
        return Number(a) + (b - a) * t;
    }
    
    function _clearCanvas(canvasContext)
    {
        canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
    }
    
    function _fillCanvas(canvasContext, colour)
    {
        canvasContext.fillStyle = colour;
        canvasContext.fillRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
    }

    function _rgb(colour)
    {
        dom.app.colour.style.color = colour;
        return window.getComputedStyle(dom.app.colour).color;
    }

    // EVENT HANDLERS

    function _handleBoolEvent(el, b)
    {
        el.classList.replace((b ? 'on' : 'off'), (b ? 'off' : 'on'));
        return !b;
    }

    function _handleFloorEvent(k)
    {
        if (k === control.floorPlus)
        {
            if (Number(render.dBFloor) + Number(render.dBStep) < Number(render.dBCeil))
            {
                // prevent inversion
                render.dBFloor = Number(render.dBFloor) + Number(render.dBStep);
            }
        }
        
        if (k === control.floorMinus)
        {
            if (Number(render.dBFloor) - Number(render.dBStep) > Number(scan.dBMin))
            {
                // prevent going outside of found range
                render.dBFloor -= render.dBStep;
            }
            else
            {
                // snap to min
                render.dBFloor = scan.dBMin;
            }
        }

        _updateControlRibbon();
    }

    function _handleCeilEvent(k) {
        if (k === control.ceilPlus)
        {
            if (Number(render.dBCeil) + Number(render.dBStep) < Number(scan.dBMax))
            {
                // prevent going outside of found range
                render.dBCeil = Number(render.dBCeil) + Number(render.dBStep);
            }
            else
            {
                 // snap to max
                render.dBCeil = scan.dBMax;
            }
        }
        
        if (k === control.ceilMinus)
        {
            if (Number(render.dBCeil) - Number(render.dBStep) > Number(render.dBFloor))
            {
                // prevent inversion
                render.dBCeil -= render.dBStep;
            }
        }
        
        _updateControlRibbon();
    }

    function _handleZoomEvent(k)
    {
        if (k === control.zoomPlus) render.zoom += render.zoomStep;
        if (k === control.zoomMinus) render.zoom = (render.zoom - render.zoomStep < 1 ? 1 : render.zoom - render.zoomStep);

        dom.app.scanZoom.style.transform = `scale(${render.zoom})`;
        
        const zbw = dom.app.scanZoombox.getAttribute('data-width');
        const zbh = dom.app.scanZoombox.getAttribute('data-height');
        dom.app.scanZoombox.style.minWidth = zbw * render.zoom;
        dom.app.scanZoombox.style.minHeight = zbh * render.zoom;

        _updateControlRibbon();
    }

    function _handleRerenderEvent()
    {
        _showConsoleMessage(dom.alert.p0, 'Just a moment. Rerendering with ', `Floor ${Number(render.dBFloor).toFixed(2)} & Ceil ${Number(render.dBCeil).toFixed(2)}`);
        setTimeout(_rerenderScan); // await to allow DOM reflow (console msg)
    }

    function _handleFullscreenEvent(event)
    {
        if (event.type === 'click' || event.type === 'keydown')
        {
            dom.app.scan.requestFullscreen();
        }
        else if (event.type === 'fullscreenchange')
        {
            if (dom.doc.fullscreenElement)
            {
                // entered fullscreen
            }
            else
            {
                // exited fullscreen
            }
        }
    }

    function _handleCSVDropped(e, config)
    {
        if (e.dataTransfer.files.length < 1)
        {
            // something other than a file was dropped in
            _showConsoleMessage(dom.alert.p1, 'This is a not a file...');
            return;
        }

        if (e.dataTransfer.items.length > 1)
        {
            // multiple items were dropped in
            _showConsoleMessage(dom.alert.p1, 'Please only drop one file.');
            return;
        }

        if (e.dataTransfer.files[0].type === 'text/csv')
        {
            // file ok
            _handleCSVFile(e.dataTransfer.files[0], config);
        }
        else
        {
            // file was not of MIME type csv
            _showConsoleMessage(dom.alert.p1, e.dataTransfer.files[0].name, ' is not a CSV file. Please ensure you drop in a .csv file from rtl_power.');
            return;
        }
    }

    function _handleCSVFile(file, config)
    {
        _applyConfig(config); // apply the config
        _coloursToRgb(); // convert any non RGB colours to RGB
        _parse(file); // run the parser
        scan.fileName = file.name;
        _showConsoleMessage(dom.alert.p0, 'Just a moment. Parsing CSV file ', scan.fileName);
    }

    // EXPOSED FUNCTIONS

    return {
        run: run,
        parsedRow: parsedRow,
        parsed: parsed,
        rendering: rendering,
    };
        
})();
    
const papaParseConfig = {
	delimiter: "", // auto	
	newline: "",	// auto
	quoteChar: '"',
	escapeChar: '"',
	header: false,
	transformHeader: undefined,
	dynamicTyping: false,
	preview: 0,
	encoding: "",
	worker: false,
	comments: false,
    step: function(results, parser) { rtlpql.parsedRow(results) },
	complete: function(results, parser) { rtlpql.parsed() },
	error: undefined,
	download: false,
	downloadRequestHeaders: undefined,
	downloadRequestBody: undefined,
	skipEmptyLines: false,
	chunk: undefined,
	chunkSize: undefined,
	fastMode: true,
	beforeFirstChunk: undefined,
	withCredentials: undefined,
	transform: undefined,
	delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP]
}