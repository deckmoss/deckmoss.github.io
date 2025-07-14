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

<p class="notice_info"><strong><em>...you may not have noticed that it is obligatory to declare certain lines for automatic garbage collection in your configuration.nix. Otherwise, you might end up in the worst-case scenario with not a single free <abbr title="Inodes are essential on Unix-like systems (such as Linux-based OS) for storing metadata of files. They may get consumed long before the memory capacity of their volume is exceeded.">inode</abbr> left to link.<br><br>
I use <abbr title="modern file system format">btrfs</abbr> and had already completed <abbr title="BUILDS are called GENERATIONS in nix">120 builds</abbr> when my system crashed during the 121st build process, displaying an error like "no space left on device," even though I had a few hundred unused gigabytes available.<br><br>
It turned out that hundreds of thousands of files and system links had been created over time, which consumed all of my inodes. I assume that old links were not deallocated and that nixos preserved a totally useless software package release history on my disk. At that point, it became <abbr title="Because every new build consumes new inodes without freeing old ones">impossible to rebuild nixos.</abbr></em></strong></p> 

<p class="notice_danger"><strong> ❌ Result: You can't simply <abbr title="to comment smth out causes nixos to build a new system profile, old packages persist as orphanes">comment out something in the configuration.nix</abbr> nor initiate garbage collection rules there, because it's too late. You can't fix this via the configuration.nix file at all.</strong></p>

## A Examining disk usage and inode consumption statistics on `btrfs`, `ext4` and `xfs` 

To put an emphasize on slightly differences between some random filesystem types i was able to examine.

### [🧩] A.1 Check Disk Usage
Let us begin with printing the disk usage with the <abbr title="disk free">df</abbr> tool out, to rule this out.
```sh
df -h
```
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

### Interpretation (`df -h`) 

<p class="notice_success">✅ 40% of <abbr title="the line where / is in the row of 'Mounted on'">system root directory</abbr> are free and theres also no sub-partition mounted in root besides boot and tempfs. Therefore the "no space left" error was not caused by a lack of overall disk space.</p>

<br>
If you simply don't have disk space left, because you have also forgotten to declare garbage collection cycles, you could do this now manually by continuing from <a href="">here.</a> Otherwise wipe some gigabites and consider to extend your partition.
<br><br>

## B Checking out the inode consumption with <abbr title="disk free -inodes">df -i</abbr>

### [🧩] B.1 Optional: btrfs
```sh
df -i
```

```
Filesystem       Inodes  IUsed    IFree IUse% Mounted on
devtmpfs        3987643    837  3986806    1% /dev
tmpfs           3990104    389  3989715    1% /dev/shm
tmpfs           3990104   2756  3987348    1% /run
/dev/dm-1             0      0        0     - /
efivarfs              0      0        0     - /sys/firmware/efi/efivars
tmpfs              1024      1     1023    1% /run/credentials/systemd-journald.service
tmpfs              1024      1     1023    1% /run/credentials/systemd-tmpfiles-setup-dev-early.service
tmpfs              1024      1     1023    1% /run/credentials/systemd-tmpfiles-setup-dev.service
tmpfs           3990104     33  3990071    1% /run/wrappers
tmpfs              1024      1     1023    1% /run/credentials/systemd-vconsole-setup.service
/dev/nvme0n1p3        0      0        0     - /boot
tmpfs              1024      1     1023    1% /run/credentials/systemd-tmpfiles-setup.service
/dev/sda4      30531584  15188 30516396    1% /mnt/ssd
/dev/sdb3      58097664 760335 57337329    2% /mnt/hdd
tmpfs              1024      1     1023    1% /run/credentials/systemd-sysctl.service
tmpfs            798020    278   797742    1% /run/user/1000
tmpfs              1024      1     1023    1% /run/credentials/getty@tty2.service
```

### Interpretation (btrfs)

<p class="notice_danger">❌ df -i can't read the inode consumption of my btrfs root partition, resulting in an output of <code>0/0/0/-</code>.</p> 

## C Choosing the correct inode measurement tool depends on the filesystem format 

