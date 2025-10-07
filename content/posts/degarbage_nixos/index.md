+++
title = "How to unchain inodes on NixOS, while getting rid of orphaned packages [Introduction]"
date = 2025-07-12T11:48:00Z
updated =  2025-07-15T12:15:00Z
[taxonomies]
categories = ["Nix/OS"]
tags = ["Linux", "NixOS", "configuration.nix", "Migration"]
[extra]
subtitle = "Employ your garbage collector sustainably on NixOS."
disable_comments = true
image = "punk_car.png"
+++

## In case you're like me new to NixOS...

<p class="notice_info"><strong><em>...you may not have noticed that it is obligatory to declare certain lines for automatic storage clean ups in your configuration.nix. Otherwise, you might end up in the worst-case scenario with not a single free <abbr title="Inodes are essential on Unix-like systems (such as Linux-based OS) for storing metadata of files. They may get consumed long before the memory capacity of their volume is exceeded.">inode</abbr> left to link.<br><br>
I use <abbr title="modern file system format">btrfs</abbr> and had already completed <abbr title="BUILDS are called GENERATIONS in nix">120 builds</abbr> when my system crashed during the 121st build process, displaying an error like "no space left on device," even though I had a few hundred unused gigabytes available.<br><br>
It turned out that hundreds of thousands of files and system links had been created over time, which consumed all of my inodes. I assume that old links were not deallocated and that nixos preserved a totally useless software package release history on my disk. At that point, it became <abbr title="Because every new build consumes new inodes without freeing old ones">impossible to rebuild nixos.</abbr></em></strong></p> 

<p class="notice_danger"><strong> ❌ Result: You can't simply <abbr title="to comment smth out causes nixos to build a new system profile, old packages persist as orphanes">comment out something in the configuration.nix</abbr> nor initiate garbage collection rules there, because it's too late. You can't fix this via the configuration.nix file at all.</strong></p>

## Continue with

├──<a href="/posts/checking_inodes" class="btn btn_info" border="5px solid black">[ 1. checking partition stats ]</a><br>
╰──<a href="/posts/nixos-garbage-collector" class="btn btn_success">[ 2. running garbage-collector ]</a>

