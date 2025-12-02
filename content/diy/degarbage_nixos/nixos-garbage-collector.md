+++
title = "How to unchain inodes on NixOS, while getting rid of orphaned packages [Part 2]"
date = 2025-07-15T14:02:00Z
updated =  2025-12-01T12:10:00Z
description = "How to run and declare NixOS garbage-collector routines"
weight = 30
draft = false
render = true
aliases = []
authors = ["Michael Fröhlich"]
in_search_index = true
[taxonomies]
categories = ["DIY"]
tags = ["NixOS"]
[extra]
subtitle = "2. Running and declaring NixOS garbage-collector routines"
+++

## Related articles

├──<a href="/diy/degarbage_nixos" class="btn btn_info">[ 0. main article ]</a><br>
╰──<a href="/diy/degarbage_nixos/checking_inodes" class="btn btn_info" border="5px solid black">[ 1. checking partition stats ] </a> 

## Introduction

As investigated in my [previous article](@/diy/degarbage_nixos/checking_inodes.md), NixOS consumes an increasing amount of the limited metadata storage area of a filesystem with each new build. 

For instance, I use NixOS on my regular desktop computers, so I rarely add or remove more than one or two packages in my <abbr title="/etc/nixos/configuration.nix">configuration.nix</abbr> file before invoking a rebuild process, which then consumes far more space in the metadata area than in the data area

