+++
title = "never trust your vendor"
date = 2025-05-16T12:00:00Z
updated =  2025-05-20T12:00:00Z
[taxonomies]
categories = ["hardware"]
tags = ["hacks", "notebooks", "linux"]
[extra]
subtitle = "Hack your vendor's RAM capacity"
disable_comments = true
image = "urban.gif"
+++

## Vendors tend to lie for profit

<br>

<p class="notice_warning"><strong>🐧 Attention! you'll need a <em>linux</em> powered operating system! 🐧</strong></p>

<br>
<p class="notice_danger"><strong>☠️</strong> For the maximization of profits, vendors tend to lie about the actual supported random access memory limits. ☠️ <br>It could also be a fact that later firmware releases support greater amounts than the initial ones. </p>

<br>

One common cumulative problem with modern notebooks' memory is that one or more RAM modules are soldered directly onto the motherboard. Most customers cannot change these types. However, often only one module is soldered, while the second module is mounted in a regular socket. These types are very easily upgradeable, which can save you a lot of money and time.

## Reasons for a RAM upgrade and against buying a new notebook
- Saves **a lot** of cash!
- You may not want to reinstall and re-customize all your applications on a new device.
- Additional software applications or the latest updates consume more of your remaining memory, which slows everything down due to the automatic use of hard disk memory (which can also shorten the lifespan of your hard disk drive).
- If you have a mid-range or high-end CPU that is already powerful enough for most users' tasks, you may not need a new notebook in most cases.
- Saves the environment.

## Example of a vendor's official statement
<br>

| Model                                   | <p align="left">Acer Swift 3 (SF314-41)</p>            |
| --------------------------------------- | :----------------------------------------------------- |
| RAM                                     | <p align="left">4 GB (provided memory is soldered)</p> |
| Max RAM supported                       | <p align="left">12 GB</p>                              |
| RAM Type                                | <p align="left">DDR4 SDRAM</p>                         |
| Form Factor                             | <p align="left">SO-DIMM 260-pin</p>                    |
| Slots <abbr title="Quantity">QTY</abbr> | <p align="left">1</p>                                  |
| Empty Slots                             | <p align="left">1</p>                                  |


<br>

You may have noticed that **4 GB** is soldered directly onto the motherboard. Most users would not unsolder this nor resolder a larger module.

<p class="notice_warning">The vendor claims that you could insert an <strong>8 GB </strong>Module into the empty slot to obtain the maximum supported limit of <strong>12 GB.</strong></p>

## How to obtain the real supported memory amount _using the Linux tool `dmidecode`_

## Installation 

### On Red Hat Linux/Fedora
```bash
sudo dnf install dmidecode
```
### On NixOS
```bash
nix-shell -p dmidecode
```
### On Debian/Ubuntu
```bash
sudo apt install dmidecode
```
## Usage
```bash
sudo dmidecode -t memory
```
#### Output
```c
# dmidecode 3.6
Getting SMBIOS data from sysfs.
SMBIOS 3.1.1 present.

Handle 0x000B, DMI type 16, 23 bytes
Physical Memory Array
	Location: System Board Or Motherboard
	Use: System Memory
	Error Correction Type: None
	Maximum Capacity: 64 GB
	Error Information Handle: 0x000E
	Number Of Devices: 2

Handle 0x000D, DMI type 17, 40 bytes
Memory Device
	Array Handle: 0x000B
	Error Information Handle: 0x0010
	Total Width: 64 bits
	Data Width: 64 bits
	Size: 4 GB
	Form Factor: SODIMM
	Set: None
	Locator: DIMM 0
	Bank Locator: P0 CHANNEL B
	Type: DDR4
	Type Detail: Synchronous Unbuffered (Unregistered)
	Speed: 2667 MT/s
	Manufacturer: Hynix
	Serial Number: 00000000
	Asset Tag: Not Specified
	Part Number: HMA851S6CJR6N-VK    
	Rank: 1
	Configured Memory Speed: 2400 MT/s
	Minimum Voltage: 1.2 V
	Maximum Voltage: 1.2 V
	Configured Voltage: 1.2 V
```

#### Interpretation
The output starts with the overall specifications of the currently installed BIOS firmware, which supports an amount of 64 GB of RAM. This differs significantly from the official vendor specification of 12 GB.

