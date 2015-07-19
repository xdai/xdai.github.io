---
layout: post
title:  "linkname, soname and realname"
date:   2012-07-16
categories: "Three Things"
tags: toolchain
---

As you may already know, the linker[^1] option `-l` should be used to
specify the name of the library which is needed by your application
when it was compiled. For example, if we write a program which utilize
libjpeg, we should specify `-ljpeg` explicitly when we compile it:

{% gist xdai/56eb95e89bd80395b7d8 image.c %}

~~~
$ gcc -ljpeg image.c
~~~

The problem lies behind is where does gcc find the library we
specified with `-ljpeg`. The only clue we get here is the string
`jpeg`, a.k.a. the *`NAMESPEC`*. So we need to understand the rules
used by toolchain which will help us to find the correct library file
in the filesystem. This is fairly straightforward: The toolchain will
search for a file named `libjpeg.so` in some directories and use the
first one it finds. The directories searched includes several standard
system directories plus any that you specify with `-L`. We can check
the directory list with gcc option `-v` when we compile our
program. `libjpeg.so` here is the *`linkname`* of the library.

Now we have get the program compiled successfully, but when we run the
binary, how could the dynamic linker[^2] find the library installed in
our system? One of the obvious way is to save the path of the library
file we find in linking stage into the binary we created and let the
dynamic linker to get the file in that path. Well, this is not
flexible enough though, because the system you run the application is
not necessarily to be the same one that compiled it, and the library
may not be installed in the same directory between two systems. So
let’s go a little further, we just save the `linkname` into the binary
and let the dynamic linker to search it in a list of directories, just
like what we have done when we link our application.

This is better, but not enough. One of the benefits comes with shared
library is that we can upgrade the library (e.g. to fix bug) without
rewrite / rebuild our application. Different versions of one library
may not be compatible. For example, our application probably used a
API which was introduced in version 6 of libjpeg, then it won’t work
with libjpeg prior to version 6. Different applications installed in
one system may depend on different versions of one library, hence it
is very common that several versions of a same library coexist in one
system. We need to add some kinds of version info into the `linkname`,
e.g. `libjpeg.so.1`, so dynamic linker can find the correct
library. `libjpeg.so.1` here is the *`soname`* of the library. We
should save `soname` instead of `linkname` in the binary.

Note that not every library upgrade breaks the ABI compatibility –
some upgrades just fix bugs, therefore minor version number is
necessary, e.g. `libjpeg.so.1.12`, which hereafter referenced as
*`realname`*.

Now let’s put this all together. When we create a shared library, we
should specify the `soname` and `realname` separately, as they are
usually not the same.

{% gist xdai/56eb95e89bd80395b7d8 fibonacci.c %}

~~~
$ gcc -Wall -Werror -fPIC -c fibonacci.c
$ gcc -shared -Wl,-soname,libfibo.so.1 -o libfibo.so.1.0.1 fibonacci.o
$ ls -l
-rw-r--r-- 1 ender ender  174 Jul 15 17:59 fibonacci.c
-rw-r--r-- 1 ender ender 1464 Jul 16 10:32 fibonacci.o
-rwxr-xr-x 1 ender ender 6329 Jul 16 10:32 libfibo.so.1.0.1
~~~

We can check the the soname with `readelf`:

~~~
$ readelf -d libfibo.so.1.0.1

Dynamic section at offset 0x7a0 contains 26 entries:
Tag        Type                         Name/Value
0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]
0x000000000000000e (SONAME)             Library soname: [libfibo.so.1]
0x000000000000000c (INIT)               0x560
0x000000000000000d (FINI)               0x6ec
0x0000000000000019 (INIT_ARRAY)         0x200788
0x000000000000001b (INIT_ARRAYSZ)       8 (bytes)
0x000000000000001a (FINI_ARRAY)         0x200790
0x000000000000001c (FINI_ARRAYSZ)       8 (bytes)
0x0000000000000004 (HASH)               0x1b8
0x000000006ffffef5 (GNU_HASH)           0x200
0x0000000000000005 (STRTAB)             0x378
0x0000000000000006 (SYMTAB)             0x240
0x000000000000000a (STRSZ)              186 (bytes)
0x000000000000000b (SYMENT)             24 (bytes)
0x0000000000000003 (PLTGOT)             0x2009a8
0x0000000000000002 (PLTRELSZ)           48 (bytes)
0x0000000000000014 (PLTREL)             RELA
0x0000000000000017 (JMPREL)             0x530
0x0000000000000007 (RELA)               0x470
0x0000000000000008 (RELASZ)             192 (bytes)
0x0000000000000009 (RELAENT)            24 (bytes)
0x000000006ffffffe (VERNEED)            0x450
0x000000006fffffff (VERNEEDNUM)         1
0x000000006ffffff0 (VERSYM)             0x432
0x000000006ffffff9 (RELACOUNT)          3
0x0000000000000000 (NULL)               0x0
~~~

Now let’s try to build a program which depends on libfibo

{% gist xdai/56eb95e89bd80395b7d8 main.c %}

~~~
$ gcc main.c -L. -lfibo -o fib
/usr/bin/ld: cannot find -lfibo
collect2: error: ld returned 1 exit status
~~~

This fails because the `linkname` is used in linking stage. The linker
can not find a file named `libfibo.so` in this case.