The reason is simple: a rebuild produces [the latest generation](@/diy/degarbage_nixos/nixos-garbage-collector.md#NixOS_Generations_for_Beginners), which contains almost the same system links as the earlier generation while adding only a few packages from the Internet.

### The Emergency Fix

<p class="notice_success">✅ NixOS is equipped with its own garbage collector, which can be invoked imperatively whenever needed. This frees inodes instantly in critical situations, such as after a system build fails and reports that no space is left.</p>

╰──<a href="/diy/degarbage_nixos/nixos-garbage-collector/#How_to_Clean-Up_Your_System" class="btn btn_success" border="5px solid black">Show Emergency Fix</a>

### The Declarative Approach

<p class="notice_success">✅ Besides the imperative clean-up, it is highly recommended to declare an automated garbage-collection routine in the <abbr title="/etc/nixos/configuration.nix">configuration.nix</abbr> file in order to prevent any unwanted future shortages of filesystem space.</p>

╰──<a href="/diy/degarbage_nixos/nixos-garbage-collector/#Declaring_Garbage-Collector_in_Configuration.nix" class="btn btn_success" border="5px solid black">Show Declarative Fix</a>

## NixOS Generations for Beginners

<p>Generations in the context of NixOS are originally called build-generations of a distinct profile. Whenever you run <code>nixos-rebuild "switch"</code>, it incrementally builds the next generation of your system. 

The <code>"switch"</code>-argument causes the system to transition directly to the newly created generation without requiring a reboot:

```sh
nixos-rebuild "switch" --use-remote-sudo
```
<cite>Bash</cite> --- <cite>like in the [official NixOS Wiki](https://nixos.wiki/wiki/Nixos-rebuild) (seen in November 2025)</cite>

A newly created entry at the top of your boot menu refers to the latest generation while preserving the previous ones.

This design guarantees an almost incorruptible operating system. In case of misconfiguration or unwanted results, one can always dive back into a previous generation during the next boot.

<cite>In my opinion, this is the most valuable advantage of using NixOS.</cite>
</p>

{{ image(src="mm_nixos_profiles.png", link="mm_nixos_profiles.png", alt="Mermaid Diagram of NixOS Profiles", caption="Diagram of NixOS User Environment Profiles") }} 

### How to List All Existing Generations

To keep things simple, I address the _system profile_ only in this article; it is not user‑specific and therefore serves as the public profile for all users on a system. Multiple profiles are possible, e.g., one for each user on multi‑user systems.

```sh
sudo nix-env -p /nix/var/nix/profiles/system --list-generations
```
<cite>Bash</cite> --- <cite>lists all existing generations of the system profile</cite>

## The Garbage-Collector

(Simplified) The garbage collector likely traverses the local <abbr title="/nix/store">nix-store</abbr> recursively and collects all unlinked packages. These are orphaned nix‑store paths because they are no longer linked to any of the existing generation’s system‑profile trees.

## How to Clean-Up Your System 

### 1. Removing Legacy Generations Imperatively

As [mentioned above](@/diy/degarbage_nixos/nixos-garbage-collector.md#Introduction), we can free some filesystem space by removing legacy generations of our active profile. 

```sh
sudo nix-collect-garbage --delete-older-than 14d
```
<cite>Bash</cite> --- <cite>this removes all generations including their orphaned packages older than 14d</cite>

### 2. Deduplicating Store Dependencies

The <code>nix store optimise</code> operation collects all identical files in your nix-store and replaces each one with a hard link that points to a single original file. This usually frees about 25–30 % of the store. Theoretically, it removes duplicate inodes and the filesystem blocks they were holding pointers to.

<p class="notice_warning">⚠️ Attention! This operation is very hungry for resources and may consume a lot of time.</p>

```sh
nix store optimise
```
<cite>Bash</cite> --- <cite>replaces identical files in the store by hard links</cite>

#### Self-Testing Results

I use btrfs as my filesystem, so I must run **this** command to plot a summary of the <abbr title="/nix/store">nix-store</abbr> filesystem statistics:

```sh
sudo btrfs filesystem usage /nix/store
```
<cite>Bash</cite> --- <cite>firstly mentioned in my [previous article](@/diy/degarbage_nixos/checking_inodes.md#[%F0%9F%A7%A9]_C.1_Optional:_btrfs) (you must choose the correct tool depending on your local filesystem)</cite>

##### Storage statistics before the invocation of <code>nix store optimise</code>:

```text
Overall:
    Device size:		 456.52GiB
    Device allocated:		 432.52GiB
    Device unallocated:		  24.00GiB
    Device missing:		     0.00B
    Device slack:		   1.50KiB
    Used:			 303.34GiB
    Free (estimated):		 145.39GiB	(min: 133.39GiB)
    Free (statfs, df):		 145.39GiB
    Data ratio:			      1.00
    Metadata ratio:		      2.00
    Global reserve:		 512.00MiB	(used: 0.00B)
    Multiple profiles:		        no

Data,single: Size:416.50GiB, Used:295.12GiB (70.86%)
   /dev/disk/by-uuid/3095dd1c-cf7e-11f0-b26a-1b1bc8337735	 416.50GiB

Metadata,DUP: Size:8.00GiB, Used:4.11GiB (51.38%)
   /dev/disk/by-uuid/3095dd1c-cf7e-11f0-b26a-1b1bc8337735	  16.00GiB

System,DUP: Size:8.00MiB, Used:64.00KiB (0.78%)
   /dev/disk/by-uuid/3095dd1c-cf7e-11f0-b26a-1b1bc8337735	  16.00MiB

Unallocated:
   /dev/disk/by-uuid/3095dd1c-cf7e-11f0-b26a-1b1bc8337735	  24.00GiB

```

##### After the invocation: 

```text
Overall:
    Device size:		 456.52GiB
    Device allocated:		 432.52GiB
    Device unallocated:		  24.00GiB
    Device missing:		     0.00B
    Device slack:		   1.50KiB
    Used:			 293.66GiB
    Free (estimated):		 153.68GiB	(min: 141.68GiB)
    Free (statfs, df):		 153.68GiB
    Data ratio:			      1.00
    Metadata ratio:		      2.00
    Global reserve:		 512.00MiB	(used: 0.00B)
    Multiple profiles:		        no

Data,single: Size:416.50GiB, Used:286.82GiB (68.86%)
   /dev/disk/by-uuid/3095dd1c-cf7e-11f0-b26a-1b1bc8337735	 416.50GiB

Metadata,DUP: Size:8.00GiB, Used:3.42GiB (42.74%)
   /dev/disk/by-uuid/3095dd1c-cf7e-11f0-b26a-1b1bc8337735	  16.00GiB

System,DUP: Size:8.00MiB, Used:64.00KiB (0.78%)
   /dev/disk/by-uuid/3095dd1c-cf7e-11f0-b26a-1b1bc8337735	  16.00MiB

Unallocated:
   /dev/disk/by-uuid/3095dd1c-cf7e-11f0-b26a-1b1bc8337735	  24.00GiB

```

##### Summary

The procedure freed 
 - around 9.0GiB in my data area
 - around 0.7GiB in my meta-data area

## Declaring Garbage-Collector in Configuration.nix

Adding these two lines to the <abbr title="/etc/nixos/configuration.nix">configuration.nix</abbr> results in automatic garbage collection whenever `nixos-rebuild` is triggered to build the next generation of your system.

```nix
{
	nix.gc.automatic = true;
	nix.gc.options = "--delete-older-than 30d";
}
```
<cite>Nix</cite> --- <cite>removes all generations older than 30 days during every build</cite>

<p class="notice_info">ℹ️ It is also possible to automate the <a href="/diy/degarbage_nixos/nixos-garbage-collector/#2._Deduplicating_Store_Dependencies">optimization procedure</a> via declaration. Please read the <a href="https://nixos.wiki/wiki/Storage_optimization">corresponding official NixOS wiki article</a> for further instructions.</p>
