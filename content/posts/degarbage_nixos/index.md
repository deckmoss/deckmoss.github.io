+++
title = "Employ your garbage collector sustainably on NixOS."
date = 2025-07-12T11:48:00Z
#updated =  2025-06-03T14:18:00Z
[taxonomies]
categories = ["Nix/OS"]
tags = ["Linux", "NixOS", "configuration.nix", "Migration"]
[extra]
subtitle = "How to unchain inodes on NixOS, while getting rid of orphaned packages."
disable_comments = true
image = "urban.gif"
+++

## In case you're like me new to NixOS...

<p class="notice_info"><strong><em>...you may not have noticed that it is obligatory to declare certain lines for automatic garbage collection in your configuration.nix. Otherwise, you might end up in the worst-case scenario with not a single free inode left to link.<br><br>
I use <abbr title="modern file system format">btrfs</abbr> and had already completed <abbr title="BUILDS are called GENERATIONS in nix">120 builds</abbr> when my system crashed during the 121st build process, displaying an error like "no space left on device," even though I had a few hundred unused gigabytes available.<br><br>
It turned out that hundreds of thousands of files and system links had been created over time, which consumed all of my <abbr title="Inodes are essential on Unix-like systems (such as Linux-based OS) for storing metadata of files. They may get consumed long before the memory capacity of their volume is exceeded.">inodes</abbr>. I assume that old links were not deallocated and that nixos preserved a totally useless software package release history on my disk. At that point, it became <abbr title="Because every new build consumes new inodes without freeing old ones">impossible to rebuild nixos.</abbr></em></strong></p> 

<p class="notice_danger"><strong> ❌ Result: You can't simply <abbr title="to comment smth out causes nixos to build a new system profile, old packages persist as orphanes">comment out something in the configuration.nix</abbr> or declare garbage collection rules there, because it's too late. You can't fix this via the configuration.nix file at all.</strong></p>

# Collecting evidence

## [🧩] Check Disk Usage $:>
Let us begin with printing the disk usage with the <abbr title="disk free">df</abbr> tool out, to rule this out.
```sh
df -h
```

<strong>Output:</strong>

```
Filesystem      Size  Used Avail Use% Mounted on
devtmpfs        1,6G     0  1,6G   0% /dev
tmpfs            16G   63M   16G   1% /dev/shm
tmpfs           7,7G  7,1M  7,7G   1% /run
/dev/dm-1       457G  266G  185G  60% /
efivarfs        128K   41K   83K  33% /sys/firmware/efi/efivars
tmpfs           1,0M     0  1,0M   0% /run/credentials/systemd-journald.service
tmpfs           1,0M     0  1,0M   0% /run/credentials/systemd-tmpfiles-setup-dev-early.service
tmpfs           1,0M     0  1,0M   0% /run/credentials/systemd-tmpfiles-setup-dev.service
tmpfs            16G  2,0M   16G   1% /run/wrappers
tmpfs           1,0M     0  1,0M   0% /run/credentials/systemd-vconsole-setup.service
/dev/nvme0n1p3  4,3G   87M  4,2G   2% /boot
tmpfs           1,0M     0  1,0M   0% /run/credentials/systemd-tmpfiles-setup.service
/dev/sda4       458G  351G   84G  81% /mnt/ssd
/dev/sdb3       873G  733G   96G  89% /mnt/hdd
tmpfs           1,0M     0  1,0M   0% /run/credentials/systemd-sysctl.service
tmpfs           3,1G  200K  3,1G   1% /run/user/1000
```

### Interpretation: 

<p class="notice_success">✅ 40% of <abbr title="the line where / is in the row of 'Mounted on'">system root directory</abbr> are free and theres also no sub-partition mounted in root besides boot and tempfs. So the "no space left" error was not caused by lack of overall disk space.</p>

<br>

## Correct inode measurement depends on your partition format 

Every partition format uses its own technique to preserve or balance a contingent of inodes. Inodes are responsible for storing file-related metadata, like systemlinks, timestamps, ownership, access rights and so on. 
## [🧩] Optional: check your btrfs, if present $:>
```sh
sudo btrfs filesystem usage /
```

<strong>Output:</strong>

```json
Overall:
Device size:         456.52GiB
Device allocated:    456.52GiB
Device unallocated:    1.01MiB
Device missing:        0.00B
Device slack:          1.50KiB
Used:                265.34GiB
Free (estimated):    184.69GiB	(min: 184.69GiB)
Free (statfs, df):   184.69GiB
Data ratio:            1.00
Metadata ratio:        2.00
Global reserve:      475.66MiB	(used: 0.00B)
Multiple profiles:		  no

Data,single: Size:440.50GiB, Used:255.81GiB (58.07%)
/dev/mapper/luks-4b890b26-f927-468e-9ce2-ead3d942224f	 440.50GiB

Metadata,DUP: Size:8.00GiB, Used:4.76GiB (59.56%)
/dev/mapper/luks-4b890b26-f927-468e-9ce2-ead3d942224f	  16.00GiB

System,DUP: Size:8.00MiB, Used:64.00KiB (0.78%)
/dev/mapper/luks-4b890b26-f927-468e-9ce2-ead3d942224f	  16.00MiB
```


### A.2. Check the inode consumption

###### [ 🧩 ]-(`Code Snippet`) :
```sh
df -i
```