Every partition format uses its own technique to preserve or balance a contingent of inodes. Inodes are responsible for storing file-related metadata, like systemlinks, timestamps, ownership, access rights and so on. 

### [🧩] C.1 Optional - check out btrfs, if present $:>
```sh
sudo btrfs filesystem usage /
```

```
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

### Interpretation (`btrfs filesystem usage`): 

<p class="notice_success">✅ Actually i must have enough space for inode allocation left. On this <code>btrfs</code> partition, only <strong>59.46%</strong> of the preserved space for Metadata/DUP was consumed. This is no surprise, because i already have fixed this. But if you actually don't have any space left, please continue <a href="">here</a> to call the garbage collector and consider also to perform a btrfs scrub.</p>

Let's focus on this part of the previous output:

```
Metadata,DUP: Size:8.00GiB, Used:4.76GiB (59.56%)
/dev/mapper/luks-4b890b26-f927-468e-9ce2-ead3d942224f	  16.00GiB
```

The reserved space for metadata equals 16.00<abbr title="A gibibyte is a more technical unit of memory size than a gigabyte. Gibibytes are based on powers of two, which fit perfectly with binary processing.">GiB</abbr> of total disk space but de-facto only 8.00GiB are allocatable for metadata or inodes. These 8.00GiB are mirrored to maximize file consistency. There should always be a backup, just in case. I guess **DUP** simply means _duplicate_.

### [🧩] C.2 Optional: ext4

My root partition on my Fedora system is formatted with ext4. I'm providing `df -i` for a comparison:

```sh
df -i
```

```
Filesystem       Inodes  IUsed    IFree   IUse% Mounted on
/dev/dm-0       6291456  1145703  5145753   19% /
devtmpfs        4340946      762  4340184    1% /dev
tmpfs           4349497        5  4349492    1% /dev/shm
efivarfs              0        0        0     - /sys/firmware/efi/efivars
tmpfs            819200     1561   817639    1% /run
tmpfs              1024        1     1023    1% /run/credentials/systemd-cryptsetup@luks\x2d36ad2af2\x2d58af\x2d583e\x2d827a\x2d47ae94d8f3db.service
tmpfs              1024        2     1022    1% /run/credentials/systemd-journald.service
/dev/nvme0n1p7   137632      107   137525    1% /boot
tmpfs           1048576       67  1048509    1% /tmp
/dev/nvme0n1p8        0        0        0     - /boot/efi
tmpfs              1024        2     1022    1% /run/credentials/systemd-resolved.service
tmpfs            869899      697   869202    1% /run/user/1000
tmpfs              1024        2     1022    1% /run/credentials/getty@tty3.service
```

### Interpretation (ext4)

<p class="notice_success">✅ <code>df -i</code> is able to read and process inode statistics of ext4 partitions</p>
### [🧩] C.3 Optional: xfs

Also for comparison reasons i called for `df -i` statistics from my MX Linux machine with a xfs formated root partition.

```sh
df -i
```

```
Filesystem       Inodes  IUsed    IFree IUse% Mounted on
udev             116689    439   116250    1% /dev
tmpfs            126496    645   125851    1% /run
/dev/dm-0      14343680 417977 13925703    3% /
tmpfs            126496      3   126493    1% /run/lock
tmpfs            126496      4   126492    1% /dev/shm
/dev/sda1             0      0        0     - /boot
cgroup           126496      4   126492    1% /sys/fs/cgroup
tmpfs            126496     36   126460    1% /run/user/1000
```

### Interpretation (xfs)

<p class="notice_success">✅ <code>df -i</code> is also able to read and process inode statistics of xfs partitions</p>

## D Comparison of btrfs, ext4 and xfs

<p class="notice_info">Depending on your partition type you must find the correct tool to gather the wanted information about actual inode consumption.<br>E.g. for btrfs i would go for the <a href="/posts/degarbage_nixos/#[%F0%9F%A7%A9]_Optional_-_check_out_btrfs,_if_present_$:%3E">btrfs usage tool</a> and then check the metadata paragraph.<br><br>For at least `ext4` and `xfs` filesystems will `df -i` do the trick</p>
