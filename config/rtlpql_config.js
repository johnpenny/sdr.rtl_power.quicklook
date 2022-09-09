const rtlpqlConfigs = {
    'Row By Row': { // name your config
        controls: { // will accept key codes as string
            floorPlus: 'x', // ('x')
            floorMinus: 'z', // ('z')
            ceilPlus: 's', // ('s')
            ceilMinus: 'a', // ('a')
            zoomPlus: 'w', // ('w')
            zoomMinus: 'q', // ('q')
            rerender: 'Enter', // ('Enter')
            fullscreen: 'f', // ('f')
            discardFloor: 'i', // ('i')
            dontClear: 'c', // ('c')
        },
        colours: { // will accept word(limited list) / hex #FFFFFF / rgb(r,g,b) / rgba(r,g,b,a) - all as string
            background: 'black', // ('black') areas with no data
            nan: 'magenta', // ('magenta') NaN errors
            ceil: 'white', // ('white') dB>ceil
            floor: 'blue', // ('blue') dB<floor (see option discardValuesUnderFloor)
            power: 'yellow', // ('yellow') dB power
            powerTint: 'rgb(0, 0, 40)', // ('rgb(0, 0, 50)') a base tint for the power colour
        },
        options: { // Tip: use progressive rendering to change ceil and floor during renders
            byrow: true, // (false) render everything in one blocking operation; (true) render row by row
            dontClearOnRerender: false, // (false) if true the old render will remain as the new one is rendered
            discardValuesUnderFloor: false, // (false) if true the values less than floor wont render
            scanZoom: 1, // (1) starting zoom
            scanZoomStep: 0.1, // (0.1)
            samplerWidth: 15, // (15) the width of the sampling box in pixels
            samplerHeight: 10, // (10) the height of the sampling box in pixels
            samplerMagnification: 20, // (20) how large should a pixel sample be rendered in the loupe
            dBStep: 0.1, // (0.1)
            scanBinMetaCount: 6, // (6) leading meta cells in a row of the csv file (count from 1 not 0)
            dBFloor: undefined, // (undefined) force dB floor (re-snap by editing floor in session)
            dBCeil: undefined, // (undefined) force dB ceil (re-snap by editing ceil in session)
            useIcons: true, // (true) show icons instead of labels in some places
            verboseLogging: false, // (false) (slow and not very useful)
        }
    },
    'Fast (blocking)': { // name your config
        controls: { // will accept key codes as string
            floorPlus: 'x', // ('x')
            floorMinus: 'z', // ('z')
            ceilPlus: 's', // ('s')
            ceilMinus: 'a', // ('a')
            zoomPlus: 'w', // ('w')
            zoomMinus: 'q', // ('q')
            rerender: 'Enter', // ('Enter')
            fullscreen: 'f', // ('f')
            discardFloor: 'i', // ('i')
            dontClear: 'c', // ('c')
        },
        colours: { // will accept word(limited list) / hex #FFFFFF / rgb(r,g,b) / rgba(r,g,b,a) - all as string
            background: 'black', // ('black') areas with no data
            nan: 'magenta', // ('magenta') NaN errors
            ceil: 'white', // ('white') dB>ceil
            floor: 'blue', // ('blue') dB<floor (see option discardValuesUnderFloor)
            power: 'yellow', // ('yellow') dB power
            powerTint: 'rgb(0, 0, 40)', // ('rgb(0, 0, 50)') a base tint for the power colour
        },
        options: { // Tip: use progressive rendering to change ceil and floor during renders
            byrow: false, // (false) render everything in one blocking operation; (true) render row by row
            dontClearOnRerender: false, // (false) if true the old render will remain as the new one is rendered
            discardValuesUnderFloor: true, // (false) if true the values less than floor wont render
            scanZoom: 1, // (1) starting zoom
            scanZoomStep: 0.1, // (0.1)
            samplerWidth: 15, // (15) the width of the sampling box in pixels
            samplerHeight: 10, // (10) the height of the sampling box in pixels
            samplerMagnification: 20, // (20) how large should a pixel sample be rendered in the loupe
            scanBinMetaCount: 6, // (6) leading meta cells in a row of the csv file (count from 1 not 0)
            dBStep: 0.1, // (0.1)
            dBFloor: undefined, // (undefined) force dB floor (re-snap by editing floor in session)
            dBCeil: undefined, // (undefined) force dB ceil (re-snap by editing ceil in session)
            useIcons: true, // (true) show icons instead of labels in some places
            verboseLogging: false, // (false) (slow and not very useful)
        }
    },
    // add more configs if you want, please remember to change the name to something unique
}