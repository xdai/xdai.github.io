---
title:  Get assembly / C code map with objdump
date:   2012-05-11
categories: [ThreeThings]
tags: [Toolchain]
---

We can use `objdump` to disassamble a binary executable. Sometimes it
would be handy if we can get a map between the assambly and C source
code, which enables us to quickly locate the assembly of a specific C
block. `-S` and `-l` flags of `objdump` provide some means to archive
that.

> -S
>
> –source
>
> Display source code intermixed with disassembly, if possible.  Implies -d.

> -l
>
> –line-numbers
>
> Label the display (using debugging information) with the filename and
> source line numbers corresponding to the object code or relocs shown.
> Only useful with -d, -D, or -r.

<!-- more -->

As long as the application is compiled with `gcc -g`, we can use
`objdump -S -l` to disassemble the application binary and get the map
we want.

{% gist xdai/44e408b71188b6012eb6 zero_checksum.c %}

~~~
$ arm-linux-gcc -g zero_checksum.c -c
$ arm-linux-objdump -Sl zero_checksum.o | head -40

zero_checksum.o:     file format elf32-littlearm

Disassembly of section .text:

00000000 <main>:
main():
/home/ender/src/tmp/zero_checksum.c:5
#include <stdio.h>

int
main(int argc, char **argv)
{
   0:   e1a0c00d        mov     ip, sp
   4:   e92dd800        stmdb   sp!, {fp, ip, lr, pc}
   8:   e24cb004        sub     fp, ip, #4      ; 0x4
   c:   e24dd010        sub     sp, sp, #16     ; 0x10
  10:   e50b0010        str     r0, [fp, #-16]
  14:   e50b1014        str     r1, [fp, #-20]
/home/ender/src/tmp/zero_checksum.c:7
        int i;
        unsigned char sum = 0;
  18:   e3a03000        mov     r3, #0  ; 0x0
  1c:   e54b3019        strb    r3, [fp, #-25]
/home/ender/src/tmp/zero_checksum.c:9
        signed char ssum;
        for (i=1; i<argc; i++) {
  20:   e3a03001        mov     r3, #1  ; 0x1
  24:   e50b3018        str     r3, [fp, #-24]
  28:   e51b2018        ldr     r2, [fp, #-24]
  2c:   e51b3010        ldr     r3, [fp, #-16]
  30:   e1520003        cmp     r2, r3
  34:   aa000020        bge     bc <.text+0xbc>
/home/ender/src/tmp/zero_checksum.c:10
            sum += (unsigned char)strtol(argv[i], NULL, 0);
  38:   e51b3018        ldr     r3, [fp, #-24]
  3c:   e1a02103        mov     r2, r3, lsl #2
  40:   e51b3014        ldr     r3, [fp, #-20]
  44:   e0823003        add     r3, r2, r3
  48:   e5930000        ldr     r0, [r3]
~~~
