---
title:  BeagleBone Black Setup and Recovery
date:   2015-07-26 12:41
categories: [Memo]
tags: [BBB]
---

## Setup

BeagleBone Black (BBB) comes with an USB Type A to Mini-B cable. So in
order to power up BBB, the easiest way is to connect Mini-B head to
BBB connector `P4` and then Type A head to a computer USB port. The
benefit of using this cable instead of a 5V@1A DC adapter is two fold:

<!-- more -->

1. BBB doesn't come with the 5V@1A DC adapter
2. We can use the Ethernet-over-USB feature, which is very convenient

Unlike BeagleBone (BB), BBB doesn't install [FT2232H][ft2232h] on
board, we can confirm this by comparing the BOM/Schematic of BB and
BBB. So there is no way for us to do serial/JTAG-over-USB like with
BB. In addition to that,
[JTAG header is also not installed on BBB][jtag_header], therefore
unless installing the header by ourselves, there is no way to use JTAG
on BBB. Now for serial debug, the option left for BBB is to use an
USB-to-TTL cable. My personal favorite is PL2303 based 4-pin cable
like [this one][pl2303]. The color code of the pins and their
functions are listed below:

|------+--------+-------------|
|Color |Function| Connect To  |
|------+--------|-------------|
|Red   | +5V    | no use      |
|Black | GND    | BBB J1 Pin1 |
|Green | RXD    | BBB J1 Pin4 |
|White | TXD    | BBB J1 Pin5 |
|------+--------+-------------|
{:.table}

The default UART configuration is `115200 8N1, no flow control`.

## Boot Options

AM335x ROM code (or firmware, if you want to call it that way) samples
`SYSBOOT[15:0]` configuration pins during power on reset (i.e. cold
reset). A device list is created based on sampled value. ROM code will
try devices in the list one by one until it finds a bootable
image. BBB latches `SYSBOOT[15:0]` as `0x403C`, but `SYSBOOT[2]` can
be flipped from `1` to `0` by holding button `S2`. So, when `S2` is
released, the boot device list will be `eMMC -> microSD -> UART0 ->
USB0`; when `S2` is hold, the boot device list will be `microSD ->
USB0 -> UART0`. Here `UART0` is the serial debug port and `USB0` is
the Mini-B USB port which is used as power source in our current
setup.

The ROM code implements the RNDIS class driver. When `USB0` is
selected as boot device and HOST OS has RNDIS device driver installed,
an Ethernet-over-USB channel will be established between BBB and the
host, which enables the ROM code to talk with HOST OS via BOOTP
protocol and download the image to the SRAM using TFTP.  Considering
that the reset button `S1` performs warm reset only, the only way to
initiate a cold reset it to re-apply the power. This fact implies that
after we holding `S2` and re-apply the power, if the microSD card is
not installed, then BBB will always try to boot from `USB0` first
after we pressing the reset button `S1`. This is very convenient if we
are going to do some baremetal programming.

For more detailed information, see _BBB Rev C schematic page 6_ and
_AM335x TRM 26.1.5_.

One way to setup bootp/tftp under Linux is to use `dnsmasq`
package. Following configuration should work out of the box after
replacing `12:34:56:78:9a:bc` with the actual MAC of the BBB. But be
aware that the MAC used by ROM code is not necessarily the same as
what we get from `ifconfig` under BBB Linux. We might need to use
wireshark or tcpdump to get this MAC. The `dhcp-host` line is
essential because BOOTP uses a fixed mapping between MAC and IP.

~~~
# disable DNS
port = 0

# tftp server
enable-tftp
tftp-root = /srv/tftp

# dhcp
dhcp-range = 10.0.0.100,10.0.0.200,12h
dhcp-host  = 12:34:56:78:9a:bc,10.0.0.100
dhcp-boot  = smiley
~~~

The configuration above is not enough. We should give the host side
interface an IP address. Add following snippet to
`/etc/network/interfaces` shall do the trick. Remember to replace
`enx123456789abc` with the real interface name.

~~~
allow-hotplug enx123456789abc

iface enx123456789abc inet static
    address 10.0.0.1
    netmask 255.255.0.0
~~~

When the host side RNDIS driver detects the new RNDIS device, it
creates a new interface. This event triggers some udev rule which
calls `ifup --allow=hotplug` with the new interface name. The
configuration above will then take effect and give that interface a
static IP address.

## Recovery

We can use the microSD card to recover corrupted on board eMMC, or
perform the on board Linux system upgrade. The steps are
straightforward:

1. Download a new image from BBB official site
2. Write the image to a microSD card with `dd`
3. Boot from the microSD card
4. Modify `/boot/uEnv.txt` to un-comment the line
`#cmdline=init=/opt/scripts/tools/eMMC/init-eMMC-flasher-v3.sh`
5. Reboot, and it will start to flash the eMMC. Status message will be
dumped to UART0
6. Remove the microSD card after the flashing is finished

[ft2232h]: http://www.ftdichip.com/Products/ICs/FT2232H.html
[jtag_header]: http://elinux.org/Beagleboard:BeagleBoneBlack#Optional_JTAG
[pl2303]: http://www.amazon.com/Generic-PL2303HX-RS232-Module-Converter/dp/B008AGDTA4

