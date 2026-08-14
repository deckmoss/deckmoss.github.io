+++
title = "Transitioning Geo Coordinates from a Leaflet Widget into OsmAnd~"
date = 2026-07-28T12:00:00Z
updated =  2026-08-14T16:26:00Z
description = "DIY Guide About Scraping and Converting Leaflets' Web Widget Coordinates into a Single Gpx File Quickly, by Using Just Your Phone"
weight = 0
draft = false
render = true
aliases = []
authors = ["Michael Fröhlich"]
in_search_index = true
[taxonomies]
categories = ["DIY"]
tags = ["Linux","OpenStreetMap","OsmAnd~","Scraping","Geo_Informatics"]
[extra]
subtitle = "How to Scrape and Convert Coordinates from a Leaflet Webwidget into GPX"
image = "lis.webp"
+++

## A On Vacation in Lisbon
<p>
On my last vacation trip to Portugal, I wanted to visit some of Lisbon's infamous graffiti spots. After spending considerable time browsing the internet for resources, I came across some page with a Leaflet Webwidget containing over 80 geocoordinates of Lisbon’s graffiti. What a huge number!

So I tried to work with it, but navigating through an unknown city using a Leaflet widget was very frustrating and nearly impossible. 

You had to constantly turn on your screen, open a web browser, and check your current position. This lacks modern navigation features like automated route planning or voice guidance. 

{{ image(src="leaflet.png", link="leaflet.png", alt="Screenshot of theLeaflet Webwidget Perspective on a Phone showing Lisbon's Graffiti Location Marks", caption="Leaflet Webwidget Perspective on a Phone") }}

Moreover, I had already created numerous destination markers in my OsmAnd~ Navigator App.
</p>

## B It was the Momentum of _this_ Idea

<p class="notice"> 💡 Right away, my mind was on scraping those coordinates and somehow converting into the GPX format which is an open-standard file format that enjoys widespread support accross navigation systems and other related software.
</p>
<q><i>You know</i>, OsmAnd~ Navigator App supports that <i>natively</i> and can <i>import</i> it no problem.</q>

In the following paragraphs I'll show you how, whether on your laptop or phone.

## C Equipped with only a Phone as Hacking Device

<p class="notice_success">✅ Tested on Android and NixOS.<br>Should work on any Linux/BSD device (including MacOS).</p>
<p class="notice_warning">⚠️ I don't know if this works on iOS.</p>

##### What You Need: 

 - Terminal Emulator
 - gpsbabel

I recommend that you check if your distro’s package manager can find `gpsbabel` (like on Termux App (Android), Debian, Ubuntu, Mint, Zorin OS, Commodore OS, etc.: run `apt search gpsbabel`) and then invoke the installation via your package manager (`apt install gpsbabel`).
If it isn’t available, you can install the Termux App on your Android phone. Mac users may install `gpsbabel` via homebrew.

