[User Guide](#user-guide) | [What](#What) | [Why](#Why) | [How](#How)
---

# sdr.rtl_power.quicklook
### Software Defined Radio • rtl_power • Quick Look • rtlpql

---

# User Guide
*This is a quick weekend project, so there is no active development; however if you spot issues please submit an issue on the GitHub repo so it can be fixed when I have spare time. It is supposed to be basic, not broken.*

I will take you through using the web UI for a 'Row by Row' render at https://quicklook.johnpenny.uk.

*The web UI has three drop boxes by default, however if you run it on your own server custom configs can be added, automatically creating new drop boxes. You may also customise the controls, colours, range defaults, and more, on a custom instance. If you have a config you feel should be included in the default set on my site, please submit it as an issue.*

#### 'Row by Row'
This is the drop box I recommend using almost all of the time. You will see the render being processed row by row.

#### 'Fast (blocking)'
This is the quickest way to view a scan, because the entire scan is rendered in one shot. The disadvantage is that you cannot watch the scan rendering, and so it is harder to spot some changes when shifting the floor/ceil.

#### 'Default Config' (virtual reference config)
This exists as a working baseline in case all other configs have problems. Generally you will not want to use this drop box. It simply uses the default property values for everything.

## Render a Scan
- Find your rtl_power .csv file and drag it on to the 'Row by Row' drop box; or click the drop box and select it on disk
	- *Did something go wrong? Massive scans will not work as browser canvases have an absolute limit in size. If your scan is not enormous, please submit an issue on GitHub*
- Wait for it to render
- Note that at the bottom of the screen your scan details are printed in full
- Note that at the bottom of the screen your colour key shows the meaning of the hues
	- The power colour will increase in intensity in line with dB value of the bin
	- The floor colour will be solid, indicating under floor, and can be made black with [i]
	- The ceil colour will be solid, indicating over ceil
	- The NaN colour will be solid, indicating bin errors
- At the top of the screen you can see your floor/ceil and zoom properties

Now you have a scan rendered, you can do various things to explore it.

- Change the floor and ceil from the scan's range to clip out a desired range
	- Hover over the 'Floor -' icon (empty moon glyph) and scroll your mouse wheel or trackpad
		- OR press [z] repeatedly/hold
	- Hover over the 'Floor +' icon (filled moon glyph) and scroll your mouse wheel or trackpad
		- OR press [x] repeatedly/hold
	- Hover over the 'Ceil -' icon (empty sun glyph) and scroll your mouse wheel or trackpad
		- OR press [a] repeatedly/hold
	- Hover over the 'Ceil +' icon (filled sun glyph) and scroll your mouse wheel or trackpad
		- OR press [s] repeatedly/hold
- Press [Enter] on your keyboard, or click the 'Rerender' button (moving pencil glyph)
- Note that the scan rerenders from top the bottom, with the new range values
- We can make this more useful by turning on 'Don't clear rerender'
	- Click the 'Don't clear rerender' button (layered square glyph)
		- OR press [c]
- Now when we rerender by pressing [Enter] we will see the new render progressively cover over the old render, allowing us to see the affect of the changes we made
- You may not care about under floor values, in which case you will likely want to make them black instead of blue
	- Click the 'Discard < Floor' button (downward arrow in circle glyph)
		- OR press [i]
- The render's pixels (bins) are going to very small, and you may want to take a closer look by zooming in to the main canvas
	- Hover over the 'Zoom -' icon (magnifying glass with - glyph) and scroll your mouse wheel or trackpad
		- OR press [q] repeatedly/hold
	- Hover over the 'Zoom +' icon (magnifying glass with + glyph) and scroll your mouse wheel or trackpad
		- OR press [w] repeatedly/hold
- Keep in mind that your scan will almost always be too wide for your screen, so you should scroll it horizontally to view the full scan
	- Hover over the scan canvas
		- Hold [shift] and scroll your mouse wheel
			- OR use other horizontal or free scrolling input such as a track pad
			- OR use the scroll bar below the canvas
- You may want to hide the UI to get a nicer view of the scan canvas, in which case you should enter fullscreen mode; the controls will all still work
	- Click the 'Fullscreen' button (corner frame square glyph)
		- OR press [f]
	- To EXIT fullscreen on most browsers you should press [esc]
- Zooming does not help us get data from the scan, so now we want to use the loupe to view a small area of the scan
	- Click somewhere within the scan canvas
		- Note the loupe moves to where you clicked
		- You may click+hold+drag on the canvas to move the loupe around
		- The loupe has rule guides that extend horizontally and vertically for some distance, to help you judge relative frequency/time changes
	- The loupe content will render in a small canvas above the scan canvas
		- You can extract the bin data by clicking on a cell within this loupe canvas
			- The cell data will be shown to the right of the loupe canvas
			- Range clipping will not stop you from reading a cell
			- The cell data will update when the loupe moves
- END
	- You have now used all features of quick look



# What
A tool to render rtl_power CSV files as a canvas image. You can view the scan image, zoom into it, use a detail loupe to view a section of the scan, and use a pixel selector to view the data in individual readings.

### Features:
- [x] Drop a file into a config box to render, or click a config box to select a file from disk
- [x] Change the floor and ceil rendering values to pinpoint a dB value (must click rerender when changed)
- [x] Custom configs in a simple editable format via a configs file
- [x] Customisable rendering colours (via configs file)
- [x] Customisable keyboard controls (via configs file)
- [x] Customisable initial render options (via configs file)
- [x] Fullscreen viewing
- [x] Row by row rendering, or single operation rendering
- [x] Rerendering on top of the old render (Don't clear rerender button)(row by row only)
- [x] Change floor and ceil while rendering for quicker configuration (row by row only)
- [x] Hide values under floor for a cleaner render (Discard < Floor button)
- [x] Zoom into the scan
- [x] Magnify a portion of the scan with a loupe
- [x] Select a pixel within the loupe to read its data
- [x] Bins are labelled with their starting frequency (see known issues)
- [x] A scan summary is generated for quick understanding of the scan's properties

### Known Issues to Fix:
- [ ] NO TOUCH SUPPORT - Apologies but the touch implementation, even for the buttons, will have to be done later, ASAP - I forgot to implement and test and do not have time
- [ ] If the sampler box exits the scrollbox, the scrollbox does not move with it
- [ ] If the scan is short or shallow the sampler does not resize to function correctly
- [ ] If the scan has very small bins, the bin data canvas will not be readable

### Roadmap (absolutely no timescale suggested, may never happen):
- [ ] Rerender the loupe and sampled pixel on changes to ceil/floor so you don't have to rerender all
- [ ] Save to img (canvas and frequency bar)
- [ ] Remote CSV files via URI
- [ ] Allow creating and saving configs to localdata
- [ ] Allow config from query string for users who want to use online, not locally
- [ ] One shot worker mode for parse/render to avoid blocking operations



# Why
I wanted a quick and easy way to view rtl_power scans.



# How
### Online
Go to https://quicklook.johnpenny.uk    
If you require some example scan files to run, please download them from the `rtl_power example scans` directory within this repo.

### On local network with web server
1. Clone this repo into the web server sites directory
1. Set up the site to be served in the web server config
1. Visit site locally at localhost, http://ip.of.the.srv, or http://hostname.local if you use Zeroconf
1. Optionally add additional configs
The directory `/config/rtlpql_config.js` allows you to add new config objects. Please make sure they have a unique name.

### Locally with no web server
1. Clone this repo onto a disk, or download it as a zip file
1. Go to repo directory, and then open index.html in a text editor
1. Find the line `<!-- <base href="/Path/To/Repo/Dir/" /> -->` which should be line 3
1. Remove the comment chars `<!--  -->` leaving `<base href="/Path/To/Repo/Dir/" />`
1. Edit the path to match the path to the repo directory on your disk. For example `<base href="/Users/name/SDR/rtlpql/" />`
1. Open the index.html file in a web browser
1. Optionally add additional configs
The directory `/config/rtlpql_config.js` allows you to add new config objects. Please make sure they have a unique name.

**NOTE: Zeroconf networking (Bonjour et al) is worth installing if you are on a Linux or Windows machine and often access local network machines.**
* Linux: Install the apt package 'avahi-daemon'
* Windows: First check that no other app has installed it for you, Install iTunes, or https://support.apple.com/kb/DL999
* Mac OS: Already installed
