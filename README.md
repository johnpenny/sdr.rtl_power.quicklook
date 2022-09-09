[What](#What) | [Why](#Why) | [How](#How)
---

# sdr.rtl_power.quicklook
### Software Defined Radio • rtl_power • Quick Look • rtlpql

---

# What
A tool to render rtl_power CSV files as a canvas image. You can view the scan image, zoom into it, use a detail loupe to view a section of the scan, and use a pixel selector to view the data in individual readings.

### Features:
- [x] Drop a file to render
- [x] Multiple configs with a simple drop based UI
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
- [ ] If the sampler box exits the scrollbox, the scrollbox does not move with it
- [ ] If the scan is short or shallow the sampler does not resize to function correctly
- [ ] If the scan has very small bins, the bin data canvas will not be readable

### Roadmap (absolutely no timescale suggested, may never happen):
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