##### My Equipment:
- Phone: [Fairphone 3+](https://en.wikipedia.org/wiki/Fairphone_3)
- OS: [Lineage OS (Android)](https://lineageos.org/)
- Android-Apps:
	- App Store: [F-Droid](https://f-droid.org/)
	- Terminal App: [Termux (F-Droid)](https://f-droid.org/packages/com.termux/) 
	- Navigator App: [OsmAnd~ (F-Droid)](https://f-droid.org/de/packages/net.osmand.plus/)
- Termux Commands & Packages:
	- [gpsbabel](https://www.gpsbabel.org/)
	- curl
	- cat
	- grep

## D Downloading a Relevant Page

Since you have installed all dependencies for this task—either on your phone or somewhere else—you should be able to get your GPX converted file out of the filtered source code of any web page hosting a leaflet widget.

<p class="notice_info">ℹ️ To show how the process works, I'll focus on the technical side, replacing my original source by this fantasy URL `https://www.your-leaflet.page/foo`. You need to replace it with your desired URL before it's invocation. Please leave me a note if the procedure doesn't work on yours!</p>

Download the desired page with `curl`:
```bash
curl -L --compressed https://www.your-leaflet.page/foo > somepage.html
```

## E Grabbing Coordinates from it's Source Code

```bash
cat somepage.html \
| grep -Eo "[-]?[[:alnum:]]{1,2}\.[[:alnum:]]*, [-]?[[:alnum:]]{1,2}\.[[:alnum:]]*"  \
> geoCoordinates.txt
```

## F Generating the GPX File 

<p class="notice_success">✅ Tested with GPSBabel Version <code>1.8.0</code> on NixOS.</p>

<p class="notice_danger">🪳 The gpsbabel call didn't work well, as long as the <code>-f</code> flag was somehow misplaced. It may be that the <code>-f</code> flag must be located directly behind the <code>-i argument</code>.</p>

```bash
gpsbabel -t -i csv -f geoCoordinates.txt -o gpx -F geoCoordinates.gpx
```

I also created a bash function containing a pipeline, which you can copy into your `~/.bashrc` file. You'll find it at [the end of this article](#The_Function:).

## G Importing the GPX File by OsmAnd~

<p class="notice_warning">⚠️ This will import additional waymarks with non-informative names into your standard favorite profile, may cluttering it up depending on how many you have actually scraped.</p>

1. Open your file manager app 
2. Navigate to the GPX file
3. Open the context menu on it (try tap and hold for a few seconds)
4. Tap on `Open with`
{{ image(src="fileman-open-with.png", link="fileman-open-with.png",  alt="Screenshot of the android filemanager's context menu where a pointer is placed on the -open with- entry", caption="Android Filemanager Context Menu on Waydroid") }}
5. Tap on `OsmAnd~`
{{ image(src="open-with-dialog.png", link="open-with-dialog.png", alt="Screenshot of the android's -Open with- dialog where a pointer is placed on the -OsmAnd~- icon", caption="Android Open With Dialog on Waydroid") }}
6. OsmAnd~ should be on screen and displaying it's import dialog. Tap on the `Favorit` entry.
{{ image(src="osmand-import-dialog.png", link="osmand-import-dialog.png", alt="Screenshot of the OsmAnd~ app's -Import- dialog where a pointer is placed on the -Favorit- entry", caption="Android OsmAnd~ Import Dialog on Waydroid") }}

## H Final Impression

{{ image(src="osmand-w-spots.png", link="osmand-w-spots.png", alt="Screenshot of the OsmAnd~ app's map view displaying imported graphiti spots in yellow", caption="Android OsmAnd~ Map Perspective on Waydroid") }}

## I Optimizations

As you already may have noticed, the procedure above has still potential for optimizations. So let's start by writing a simple pipeline.

##### The Pipeline:

```bash
curl -L --compressed https://www.your-leaflet.page/foo \
| grep -Eo "[-]?[[:alnum:]]{1,2}\.[[:alnum:]]*, [-]?[[:alnum:]]{1,2}\.[[:alnum:]]*" \
| gpsbabel -t -i csv -o gpx - -F geoCoordinates.gpx
```
_Ok, now let's wrap up this pipeline into a function!_

##### The Function:

By copying the following snippet into your existing `~/.bashrc` file, you can forget each step. Just open your terminal, call the function with the URL and the desired output file name as arguments.

```bash
leaflet2gpx() {
    # usage: leaflet2gpx <URL> <Output File Name>
    gpsbabel -t -i csv -f <(\ 
        curl -L --compressed ${1} \
        | grep -Eo "[-]?[[:alnum:]]{1,2}\.[[:alnum:]]*, [-]?[[:alnum:]]{1,2}\.[[:alnum:]]*"\
    ) -o gpx -F ${2};
}
```

Example call:

```bash
leaflet2gpx https://www.your-leaflet.page/foo geoCoordinates.gpx
```

With your `~/.bashrc` extended by this function, you'll be able to convert coordinates from any page on-the-fly into a `.gpx` file. Your next vacation trip is just around the corner!