~~~
$ ln -s libfibo.so.1.0.1 libfibo.so
$ gcc main.c -L. -lfibo -o fib
$ ls -l
-rwxr-xr-x 1 ender ender 7330 Jul 16 10:32 fib
-rw-r--r-- 1 ender ender  174 Jul 15 17:59 fibonacci.c
-rw-r--r-- 1 ender ender 1464 Jul 16 10:32 fibonacci.o
lrwxrwxrwx 1 ender ender   16 Jul 16 10:41 libfibo.so -> libfibo.so.1.0.1
-rwxr-xr-x 1 ender ender 6329 Jul 16 10:32 libfibo.so.1.0.1
-rw-r--r-- 1 ender ender  152 Jul 15 17:41 main.c
~~~

Compile succeed. But the binary won’t run, because `soname` is used by
dynamic linker to find the library file when we are trying to run the
binary:

~~~
$ ./fib
./fib: error while loading shared libraries: libfibo.so.1: cannot open
shared object file: No such file or directory
$ ldd fib
        linux-vdso.so.1 =>  (0x00007fffe75ff000)
        libfibo.so.1 => not found
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007ff65ad78000)
        /lib64/ld-linux-x86-64.so.2 (0x00007ff65b119000)
~~~

Ok, let’s create a symbol link for the `soname`:

~~~
$ ln -s libfibo.so.1.0.1 libfibo.so.1
$ ls -l
-rwxr-xr-x 1 ender ender 7330 Jul 16 10:32 fib
-rw-r--r-- 1 ender ender  174 Jul 15 17:59 fibonacci.c
-rw-r--r-- 1 ender ender 1464 Jul 16 10:32 fibonacci.o
lrwxrwxrwx 1 ender ender   16 Jul 16 10:41 libfibo.so -> libfibo.so.1.0.1
lrwxrwxrwx 1 ender ender   16 Jul 16 10:45 libfibo.so.1 -> libfibo.so.1.0.1
-rwxr-xr-x 1 ender ender 6329 Jul 16 10:32 libfibo.so.1.0.1
-rw-r--r-- 1 ender ender  152 Jul 15 17:41 main.c
$ ./fib
./fib: error while loading shared libraries: libfibo.so.1: cannot open
shared object file: No such file or directory
$ ldd fib
        linux-vdso.so.1 =>  (0x00007fffe75ff000)
        libfibo.so.1 => not found
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007ff65ad78000)
        /lib64/ld-linux-x86-64.so.2 (0x00007ff65b119000)
~~~

Hmmm? Still failed! Well, this is because the current directory is not
in the search path list of the dynamic linker. We have several way to
get rid of it. The first one is the environment variable
`LD_LIBRARY_PATH`:

~~~
$ LD_LIBRARY_PATH=. ./fib
fibonacci(1) = 1
$ LD_LIBRARY_PATH=. ldd fib
        linux-vdso.so.1 =>  (0x00007fffd71ff000)
        libfibo.so.1 => ./libfibo.so.1 (0x00007f9f55a02000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f9f55663000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f9f55c05000)
~~~

The second one is a little bit more complex. We can ask toolchain to
embed into the binary some additional search path for dynamic
linker. In this way we don’t need the end user to do some special
configuration to make the binary run, however we must rebuild our
application:

~~~
$ gcc main.c -L. -lfibo -Wl,-rpath,$(pwd) -o fib
$ ./fib
fibonacci(1) = 1
$ ldd fib-rpath
        linux-vdso.so.1 =>  (0x00007fff5a5ff000)
        libfibo.so.1 => /home/ender/src/git/arsenal/library/shared/libfibo.so.1 (0x00007f0b06303000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f0b05f64000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f0b06506000)
~~~

As the end of this article, let’s get some insight into how dynamic
linker finds the correct library:

~~~
$ LD_DEBUG=libs ./fib
      9122:     find library=libfibo.so.1 [0]; searching
      9122:      search path=/home/ender/src/git/arsenal/library/shared/tls/x86_64:/home/ender/src/git/arsenal/library/shared/tls:/home/ender/src/git/arsenal/library/shared/x86_64:/home/ender/src/git/arsenal/library/shared               (RPATH from file ./fib)
      9122:       trying file=/home/ender/src/git/arsenal/library/shared/tls/x86_64/libfibo.so.1
      9122:       trying file=/home/ender/src/git/arsenal/library/shared/tls/libfibo.so.1
      9122:       trying file=/home/ender/src/git/arsenal/library/shared/x86_64/libfibo.so.1
      9122:       trying file=/home/ender/src/git/arsenal/library/shared/libfibo.so.1
      9122:
      9122:     find library=libc.so.6 [0]; searching
      9122:      search path=/home/ender/src/git/arsenal/library/shared         (RPATH from file ./fib)
      9122:       trying file=/home/ender/src/git/arsenal/library/shared/libc.so.6
      9122:      search cache=/etc/ld.so.cache
      9122:       trying file=/lib/x86_64-linux-gnu/libc.so.6
      9122:
      9122:
      9122:     calling init: /lib64/ld-linux-x86-64.so.2
      9122:
      9122:
      9122:     calling init: /lib/x86_64-linux-gnu/libc.so.6
      9122:
      9122:
      9122:     calling init: /home/ender/src/git/arsenal/library/shared/libfibo.so.1
      9122:
      9122:
      9122:     initialize program: ./fib
      9122:
      9122:
      9122:     transferring control: ./fib
      9122:
fibonacci(1) = 1
      9122:
      9122:     calling fini: ./fib [0]
      9122:
      9122:
      9122:     calling fini: /home/ender/src/git/arsenal/library/shared/libfibo.so.1 [0]
      9122:
~~~

### Reference
[^1]: [ld - The GNU linker](http://linux.die.net/man/1/ld)
[^2]: [ld.so, ld-linux.so* - dynamic linker/loader](http://linux.die.net/man/8/ld-linux)
